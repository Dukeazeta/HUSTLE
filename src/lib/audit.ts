import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type AuditFinding = { code: string; severity: "high" | "medium" | "low"; title: string; evidence: string; recommendation: string };
export type WebsiteAudit = { status: string; httpStatus: number | null; responseMs: number | null; pageBytes: number; score: number; findings: AuditFinding[]; summary: string };

function isPrivateIp(address: string) {
  if (!isIP(address)) return true;
  return /^(10\.|127\.|169\.254\.|192\.168\.|0\.|::1$|fc|fd|fe80)/i.test(address) || /^172\.(1[6-9]|2\d|3[01])\./.test(address);
}

export async function assertPublicUrl(raw: string) {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Unsafe website URL");
  const records = await lookup(url.hostname, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) throw new Error("Private or unresolved website host");
  return url;
}

function add(findings: AuditFinding[], code: string, severity: AuditFinding["severity"], title: string, evidence: string, recommendation: string) {
  findings.push({ code, severity, title, evidence, recommendation });
}

export async function auditWebsite(raw?: string | null): Promise<WebsiteAudit> {
  const findings: AuditFinding[] = [];
  if (!raw) {
    add(findings, "missing_website", "high", "No business website", "The public business listing has no website URL.", "Launch a focused mobile-first website with clear contact and booking actions.");
    return { status: "missing", httpStatus: null, responseMs: null, pageBytes: 0, score: 82, findings, summary: "The business has no website, creating a clear website-launch opportunity." };
  }
  const url = await assertPublicUrl(raw);
  if (url.protocol !== "https:") add(findings, "no_https", "high", "Website is not secure", `The listed URL uses ${url.protocol}`, "Move the site to HTTPS and redirect HTTP traffic.");
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8_000), headers: { "User-Agent": "HustleWebsiteAudit/1.0" } });
  } catch {
    add(findings, "unreachable", "high", "Website could not be reached", "The homepage did not respond within 8 seconds.", "Repair hosting or replace the unavailable website.");
    return { status: "unreachable", httpStatus: null, responseMs: Date.now() - started, pageBytes: 0, score: 88, findings, summary: "The listed website is unreachable." };
  }
  const responseMs = Date.now() - started;
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Redirect without a destination");
    const redirected = new URL(location, url);
    await assertPublicUrl(redirected.href);
    response = await fetch(redirected, { redirect: "error", signal: AbortSignal.timeout(8_000), headers: { "User-Agent": "HustleWebsiteAudit/1.0" } });
  }
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > 2_000_000) throw new Error("Website response exceeds the 2 MB audit limit");
  const html = (await response.text()).slice(0, 2_000_000);
  const bytes = Buffer.byteLength(html);
  if (!response.ok) add(findings, "http_error", "high", "Homepage returns an error", `The homepage returned HTTP ${response.status}.`, "Repair the homepage response and hosting configuration.");
  if (responseMs > 2500) add(findings, "slow_response", "medium", "Slow initial response", `The server took ${responseMs} ms to respond.`, "Improve hosting, caching, and server response time.");
  if (bytes > 900_000) add(findings, "large_page", "medium", "Heavy homepage", `The homepage HTML is ${Math.round(bytes / 1024)} KB before images.`, "Reduce markup and defer nonessential content.");
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) add(findings, "no_viewport", "high", "Mobile viewport is missing", "No viewport meta tag was detected.", "Add responsive viewport settings and test on mobile screens.");
  if (!/<title[^>]*>\s*[^<]{3,}/i.test(html)) add(findings, "weak_title", "medium", "Page title is missing or weak", "No meaningful HTML title was detected.", "Write a specific title using the business name, service, and location.");
  if (!/<meta[^>]+name=["']description["']/i.test(html)) add(findings, "no_description", "low", "Search description is missing", "No meta description was detected.", "Add a concise local search description.");
  if (!/(book|reserve|appointment|contact|call|whatsapp|get a quote)/i.test(html)) add(findings, "no_cta", "high", "No clear conversion action", "The page text has no obvious booking, contact, call, or quote action.", "Add a prominent action tailored to how customers buy.");
  if (!/<form\b/i.test(html) && !/(mailto:|wa\.me|api\.whatsapp)/i.test(html)) add(findings, "weak_contact", "medium", "Limited contact path", "No form, email link, or WhatsApp link was detected.", "Add a short contact form and direct messaging option.");
  const score = Math.min(100, findings.reduce((total, f) => total + ({ high: 22, medium: 12, low: 6 }[f.severity]), 8));
  return { status: response.ok ? "complete" : "error", httpStatus: response.status, responseMs, pageBytes: bytes, score, findings, summary: findings.length ? `${findings.length} evidence-backed website opportunities were found.` : "No strong website-rescue opportunity was detected." };
}
