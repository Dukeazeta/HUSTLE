import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { activities, businesses, opportunities } from "@/db/schema";
import { apiError, notConfigured, requireUser, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const opportunityId = (await params).id;
    const opportunity = await db.query.opportunities.findFirst({
      where: eq(opportunities.id, opportunityId),
    });
    if (!opportunity)
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    if (opportunity.previewApprovedAt)
      return NextResponse.json({
        stage: "payment_due",
        previewApprovedAt: opportunity.previewApprovedAt,
        alreadyRecorded: true,
      });
    if (!opportunity.previewUrl)
      return NextResponse.json(
        { error: "Record the restricted preview URL first" },
        { status: 409 },
      );
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx
        .update(opportunities)
        .set({ stage: "payment_due", previewApprovedAt: now, updatedAt: now })
        .where(eq(opportunities.id, opportunityId));
      await tx
        .update(businesses)
        .set({ stage: "payment_due", updatedAt: now })
        .where(eq(businesses.id, opportunity.businessId));
      await tx
        .insert(activities)
        .values({
          id: id("act"),
          businessId: opportunity.businessId,
          type: "preview_approved",
          detail:
            "Customer approved the restricted staging preview; payment is now due before handover.",
        });
    });
    return NextResponse.json({ stage: "payment_due", previewApprovedAt: now });
  } catch (error) {
    return apiError(error);
  }
}
