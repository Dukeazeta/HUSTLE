import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/auth", () => ({ auth: vi.fn(async () => null) }));

const { apiError, notConfigured, parseBody, UserError } = await import("./api");
const { requireWorkspace } = await import("./workspace");
const { isDemoMode } = await import("./demo");

const jsonRequest = (body: string) =>
  new Request("http://localhost/api/test", { method: "POST", body });

describe("API error responses", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows a UserError's message and status", async () => {
    const response = apiError(new UserError("Contact value is invalid", 422));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "Contact value is invalid" });
  });

  it("hides internal error details behind the fallback", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = apiError(
      new Error("Brave Search API key is invalid. Replace BRAVE_SEARCH_API_KEY"),
      "Public presence search failed",
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: "Public presence search failed" });
    expect(JSON.stringify(body)).not.toContain("BRAVE_SEARCH_API_KEY");
  });

  it("uses a calm generic message when no fallback is given", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const body = await apiError(new Error("SQLITE_BUSY")).json();
    expect(body.error).toBe("Something went wrong. Your saved data is unchanged.");
  });

  it("turns invalid request bodies into readable 400 errors", async () => {
    const schema = z.object({ name: z.string().min(2) });
    const invalid = await parseBody(jsonRequest('{"name":"a"}'), schema).catch((e) => e);
    expect(invalid).toBeInstanceOf(UserError);
    expect(apiError(invalid).status).toBe(400);
    expect(invalid.message).toMatch(/^Invalid name:/);

    const malformed = await parseBody(jsonRequest("{oops"), schema).catch((e) => e);
    expect(malformed.message).toBe("The request body is not valid JSON.");
  });

  it("accepts a fallback body for optional payloads", async () => {
    const schema = z.object({ reason: z.string().optional() });
    await expect(parseBody(jsonRequest(""), schema, {})).resolves.toEqual({});
  });
});

describe("demo mode", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("lets demo visitors in without a session and keeps data read-only", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("VERCEL_ENV", "");
    expect(isDemoMode()).toBe(true);
    expect(await requireWorkspace()).toMatchObject({
      email: "demo@hustle.local",
      workspaceId: "ws_demo",
    });
    const response = notConfigured("Turso");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Demo data is read-only" });
  });

  it("is ignored on Vercel production", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isDemoMode()).toBe(false);
    expect(await requireWorkspace()).toBeNull();
    expect(notConfigured("Turso").status).toBe(503);
  });
});
