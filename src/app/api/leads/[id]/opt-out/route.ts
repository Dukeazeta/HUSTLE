import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import {
  activities,
  businesses,
  outreachDrafts,
  suppressions,
} from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";

const inputSchema = z.object({
  reason: z
    .string()
    .min(2)
    .max(300)
    .default("Contact requested no further messages"),
});
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const businessId = (await params).id;
    const { reason } = inputSchema.parse(
      await request.json().catch(() => ({})),
    );
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });
    if (!business)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    await db
      .insert(suppressions)
      .values({
        id: id("sup"),
        email: business.email,
        phone: business.phone,
        domain: business.normalizedDomain,
        reason,
        source: "direct_objection",
      });
    await db
      .update(businesses)
      .set({
        suppressed: true,
        stage: "do_not_contact",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(businesses.id, businessId));
    await db
      .update(outreachDrafts)
      .set({
        followUpDueAt: null,
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(outreachDrafts.businessId, businessId));
    await db
      .insert(activities)
      .values({ id: id("act"), businessId, type: "opt_out", detail: reason });
    return NextResponse.json({ suppressed: true });
  } catch (error) {
    return apiError(error);
  }
}
