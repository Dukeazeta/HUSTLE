import { NextResponse } from "next/server";
import { and, count, desc, eq, gte, or } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@/db";
import {
  aiUsage,
  audits,
  businessLinks,
  businesses,
  contacts,
  findings,
  outreachDrafts,
  pitchGenerations,
  pitchVariants,
  suppressions,
} from "@/db/schema";
import { apiError, notConfigured, requireOwner, unauthorized } from "@/lib/api";
import type { AuditFinding } from "@/lib/audit";
import { OUTREACH_CHANNELS } from "@/lib/constants";
import { withDatabaseRetry } from "@/lib/db-retry";
import { generatePitchVariantParts } from "@/lib/gemini";
import { id } from "@/lib/ids";
import { ukOutreachBlockReason } from "@/lib/outreach-compliance";
import { aggregatePitchStyleSignals } from "@/lib/pitch-learning";
import {
  buildFallbackPitchParts,
  rankPitchEvidence,
  renderPitchVariants,
  type PitchVariantParts,
} from "@/lib/pitch-generation";

const bodySchema = z.object({
  channel: z.enum(OUTREACH_CHANNELS),
  requestId: z.string().min(8).max(100),
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
      return NextResponse.json({ error: "Lead is suppressed" }, { status: 409 });

    const complianceError = ukOutreachBlockReason(business);
    if (complianceError)
      return NextResponse.json({ error: complianceError }, { status: 409 });

    const target = await findChannelTarget(businessId, input.channel);
    if (!target)
      return NextResponse.json(
        {
          error:
            input.channel === "instagram" || input.channel === "linkedin"
              ? `Confirm a business-owned ${input.channel} profile before drafting`
              : `Verify a ${input.channel} contact before drafting`,
        },
        { status: 409 },
      );

    const blocked = await withDatabaseRetry(() =>
      db
        .select({ id: suppressions.id })
        .from(suppressions)
        .where(
          or(
            eq(suppressions.email, business.email ?? ""),
            eq(
              suppressions.email,
              input.channel === "email" ? target.normalizedValue : "",
            ),
            eq(suppressions.phone, business.phone ?? ""),
            eq(
              suppressions.phone,
              input.channel === "whatsapp" ? target.normalizedValue : "",
            ),
            eq(suppressions.domain, business.normalizedDomain ?? ""),
            eq(suppressions.profileUrl, target.normalizedValue),
          ),
        )
        .limit(1),
    );
    if (blocked.length)
      return NextResponse.json(
        { error: "Contact is on the suppression list" },
        { status: 409 },
      );
    const existing = await loadGeneration(businessId, input.requestId);
    if (existing) return NextResponse.json(existing);

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

    const storedFindings = await withDatabaseRetry(() =>
      db.select().from(findings).where(eq(findings.auditId, audit.id)),
    );
    const auditFindings: AuditFinding[] = storedFindings.map((finding) => {
      if (!(["high", "medium", "low"] as const).includes(
        finding.severity as AuditFinding["severity"],
      ))
        throw new Error("Stored finding has an invalid severity");
      return {
        code: finding.code,
        severity: finding.severity as AuditFinding["severity"],
        title: finding.title,
        evidence: finding.evidence,
        recommendation: finding.recommendation,
      };
    });
    const rankedEvidence = rankPitchEvidence(auditFindings, audit.status);
    if (!rankedEvidence.length)
      return NextResponse.json(
        { error: "No verified pitch evidence is available" },
        { status: 409 },
      );

    const styleSignals = await loadStyleSignals(
      business.country,
      input.channel,
    );
    const validCodes = new Set(rankedEvidence.map((finding) => finding.code));
    let parts: PitchVariantParts[] = buildFallbackPitchParts(
      rankedEvidence,
      input.channel,
    );
    let usedFallback = true;
    let inputTokens = 0;
    let outputTokens = 0;

    if (await hasGeminiCapacity()) {
      let repairReason: string | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const generated = await generatePitchVariantParts({
            category: business.category,
            country: business.country,
            channel: input.channel,
            evidence: rankedEvidence,
            styleSignals,
            repairReason,
          });
          inputTokens += generated.usage?.promptTokenCount ?? 0;
          outputTokens += generated.usage?.candidatesTokenCount ?? 0;
          renderPitchVariants({
            businessName: business.name,
            senderName: process.env.OUTREACH_SENDER_NAME?.trim() || "HUSTLE",
            channel: input.channel,
            variants: generated.variants,
            validEvidenceCodes: validCodes,
          });
          parts = generated.variants;
          usedFallback = false;
          break;
        } catch (error) {
          repairReason =
            error instanceof Error
              ? error.message.slice(0, 180)
              : "schema or evidence validation failed";
        }
      }
    }

    const rendered = renderPitchVariants({
      businessName: business.name,
      senderName: process.env.OUTREACH_SENDER_NAME?.trim() || "HUSTLE",
      channel: input.channel,
      variants: parts,
      validEvidenceCodes: validCodes,
    });
    const generationRecord = {
      id: id("pgen"),
      businessId,
      requestId: input.requestId,
      channel: input.channel,
      model: usedFallback
        ? null
        : process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      usedFallback,
      styleSignals,
    };
    const variantRecords = rendered.map((variant) => ({
      id: id("pvar"),
      generationId: generationRecord.id,
      ...variant,
    }));

    await withDatabaseRetry(() =>
      db.transaction(async (tx) => {
        const inserted = await tx
          .insert(pitchGenerations)
          .values(generationRecord)
          .onConflictDoNothing()
          .returning({ id: pitchGenerations.id });
        if (inserted.length) await tx.insert(pitchVariants).values(variantRecords);
        if (!usedFallback)
          await tx.insert(aiUsage).values({
            id: id("ai"),
            businessId,
            model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
            purpose: "pitch_generation",
            inputTokens,
            outputTokens,
          });
      }),
    );

    const saved = await loadGeneration(businessId, input.requestId);
    if (!saved) throw new Error("Pitch generation was not saved");
    return NextResponse.json(saved);
  } catch (error) {
    return apiError(error);
  }
}

