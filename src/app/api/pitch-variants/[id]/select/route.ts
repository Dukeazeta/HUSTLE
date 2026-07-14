import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import {
  activities,
  businessLinks,
  businesses,
  contacts,
  outreachDrafts,
  pitchGenerations,
  pitchVariants,
  suppressions,
} from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { withDatabaseRetry } from "@/lib/db-retry";
import { id } from "@/lib/ids";
import { ukOutreachBlockReason } from "@/lib/outreach-compliance";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");

  try {
    const variantId = (await params).id;
    const [record] = await withDatabaseRetry(() =>
      db
        .select({
          variant: pitchVariants,
          generation: pitchGenerations,
          business: businesses,
        })
        .from(pitchVariants)
        .innerJoin(
          pitchGenerations,
          eq(pitchVariants.generationId, pitchGenerations.id),
        )
        .innerJoin(
          businesses,
          eq(pitchGenerations.businessId, businesses.id),
        )
        .where(eq(pitchVariants.id, variantId))
        .limit(1),
    );
    if (!record)
      return NextResponse.json({ error: "Pitch variant not found" }, { status: 404 });
    if (record.business.suppressed)
      return NextResponse.json({ error: "Lead is suppressed" }, { status: 409 });
    const complianceError = ukOutreachBlockReason(record.business);
    if (complianceError)
      return NextResponse.json({ error: complianceError }, { status: 409 });
    const target = await loadChannelTarget(
      record.business.id,
      record.generation.channel,
    );
    if (!target)
      return NextResponse.json(
        { error: `The verified ${record.generation.channel} target is no longer available` },
        { status: 409 },
      );
    const blocked = await withDatabaseRetry(() =>
      db
        .select({ id: suppressions.id })
        .from(suppressions)
        .where(
          or(
            eq(suppressions.email, record.business.email ?? ""),
            eq(suppressions.phone, record.business.phone ?? ""),
            eq(suppressions.domain, record.business.normalizedDomain ?? ""),
            eq(suppressions.profileUrl, target),
            eq(
              suppressions.email,
              record.generation.channel === "email" ? target : "",
            ),
            eq(
              suppressions.phone,
              record.generation.channel === "whatsapp" ? target : "",
            ),
          ),
        )
        .limit(1),
    );
    if (blocked.length)
      return NextResponse.json(
        { error: "Contact is on the suppression list" },
        { status: 409 },
      );

    const now = new Date().toISOString();
    const draftRecord = {
      id: id("drf"),
      businessId: record.business.id,
      channel: record.generation.channel,
      sourceVariantId: record.variant.id,
      subject: record.variant.subject,
      body: record.variant.body,
    };
    await withDatabaseRetry(() =>
      db.transaction(async (tx) => {
        const inserted = await tx
          .insert(outreachDrafts)
          .values(draftRecord)
          .onConflictDoNothing({ target: outreachDrafts.sourceVariantId })
          .returning({ id: outreachDrafts.id });
        if (!inserted.length) return;
        await tx
          .update(businesses)
          .set({ stage: "pitch_ready", updatedAt: now })
          .where(eq(businesses.id, record.business.id));
        await tx.insert(activities).values({
          id: id("act"),
          businessId: record.business.id,
          type: "pitch_variant_selected",
          detail: `${record.variant.label} ${record.generation.channel} variant selected`,
          metadata: {
            generationId: record.generation.id,
            variantId: record.variant.id,
          },
        });
      }),
    );
    const draft = await withDatabaseRetry(() =>
      db.query.outreachDrafts.findFirst({
        where: eq(outreachDrafts.sourceVariantId, variantId),
      }),
    );
    if (!draft) throw new Error("Selected draft was not saved");
    return NextResponse.json({ draft });
  } catch (error) {
    return apiError(error);
  }
}

async function loadChannelTarget(
  businessId: string,
  channel: "email" | "whatsapp" | "instagram" | "linkedin",
) {
  if (channel === "email" || channel === "whatsapp") {
    const contact = await withDatabaseRetry(() =>
        db.query.contacts.findFirst({
          where: and(
            eq(contacts.businessId, businessId),
            eq(contacts.channel, channel),
            eq(contacts.verified, true),
          ),
        }),
      );
    return contact?.normalizedValue ?? null;
  }
  const link = await withDatabaseRetry(() =>
      db.query.businessLinks.findFirst({
        where: and(
          eq(businessLinks.businessId, businessId),
          eq(businessLinks.type, channel),
          eq(businessLinks.verificationStatus, "confirmed"),
        ),
      }),
    );
  return link?.normalizedUrl ?? null;
}
