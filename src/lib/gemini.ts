import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { AuditFinding } from "./audit";

const analysisSchema = z.object({ summary: z.string().max(500), pitchAngle: z.string().max(300), recommendedPackage: z.enum(["Landing page rescue", "Complete business website", "Booking or catalogue website"]), evidenceCodes: z.array(z.string()).min(1), confidence: z.number().min(0).max(1) });
export type AiAnalysis = z.infer<typeof analysisSchema>;

const naturalDraftSchema = z.object({
  observation: z.string().min(20).max(260),
  offer: z.string().min(20).max(260),
  evidenceCodes: z.array(z.string()).min(1).max(2),
});

const aiTells = /[—–]|\b(additionally|crucial|delve|enhance|highlight|pivotal|showcase|valuable|vibrant|at its core|the real question|here'?s the thing|let'?s dive|game[- ]changer)\b/i;

export async function draftNaturalPitch(input: { category: string; country: string; channel: "email" | "whatsapp"; findings: AuditFinding[] }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing");
  const evidence = input.findings.slice(0, 3).map(({ code, title, evidence, severity }) => ({ code, title, evidence, severity }));
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
    config: { responseMimeType: "application/json", responseJsonSchema: { type: "object", additionalProperties: false, required: ["observation", "offer", "evidenceCodes"], properties: { observation: { type: "string", minLength: 20, maxLength: 260 }, offer: { type: "string", minLength: 20, maxLength: 260 }, evidenceCodes: { type: "array", minItems: 1, maxItems: 2, items: { type: "string" } } } } },
  });
  const draft = naturalDraftSchema.parse(JSON.parse(response.text ?? "{}"));
  const validCodes = new Set(evidence.map((item) => item.code));
  if (draft.evidenceCodes.some((code) => !validCodes.has(code))) throw new Error("Draft referenced unsupported evidence");
  if (aiTells.test(`${draft.observation} ${draft.offer}`)) throw new Error("Draft failed the human-language audit");
  return { draft, usage: response.usageMetadata };
}

export async function analyzeFindings(input: { category: string; country: string; score: number; findings: AuditFinding[] }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini API key is missing");
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const evidence = input.findings.map(({ code, title, evidence, severity }) => ({ code, title, evidence, severity }));
  const response = await client.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    contents: `Analyze this anonymized website audit for a ${input.category} in market ${input.country}. Use only supplied evidence. Keep summary at 500 characters or fewer and pitchAngle at 300 characters or fewer. Score: ${input.score}. Evidence: ${JSON.stringify(evidence)}`,
    config: { responseMimeType: "application/json", responseJsonSchema: { type: "object", required: ["summary", "pitchAngle", "recommendedPackage", "evidenceCodes", "confidence"], additionalProperties: false, properties: { summary: { type: "string", maxLength: 500 }, pitchAngle: { type: "string", maxLength: 300 }, recommendedPackage: { type: "string", enum: ["Landing page rescue", "Complete business website", "Booking or catalogue website"] }, evidenceCodes: { type: "array", minItems: 1, items: { type: "string" } }, confidence: { type: "number", minimum: 0, maximum: 1 } } } },
  });
  const parsed = analysisSchema.parse(JSON.parse(response.text ?? "{}"));
  const validCodes = new Set(evidence.map((item) => item.code));
  if (parsed.evidenceCodes.some((code) => !validCodes.has(code))) throw new Error("AI analysis referenced unsupported evidence");
  return { analysis: parsed, usage: response.usageMetadata };
}
