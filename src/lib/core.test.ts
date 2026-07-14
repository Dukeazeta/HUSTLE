import { describe, expect, it } from "vitest";
import { auditWebsite } from "./audit";
import { addBusinessDays, buildPitch } from "./drafts";
import { normalizeDomain, normalizePhone } from "./ids";
import { withDatabaseRetry } from "./db-retry";

describe("lead normalization", () => {
  it("normalizes domains and phone numbers for deduplication", () => {
    expect(normalizeDomain("https://www.Example.com/menu")).toBe("example.com");
    expect(normalizePhone("+234 (801) 234-5678")).toBe("+2348012345678");
  });
});

describe("database resilience", () => {
  it("retries a transient Turso connection timeout once", async () => {
    let attempts = 0;
    const value = await withDatabaseRetry(async () => {
      attempts++;
      if (attempts === 1) throw new Error("fetch failed", { cause: Object.assign(new Error("Connect Timeout Error"), { code: "UND_ERR_CONNECT_TIMEOUT" }) });
      return "connected";
    });
    expect(value).toBe("connected");
    expect(attempts).toBe(2);
  });
});

describe("website audit", () => {
  it("qualifies a missing website with evidence", async () => {
    const result = await auditWebsite(null);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.findings[0].code).toBe("missing_website");
  });
});

describe("outreach safety", () => {
  const finding = { code: "no_cta", severity: "high" as const, title: "No clear conversion action", evidence: "No CTA detected", recommendation: "Add a booking action" };
  it("builds an evidence-based message with opt-out wording", () => {
    const draft = buildPitch({ businessName: "Test Spa", country: "UK", channel: "email", findings: [finding], sourceUrl: "https://maps.example/test" });
    expect(draft.body).toContain("no cta detected");
    expect(draft.body).toContain("I won't follow up");
    expect(draft.body).not.toMatch(/[—–]/);
    expect(draft.subject).toBe("Quick note about Test Spa's website");
  });
  it("refuses to pitch without verified findings", () => {
    expect(() => buildPitch({ businessName: "Test", country: "NG", channel: "whatsapp", findings: [], sourceUrl: "https://example.com" })).toThrow();
  });
  it("schedules five business days without weekends", () => {
    expect(addBusinessDays(new Date("2026-07-17T09:00:00Z"), 5).toISOString().slice(0, 10)).toBe("2026-07-24");
  });
});
