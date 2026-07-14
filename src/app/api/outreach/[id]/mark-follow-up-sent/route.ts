import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { activities, businesses, outreachDrafts } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const draftId = (await params).id;
    const draft = await db.query.outreachDrafts.findFirst({
      where: eq(outreachDrafts.id, draftId),
    });
    if (!draft)
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (draft.followUpSentAt)
      return NextResponse.json({
        sentAt: draft.followUpSentAt,
        alreadyRecorded: true,
      });
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, draft.businessId),
    });
    if (!business || business.suppressed || !draft.followUpBody)
      return NextResponse.json(
        { error: "Follow-up is unavailable" },
        { status: 409 },
      );
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx
        .update(outreachDrafts)
        .set({ followUpSentAt: now, followUpDueAt: null, updatedAt: now })
        .where(eq(outreachDrafts.id, draftId));
      await tx
        .insert(activities)
        .values({
          id: id("act"),
          businessId: draft.businessId,
          type: "follow_up_sent",
          detail: `${draft.channel} follow-up manually confirmed`,
        });
    });
    return NextResponse.json({ sentAt: now });
  } catch (error) {
    return apiError(error);
  }
}
