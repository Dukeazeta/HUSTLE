import { NextResponse } from "next/server";
import { count, eq, gte } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import {
  aiUsage,
  audits,
  businesses,
  contacts,
  findings,
  opportunities,
} from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { auditWebsite } from "@/lib/audit";
import { analyzeFindings } from "@/lib/gemini";
import { id, normalizeDomain, normalizePhone } from "@/lib/ids";
import { getPlaceDetails, preferredPlacePhone } from "@/lib/places";
import { preserveStageAfterAudit } from "@/lib/workflow";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const businessId = (await params).id;
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });
    if (!business)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    let listingDetails: Awaited<ReturnType<typeof getPlaceDetails>> = null;
    if (business.placeId && (!business.phone || !business.websiteUrl)) {
      try {
        listingDetails = await getPlaceDetails(business.placeId);
      } catch (detailsError) {
        console.warn(
          "Google listing enrichment failed; continuing audit",
          detailsError,
        );
      }
    }
    const listingPhone =
      business.phone ??
      (listingDetails ? preferredPlacePhone(listingDetails) : null);
    const websiteUrl = business.websiteUrl ?? listingDetails?.websiteUri;
    const sourceUrl =
      listingDetails?.googleMapsUri ??
      business.sourceUrl ??
      `https://www.google.com/maps/search/?api=1&query_place_id=${business.placeId}`;
    const result = await auditWebsite(websiteUrl);
    if (listingPhone) {
      const normalizedListingPhone = normalizePhone(listingPhone)!;
      if (
        !result.contacts.some(
          (contact) => contact.normalizedValue === normalizedListingPhone,
        )
      )
        result.contacts.unshift({
          channel: "phone",
          value: listingPhone,
          normalizedValue: normalizedListingPhone,
          sourceUrl,
        });
      if (
        result.findings.some((finding) => finding.code === "no_public_contact")
      ) {
        result.findings = result.findings.filter(
          (finding) => finding.code !== "no_public_contact",
        );
        result.score = Math.max(0, result.score - 12);
        result.summary = result.findings.length
          ? `${result.findings.length} evidence-backed website opportunities were found.`
          : "No strong website-rescue opportunity was detected.";
      }
    }
    let summary = result.summary;
    let aiUsed = false;
    let aiResult = null;
    if (result.score >= 60 && process.env.GEMINI_API_KEY) {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const [usage] = await db
        .select({ value: count() })
        .from(aiUsage)
        .where(gte(aiUsage.createdAt, start.toISOString()));
      const limit = Number(process.env.GEMINI_DAILY_LIMIT ?? 30);
      if (usage.value < limit) {
        try {
          const generated = await analyzeFindings({
            category: business.category,
            country: business.country,
            score: result.score,
            findings: result.findings,
          });
          aiResult = generated.analysis;
          summary = generated.analysis.summary;
          aiUsed = true;
          await db.insert(aiUsage).values({
            id: id("ai"),
            businessId,
            model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
            purpose: "audit",
            inputTokens: generated.usage?.promptTokenCount ?? 0,
            outputTokens: generated.usage?.candidatesTokenCount ?? 0,
          });
        } catch (aiError) {
          console.warn(
            "Gemini audit enrichment rejected; using deterministic audit",
            aiError,
          );
        }
      }
    }
    const auditId = id("aud");
    const stage = preserveStageAfterAudit(business.stage, result.score);
    await db.transaction(async (tx) => {
      await tx.insert(audits).values({
        id: auditId,
        businessId,
        status: result.status,
        httpStatus: result.httpStatus,
        responseMs: result.responseMs,
        pageBytes: result.pageBytes,
        score: result.score,
        summary,
        aiUsed,
      });
      if (result.findings.length)
        await tx.insert(findings).values(
          result.findings.map((item) => ({
            id: id("fnd"),
            auditId,
            ...item,
          })),
        );
      for (const contact of result.contacts)
        await tx
          .insert(contacts)
          .values({
            id: id("con"),
            businessId,
            ...contact,
            discoveredAt: new Date().toISOString(),
          })
          .onConflictDoNothing();
      await tx
        .update(businesses)
        .set({
          score: result.score,
          stage,
          phone: normalizePhone(listingPhone) ?? business.phone,
          websiteUrl: websiteUrl ?? business.websiteUrl,
          normalizedDomain:
            normalizeDomain(websiteUrl) ?? business.normalizedDomain,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(businesses.id, businessId));
      if (result.score >= 60)
        await tx
          .insert(opportunities)
          .values({
            id: id("opp"),
            businessId,
            stage: "qualified",
            packageName: aiResult?.recommendedPackage,
            currency: business.country === "NG" ? "NGN" : "GBP",
          })
          .onConflictDoNothing({ target: opportunities.businessId });
    });
    return NextResponse.json({
      audit: { id: auditId, ...result, summary, aiUsed },
      ai: aiResult,
    });
  } catch (error) {
    return apiError(error);
  }
}
