import { describe, expect, it } from "vitest";
import {
  auditWebsite,
  calculateOpportunityScore,
  discoveredContactVerification,
  extractPublicContacts,
} from "./audit";
import { addBusinessDays, buildPitch } from "./drafts";
import { normalizeDomain, normalizePhone } from "./ids";
import { preferredPlacePhone } from "./places";
import {
  braveSearchErrorMessage,
  buildBraveSearchRequest,
  classifyBusinessLink,
  extractPublicBusinessLinks,
} from "./web-enrichment";
import { withDatabaseRetry } from "./db-retry";
import { buildPitchPrompt } from "./gemini";
import { ukOutreachBlockReason } from "./outreach-compliance";
import { aggregatePitchStyleSignals } from "./pitch-learning";
import {
  buildFallbackPitchParts,
  rankPitchEvidence,
  renderPitchVariants,
  validatePitchParts,
} from "./pitch-generation";
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
  it("prefers the international Google listing phone number", () => {
    expect(
      preferredPlacePhone({
        nationalPhoneNumber: "0801 234 5678",
        internationalPhoneNumber: "+234 801 234 5678",
      }),
    ).toBe("+234 801 234 5678");
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
  it("automatically trusts only an explicitly published WhatsApp link", () => {
    expect(discoveredContactVerification("whatsapp")).toMatchObject({
      verified: true,
      verificationMethod: "published_whatsapp",
    });
    expect(discoveredContactVerification("phone")).toMatchObject({
      verified: false,
      verificationMethod: "unverified",
    });
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
  it("extracts plain public emails and structured business phone numbers", () => {
    const result = extractPublicContacts(
      '<p>Bookings: hello@example.com</p><script type="application/ld+json">{"telephone":"+234 801 234 5678"}</script>',
      "https://example.com/about",
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          channel: "email",
          value: "hello@example.com",
        }),
        expect.objectContaining({
          channel: "phone",
          normalizedValue: "+2348012345678",
        }),
      ]),
    );
  });
});

describe("public business presence", () => {
  it("collects business social profiles linked from the official website", () => {
    const links = extractPublicBusinessLinks(
      [
        '<a href="https://instagram.com/testhotel/">Instagram</a>',
        '<a href="https://linkedin.com/company/test-hotel">LinkedIn</a>',
        '<a href="https://linkedin.com/in/private-person">Person</a>',
      ].join(""),
      "https://testhotel.example/contact",
    );
    expect(links.map((link) => link.type).sort()).toEqual([
      "instagram",
      "linkedin",
    ]);
    expect(links.every((link) => link.verificationStatus === "confirmed")).toBe(
      true,
    );
  });
  it("rejects directory pages as official website candidates", () => {
    expect(classifyBusinessLink("https://booking.com/hotel/test")).toBeNull();
    expect(classifyBusinessLink("https://testhotel.example")).toBe("website");
  });
  it("omits unsupported Nigeria country filtering from Brave requests", () => {
    const nigeria = buildBraveSearchRequest({
      businessName: "Test Salon",
      city: "Lagos",
      country: "NG",
    });
    const uk = buildBraveSearchRequest({
      businessName: "Test Salon",
      city: "London",
      country: "UK",
    });
    expect(nigeria.endpoint.searchParams.has("country")).toBe(false);
    expect(nigeria.query).toContain("Nigeria");
    expect(uk.endpoint.searchParams.get("country")).toBe("gb");
  });
  it("explains Brave's invalid-token 422 response", () => {
    expect(
      braveSearchErrorMessage(
        422,
        JSON.stringify({
          error: {
            code: "SUBSCRIPTION_TOKEN_INVALID",
            detail: "The provided subscription token is invalid.",
          },
        }),
      ),
    ).toContain("API key is invalid");
  });
});

