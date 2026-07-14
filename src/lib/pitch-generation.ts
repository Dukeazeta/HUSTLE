import type { AuditFinding } from "./audit";
import type {
  OutreachChannel,
  PitchVariantLabel,
} from "./constants";

export type PitchEvidence = Pick<
  AuditFinding,
  "code" | "title" | "evidence" | "severity"
>;

export type PitchVariantParts = {
  label: PitchVariantLabel;
  subject: string | null;
  observation: string;
  cta: string;
  evidenceCodes: string[];
};

export type RenderedPitchVariant = {
  label: PitchVariantLabel;
  subject: string | null;
  body: string;
  evidenceCodes: string[];
};

export type PitchStyleSignals = {
  sampleSize: number;
  preferredVariant: PitchVariantLabel | null;
  averageFinalLength: number | null;
  averageParagraphCount: number | null;
  prefersNamedGreeting: boolean | null;
  averageEditRatio: number | null;
  positiveFeedbackRate: number | null;
};

const CHANNEL_LIMITS: Record<OutreachChannel, number> = {
  email: 900,
  whatsapp: 550,
  instagram: 450,
  linkedin: 500,
};

const severityWeight = { high: 300, medium: 200, low: 100 } as const;
const issuePriority: Record<string, number> = {
  missing_website: 90,
  unreachable: 85,
  http_error: 80,
  no_cta: 75,
  weak_contact: 70,
  no_public_contact: 68,
  no_viewport: 65,
  slow_response: 55,
  large_page: 50,
  no_https: 45,
  weak_title: 35,
  no_description: 30,
};

const forbiddenClaims =
  /\b(revenue|sales|profit|conversion(?:s| rate)?|guarantee(?:d)?|customers? (?:will|would|are going to|leave|bounce|love)|visitors? (?:will|would|leave|bounce)|more bookings?|more clients?|increase|boost|grow your|price|cost|deposit|free)\b/i;
const aiTells =
  /[—–]|\b(additionally|crucial|delve|enhance|pivotal|showcase|game[- ]changer|digital presence|conversion-focused|unlock|elevate|I hope this finds you well)\b/i;
const privateData =
  /(?:https?:\/\/|www\.|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d[\d\s().-]{7,}\d))/i;

export function rankPitchEvidence(
  findings: PitchEvidence[],
  auditStatus: string,
): PitchEvidence[] {
  if (!findings.length && auditStatus === "complete") {
    return [
      {
        code: "healthy_website",
        severity: "low",
        title: "No strong rescue issue detected",
        evidence: "The audit found no clear technical website-rescue issue.",
      },
    ];
  }

  return [...findings]
    .sort(
      (a, b) =>
        severityWeight[b.severity] + (issuePriority[b.code] ?? 0) -
        (severityWeight[a.severity] + (issuePriority[a.code] ?? 0)),
    )
    .slice(0, 2);
}

function observationFor(evidence: PitchEvidence) {
  const known: Record<string, string> = {
    missing_website:
      "I couldn't find a website linked from the public business listing.",
    unreachable:
      "I tried the website linked from the listing, but the homepage didn't load.",
    http_error:
      "I opened the listed website and the homepage returned an error.",
    no_cta:
      "I checked the homepage and couldn't find a clear booking, contact, call, or quote action.",
    weak_contact:
      "I checked the homepage and couldn't find a form, email link, or WhatsApp link.",
    no_public_contact:
      "I checked the homepage and its contact pages but couldn't find a public contact method.",
    no_viewport:
      "I checked the homepage and it is missing the setting browsers use for a proper mobile layout.",
    slow_response:
      "I checked the homepage and its initial response took longer than the audit threshold.",
    large_page:
      "I checked the homepage and the page markup is unusually heavy before images load.",
    no_https:
      "I noticed the listed website opens without HTTPS.",
    weak_title:
      "I checked the homepage and couldn't find a clear page title.",
    no_description:
      "I checked the homepage and it is missing a search description.",
    healthy_website:
      "I checked the website linked from the listing and didn't find an obvious technical rescue issue.",
  };
  return known[evidence.code] ?? `I checked the website and noticed: ${evidence.title.toLowerCase()}.`;
}

function permissionCta(evidence: PitchEvidence, compact = false) {
  if (
    evidence.code === "missing_website" ||
    evidence.code === "healthy_website"
  ) {
    return compact
      ? "Would you like me to send a simple homepage idea?"
      : "Would you like me to send a brief homepage idea so you can see what I have in mind?";
  }
  return compact
    ? "Would you like me to send a brief fix plan?"
    : "Would you like me to send a brief fix plan for that, with no obligation to use it?";
}

export function buildFallbackPitchParts(
  evidence: PitchEvidence[],
  channel: OutreachChannel,
): PitchVariantParts[] {
  const primary = evidence[0];
  if (!primary) throw new Error("A pitch requires verified audit evidence");
  const support = evidence[1];
  const primaryObservation = observationFor(primary);
  const supportObservation = support
    ? ` I also noticed ${observationFor(support)
        .replace(/^I (?:checked|tried|noticed|opened) /i, "")
        .replace(/^the /, "the ")}`
    : "";
  const subject =
    primary.code === "missing_website"
      ? "A homepage idea"
      : primary.code === "unreachable" || primary.code === "http_error"
        ? "The website link isn't loading"
        : primary.title.slice(0, 59);

  return [
    {
      label: "short",
      subject: channel === "email" ? subject : null,
      observation: primaryObservation,
      cta: permissionCta(primary, true),
      evidenceCodes: [primary.code],
    },
    {
      label: "warm",
      subject: channel === "email" ? subject : null,
      observation: `${primaryObservation} I thought it was worth mentioning directly rather than sending a generic template.`,
      cta: permissionCta(primary),
      evidenceCodes: [primary.code],
    },
    {
      label: "specific",
      subject: channel === "email" ? subject : null,
      observation: `${primaryObservation}${supportObservation}`,
      cta: permissionCta(primary),
      evidenceCodes: [primary.code, ...(support ? [support.code] : [])],
    },
  ];
}

