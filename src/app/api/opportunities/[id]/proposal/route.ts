import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { activities, businesses, opportunities, proposals } from "@/db/schema";
import { apiError, notConfigured, requireUser, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";
const schema = z.object({
  title: z.string().min(3).max(120),
  content: z.string().min(50).max(12000),
  expiresAt: z.string().datetime(),
});
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireUser())) return unauthorized();
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
    const existing = await db.query.proposals.findFirst({
      where: eq(proposals.opportunityId, opportunityId),
    });
    const now = new Date().toISOString();
    const record = existing
      ? { ...existing, ...input, updatedAt: now }
      : { id: id("prp"), opportunityId, ...input };
    await db.transaction(async (tx) => {
      if (existing)
        await tx
          .update(proposals)
          .set({ ...input, updatedAt: now })
          .where(eq(proposals.id, existing.id));
      else await tx.insert(proposals).values(record);
      await tx
        .update(opportunities)
        .set({ stage: "proposal", updatedAt: now })
        .where(eq(opportunities.id, opportunityId));
      await tx
        .update(businesses)
        .set({ stage: "proposal", updatedAt: now })
        .where(eq(businesses.id, opportunity.businessId));
      await tx
        .insert(activities)
        .values({
          id: id("act"),
          businessId: opportunity.businessId,
          type: "proposal_saved",
          detail: "Proposal saved for manual delivery",
        });
    });
    return NextResponse.json(
      { proposal: record },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