describe("opportunity scoring", () => {
  it("scores the same website need differently using real sales evidence", () => {
    const hardToReach = calculateOpportunityScore({
      websiteNeed: 60,
      contactChannels: [],
      rating: 3.4,
      userRatingCount: 3,
      hasAddress: true,
      hasPlaceId: true,
      category: "hotel",
    });
    const activeAndReachable = calculateOpportunityScore({
      websiteNeed: 60,
      contactChannels: ["phone", "whatsapp"],
      rating: 4.7,
      userRatingCount: 250,
      hasAddress: true,
      hasPlaceId: true,
      category: "hotel",
    });
    expect(hardToReach).toBe(66);
    expect(activeAndReachable).toBe(98);
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

describe("pitch generation upgrade", () => {
  const missingWebsite = {
    code: "missing_website",
    severity: "high" as const,
    title: "No business website",
    evidence: "The public business listing has no website URL.",
  };
  const noContact = {
    code: "weak_contact",
    severity: "medium" as const,
    title: "Limited contact path",
    evidence: "No form, email link, or WhatsApp link was detected.",
  };

  it.each(["email", "whatsapp", "instagram", "linkedin"] as const)(
    "builds three distinct and bounded %s fallbacks",
    (channel) => {
      const evidence = rankPitchEvidence(
        [noContact, missingWebsite],
        "missing",
      );
      const variants = renderPitchVariants({
        businessName: "Example Salon",
        senderName: "Duke",
        channel,
        variants: buildFallbackPitchParts(evidence, channel),
        validEvidenceCodes: new Set(evidence.map((item) => item.code)),
      });
      expect(variants.map((item) => item.label)).toEqual([
        "short",
        "warm",
        "specific",
      ]);
      expect(new Set(variants.map((item) => item.body)).size).toBe(3);
      expect(variants.every((item) => item.body.includes("I won't follow up"))).toBe(
        true,
      );
      if (channel === "email")
        expect(variants.every((item) => (item.subject?.length ?? 60) < 60)).toBe(
          true,
        );
      else expect(variants.every((item) => item.subject === null)).toBe(true);
    },
  );

  it("never claims a missing website was reviewed", () => {
    const variants = buildFallbackPitchParts([missingWebsite], "whatsapp");
    expect(variants[0].observation).toContain("couldn't find a website");
    expect(variants[0].observation).not.toMatch(/reviewed|checked the website/i);
  });

  it("rejects unsupported claims and evidence codes", () => {
    expect(() =>
      validatePitchParts(
        [
          {
            label: "short",
            subject: null,
            observation: "This will increase your sales and bookings.",
            cta: "Would you like me to send a brief fix plan?",
            evidenceCodes: ["invented"],
          },
          ...buildFallbackPitchParts([missingWebsite], "whatsapp").slice(1),
        ],
        "whatsapp",
        new Set(["missing_website"]),
      ),
    ).toThrow();
  });

  it("removes contact data from Gemini prompts", () => {
    const prompt = buildPitchPrompt({
      category: "Acme Salon +2348012345678",
      country: "NG",
      channel: "instagram",
      evidence: [
        {
          ...missingWebsite,
          evidence:
            "See https://acme.example or owner@acme.example and +234 801 234 5678.",
        },
      ],
      styleSignals: aggregatePitchStyleSignals([]),
    });
    expect(prompt).not.toContain("Acme Salon");
    expect(prompt).not.toContain("https://acme.example");
    expect(prompt).not.toContain("owner@acme.example");
    expect(prompt).not.toContain("+234 801 234 5678");
  });

  it("learns only aggregate style measurements", () => {
    const signals = aggregatePitchStyleSignals([
      {
        label: "warm",
        originalBody: "Hi,\n\nWould you like me to send a brief fix plan?",
        finalBody: "Hi Ada,\n\nMay I send a short fix plan?",
        feedback: "up",
      },
    ]);
    expect(signals).toMatchObject({
      sampleSize: 1,
      preferredVariant: "warm",
      prefersNamedGreeting: true,
      positiveFeedbackRate: 1,
    });
    expect(JSON.stringify(signals)).not.toContain("Ada");
  });

  it("blocks UK outreach until a valid basis is recorded", () => {
    expect(
      ukOutreachBlockReason({
        country: "UK",
        legalForm: "unknown",
        outreachBasis: null,
        outreachBasisNote: null,
        outreachBasisReviewedAt: null,
      }),
    ).toContain("basis");
    expect(
      ukOutreachBlockReason({
        country: "UK",
        legalForm: "sole_trader",
        outreachBasis: "consent",
        outreachBasisNote: "Consent recorded in the enquiry email",
        outreachBasisReviewedAt: "2026-07-14T12:00:00Z",
      }),
    ).toBeNull();
  });
});