function greeting(channel: OutreachChannel, businessName: string) {
  if (channel === "email")
    return `Hi,\n\nI found ${businessName} through its public business listing.`;
  if (channel === "linkedin")
    return `Hi, I came across ${businessName}'s business profile.`;
  if (channel === "instagram")
    return `Hi, I found ${businessName} through its public profile.`;
  return `Hi, I came across ${businessName}'s public business listing.`;
}

function optOut(channel: OutreachChannel) {
  return channel === "email"
    ? "If this isn't relevant, just let me know and I won't follow up."
    : "If not, just say and I won't follow up.";
}

export function renderPitchVariants(input: {
  businessName: string;
  senderName: string;
  channel: OutreachChannel;
  variants: PitchVariantParts[];
  validEvidenceCodes: Set<string>;
}): RenderedPitchVariant[] {
  validatePitchParts(
    input.variants,
    input.channel,
    input.validEvidenceCodes,
  );

  const rendered = input.variants.map((variant) => {
    const body = [
      greeting(input.channel, input.businessName),
      variant.observation,
      variant.cta,
      optOut(input.channel),
      input.senderName,
    ].join(input.channel === "email" ? "\n\n" : "\n\n");

    if (body.length > CHANNEL_LIMITS[input.channel]) {
      throw new Error(
        `${variant.label} exceeds the ${input.channel} character limit`,
      );
    }
    return {
      label: variant.label,
      subject: variant.subject,
      body,
      evidenceCodes: variant.evidenceCodes,
    };
  });

  return rendered;
}

export function validatePitchParts(
  variants: PitchVariantParts[],
  channel: OutreachChannel,
  validEvidenceCodes: Set<string>,
) {
  const expected = new Set<PitchVariantLabel>([
    "short",
    "warm",
    "specific",
  ]);
  if (variants.length !== expected.size)
    throw new Error("Generation must contain exactly three variants");

  for (const variant of variants) {
    if (!expected.delete(variant.label))
      throw new Error("Generation contains duplicate or unknown variants");
    if (variant.observation.length < 20 || variant.observation.length > 300)
      throw new Error(`${variant.label} observation has an invalid length`);
    if (variant.cta.length < 20 || variant.cta.length > 180)
      throw new Error(`${variant.label} CTA has an invalid length`);
    if (!/[?]$/.test(variant.cta.trim()) || !/\b(send|share)\b/i.test(variant.cta))
      throw new Error(`${variant.label} CTA must ask permission to send something`);
    if (variant.evidenceCodes.length < 1 || variant.evidenceCodes.length > 2)
      throw new Error(`${variant.label} must cite one or two findings`);
    if (variant.evidenceCodes.some((code) => !validEvidenceCodes.has(code)))
      throw new Error(`${variant.label} referenced unsupported evidence`);
    const text = `${variant.subject ?? ""} ${variant.observation} ${variant.cta}`;
    if (forbiddenClaims.test(text))
      throw new Error(`${variant.label} contains an unsupported claim`);
    if (aiTells.test(text))
      throw new Error(`${variant.label} failed the natural-language check`);
    if (privateData.test(text))
      throw new Error(`${variant.label} contains contact data or a URL`);
    if (channel === "email") {
      if (!variant.subject?.trim() || variant.subject.length >= 60)
        throw new Error(`${variant.label} email subject must be under 60 characters`);
    } else if (variant.subject !== null) {
      throw new Error(`${variant.label} subject is only allowed for email`);
    }
  }
  assertDistinct(
    variants.map((variant) => `${variant.observation} ${variant.cta}`),
  );
}

function assertDistinct(messages: string[]) {
  for (let left = 0; left < messages.length; left++) {
    for (let right = left + 1; right < messages.length; right++) {
      if (jaccard(messages[left], messages[right]) > 0.82)
        throw new Error("Pitch variants are too similar");
    }
  }
}

function jaccard(left: string, right: string) {
  const words = (value: string) =>
    new Set(value.toLowerCase().match(/[a-z0-9']+/g) ?? []);
  const a = words(left);
  const b = words(right);
  const intersection = [...a].filter((word) => b.has(word)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 1;
}

export function sanitizePitchEvidence(evidence: PitchEvidence[]) {
  return evidence.map((item) => ({
    code: item.code,
    severity: item.severity,
    title: redactPrivateData(item.title),
    evidence: redactPrivateData(item.evidence),
  }));
}

function redactPrivateData(value: string) {
  return value
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[redacted-url]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[redacted-phone]")
    .replace(
      /\b\d{1,5}\s+[\p{L}.'-]+(?:\s+[\p{L}.'-]+){0,4}\s+(?:street|st|road|rd|avenue|ave|close|lane|ln|drive|way)\b/giu,
      "[redacted-address]",
    )
    .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, "[redacted-postcode]");
}
