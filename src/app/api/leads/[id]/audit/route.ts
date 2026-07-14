import { NextResponse } from "next/server";
import { count, eq, gte } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { aiUsage, audits, businesses, findings, opportunities } from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { auditWebsite } from "@/lib/audit";
import { analyzeFindings } from "@/lib/gemini";
import { id } from "@/lib/ids";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const businessId = (await params).id;
    const business = await db.query.businesses.findFirst({ where: eq(businesses.id, businessId) });
    if (!business) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const result = await auditWebsite(business.websiteUrl);
    let summary = result.summary;
    let aiUsed = false;
    let aiResult = null;
    if (result.score >= 60 && process.env.GEMINI_API_KEY) {
      const start = new Date(); start.setUTCHours(0, 0, 0, 0);
      const [usage] = await db.select({ value: count() }).from(aiUsage).where(gte(aiUsage.createdAt, start.toISOString()));
      const limit = Number(process.env.GEMINI_DAILY_LIMIT ?? 30);
      if (usage.value < limit) {
        try {
          const generated = await analyzeFindings({ category: business.category, country: business.country, score: result.score, findings: result.findings });
          aiResult = generated.analysis; summary = generated.analysis.summary; aiUsed = true;
          await db.insert(aiUsage).values({ id: id("ai"), businessId, model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash", purpose: "audit", inputTokens: generated.usage?.promptTokenCount ?? 0, outputTokens: generated.usage?.candidatesTokenCount ?? 0 });
        } catch (aiError) {
          console.warn("Gemini audit enrichment rejected; using deterministic audit", aiError);
        }
      }
    }
    const auditId = id("aud");
    await db.insert(audits).values({ id: auditId, businessId, status: result.status, httpStatus: result.httpStatus, responseMs: result.responseMs, pageBytes: result.pageBytes, score: result.score, summary, aiUsed });
    if (result.findings.length) await db.insert(findings).values(result.findings.map((item) => ({ id: id("fnd"), auditId, ...item })));
    const stage = result.score >= 60 ? "qualified" : "audited";
    await db.update(businesses).set({ score: result.score, stage, updatedAt: new Date().toISOString() }).where(eq(businesses.id, businessId));
    if (result.score >= 60) await db.insert(opportunities).values({ id: id("opp"), businessId, stage: "qualified", packageName: aiResult?.recommendedPackage, currency: business.country === "NG" ? "NGN" : "GBP" }).onConflictDoNothing({ target: opportunities.businessId });
    return NextResponse.json({ audit: { id: auditId, ...result, summary, aiUsed }, ai: aiResult });
  } catch (error) { return apiError(error); }
}
