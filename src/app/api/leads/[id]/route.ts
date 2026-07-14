import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import {
  activities,
  businesses,
  contacts,
  opportunities,
  outreachDrafts,
} from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { PIPELINE_STAGES } from "@/lib/constants";
import { id, normalizePhone } from "@/lib/ids";
import { canTransition, REMINDER_CANCEL_STAGES } from "@/lib/workflow";

const schema = z.object({
  stage: z.enum(PIPELINE_STAGES).optional(),
  nextActionAt: z.string().datetime().nullable().optional(),
  legalForm: z.enum(["corporate", "sole_trader", "unknown"]).optional(),
  complianceReviewed: z.boolean().optional(),
  lostReason: z.string().max(500).nullable().optional(),
  reopen: z.boolean().default(false),
  contact: z
    .object({
      id: z.string().optional(),
      channel: z.enum(["email", "phone", "whatsapp"]),
      value: z.string().min(3).max(320),
      sourceUrl: z.string().url(),
      verified: z.boolean(),
      isPrimary: z.boolean(),
    })
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const businessId = (await params).id;
    const input = schema.parse(await request.json());
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });
    if (!business)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (
      input.stage &&
      !canTransition(
        business.stage as (typeof PIPELINE_STAGES)[number],
        input.stage,
        input.reopen,
      )
    )
      return NextResponse.json(
        {
          error: "Invalid pipeline transition; confirm reopening a closed lead",
        },
        { status: 409 },
      );
    if (input.stage === "lost" && !input.lostReason?.trim())
      return NextResponse.json(
        { error: "A lost reason is required" },
        { status: 400 },
      );
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      const updates = {
        stage: input.stage,
        legalForm: input.legalForm,
        complianceReviewed: input.complianceReviewed,
        lostReason: input.lostReason,
        updatedAt: now,
      };
      await tx
        .update(businesses)
        .set(
          Object.fromEntries(
            Object.entries(updates).filter(([, value]) => value !== undefined),
          ),
        )
        .where(eq(businesses.id, businessId));
      if (input.nextActionAt !== undefined)
        await tx
          .update(opportunities)
          .set({ nextActionAt: input.nextActionAt, updatedAt: now })
          .where(eq(opportunities.businessId, businessId));
      if (input.stage)
        await tx
          .update(opportunities)
          .set({ stage: input.stage, updatedAt: now })
          .where(eq(opportunities.businessId, businessId));
      if (input.stage && REMINDER_CANCEL_STAGES.has(input.stage))
        await tx
          .update(outreachDrafts)
          .set({ followUpDueAt: null, updatedAt: now })
          .where(
            and(
              eq(outreachDrafts.businessId, businessId),
              ne(outreachDrafts.status, "cancelled"),
            ),
          );
      if (input.contact) {
        const normalizedValue =
          input.contact.channel === "email"
            ? input.contact.value.toLowerCase().trim()
            : normalizePhone(input.contact.value);
        if (!normalizedValue) throw new Error("Contact value is invalid");
        if (input.contact.isPrimary)
          await tx
            .update(contacts)
            .set({ isPrimary: false, updatedAt: now })
            .where(
              and(
                eq(contacts.businessId, businessId),
                eq(contacts.channel, input.contact.channel),
              ),
            );
        const contactId = input.contact.id ?? id("con");
        await tx
          .insert(contacts)
          .values({
            ...input.contact,
            id: contactId,
            businessId,
            normalizedValue,
            discoveredAt: now,
          })
          .onConflictDoUpdate({
            target: [
              contacts.businessId,
              contacts.channel,
              contacts.normalizedValue,
            ],
            set: {
              sourceUrl: input.contact.sourceUrl,
              verified: input.contact.verified,
              isPrimary: input.contact.isPrimary,
              updatedAt: now,
            },
          });
        if (input.contact.verified && input.contact.isPrimary)
          await tx
            .update(businesses)
            .set(
              input.contact.channel === "email"
                ? { email: normalizedValue, updatedAt: now }
                : { phone: normalizedValue, updatedAt: now },
            )
            .where(eq(businesses.id, businessId));
      }
      await tx
        .insert(activities)
        .values({
          id: id("act"),
          businessId,
          type: input.contact ? "contact_updated" : "lead_updated",
          detail: input.stage
            ? `Stage changed from ${business.stage} to ${input.stage}`
            : "Lead details updated",
        });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
