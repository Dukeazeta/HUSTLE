import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import {
  activities,
  businessLinks,
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
    const socialProfiles = await db
      .select({ normalizedUrl: businessLinks.normalizedUrl })
      .from(businessLinks)
      .where(eq(businessLinks.businessId, businessId));
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx.insert(suppressions).values([
        {
          id: id("sup"),
          email: business.email,
          phone: business.phone,
          domain: business.normalizedDomain,
          reason,
          source: "direct_objection",
        },
        ...socialProfiles.map((profile) => ({
          id: id("sup"),
          profileUrl: profile.normalizedUrl,
          reason,
          source: "direct_objection",
        })),
      ]);
      await tx
        .update(businesses)
        .set({
          suppressed: true,
          stage: "do_not_contact",
          updatedAt: now,
        })
        .where(eq(businesses.id, businessId));
      await tx
        .update(outreachDrafts)
        .set({
          followUpDueAt: null,
          status: "cancelled",
          updatedAt: now,
        })
        .where(eq(outreachDrafts.businessId, businessId));
      await tx.insert(activities).values({
        id: id("act"),
        businessId,
        type: "opt_out",
        detail: reason,
      });
    });
    return NextResponse.json({ suppressed: true });
  } catch (error) {
    return apiError(error);
  }
}
