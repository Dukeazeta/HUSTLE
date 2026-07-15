import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { AuditFinding } from "./audit";
import type { OutreachChannel } from "./constants";
import { countryName } from "./markets";
import {
  sanitizePitchEvidence,
  type PitchEvidence,
  type PitchStyleSignals,
  type PitchVariantParts,
} from "./pitch-generation";

const analysisSchema = z.object({
  summary: z.string().max(500),
  pitchAngle: z.string().max(300),
  recommendedPackage: z.enum([
    "Landing page rescue",
    "Complete business website",
    "Booking or catalogue website",
  ]),
  evidenceCodes: z.array(z.string()).min(1),
  confidence: z.number().min(0).max(1),
});
export type AiAnalysis = z.infer<typeof analysisSchema>;

const naturalDraftSchema = z.object({
  observation: z.string().min(20).max(260),
  offer: z.string().min(20).max(260),
  evidenceCodes: z.array(z.string()).min(1).max(2),
});

const aiTells =
  /[—–]|\b(additionally|crucial|delve|enhance|highlight|pivotal|showcase|valuable|vibrant|at its core|the real question|here'?s the thing|let'?s dive|game[- ]changer)\b/i;

const pitchVariantSchema = z.object({
  variants: z
    .array(
      z.object({
        label: z.enum(["short", "warm", "specific"]),
        subject: z.string().max(59).nullable(),
        observation: z.string().min(20).max(300),
        cta: z.string().min(20).max(180),
        evidenceCodes: z.array(z.string()).min(1).max(2),
      }),
    )
    .length(3),
});

export function buildPitchPrompt(input: {
  category: string;
  country: string;
  channel: OutreachChannel;
  evidence: PitchEvidence[];
  styleSignals: PitchStyleSignals;
  repairReason?: string;
}) {
  const safeCategories = new Set([
    "restaurant",
    "hotel",
    "salon",
    "spa",
    "caterer",
    "event_venue",
    "beauty",
  ]);
  const category = safeCategories.has(input.category)
    ? input.category.replaceAll("_", " ")
    : "local business";
  const country = countryName(input.country);
  const repair = input.repairReason
    ? `\nThe previous response was rejected for this reason: ${input.repairReason}. Correct it without adding new facts.`
    : "";

  return `Write three distinct first-contact ${input.channel} pitch variants for an anonymous ${category} in ${country}. Use only the anonymized evidence below.

Evidence: ${JSON.stringify(sanitizePitchEvidence(input.evidence))}
Aggregate style signals from earlier outreach: ${JSON.stringify(input.styleSignals)}

Return exactly Short, Warm, and Specific variants in structured JSON.
- Write like a thoughtful independent professional who has personally reviewed the available information. The tone should be polished, friendly, calm, and genuinely human.
- Sound confident and helpful without being pushy, overly casual, stiff, or corporate. Use complete, conversational sentences that flow naturally when read aloud.
- Short is the most compact. Warm is considerate without fake praise or familiarity. Specific leads with the strongest concrete issue and may mention one supporting issue.
- Each variant must cite one primary evidence code and at most one supporting code from the supplied evidence.
- observation should explain what was noticed respectfully and state only what the audit directly established. It should not sound accusatory or like a raw audit report. Never invent benefits, customer behaviour, revenue, sales, prices, results, or compliments.
- CTA must be one natural, low-pressure question asking whether it would be helpful or useful to send or share a brief improvement outline, fix plan, or homepage idea. Do not ask for a call.
- The first message must not mention deposits, payment terms, previews, discounts, or pricing.
- Use plain natural language, contractions where useful, and normal punctuation. Avoid abrupt fragments and canned sales language. No slang, emojis, hype, em dashes, agency language, or AI phrases.
- Do not add a greeting, sign-off, sender name, company name, or brand name. Those details are handled outside this response.
- Never include a business name, person name, address, location, URL, email address, phone number, profile handle, or contact detail.
- Email subjects must describe the primary issue and be under 60 characters. For every other channel, subject must be null.
- Use aggregate signals only as light style guidance. Do not recreate any earlier message.${repair}`;
}

