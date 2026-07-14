import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, ne } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { activities, businessLinks, businesses } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { id } from "@/lib/ids";
import { searchPublicBusinessPresence } from "@/lib/web-enrichment";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  if (!process.env.BRAVE_SEARCH_API_KEY) return notConfigured("Brave Search");

  try {
    const businessId = (await params).id;
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });
    if (!business)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const dayStart = start.toISOString().slice(0, 10);
    const cachedSearch = await db.query.activities.findFirst({
      where: and(
        eq(activities.businessId, businessId),
        eq(activities.type, "web_enrichment"),
        gte(activities.createdAt, dayStart),
      ),
      orderBy: [desc(activities.createdAt)],
    });
    if (cachedSearch)
      return NextResponse.json({
        cached: true,
        links: await db
          .select()
          .from(businessLinks)
          .where(
            and(
              eq(businessLinks.businessId, businessId),
              ne(businessLinks.verificationStatus, "rejected"),
            ),
          )
          .orderBy(desc(businessLinks.confidence)),
      });

    const [usage] = await db
      .select({ value: count() })
      .from(activities)
      .where(
        and(
          eq(activities.type, "web_enrichment"),
          gte(activities.createdAt, dayStart),
        ),
      );
    const dailyLimit = Math.max(1, Number(process.env.BRAVE_DAILY_LIMIT ?? 30));
    if (usage.value >= dailyLimit)
      return NextResponse.json(
        { error: "Daily public-web search limit reached" },
        { status: 429 },
      );

    const candidates = await searchPublicBusinessPresence({
      businessName: business.name,
      city: business.city,
      country: business.country,
    });
    const now = new Date().toISOString();
    await db.transaction(async (tx) => {
      for (const candidate of candidates)
        await tx
          .insert(businessLinks)
          .values({
            id: id("lnk"),
            businessId,
            ...candidate,
            discoveredAt: now,
          })
          .onConflictDoUpdate({
            target: [businessLinks.businessId, businessLinks.normalizedUrl],
            set: {
              type: candidate.type,
              url: candidate.url,
              sourceUrl: candidate.sourceUrl,
              confidence: candidate.confidence,
              evidence: candidate.evidence,
              updatedAt: now,
            },
          });
      await tx.insert(activities).values({
        id: id("act"),
        businessId,
        type: "web_enrichment",
        detail: `Public-web search found ${candidates.length} candidate links`,
        metadata: { provider: "brave", candidateCount: candidates.length },
      });
    });

    return NextResponse.json({
      cached: false,
      links: await db
        .select()
        .from(businessLinks)
        .where(
          and(
            eq(businessLinks.businessId, businessId),
            ne(businessLinks.verificationStatus, "rejected"),
          ),
        )
        .orderBy(desc(businessLinks.confidence)),
    });
  } catch (error) {
    return apiError(error, "Public presence search failed");
  }
}
