import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import { activities, businessLinks, businesses } from "@/db/schema";
import { apiError, notConfigured, requireUser, unauthorized } from "@/lib/api";
import { assertPublicUrl } from "@/lib/audit";
import { id, normalizeDomain } from "@/lib/ids";

const inputSchema = z.object({ action: z.enum(["confirm", "reject"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; linkId: string }> },
) {
  if (!(await requireUser())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");

  try {
    const { id: businessId, linkId } = await params;
    const input = inputSchema.parse(await request.json());
    const link = await db.query.businessLinks.findFirst({
      where: and(
        eq(businessLinks.id, linkId),
        eq(businessLinks.businessId, businessId),
      ),
    });
    if (!link)
      return NextResponse.json(
        { error: "Candidate link not found" },
        { status: 404 },
      );

    if (input.action === "confirm") await assertPublicUrl(link.url);
    const status = input.action === "confirm" ? "confirmed" : "rejected";
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      await tx
        .update(businessLinks)
        .set({ verificationStatus: status, updatedAt: now })
        .where(eq(businessLinks.id, linkId));
      if (input.action === "confirm" && link.type === "website")
        await tx
          .update(businesses)
          .set({
            websiteUrl: link.url,
            normalizedDomain: normalizeDomain(link.url),
            updatedAt: now,
          })
          .where(eq(businesses.id, businessId));
      await tx.insert(activities).values({
        id: id("act"),
        businessId,
        type: `business_link_${status}`,
        detail: `${link.type} candidate ${status}: ${link.url}`,
      });
    });

    return NextResponse.json({
      link: { ...link, verificationStatus: status, updatedAt: now },
    });
  } catch (error) {
    return apiError(error, "Could not review candidate link");
  }
}