export async function generatePitchVariantParts(input: {
  category: string;
  country: string;
  channel: OutreachChannel;
  evidence: PitchEvidence[];
  styleSignals: PitchStyleSignals;
  repairReason?: string;
}) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing");
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    contents: buildPitchPrompt(input),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["variants"],
        properties: {
          variants: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              additionalProperties: false,
              required: [
                "label",
                "subject",
                "observation",
                "cta",
                "evidenceCodes",
              ],
              properties: {
                label: {
                  type: "string",
                  enum: ["short", "warm", "specific"],
                },
                subject: { type: "string", nullable: true, maxLength: 59 },
                observation: {
                  type: "string",
                  minLength: 20,
                  maxLength: 300,
                },
                cta: { type: "string", minLength: 20, maxLength: 180 },
                evidenceCodes: {
                  type: "array",
                  minItems: 1,
                  maxItems: 2,
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  });
  const parsed = pitchVariantSchema.parse(JSON.parse(response.text ?? "{}"));
  return {
    variants: parsed.variants as PitchVariantParts[],
    usage: response.usageMetadata,
  };
}

export async function draftNaturalPitch(input: {
  category: string;
  country: string;
  channel: "email" | "whatsapp";
  findings: AuditFinding[];
}) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing");
  const evidence = input.findings
    .slice(0, 3)
    .map(({ code, title, evidence, severity }) => ({
      code,
      title,
      evidence,
      severity,
    }));
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    contents: `Write two short pieces of a cold ${input.channel} message for an anonymous ${input.category} business in ${input.country}. Use only this evidence: ${JSON.stringify(evidence)}

First draft it, then silently ask what still sounds AI-generated, and rewrite before returning JSON.

Voice rules adapted from the Humanizer editing workflow:
- Sound like one person who genuinely checked the site, not an agency campaign.
- Use plain words, contractions, and mixed sentence lengths.
- Mention one concrete issue and why a customer might care. Do not list every finding.
- Make a modest offer and end with a low-pressure question.
- No hype, fake familiarity, vague praise, rule-of-three lists, rhetorical hooks, emojis, em dashes, en dashes, or AI vocabulary.
- Do not use names, addresses, contact details, invented facts, revenue claims, or phrases such as "conversion-focused", "digital presence", "turn visitors into customers", "unlock", "elevate", or "I hope this finds you well".
- observation and offer must each be at most 260 characters.
- evidenceCodes must contain only codes from the supplied evidence.`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        additionalProperties: false,
        required: ["observation", "offer", "evidenceCodes"],
        properties: {
          observation: { type: "string", minLength: 20, maxLength: 260 },
          offer: { type: "string", minLength: 20, maxLength: 260 },
          evidenceCodes: {
            type: "array",
            minItems: 1,
            maxItems: 2,
            items: { type: "string" },
          },
        },
      },
    },
  });
  const draft = naturalDraftSchema.parse(JSON.parse(response.text ?? "{}"));
  const validCodes = new Set(evidence.map((item) => item.code));
  if (draft.evidenceCodes.some((code) => !validCodes.has(code)))
    throw new Error("Draft referenced unsupported evidence");
  if (aiTells.test(`${draft.observation} ${draft.offer}`))
    throw new Error("Draft failed the human-language audit");
  return { draft, usage: response.usageMetadata };
}

export async function analyzeFindings(input: {
  category: string;
  country: string;
  score: number;
  findings: AuditFinding[];
}) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing");
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const evidence = input.findings.map(
    ({ code, title, evidence, severity }) => ({
      code,
      title,
      evidence,
      severity,
    }),
  );
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    contents: `Analyze this anonymized website audit for a ${input.category} in market ${input.country}. Use only supplied evidence. Keep summary at 500 characters or fewer and pitchAngle at 300 characters or fewer. Score: ${input.score}. Evidence: ${JSON.stringify(evidence)}`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        required: [
          "summary",
          "pitchAngle",
          "recommendedPackage",
          "evidenceCodes",
          "confidence",
        ],
        additionalProperties: false,
        properties: {
          summary: { type: "string", maxLength: 500 },
          pitchAngle: { type: "string", maxLength: 300 },
          recommendedPackage: {
            type: "string",
            enum: [
              "Landing page rescue",
              "Complete business website",
              "Booking or catalogue website",
            ],
          },
          evidenceCodes: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
  });
  const parsed = analysisSchema.parse(JSON.parse(response.text ?? "{}"));
  const validCodes = new Set(evidence.map((item) => item.code));
  if (parsed.evidenceCodes.some((code) => !validCodes.has(code)))
    throw new Error("AI analysis referenced unsupported evidence");
  return { analysis: parsed, usage: response.usageMetadata };
}
