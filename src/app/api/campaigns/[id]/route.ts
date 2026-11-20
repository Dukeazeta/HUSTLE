import { NextResponse } from "next/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns } from "@/db/schema";
import { apiError, notConfigured, parseBody, unauthorized } from "@/lib/api";
import { getOwnedCampaign } from "@/lib/ownership";
import { requireWorkspace } from "@/lib/workspace";
import { OUTREACH_CHANNELS } from "@/lib/constants";
import {
  isCurrencyCode,
  normalizeCurrencyCode,
} from "@/lib/markets";

const updateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("stop") }),
  z.object({
    action: z.literal("review_compliance"),
    complianceNote: z.string().trim().min(20).max(2000),
    complianceReference: z.string().trim().min(3).max(1000),
    approvedChannels: z.array(z.enum(OUTREACH_CHANNELS)).min(1),
  }),
  z.object({
    action: z.literal("update_pricing"),
    currency: z
      .string()
      .transform(normalizeCurrencyCode)
      .refine(isCurrencyCode, { message: "Select a valid currency" }),
    packagePrices: z.object({
      landingPageRescue: z.number().int().positive(),
      completeBusinessWebsite: z.number().int().positive(),
      bookingCatalogueWebsite: z.number().int().positive(),
    }),
  }),
]);

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const workspace = await requireWorkspace();
  if (!workspace) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");

  try {
    const input = await parseBody(request, updateSchema);
    const campaignId = (await params).id;
    const campaign = await getOwnedCampaign(workspace.workspaceId, campaignId);
    if (!campaign)
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );

    if (input.action === "stop" && campaign.status !== "complete")
      await db
        .update(campaigns)
        .set({ status: "complete", updatedAt: new Date().toISOString() })
        .where(eq(campaigns.id, campaignId));

    if (input.action === "review_compliance")
      await db
        .update(campaigns)
        .set({
          complianceNote: input.complianceNote,
          complianceReference: input.complianceReference,
          approvedChannels: [...new Set(input.approvedChannels)],
          complianceReviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(campaigns.id, campaignId));

    if (input.action === "update_pricing")
      await db
        .update(campaigns)
        .set({
          currency: input.currency,
          landingPagePrice: input.packagePrices.landingPageRescue,
          completeWebsitePrice: input.packagePrices.completeBusinessWebsite,
          bookingCataloguePrice: input.packagePrices.bookingCatalogueWebsite,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(campaigns.id, campaignId));

    return NextResponse.json({
      campaign: {
        id: campaignId,
        ...(input.action === "stop" ? { status: "complete" } : input),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const workspace = await requireWorkspace();
  if (!workspace) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");

  try {
    const campaignId = (await params).id;
    if (!(await getOwnedCampaign(workspace.workspaceId, campaignId)))
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const [leadTotal] = await db
      .select({ value: count() })
      .from(businesses)
      .where(eq(businesses.campaignId, campaignId));
    const deleted = await db
      .delete(campaigns)
      .where(
        and(
          eq(campaigns.id, campaignId),
          eq(campaigns.workspaceId, workspace.workspaceId),
        ),
      )
      .returning({ id: campaigns.id });

    if (!deleted.length)
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );

    return NextResponse.json({ deleted: true, leadsDeleted: leadTotal.value });
  } catch (error) {
    return apiError(error);
  }
}
