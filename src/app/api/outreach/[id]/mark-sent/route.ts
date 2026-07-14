import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import {
  activities,
  businessLinks,
  businesses,
  contacts,
  outreachDrafts,
  suppressions,
} from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { withDatabaseRetry } from "@/lib/db-retry";
import { addBusinessDays } from "@/lib/drafts";
import { id } from "@/lib/ids";
import { ukOutreachBlockReason } from "@/lib/outreach-compliance";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");

  try {
    const draftId = (await params).id;
    const draft = await withDatabaseRetry(() =>
      db.query.outreachDrafts.findFirst({
        where: eq(outreachDrafts.id, draftId),
      }),
    );
    if (!draft)
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    if (draft.sentAt)
      return NextResponse.json({
        sentAt: draft.sentAt,
        followUpDueAt: draft.followUpDueAt,
        alreadyRecorded: true,
      });

    const business = await withDatabaseRetry(() =>
      db.query.businesses.findFirst({
        where: eq(businesses.id, draft.businessId),
      }),
    );
    if (!business || business.suppressed)
      return NextResponse.json(
        { error: "Suppressed contacts cannot be messaged" },
        { status: 409 },
      );
    const complianceError = ukOutreachBlockReason(business);
    if (complianceError)
      return NextResponse.json({ error: complianceError }, { status: 409 });

    let targetValue: string | null = null;
    if (draft.channel === "email" || draft.channel === "whatsapp") {
      const channel = draft.channel;
      const contact = await withDatabaseRetry(() =>
          db.query.contacts.findFirst({
            where: and(
              eq(contacts.businessId, draft.businessId),
              eq(contacts.channel, channel),
              eq(contacts.verified, true),
            ),
          }),
        );
      targetValue = contact?.normalizedValue ?? null;
    } else {
      const channel = draft.channel;
      const link = await withDatabaseRetry(() =>
          db.query.businessLinks.findFirst({
            where: and(
              eq(businessLinks.businessId, draft.businessId),
              eq(businessLinks.type, channel),
              eq(businessLinks.verificationStatus, "confirmed"),
            ),
          }),
        );
      targetValue = link?.normalizedUrl ?? null;
    }
    if (!targetValue)
      return NextResponse.json(
        {
          error:
            draft.channel === "instagram" || draft.channel === "linkedin"
              ? `Confirm the business-owned ${draft.channel} profile before sending`
              : `Verify a ${draft.channel} contact before sending`,
        },
        { status: 409 },
      );
    const blocked = await withDatabaseRetry(() =>
      db
        .select({ id: suppressions.id })
        .from(suppressions)
        .where(
          or(
            eq(suppressions.email, business.email ?? ""),
            eq(suppressions.phone, business.phone ?? ""),
            eq(suppressions.domain, business.normalizedDomain ?? ""),
            eq(suppressions.profileUrl, targetValue),
            eq(
              suppressions.email,
              draft.channel === "email" ? targetValue : "",
            ),
            eq(
              suppressions.phone,
              draft.channel === "whatsapp" ? targetValue : "",
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

    const sentAt = new Date();
    const followUpDueAt = addBusinessDays(sentAt, 5);
    await withDatabaseRetry(() =>
      db.transaction(async (tx) => {
        const updated = await tx
          .update(outreachDrafts)
          .set({
            status: "sent",
            sentAt: sentAt.toISOString(),
            followUpDueAt: followUpDueAt.toISOString(),
            updatedAt: sentAt.toISOString(),
          })
          .where(
            and(
              eq(outreachDrafts.id, draftId),
              eq(outreachDrafts.status, "draft"),
            ),
          )
          .returning({ id: outreachDrafts.id });
        if (!updated.length) return;
        await tx
          .update(businesses)
          .set({ stage: "contacted", updatedAt: sentAt.toISOString() })
          .where(eq(businesses.id, draft.businessId));
        await tx.insert(activities).values({
          id: id("act"),
          businessId: draft.businessId,
          type: "outreach_sent",
          detail: `${draft.channel} outreach manually confirmed`,
        });
      }),
    );
    return NextResponse.json({ sentAt, followUpDueAt });
  } catch (error) {
    return apiError(error);
  }
}
