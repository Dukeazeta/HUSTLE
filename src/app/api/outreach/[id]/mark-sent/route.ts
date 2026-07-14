import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { activities, businesses, outreachDrafts } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { addBusinessDays } from "@/lib/drafts";
import { id } from "@/lib/ids";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const draftId = (await params).id;
    const draft = await db.query.outreachDrafts.findFirst({ where: eq(outreachDrafts.id, draftId) });
    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    const business = await db.query.businesses.findFirst({ where: eq(businesses.id, draft.businessId) });
    if (!business || business.suppressed) return NextResponse.json({ error: "Suppressed contacts cannot be messaged" }, { status: 409 });
    const sentAt = new Date(); const followUpDueAt = addBusinessDays(sentAt, 5);
    await db.update(outreachDrafts).set({ status: "sent", sentAt: sentAt.toISOString(), followUpDueAt: followUpDueAt.toISOString(), updatedAt: sentAt.toISOString() }).where(eq(outreachDrafts.id, draftId));
    await db.update(businesses).set({ stage: "contacted", updatedAt: sentAt.toISOString() }).where(eq(businesses.id, draft.businessId));
    await db.insert(activities).values({ id: id("act"), businessId: draft.businessId, type: "outreach_sent", detail: `${draft.channel} outreach manually confirmed` });
    return NextResponse.json({ sentAt, followUpDueAt });
  } catch (error) { return apiError(error); }
}
