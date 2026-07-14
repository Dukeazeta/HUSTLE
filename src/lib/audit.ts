import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { normalizePhone } from "./ids";
import {
  extractPublicBusinessLinks,
  type BusinessLinkCandidate,
} from "./web-enrichment";

export type AuditFinding = {
  code: string;
  severity: "high" | "medium" | "low";
  title: string;
  evidence: string;
  recommendation: string;
};
export type DiscoveredContact = {
  channel: "email" | "phone" | "whatsapp";
  value: string;
  normalizedValue: string;
  sourceUrl: string;
};
export type WebsiteAudit = {
  status: string;
  httpStatus: number | null;
  responseMs: number | null;
  pageBytes: number;
  score: number;
  findings: AuditFinding[];
  summary: string;
  contacts: DiscoveredContact[];
  links: BusinessLinkCandidate[];
};

export type OpportunityScoreInput = {
  websiteNeed: number;
  contactChannels: Array<DiscoveredContact["channel"]>;
  rating?: number | null;
  userRatingCount?: number | null;
  hasAddress: boolean;
  hasPlaceId: boolean;
  category: string;
};

export function discoveredContactVerification(
  channel: DiscoveredContact["channel"],
) {
  return channel === "whatsapp"
    ? {
        verified: true,
        isPrimary: true,
        verificationMethod: "published_whatsapp" as const,
      }
    : {
        verified: false,
        isPrimary: false,
        verificationMethod: "unverified" as const,
      };
}

const MAX_CONTACT_PAGES = 3;
const CONTACT_PAGE_BYTES = 750_000;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&#x2f;/gi, "/")
    .replace(/&#47;/g, "/")
    .replace(/&#64;|&commat;/gi, "@")
    .replace(/&nbsp;/gi, " ");
}

function isPrivateIp(address: string) {
  if (!isIP(address)) return true;
  return (
    /^(10\.|127\.|169\.254\.|192\.168\.|0\.|::1$|fc|fd|fe80)/i.test(address) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(address)
  );
}

export async function assertPublicUrl(raw: string) {
  const url = new URL(raw);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Unsafe website URL");
  const records = await lookup(url.hostname, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address)))
    throw new Error("Private or unresolved website host");
  return url;
}

function add(
  findings: AuditFinding[],
  code: string,
  severity: AuditFinding["severity"],
  title: string,
  evidence: string,
  recommendation: string,
) {
  findings.push({ code, severity, title, evidence, recommendation });
}

export function calculateOpportunityScore(input: OpportunityScoreInput) {
  let score = Math.max(0, Math.min(60, input.websiteNeed));
  const channels = new Set(input.contactChannels);

  if (channels.has("email") || channels.has("whatsapp")) score += 20;
  else if (channels.has("phone")) score += 16;

  if (input.rating != null) {
    if (input.rating >= 4.5) score += 5;
    else if (input.rating >= 4) score += 4;
    else if (input.rating >= 3.5) score += 2;
    else if (input.rating >= 3) score += 1;
  }

  const reviews = input.userRatingCount ?? 0;
  if (reviews >= 500) score += 10;
  else if (reviews >= 100) score += 8;
  else if (reviews >= 25) score += 5;
  else if (reviews >= 5) score += 2;

  if (input.hasAddress) score += 2;
  if (input.hasPlaceId) score += 2;
  if (
    [
      "restaurant",
      "hotel",
      "salon",
      "spa",
      "caterer",
      "event_venue",
      "beauty",
    ].includes(input.category)
  )
    score += 1;

  return Math.min(100, score);
}

