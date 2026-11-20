import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import {
  auditWebsite,
  calculateOpportunityScore,
  discoveredContactVerification,
  extractPublicContacts,
} from "./audit";
import { addBusinessDays, buildPitch } from "./drafts";
import { normalizeDomain, normalizePhone } from "./ids";
import { buildPlacesSearchRequest, preferredPlacePhone } from "./places";
import {
  braveSearchErrorMessage,
  buildBraveSearchRequest,
  classifyBusinessLink,
  extractPublicBusinessLinks,
} from "./web-enrichment";
import { withDatabaseRetry } from "./db-retry";
import { createGuardedLookup, isPrivateIp, readCapped, safeFetch } from "./safe-fetch";
import { buildPitchPrompt, geminiModel } from "./gemini";
import { outreachBlockReason } from "./outreach-compliance";
import {
  braveCountryCode,
  countryName,
  isCountryCode,
  isCurrencyCode,
  normalizeCountryCode,
  packagePricesFromCampaign,
} from "./markets";
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
      country: "GB",
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
      country: "GB",
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
      expect(variants.every((item) => !item.body.endsWith("HUSTLE"))).toBe(true);
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

  it("only adds a personal sign-off when one is configured", () => {
    const parts = buildFallbackPitchParts([missingWebsite], "email");
    const withoutSignOff = renderPitchVariants({
      businessName: "Example Salon",
      channel: "email",
      variants: parts,
      validEvidenceCodes: new Set(["missing_website"]),
    });
    const withSignOff = renderPitchVariants({
      businessName: "Example Salon",
      senderName: "Duke",
      channel: "email",
      variants: parts,
      validEvidenceCodes: new Set(["missing_website"]),
    });

    expect(withoutSignOff.every((item) => !item.body.endsWith("HUSTLE"))).toBe(
      true,
    );
    expect(withSignOff.every((item) => item.body.endsWith("Duke"))).toBe(true);
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

  describe("Gemini model selection", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("defaults to Gemini 3.8 Flash", () => {
      vi.stubEnv("GEMINI_MODEL", "");
      expect(geminiModel()).toBe("gemini-3.8-flash");
    });

    it("lets GEMINI_MODEL override the default", () => {
      vi.stubEnv("GEMINI_MODEL", "gemini-3.6-flash");
      expect(geminiModel()).toBe("gemini-3.6-flash");
    });
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
    expect(prompt).toContain("polished, friendly, calm, and genuinely human");
    expect(prompt).toContain("Do not add a greeting, sign-off");
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

  it("requires campaign and lead review outside Nigeria", () => {
    const reviewedCampaign = {
      campaignComplianceReviewedAt: "2026-07-14T11:00:00Z",
      campaignComplianceNote: "Reviewed Canadian commercial messaging rules.",
      approvedChannels: ["email"],
    };
    expect(
      outreachBlockReason({
        country: "CA",
        legalForm: "unknown",
        complianceReviewed: false,
        outreachBasis: null,
        outreachBasisNote: null,
        outreachBasisReviewedAt: null,
        campaignComplianceReviewedAt: null,
        campaignComplianceNote: null,
        approvedChannels: [],
        channel: "email",
      }),
    ).toContain("campaign compliance");
    expect(
      outreachBlockReason({
        country: "CA",
        legalForm: "corporate",
        complianceReviewed: true,
        outreachBasis: "corporate_b2b",
        outreachBasisNote: null,
        outreachBasisReviewedAt: "2026-07-14T12:00:00Z",
        ...reviewedCampaign,
        channel: "linkedin",
      }),
    ).toContain("Approve linkedin");
    expect(
      outreachBlockReason({
        country: "CA",
        legalForm: "unknown",
        complianceReviewed: true,
        outreachBasis: "corporate_b2b",
        outreachBasisNote: null,
        outreachBasisReviewedAt: "2026-07-14T12:00:00Z",
        ...reviewedCampaign,
        channel: "email",
      }),
    ).toContain("confirmed corporate");
    expect(
      outreachBlockReason({
        country: "CA",
        legalForm: "sole_trader",
        complianceReviewed: true,
        outreachBasis: "consent",
        outreachBasisNote: "Consent recorded in the enquiry email",
        outreachBasisReviewedAt: "2026-07-14T12:00:00Z",
        ...reviewedCampaign,
        channel: "email",
      }),
    ).toBeNull();
    expect(
      outreachBlockReason({
        country: "NG",
        legalForm: "unknown",
        complianceReviewed: false,
        outreachBasis: null,
        outreachBasisNote: null,
        outreachBasisReviewedAt: null,
        campaignComplianceReviewedAt: null,
        campaignComplianceNote: null,
        approvedChannels: [],
        channel: "whatsapp",
      }),
    ).toBeNull();
  });
});

describe("worldwide market catalog", () => {
  it.each(["CA", "US", "AU", "DE", "AE", "BR", "IN", "JP"])(
    "accepts the %s market",
    (country) => expect(isCountryCode(country)).toBe(true),
  );

  it("normalizes the legacy UK code and validates currencies", () => {
    expect(normalizeCountryCode("UK")).toBe("GB");
    expect(countryName("GB")).toBe("United Kingdom");
    expect(isCurrencyCode("CAD")).toBe(true);
    expect(isCurrencyCode("ZZZ")).toBe(false);
    expect(isCountryCode("ZZ")).toBe(false);
  });

  it("only applies Brave country bias for supported markets", () => {
    expect(braveCountryCode("GB")).toBe("gb");
    expect(braveCountryCode("NG")).toBeNull();
  });

  it("builds an English Google Places query for the selected market", () => {
    expect(
      buildPlacesSearchRequest({
        city: "Toronto",
        country: "CA",
        category: "event_venue",
        limit: 60,
      }),
    ).toEqual({
      textQuery: "event venue in Toronto, Canada",
      pageSize: 20,
      languageCode: "en",
      regionCode: "CA",
    });
  });

  it("keeps campaign package prices independent of country", () => {
    expect(
      packagePricesFromCampaign({
        landingPagePrice: 650,
        completeWebsitePrice: 1750,
        bookingCataloguePrice: 3000,
      }),
    ).toEqual({
      landingPageRescue: 650,
      completeBusinessWebsite: 1750,
      bookingCatalogueWebsite: 3000,
    });
  });
});

describe("worldwide market migration", () => {
  it("backfills legacy UK campaigns and businesses without changing prices", async () => {
    const client = createClient({ url: "file::memory:" });
    try {
      await client.execute(
        "CREATE TABLE campaigns (id text PRIMARY KEY NOT NULL, country text NOT NULL)",
      );
      await client.execute(
        "CREATE TABLE businesses (id text PRIMARY KEY NOT NULL, country text NOT NULL)",
      );
      await client.execute(
        "INSERT INTO campaigns (id, country) VALUES ('cmp_uk', 'UK')",
      );
      await client.execute(
        "INSERT INTO businesses (id, country) VALUES ('biz_uk', 'UK')",
      );

      const migration = readFileSync(
        new URL("../../drizzle/0007_worldwide_markets.sql", import.meta.url),
        "utf8",
      );
      for (const statement of migration.split("--> statement-breakpoint")) {
        if (statement.trim()) await client.execute(statement);
      }

      const campaign = await client.execute(
        "SELECT country, currency, landing_page_price, complete_website_price, booking_catalogue_price FROM campaigns WHERE id = 'cmp_uk'",
      );
      const business = await client.execute(
        "SELECT country FROM businesses WHERE id = 'biz_uk'",
      );

      expect(campaign.rows[0]).toMatchObject({
        country: "GB",
        currency: "GBP",
        landing_page_price: 450,
        complete_website_price: 1200,
        booking_catalogue_price: 2200,
      });
      expect(business.rows[0]).toMatchObject({ country: "GB" });
    } finally {
      client.close();
    }
  });
});

describe("private address protection", () => {
  it("blocks private, reserved and disguised internal addresses", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.20.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "198.18.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "255.255.255.255",
      "::",
      "::1",
      "fd12::1",
      "fe80::1",
      "febf::1",
      "fec0::1",
      "ff02::1",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1",
      "64:ff9b::7f00:1",
      "[::1]",
      "not-an-ip",
    ])
      expect(isPrivateIp(address), address).toBe(true);
  });

  it("allows ordinary public addresses", () => {
    for (const address of ["8.8.8.8", "104.16.132.229", "2606:4700::6810:84e5", "2001:4860:4860::8888"])
      expect(isPrivateIp(address), address).toBe(false);
  });

  it("refuses to connect when a host resolves to a private address", async () => {
    const lookup = createGuardedLookup((_host, callback) =>
      callback(null, [
        { address: "93.184.216.34", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ]),
    );
    const error = await new Promise<NodeJS.ErrnoException | null>((resolve) =>
      lookup("rebind.example", { all: true }, (err) => resolve(err)),
    );
    expect(error?.code).toBe("EPRIVATEADDRESS");
  });

  it("passes public results through in the shape the socket asked for", async () => {
    const lookup = createGuardedLookup((_host, callback) =>
      callback(null, [{ address: "93.184.216.34", family: 4 }]),
    );
    const single = await new Promise((resolve) =>
      lookup("example.com", {}, (_err, address, family) => resolve([address, family])),
    );
    expect(single).toEqual(["93.184.216.34", 4]);
  });

  it("refuses private IP literals before any connection is made", async () => {
    for (const url of ["http://127.0.0.1/", "http://169.254.169.254/latest", "http://[::1]/", "http://[::ffff:7f00:1]/"])
      await expect(safeFetch(url), url).rejects.toThrow(/private address/);
  });

  it("stops reading a response body at the byte limit", async () => {
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        controller.enqueue(new TextEncoder().encode("a".repeat(1_000)));
      },
    });
    const text = await readCapped({ body }, 2_500);
    expect(text.length).toBe(2_500);
    expect(pulls).toBeLessThan(10);
  });
});

