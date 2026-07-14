import { NextResponse } from "next/server";
import { count, desc, eq, gte, or } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import {
  aiUsage,
  audits,
  businesses,
  findings,
  outreachDrafts,
  suppressions,
} from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import { buildHumanizedPitch, buildPitch } from "@/lib/drafts";
import { draftNaturalPitch } from "@/lib/gemini";
import type { AuditFinding } from "@/lib/audit";
import { id } from "@/lib/ids";
import { withDatabaseRetry } from "@/lib/db-retry";

const bodySchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  pitchAngle: z.string().max(300).optional(),
});
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireOwner())) return unauthorized();
  if (!isDatabaseConfigured()) return notConfigured("Turso");
  try {
    const businessId = (await params).id;
    const input = bodySchema.parse(await request.json());
    const business = await withDatabaseRetry(() =>
      db.query.businesses.findFirst({ where: eq(businesses.id, businessId) }),
    );
    if (!business)
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    if (business.suppressed)
      return NextResponse.json(
        { error: "Lead is suppressed" },
        { status: 409 },
      );
    if (
      business.country === "UK" &&
      business.legalForm !== "corporate" &&
      !business.complianceReviewed
    )
      return NextResponse.json(
        { error: "UK lead requires legal-form compliance review" },
        { status: 409 },
      );
    const blocked = await withDatabaseRetry(() =>
      db
        .select()
        .from(suppressions)
        .where(
          or(
            eq(suppressions.email, business.email ?? ""),
            eq(suppressions.phone, business.phone ?? ""),
            eq(suppressions.domain, business.normalizedDomain ?? ""),
          ),
        )
        .limit(1),
    );
    if (blocked.length)
      return NextResponse.json(
        { error: "Contact is on the suppression list" },
        { status: 409 },
      );
    const audit = await withDatabaseRetry(() =>
      db.query.audits.findFirst({
        where: eq(audits.businessId, businessId),
        orderBy: [desc(audits.createdAt)],
      }),
    );
    if (!audit)
      return NextResponse.json(
        { error: "Audit this lead before drafting" },
        { status: 409 },
      );
    const evidence = await withDatabaseRetry(() =>
      db.select().from(findings).where(eq(findings.auditId, audit.id)),
    );
    const verifiedEvidence: AuditFinding[] = evidence.map((item) => {
      if (!["high", "medium", "low"].includes(item.severity))
        throw new Error("Stored finding has an invalid severity");
      return {
        code: item.code,
        severity: item.severity as AuditFinding["severity"],
        title: item.title,
        evidence: item.evidence,
        recommendation: item.recommendation,
      };
    });
    let draft = buildPitch({
      businessName: business.name,
      country: business.country,
      channel: input.channel,
      findings: verifiedEvidence,
      sourceUrl: business.sourceUrl,
      pitchAngle: input.pitchAngle,
    });
    if (process.env.GEMINI_API_KEY) {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const [usageCount] = await withDatabaseRetry(() =>
        db
          .select({ value: count() })
          .from(aiUsage)
          .where(gte(aiUsage.createdAt, start.toISOString())),
      );
      if (usageCount.value < Number(process.env.GEMINI_DAILY_LIMIT ?? 30)) {
        try {
          const generated = await draftNaturalPitch({
            category: business.category,
            country: business.country,
            channel: input.channel,
            findings: verifiedEvidence,
          });
          draft = buildHumanizedPitch({
            businessName: business.name,
            channel: input.channel,
            observation: generated.draft.observation,
            offer: generated.draft.offer,
          });
          await db
            .insert(aiUsage)
            .values({
              id: id("ai"),
              businessId,
              model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
              purpose: "draft",
              inputTokens: generated.usage?.promptTokenCount ?? 0,
              outputTokens: generated.usage?.candidatesTokenCount ?? 0,
            });
        } catch (draftError) {
          console.warn(
            "Gemini message draft rejected; using humanized local draft",
            draftError,
          );
        }
      }
    }
    const record = {
      id: id("drf"),
      businessId,
      channel: input.channel,
      ...draft,
    };
    await db.insert(outreachDrafts).values(record);
    await db
      .update(businesses)
      .set({ stage: "pitch_ready", updatedAt: new Date().toISOString() })
      .where(eq(businesses.id, businessId));
    return NextResponse.json({ draft: record });
  } catch (error) {
    return apiError(error);
  }
}