async function loadGeneration(businessId: string, requestId: string) {
  const generation = await withDatabaseRetry(() =>
    db.query.pitchGenerations.findFirst({
      where: and(
        eq(pitchGenerations.businessId, businessId),
        eq(pitchGenerations.requestId, requestId),
      ),
    }),
  );
  if (!generation) return null;
  const variants = await withDatabaseRetry(() =>
    db
      .select()
      .from(pitchVariants)
      .where(eq(pitchVariants.generationId, generation.id)),
  );
  return { generation, variants };
}

async function findChannelTarget(
  businessId: string,
  channel: (typeof OUTREACH_CHANNELS)[number],
) {
  if (channel === "email" || channel === "whatsapp") {
    const contact = await withDatabaseRetry(() =>
      db.query.contacts.findFirst({
        where: and(
          eq(contacts.businessId, businessId),
          eq(contacts.channel, channel),
          eq(contacts.verified, true),
        ),
      }),
    );
    return contact
      ? { value: contact.value, normalizedValue: contact.normalizedValue }
      : null;
  }
  const link = await withDatabaseRetry(() =>
    db.query.businessLinks.findFirst({
      where: and(
        eq(businessLinks.businessId, businessId),
        eq(businessLinks.type, channel),
        eq(businessLinks.verificationStatus, "confirmed"),
      ),
    }),
  );
  return link
    ? { value: link.url, normalizedValue: link.normalizedUrl }
    : null;
}

async function hasGeminiCapacity() {
  if (!process.env.GEMINI_API_KEY) return false;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [usage] = await withDatabaseRetry(() =>
    db
      .select({ value: count() })
      .from(aiUsage)
      .where(gte(aiUsage.createdAt, start.toISOString())),
  );
  return usage.value < Number(process.env.GEMINI_DAILY_LIMIT ?? 30);
}

async function loadStyleSignals(
  country: string,
  channel: (typeof OUTREACH_CHANNELS)[number],
) {
  const samples = await withDatabaseRetry(() =>
    db
      .select({
        label: pitchVariants.label,
        originalBody: pitchVariants.body,
        finalBody: outreachDrafts.body,
        feedback: outreachDrafts.feedback,
      })
      .from(outreachDrafts)
      .innerJoin(
        pitchVariants,
        eq(outreachDrafts.sourceVariantId, pitchVariants.id),
      )
      .innerJoin(
        pitchGenerations,
        eq(pitchVariants.generationId, pitchGenerations.id),
      )
      .innerJoin(
        businesses,
        eq(pitchGenerations.businessId, businesses.id),
      )
      .where(
        and(
          eq(pitchGenerations.channel, channel),
          eq(businesses.country, country),
        ),
      )
      .orderBy(desc(outreachDrafts.updatedAt))
      .limit(100),
  );
  return aggregatePitchStyleSignals(samples);
}
