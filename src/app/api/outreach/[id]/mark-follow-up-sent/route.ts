import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import {
  activities,
  businessLinks,
  businesses,
  campaigns,
  contacts,
  outreachDrafts,
} from "@/db/schema";
import { apiError, notConfigured, requireUser, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";
import { outreachBlockReason } from "@/lib/outreach-compliance";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
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
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, business.campaignId),
    });
    if (!campaign)
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const complianceError = outreachBlockReason({
      ...business,
      channel: draft.channel,
      campaignComplianceReviewedAt: campaign.complianceReviewedAt,
      campaignComplianceNote: campaign.complianceNote,
      approvedChannels: campaign.approvedChannels,
    });
    if (complianceError)
      return NextResponse.json({ error: complianceError }, { status: 409 });
    const target =
      draft.channel === "email" || draft.channel === "whatsapp"
        ? await db.query.contacts.findFirst({
            where: and(
              eq(contacts.businessId, draft.businessId),
              eq(contacts.channel, draft.channel),
              eq(contacts.verified, true),
            ),
          })
        : await db.query.businessLinks.findFirst({
            where: and(
              eq(businessLinks.businessId, draft.businessId),
              eq(businessLinks.type, draft.channel),
              eq(businessLinks.verificationStatus, "confirmed"),
            ),
          });
    if (!target)
      return NextResponse.json(
        { error: `${draft.channel} target is no longer verified` },
        { status: 409 },
      );
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(outreachDrafts)
        .set({ followUpSentAt: now, followUpDueAt: null, updatedAt: now })
        .where(
          and(
            eq(outreachDrafts.id, draftId),
            isNull(outreachDrafts.followUpSentAt),
          ),
        )
        .returning({ id: outreachDrafts.id });
      if (updated.length)
        await tx.insert(activities).values({
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
