import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { businesses, campaigns } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";

const updateSchema = z.object({ action: z.literal("stop") });

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");

  try {
    updateSchema.parse(await request.json());
    const campaignId = (await params).id;
    const campaign = await db.query.campaigns.findFirst({
      columns: { id: true, status: true },
      where: eq(campaigns.id, campaignId),
    });
    if (!campaign)
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      );

    if (campaign.status !== "complete")
      await db
        .update(campaigns)
        .set({ status: "complete", updatedAt: new Date().toISOString() })
        .where(eq(campaigns.id, campaignId));

    return NextResponse.json({
      campaign: { id: campaignId, status: "complete" },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");

  try {
    const campaignId = (await params).id;
    const [leadTotal] = await db
      .select({ value: count() })
      .from(businesses)
      .where(eq(businesses.campaignId, campaignId));
    const deleted = await db
      .delete(campaigns)
      .where(eq(campaigns.id, campaignId))
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
