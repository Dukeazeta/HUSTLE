import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// A real SQLite file, migrated with the same migrator production uses.
const dir = mkdtempSync(join(tmpdir(), "hustle-tenant-"));
process.env.TURSO_CONNECTION_URL = `file:${join(dir, "tenant.db")}`;
delete process.env.DEMO_MODE;
process.env.BRAVE_SEARCH_API_KEY = "test-key";
process.env.GOOGLE_PLACES_API_KEY = "test-key";

const session = vi.hoisted(() => ({
  current: null as null | { user: { id: string; email: string; name: string } },
}));
vi.mock("@/auth", () => ({ auth: vi.fn(async () => session.current) }));
vi.mock("@/lib/places", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/places")>()),
  searchPlaces: vi.fn(async () => [
    {
      id: "place_shared",
      displayName: { text: "Shared Salon (A's copy)" },
      formattedAddress: "1 Example Street",
      websiteUri: "https://shared-salon.example",
      googleMapsUri: "https://maps.google.com/?cid=1",
      primaryType: "beauty_salon",
    },
  ]),
  getPlaceDetails: vi.fn(async () => null),
}));

const { migrate } = await import("drizzle-orm/libsql/migrator");
const { eq } = await import("drizzle-orm");
const { db } = await import("@/db");
const schema = await import("@/db/schema");
const { resolveWorkspace, LEGACY_WORKSPACE_ID } = await import("@/lib/workspace");

const USER_A = { id: "user_a", email: "ann@example.com", name: "Ann Example" };
const USER_B = { id: "user_b", email: "ben@example.com", name: "Ben Example" };
const B = {
  workspace: "ws_b",
  campaign: "cmp_b",
  business: "biz_b",
  audit: "aud_b",
  contact: "con_b",
  link: "lnk_b",
  generation: "pgen_b",
  variant: "pvar_b",
  draft: "drf_b",
  opportunity: "opp_b",
  proposal: "prp_b",
};

async function seed() {
  const now = new Date().toISOString();
  await db.insert(schema.users).values([
    { id: USER_A.id, email: USER_A.email, name: USER_A.name },
    { id: USER_B.id, email: USER_B.email, name: USER_B.name },
  ]);
  await db.insert(schema.workspaces).values([
    { id: "ws_a", name: "Ann's workspace" },
    { id: B.workspace, name: "Ben's workspace" },
  ]);
  await db.insert(schema.workspaceMembers).values([
    { workspaceId: "ws_a", userId: USER_A.id },
    { workspaceId: B.workspace, userId: USER_B.id },
  ]);
  await db.insert(schema.campaigns).values([
    { id: "cmp_a", workspaceId: "ws_a", name: "Ann Lagos", country: "NG", city: "Lagos", category: "salon", status: "active" },
    { id: B.campaign, workspaceId: B.workspace, name: "Ben Lagos", country: "NG", city: "Lagos", category: "salon", status: "active" },
  ]);
  await db.insert(schema.businesses).values([
    { id: "biz_a", workspaceId: "ws_a", campaignId: "cmp_a", placeId: "place_a", name: "Ann's Lead", category: "salon", country: "NG", city: "Lagos", sourceUrl: "https://maps.example/a", sourceDiscoveredAt: now },
    { id: B.business, workspaceId: B.workspace, campaignId: B.campaign, placeId: "place_shared", name: "Shared Salon (B's copy)", category: "salon", country: "NG", city: "Lagos", sourceUrl: "https://maps.example/b", sourceDiscoveredAt: now, phone: "+2348000000000", stage: "contacted", score: 80 },
  ]);
  await db.insert(schema.audits).values({ id: B.audit, businessId: B.business, status: "ok", score: 80 });
  await db.insert(schema.contacts).values({ id: B.contact, businessId: B.business, channel: "email", value: "owner@b.example", normalizedValue: "owner@b.example", sourceUrl: "https://b.example", discoveredAt: now });
  await db.insert(schema.businessLinks).values({ id: B.link, businessId: B.business, type: "instagram", url: "https://instagram.com/bsalon", normalizedUrl: "instagram.com/bsalon", sourceUrl: "https://b.example", discoveredAt: now, evidence: "Linked from website", confidence: 0.9 });
  await db.insert(schema.pitchGenerations).values({ id: B.generation, businessId: B.business, requestId: "request_b_1", channel: "email", usedFallback: true, styleSignals: {} as never });
  await db.insert(schema.pitchVariants).values({ id: B.variant, generationId: B.generation, label: "short", body: "Ben's private pitch text", evidenceCodes: [] as never });
  await db.insert(schema.outreachDrafts).values({ id: B.draft, businessId: B.business, channel: "email", body: "Ben's private draft body", status: "sent", sentAt: now, followUpDueAt: now });
  await db.insert(schema.opportunities).values({ id: B.opportunity, businessId: B.business, stage: "qualified" });
  await db.insert(schema.proposals).values({ id: B.proposal, opportunityId: B.opportunity, title: "Ben's proposal", content: "Private", expiresAt: now });
}

