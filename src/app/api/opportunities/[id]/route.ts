import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { activities, businesses, opportunities } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";

const schema = z.object({
  packageName: z.string().min(3).max(120).optional(),
  valueMinor: z.number().int().positive().optional(),
  currency: z.enum(["NGN", "GBP"]).optional(),
  previewUrl: z.string().url().optional(),
});
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const opportunityId = (await params).id;
    const input = schema.parse(await request.json());
    const opportunity = await db.query.opportunities.findFirst({
      where: eq(opportunities.id, opportunityId),
    });
    if (!opportunity)
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 },
      );
    const now = new Date().toISOString();
    const stage = input.previewUrl ? "preview" : opportunity.stage;
    await db.transaction(async (tx) => {
      await tx
        .update(opportunities)
        .set({ ...input, stage, updatedAt: now })
        .where(eq(opportunities.id, opportunityId));
      if (input.previewUrl)
        await tx
          .update(businesses)
          .set({ stage, updatedAt: now })
          .where(eq(businesses.id, opportunity.businessId));
      await tx
        .insert(activities)
        .values({
          id: id("act"),
          businessId: opportunity.businessId,
          type: input.previewUrl ? "preview_recorded" : "opportunity_updated",
          detail: input.previewUrl
            ? "Restricted preview URL recorded"
            : "Opportunity details updated",
        });
    });
    return NextResponse.json({
      opportunity: { ...opportunity, ...input, stage },
    });
  } catch (error) {
    return apiError(error);
  }
}