export function extractPublicContacts(
  html: string,
  sourceUrl: string,
): DiscoveredContact[] {
  const found = new Map<string, DiscoveredContact>();
  const addContact = (
    channel: DiscoveredContact["channel"],
    value: string,
    normalizedValue: string,
  ) => {
    if (!normalizedValue) return;
    const key = `${channel}:${normalizedValue.toLowerCase()}`;
    found.set(key, {
      channel,
      value: value.trim(),
      normalizedValue,
      sourceUrl,
    });
  };
  const decodedHtml = decodeHtml(html);

  for (const match of decodedHtml.matchAll(/mailto:([^?"'<>\s]+)/gi)) {
    const email = decodeURIComponent(match[1])
      .toLowerCase()
      .replace(/[.,;:]$/, "");
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      addContact("email", email, email);
  }

  for (const match of decodedHtml.matchAll(
    /(?:wa\.me\/|api\.whatsapp\.com\/(?:send\/)?\?(?:[^"'<>\s]*&)?phone=|whatsapp:\/\/send\?(?:[^"'<>\s]*&)?phone=)(\+?\d[\d\s()-]{6,})/gi,
  )) {
    const phone = normalizePhone(match[1]);
    addContact("whatsapp", match[1], phone ?? "");
  }

  for (const match of decodedHtml.matchAll(/tel:([^?"'<>]+)/gi)) {
    const value = decodeURIComponent(match[1]).trim();
    addContact("phone", value, normalizePhone(value) ?? "");
  }

  for (const match of decodedHtml.matchAll(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  )) {
    const email = match[0].toLowerCase();
    addContact("email", email, email);
  }

  for (const match of decodedHtml.matchAll(
    /["'](?:telephone|phone|mobile)["']\s*:\s*["']([^"']{7,30})["']/gi,
  )) {
    const value = match[1].trim();
    const phone = normalizePhone(value);
    if (phone && phone.replace(/\D/g, "").length >= 7)
      addContact("phone", value, phone);
  }

  return [...found.values()];
}

function discoverContactPageUrls(html: string, baseUrl: string) {
  const base = new URL(baseUrl);
  const candidates = new Map<string, URL>();

  for (const match of html.matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const href = decodeHtml(match[1]).trim();
    const label = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (
      !/(contact|about|reach us|get in touch|find us|location)/i.test(
        `${href} ${label}`,
      )
    )
      continue;

    try {
      const candidate = new URL(href, base);
      const candidateDomain = candidate.hostname
        .toLowerCase()
        .replace(/^www\./, "");
      const baseDomain = base.hostname.toLowerCase().replace(/^www\./, "");
      if (
        candidateDomain !== baseDomain ||
        !["http:", "https:"].includes(candidate.protocol)
      )
        continue;
      candidate.hash = "";
      candidates.set(candidate.href, candidate);
    } catch {
      // Ignore malformed links from third-party websites.
    }
  }

  return [...candidates.values()].slice(0, MAX_CONTACT_PAGES);
}

async function fetchContactPage(url: URL, redirectsRemaining = 2) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(6_000),
    headers: { "User-Agent": "HustleWebsiteAudit/1.0" },
  });
  if (response.status >= 300 && response.status < 400) {
    if (redirectsRemaining === 0) return null;
    const location = response.headers.get("location");
    if (!location) return null;
    const redirected = new URL(location, url);
    const originalDomain = url.hostname.toLowerCase().replace(/^www\./, "");
    const redirectedDomain = redirected.hostname
      .toLowerCase()
      .replace(/^www\./, "");
    if (originalDomain !== redirectedDomain) return null;
    await assertPublicUrl(redirected.href);
    return fetchContactPage(redirected, redirectsRemaining - 1);
  }
  const length = Number(response.headers.get("content-length") || 0);
  const contentType = response.headers.get("content-type") ?? "";
  if (
    !response.ok ||
    length > CONTACT_PAGE_BYTES ||
    !contentType.includes("text/html")
  )
    return null;
  return (await response.text()).slice(0, CONTACT_PAGE_BYTES);
}

export async function auditWebsite(raw?: string | null): Promise<WebsiteAudit> {
  const findings: AuditFinding[] = [];
  if (!raw) {
    add(
      findings,
      "missing_website",
      "high",
      "No business website",
      "The public business listing has no website URL.",
      "Launch a focused mobile-first website with clear contact and booking actions.",
    );
    return {
      status: "missing",
      httpStatus: null,
      responseMs: null,
      pageBytes: 0,
      score: 60,
      findings,
      summary:
        "The business has no website, creating a clear website-launch opportunity.",
      contacts: [],
      links: [],
    };
  }
  const url = await assertPublicUrl(raw);
  if (url.protocol !== "https:")
    add(
      findings,
      "no_https",
      "high",
      "Website is not secure",
      `The listed URL uses ${url.protocol}`,
      "Move the site to HTTPS and redirect HTTP traffic.",
    );
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "HustleWebsiteAudit/1.0" },
    });
  } catch {
    add(
      findings,
      "unreachable",
      "high",
      "Website could not be reached",
      "The homepage did not respond within 8 seconds.",
      "Repair hosting or replace the unavailable website.",
    );
    return {
      status: "unreachable",
      httpStatus: null,
      responseMs: Date.now() - started,
      pageBytes: 0,
      score: 58,
      findings,
      summary: "The listed website is unreachable.",
      contacts: [],
      links: [],
    };
  }
  const responseMs = Date.now() - started;
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirect without a destination");
    const redirected = new URL(location, url);
    await assertPublicUrl(redirected.href);
    response = await fetch(redirected, {
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
      headers: { "User-Agent": "HustleWebsiteAudit/1.0" },
    });
  }
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > 2_000_000)
    throw new Error("Website response exceeds the 2 MB audit limit");
  const html = (await response.text()).slice(0, 2_000_000);
  const finalUrl = response.url || url.href;
  const contacts = new Map(
    extractPublicContacts(html, finalUrl).map((item) => [
      `${item.channel}:${item.normalizedValue}`,
      item,
    ]),
  );
  const links = new Map(
    extractPublicBusinessLinks(html, finalUrl).map((item) => [
      item.normalizedUrl,
      item,
    ]),
  );
  const contactLinks = discoverContactPageUrls(html, finalUrl);
  for (const contactUrl of contactLinks) {
    try {
      await assertPublicUrl(contactUrl.href);
      const contactHtml = await fetchContactPage(contactUrl);
      if (!contactHtml) continue;
      for (const item of extractPublicContacts(contactHtml, contactUrl.href))
        contacts.set(`${item.channel}:${item.normalizedValue}`, item);
      for (const item of extractPublicBusinessLinks(
        contactHtml,
        contactUrl.href,
      ))
        links.set(item.normalizedUrl, item);
    } catch {
      /* Contact enrichment is best-effort and never fails the audit. */
    }
  }
  const bytes = Buffer.byteLength(html);
  if (!response.ok)
    add(
      findings,
      "http_error",
      "high",
      "Homepage returns an error",
      `The homepage returned HTTP ${response.status}.`,
      "Repair the homepage response and hosting configuration.",
    );
  if (responseMs > 2500)
    add(
      findings,
      "slow_response",
      "medium",
      "Slow initial response",
      `The server took ${responseMs} ms to respond.`,
      "Improve hosting, caching, and server response time.",
    );
  if (bytes > 900_000)
    add(
      findings,
      "large_page",
      "medium",
      "Heavy homepage",
      `The homepage HTML is ${Math.round(bytes / 1024)} KB before images.`,
      "Reduce markup and defer nonessential content.",
    );
  if (!/<meta[^>]+name=["']viewport["']/i.test(html))
    add(
      findings,
      "no_viewport",
      "high",
      "Mobile viewport is missing",
      "No viewport meta tag was detected.",
      "Add responsive viewport settings and test on mobile screens.",
    );
  if (!/<title[^>]*>\s*[^<]{3,}/i.test(html))
    add(
      findings,
      "weak_title",
      "medium",
      "Page title is missing or weak",
      "No meaningful HTML title was detected.",
      "Write a specific title using the business name, service, and location.",
    );
  if (!/<meta[^>]+name=["']description["']/i.test(html))
    add(
      findings,
      "no_description",
      "low",
      "Search description is missing",
      "No meta description was detected.",
      "Add a concise local search description.",
    );
  if (
    !/(book|reserve|appointment|contact|call|whatsapp|get a quote)/i.test(html)
  )
    add(
      findings,
      "no_cta",
      "high",
      "No clear conversion action",
      "The page text has no obvious booking, contact, call, or quote action.",
      "Add a prominent action tailored to how customers buy.",
    );
  if (!/<form\b/i.test(html) && !/(mailto:|wa\.me|api\.whatsapp)/i.test(html))
    add(
      findings,
      "weak_contact",
      "medium",
      "Limited contact path",
      "No form, email link, or WhatsApp link was detected.",
      "Add a short contact form and direct messaging option.",
    );
  if (contacts.size === 0)
    add(
      findings,
      "no_public_contact",
      "medium",
      "No public contact details found",
      "The homepage and checked contact pages exposed no business email, telephone number, or WhatsApp contact.",
      "Add a clearly visible business contact method and keep it consistent across the website.",
    );
  const score = Math.min(
    60,
    findings.reduce(
      (total, f) => total + { high: 14, medium: 8, low: 4 }[f.severity],
      0,
    ),
  );
  return {
    status: response.ok ? "complete" : "error",
    httpStatus: response.status,
    responseMs,
    pageBytes: bytes,
    score,
    findings,
    summary: findings.length
      ? `${findings.length} evidence-backed website opportunities were found.`
      : "No strong website-rescue opportunity was detected.",
    contacts: [...contacts.values()],
    links: [...links.values()],
  };
}