async function snapshotB() {
  return JSON.stringify({
    campaign: await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, B.campaign)),
    business: await db.select().from(schema.businesses).where(eq(schema.businesses.id, B.business)),
    contacts: await db.select().from(schema.contacts).where(eq(schema.contacts.businessId, B.business)),
    links: await db.select().from(schema.businessLinks).where(eq(schema.businessLinks.businessId, B.business)),
    drafts: await db.select().from(schema.outreachDrafts).where(eq(schema.outreachDrafts.businessId, B.business)),
    opportunity: await db.select().from(schema.opportunities).where(eq(schema.opportunities.id, B.opportunity)),
    proposals: await db.select().from(schema.proposals).where(eq(schema.proposals.opportunityId, B.opportunity)),
    activities: await db.select().from(schema.activities).where(eq(schema.activities.businessId, B.business)),
    suppressions: await db.select().from(schema.suppressions),
  });
}

const json = (method: string, body?: unknown) =>
  new Request("http://localhost/api/test", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params) });

beforeAll(async () => {
  await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
  await seed();
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));
beforeEach(() => {
  session.current = { user: USER_A };
});

describe("tenant isolation: user A cannot reach workspace B", () => {
  it("returns 404 from every route given B's ids and leaves B's data untouched", async () => {
    const before = await snapshotB();
    const expiresAt = new Date(Date.now() + 86_400_000).toISOString();
    const calls: Array<[string, () => Promise<Response>]> = [
      ["PATCH campaign", async () => (await import("./campaigns/[id]/route")).PATCH(json("PATCH", { action: "stop" }), ctx({ id: B.campaign }))],
      ["DELETE campaign", async () => (await import("./campaigns/[id]/route")).DELETE(json("DELETE"), ctx({ id: B.campaign }))],
      ["POST campaign search", async () => (await import("./campaigns/[id]/search/route")).POST(json("POST"), ctx({ id: B.campaign }))],
      ["PATCH lead", async () => (await import("./leads/[id]/route")).PATCH(json("PATCH", { legalForm: "corporate" }), ctx({ id: B.business }))],
      ["POST lead audit", async () => (await import("./leads/[id]/audit/route")).POST(json("POST"), ctx({ id: B.business }))],
      ["POST lead draft", async () => (await import("./leads/[id]/draft/route")).POST(json("POST", { channel: "email", requestId: "request_a_123" }), ctx({ id: B.business }))],
      ["POST lead enrich", async () => (await import("./leads/[id]/enrich/route")).POST(json("POST"), ctx({ id: B.business }))],
      ["PATCH lead link", async () => (await import("./leads/[id]/links/[linkId]/route")).PATCH(json("PATCH", { action: "reject" }), ctx({ id: B.business, linkId: B.link }))],
      ["PATCH link via own lead id", async () => (await import("./leads/[id]/links/[linkId]/route")).PATCH(json("PATCH", { action: "reject" }), ctx({ id: "biz_a", linkId: B.link }))],
      ["POST lead opt-out", async () => (await import("./leads/[id]/opt-out/route")).POST(json("POST", { reason: "Asked us to stop" }), ctx({ id: B.business }))],
      ["PATCH opportunity", async () => (await import("./opportunities/[id]/route")).PATCH(json("PATCH", { packageName: "Complete website" }), ctx({ id: B.opportunity }))],
      ["POST preview approved", async () => (await import("./opportunities/[id]/preview-approved/route")).POST(json("POST"), ctx({ id: B.opportunity }))],
      ["POST proposal", async () => (await import("./opportunities/[id]/proposal/route")).POST(json("POST", { title: "Hijack", content: "x".repeat(60), expiresAt }), ctx({ id: B.opportunity }))],
      ["POST payment", async () => (await import("./opportunities/[id]/payment/route")).POST(json("POST", { amountMinor: 1000, currency: "NGN" }), ctx({ id: B.opportunity }))],
      ["PATCH outreach draft", async () => (await import("./outreach/[id]/route")).PATCH(json("PATCH", { body: "Overwritten by someone else" }), ctx({ id: B.draft }))],
      ["POST follow-up", async () => (await import("./outreach/[id]/follow-up/route")).POST(json("POST", {}), ctx({ id: B.draft }))],
      ["POST mark follow-up sent", async () => (await import("./outreach/[id]/mark-follow-up-sent/route")).POST(json("POST"), ctx({ id: B.draft }))],
      ["POST mark sent", async () => (await import("./outreach/[id]/mark-sent/route")).POST(json("POST"), ctx({ id: B.draft }))],
      ["POST select pitch variant", async () => (await import("./pitch-variants/[id]/select/route")).POST(json("POST"), ctx({ id: B.variant }))],
    ];
    for (const [name, call] of calls) {
      const response = await call();
      expect(response.status, `${name} → ${await response.clone().text()}`).toBe(404);
    }
    expect(await snapshotB()).toBe(before);
  });

  it("lists only the caller's campaigns and leads", async () => {
    const campaigns = await (await (await import("./campaigns/route")).GET()).json();
    expect(campaigns.campaigns.map((c: { id: string }) => c.id)).toEqual(["cmp_a"]);
    const leads = await (await (await import("./leads/route")).GET()).json();
    expect(leads.leads.map((l: { id: string }) => l.id)).toEqual(["biz_a"]);
  });

  it("imports a place B already has as A's own copy without touching B's row", async () => {
    const before = await snapshotB();
    const { POST } = await import("./campaigns/[id]/search/route");
    const response = await POST(json("POST"), ctx({ id: "cmp_a" }));
    expect(response.status).toBe(200);
    expect((await response.json()).imported).toBe(1);
    const copies = await db
      .select({ id: schema.businesses.id, workspaceId: schema.businesses.workspaceId, name: schema.businesses.name })
      .from(schema.businesses)
      .where(eq(schema.businesses.placeId, "place_shared"));
    expect(copies).toHaveLength(2);
    expect(copies.find((c) => c.workspaceId === "ws_a")?.name).toBe("Shared Salon (A's copy)");
    expect(await snapshotB()).toBe(before);
  });

  it("stops searches once the workspace's daily cap is used", async () => {
    process.env.PLACES_DAILY_SEARCH_LIMIT = "1";
    try {
      const { POST } = await import("./campaigns/[id]/search/route");
      // The previous test already used A's one search for today.
      const response = await POST(json("POST"), ctx({ id: "cmp_a" }));
      expect(response.status).toBe(429);
      session.current = { user: USER_B };
      expect((await POST(json("POST"), ctx({ id: B.campaign }))).status).toBe(200);
    } finally {
      delete process.env.PLACES_DAILY_SEARCH_LIMIT;
    }
  });
});

