import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import {
  activities,
  businesses,
  opportunities,
  outreachDrafts,
  payments,
} from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";

const inputSchema = z.object({
  amountMinor: z.number().int().positive(),
  currency: z.enum(["NGN", "GBP"]),
  reference: z.string().max(120).optional(),
  paidAt: z.string().datetime().optional(),
});
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const opportunityId = (await params).id;
    const input = inputSchema.parse(await request.json());
    const opportunity = await db.query.opportunities.findFirst({
      where: eq(opportunities.id, opportunityId),
    });
    if (!opportunity)
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    if (!opportunity.previewApprovedAt)
      return NextResponse.json(
        { error: "Preview approval must be recorded before payment" },
        { status: 409 },
      );
    if (opportunity.paidAt)
      return NextResponse.json({
        stage: "won",
        paidAt: opportunity.paidAt,
        handoverUnlocked: true,
        alreadyRecorded: true,
      });
    const now = input.paidAt ?? new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx
        .insert(payments)
        .values({
          id: id("pay"),
          opportunityId,
          amountMinor: input.amountMinor,
          currency: input.currency,
          reference: input.reference,
          paidAt: now,
        });
      await tx
        .update(opportunities)
        .set({
          stage: "won",
          paidAt: now,
          valueMinor: input.amountMinor,
          currency: input.currency,
          updatedAt: now,
        })
        .where(eq(opportunities.id, opportunityId));
      await tx
        .update(businesses)
        .set({ stage: "won", updatedAt: now })
        .where(eq(businesses.id, opportunity.businessId));
      await tx
        .update(outreachDrafts)
        .set({ followUpDueAt: null, updatedAt: now })
        .where(eq(outreachDrafts.businessId, opportunity.businessId));
      await tx
        .insert(activities)
        .values({
          id: id("act"),
          businessId: opportunity.businessId,
          type: "payment_received",
          detail: "Payment recorded; production handover is now unlocked.",
        });
    });
    return NextResponse.json({
      stage: "won",
      paidAt: now,
      handoverUnlocked: true,
    });
  } catch (error) {
    return apiError(error);
  }
}
