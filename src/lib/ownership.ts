import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  businesses,
  campaigns,
  opportunities,
  outreachDrafts,
} from "@/db/schema";

/**
 * Loaders that only return a record when it belongs to the given workspace.
 * A missing record and another workspace's record look identical to callers,
 * so routes answer both with the same 404 and ids can't be probed.
 */

export const notFound = () =>
  NextResponse.json({ error: "Not found" }, { status: 404 });

export function getOwnedCampaign(workspaceId: string, campaignId: string) {
  return db.query.campaigns.findFirst({
    where: and(eq(campaigns.id, campaignId), eq(campaigns.workspaceId, workspaceId)),
  });
}

export function getOwnedBusiness(workspaceId: string, businessId: string) {
  return db.query.businesses.findFirst({
    where: and(eq(businesses.id, businessId), eq(businesses.workspaceId, workspaceId)),
  });
}

export async function getOwnedOpportunity(workspaceId: string, opportunityId: string) {
  const [row] = await db
    .select({ opportunity: opportunities })
    .from(opportunities)
    .innerJoin(businesses, eq(opportunities.businessId, businesses.id))
    .where(
      and(eq(opportunities.id, opportunityId), eq(businesses.workspaceId, workspaceId)),
    )
    .limit(1);
  return row?.opportunity;
}

export async function getOwnedDraft(workspaceId: string, draftId: string) {
  const [row] = await db
    .select({ draft: outreachDrafts })
    .from(outreachDrafts)
    .innerJoin(businesses, eq(outreachDrafts.businessId, businesses.id))
    .where(and(eq(outreachDrafts.id, draftId), eq(businesses.workspaceId, workspaceId)))
    .limit(1);
  return row?.draft;
}
