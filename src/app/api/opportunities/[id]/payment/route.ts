import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { activities, businesses, opportunities, payments } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";

const inputSchema = z.object({ amountMinor: z.number().int().positive(), currency: z.enum(["NGN", "GBP"]), reference: z.string().max(120).optional() });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const opportunityId = (await params).id; const input = inputSchema.parse(await request.json());
    const opportunity = await db.query.opportunities.findFirst({ where: eq(opportunities.id, opportunityId) });
    if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    if (!opportunity.previewApprovedAt) return NextResponse.json({ error: "Preview approval must be recorded before payment" }, { status: 409 });
    const now = new Date().toISOString();
    await db.insert(payments).values({ id: id("pay"), opportunityId, ...input, paidAt: now });
    await db.update(opportunities).set({ stage: "won", paidAt: now, valueMinor: input.amountMinor, currency: input.currency, updatedAt: now }).where(eq(opportunities.id, opportunityId));
    await db.update(businesses).set({ stage: "won", updatedAt: now }).where(eq(businesses.id, opportunity.businessId));
    await db.insert(activities).values({ id: id("act"), businessId: opportunity.businessId, type: "payment_received", detail: "Payment recorded; production handover is now unlocked." });
    return NextResponse.json({ stage: "won", paidAt: now, handoverUnlocked: true });
  } catch (error) { return apiError(error); }
}
