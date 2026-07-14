import { z } from "zod";

export const BUSINESS_LINK_TYPES = [
  "website",
  "instagram",
  "linkedin",
  "facebook",
  "x",
  "tiktok",
] as const;

export type BusinessLinkType = (typeof BUSINESS_LINK_TYPES)[number];

export type BusinessLinkCandidate = {
  type: BusinessLinkType;
  url: string;
  normalizedUrl: string;
  sourceUrl: string;
  confidence: number;
  evidence: string;
  verificationStatus: "candidate" | "confirmed";
};

const searchResponseSchema = z.object({
  web: z
    .object({
      results: z
        .array(
          z.object({
            title: z.string(),
            url: z.string().url(),
            description: z.string().optional().default(""),
          }),
        )
        .default([]),
    })
    .optional(),
});

const directoryDomains = new Set([
  "google.com",
  "tripadvisor.com",
  "booking.com",
  "hotels.com",
  "yelp.com",
  "foursquare.com",
  "zomato.com",
  "expedia.com",
  "agoda.com",
  "mapquest.com",
  "opentable.com",
]);

const genericTerms = new Set([
  "and",
  "the",
  "hotel",
  "hotels",
  "restaurant",
  "restaurants",
  "salon",
  "spa",
  "limited",
  "ltd",
  "company",
  "official",
]);

function cleanText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string) {
  const meaningful = cleanText(value)
    .split(" ")
    .filter((term) => term.length >= 3 && !genericTerms.has(term));
  return [...new Set(meaningful)];
}

function rootDomain(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isDomain(domain: string, expected: string) {
  return domain === expected || domain.endsWith(`.${expected}`);
}

export function normalizeBusinessLink(raw: string) {
  const url = new URL(raw);
  url.hash = "";
  for (const key of [...url.searchParams.keys()])
    if (key.startsWith("utm_") || ["fbclid", "gclid"].includes(key))
      url.searchParams.delete(key);
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.href;
}

export function classifyBusinessLink(raw: string): BusinessLinkType | null {
  const url = new URL(raw);
  const domain = rootDomain(url.hostname);
  const path = url.pathname.toLowerCase();
  if (isDomain(domain, "instagram.com")) {
    if (/^\/(?:accounts|explore|p|reel|stories)(?:\/|$)/.test(path))
      return null;
    return "instagram";
  }
  if (isDomain(domain, "linkedin.com"))
    return path.startsWith("/company/") ? "linkedin" : null;
  if (isDomain(domain, "facebook.com")) {
    if (/^\/(?:share|dialog|login|groups)(?:\/|$)/.test(path)) return null;
    return "facebook";
  }
  if (isDomain(domain, "x.com") || isDomain(domain, "twitter.com")) return "x";
  if (isDomain(domain, "tiktok.com"))
    return path.startsWith("/@") ? "tiktok" : null;
  if (
    [...directoryDomains].some(
      (blocked) => domain === blocked || domain.endsWith(`.${blocked}`),
    )
  )
    return null;
  return "website";
}

export function extractPublicBusinessLinks(
  html: string,
  sourceUrl: string,
): BusinessLinkCandidate[] {
  const found = new Map<string, BusinessLinkCandidate>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1].replace(/&amp;/gi, "&"), sourceUrl);
      const type = classifyBusinessLink(url.href);
      if (!type || type === "website") continue;
      const normalizedUrl = normalizeBusinessLink(url.href);
      found.set(normalizedUrl, {
        type,
        url: normalizedUrl,
        normalizedUrl,
        sourceUrl,
        confidence: 95,
        evidence: `The business website links directly to this ${type} profile.`,
        verificationStatus: "confirmed",
      });
    } catch {
      // Ignore malformed public links.
    }
  }
  return [...found.values()];
}

function scoreResult(input: {
  businessName: string;
  city: string;
  title: string;
  description: string;
  url: string;
  type: BusinessLinkType;
}) {
  const nameTerms = tokens(input.businessName);
  const titleTerms = new Set(tokens(input.title));
  const urlText = cleanText(new URL(input.url).pathname);
  const description = cleanText(input.description);
  const matchedTitle = nameTerms.filter((term) => titleTerms.has(term)).length;
  const matchedUrl = nameTerms.filter((term) => urlText.includes(term)).length;
  const matchedDescription = nameTerms.filter((term) =>
    description.includes(term),
  ).length;
  const denominator = Math.max(1, nameTerms.length);
  const cityMatched = cleanText(`${input.title} ${input.description}`).includes(
    cleanText(input.city),
  );
  let score = Math.round(
    (matchedTitle / denominator) * 45 +
      (matchedUrl / denominator) * 20 +
      (matchedDescription / denominator) * 10 +
      (cityMatched ? 10 : 0) +
      (input.type !== "website" ? 5 : 0),
  );
  if (matchedTitle === denominator && denominator > 0) score += 10;
  score = Math.min(100, score);
  const evidence = [
    `${matchedTitle}/${denominator} business-name terms matched the result title`,
    cityMatched ? "city matched" : "city not shown",
  ].join("; ");
  return { score, evidence };
}

export async function searchPublicBusinessPresence(input: {
  businessName: string;
  city: string;
  country: string;
}) {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) throw new Error("Brave Search is not configured");
  const query = `"${input.businessName}" "${input.city}" ${input.country} official website Instagram LinkedIn`;
  const endpoint = new URL("https://api.search.brave.com/res/v1/web/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("count", "10");
  endpoint.searchParams.set("search_lang", "en");
  endpoint.searchParams.set("safesearch", "moderate");
  endpoint.searchParams.set("country", input.country === "NG" ? "NG" : "GB");
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": key,
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Brave Search returned ${response.status}`);
  const parsed = searchResponseSchema.parse(await response.json());
  const sourceUrl = `https://search.brave.com/search?q=${encodeURIComponent(query)}`;
  const candidates = new Map<string, BusinessLinkCandidate>();
  for (const result of parsed.web?.results ?? []) {
    try {
      const type = classifyBusinessLink(result.url);
      if (!type) continue;
      const { score, evidence } = scoreResult({
        businessName: input.businessName,
        city: input.city,
        title: result.title,
        description: result.description,
        url: result.url,
        type,
      });
      if (score < (type === "website" ? 55 : 50)) continue;
      const normalizedUrl = normalizeBusinessLink(result.url);
      const existing = candidates.get(normalizedUrl);
      if (existing && existing.confidence >= score) continue;
      candidates.set(normalizedUrl, {
        type,
        url: normalizedUrl,
        normalizedUrl,
        sourceUrl,
        confidence: score,
        evidence,
        verificationStatus: "candidate",
      });
    } catch {
      // Ignore malformed or unsupported result URLs.
    }
  }
  return [...candidates.values()];
}