describe("workspace resolution", () => {
  it("gives a new user one personal workspace, even on simultaneous first requests", async () => {
    await db.insert(schema.users).values({ id: "user_new", email: "new@example.com", name: "Nia New" });
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        resolveWorkspace({ userId: "user_new", email: "new@example.com", name: "Nia New" }),
      ),
    );
    expect(new Set(results.map((r) => r.workspaceId))).toEqual(new Set(["ws_user_new"]));
    const memberships = await db
      .select()
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.userId, "user_new"));
    expect(memberships).toHaveLength(1);
    const [workspace] = await db.select().from(schema.workspaces).where(eq(schema.workspaces.id, "ws_user_new"));
    expect(workspace.name).toBe("Nia's workspace");
  });

  it("lets only LEGACY_DATA_OWNER_EMAIL claim the original workspace, once", async () => {
    process.env.LEGACY_DATA_OWNER_EMAIL = "Owner@Example.com";
    try {
      await db.insert(schema.users).values([
        { id: "user_other", email: "other@example.com" },
        { id: "user_owner", email: "owner@example.com" },
        { id: "user_late", email: "late@example.com" },
      ]);
      const other = await resolveWorkspace({ userId: "user_other", email: "other@example.com", name: null });
      expect(other.workspaceId).toBe("ws_user_other");

      const owner = await resolveWorkspace({ userId: "user_owner", email: "owner@example.com", name: null });
      expect(owner).toMatchObject({ workspaceId: LEGACY_WORKSPACE_ID, role: "owner" });

      // A second account using the same email after the claim gets its own workspace.
      const late = await resolveWorkspace({ userId: "user_late", email: "owner@example.com", name: null });
      expect(late.workspaceId).toBe("ws_user_late");
      const legacyMembers = await db
        .select()
        .from(schema.workspaceMembers)
        .where(eq(schema.workspaceMembers.workspaceId, LEGACY_WORKSPACE_ID));
      expect(legacyMembers.map((m) => m.userId)).toEqual(["user_owner"]);
    } finally {
      delete process.env.LEGACY_DATA_OWNER_EMAIL;
    }
  });
});

describe("custom business categories", () => {
  it("saves any business type as a slug in the caller's workspace", async () => {
    const { POST } = await import("./campaigns/route");
    const response = await POST(
      json("POST", {
        name: "Accra dentists",
        country: "GH",
        city: "Accra",
        category: "  Dental   Clinic ",
      }),
    );
    expect(response.status).toBe(201);
    const [row] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.name, "Accra dentists"));
    expect(row.category).toBe("dental_clinic");
    expect(row.workspaceId).not.toBe(B.workspace);
  });

  it("rejects business types that aren't plain words", async () => {
    const { POST } = await import("./campaigns/route");
    for (const category of ["", "x", "gyms; DROP TABLE", "<script>", "a".repeat(51)]) {
      const response = await POST(
        json("POST", { name: "Bad type", country: "GH", city: "Accra", category }),
      );
      expect(response.status).toBe(400);
    }
  });
});
