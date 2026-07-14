import { describe, expect, it } from "vitest";
import { auditWebsite, extractPublicContacts } from "./audit";
import { addBusinessDays, buildPitch } from "./drafts";
import { normalizeDomain, normalizePhone } from "./ids";
import { withDatabaseRetry } from "./db-retry";
import {
  buildFollowUp,
  canTransition,
  preserveStageAfterAudit,
} from "./workflow";

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
      if (attempts === 1)
        throw new Error("fetch failed", {
          cause: Object.assign(new Error("Connect Timeout Error"), {
            code: "UND_ERR_CONNECT_TIMEOUT",
          }),
        });
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
  it("extracts only explicit public contact links with their source", () => {
    const result = extractPublicContacts(
      '<a href="mailto:Hello@Example.com">Email</a><a href="https://wa.me/2348012345678">Chat</a><a href="tel:+44 20 1234 5678">Call</a>',
      "https://example.com/contact",
    );
    expect(result.map((item) => item.channel).sort()).toEqual([
      "email",
      "phone",
      "whatsapp",
    ]);
    expect(
      result.every((item) => item.sourceUrl === "https://example.com/contact"),
    ).toBe(true);
  });
});

describe("outreach safety", () => {
  const finding = {
    code: "no_cta",
    severity: "high" as const,
    title: "No clear conversion action",
    evidence: "No CTA detected",
    recommendation: "Add a booking action",
  };
  it("builds an evidence-based message with opt-out wording", () => {
    const draft = buildPitch({
      businessName: "Test Spa",
      country: "UK",
      channel: "email",
      findings: [finding],
      sourceUrl: "https://maps.example/test",
    });
    expect(draft.body).toContain("no cta detected");
    expect(draft.body).toContain("I won't follow up");
    expect(draft.body).not.toMatch(/[—–]/);
    expect(draft.subject).toBe("Quick note about Test Spa's website");
  });
  it("refuses to pitch without verified findings", () => {
    expect(() =>
      buildPitch({
        businessName: "Test",
        country: "NG",
        channel: "whatsapp",
        findings: [],
        sourceUrl: "https://example.com",
      }),
    ).toThrow();
  });
  it("schedules five business days without weekends", () => {
    expect(
      addBusinessDays(new Date("2026-07-17T09:00:00Z"), 5)
        .toISOString()
        .slice(0, 10),
    ).toBe("2026-07-24");
  });
  it("builds a restrained manual follow-up", () => {
    const result = buildFollowUp(
      "Hi,\n\nI noticed the booking button is missing from the homepage.",
      "email",
    );
    expect(result.subject).toContain("Following up");
    expect(result.body).toContain("No worries");
  });
  it("prevents audit regression and closed-stage reopening by default", () => {
    expect(preserveStageAfterAudit("contacted", 20)).toBe("contacted");
    expect(canTransition("won", "qualified")).toBe(false);
    expect(canTransition("won", "qualified", true)).toBe(true);
  });
});
