import { describe, expect, it } from "vitest";
import { isPublicPath } from "./public-paths";

describe("isPublicPath", () => {
  it("lets the marketing pages through without a session", () => {
    for (const path of ["/", "/how-it-works", "/pricing", "/privacy", "/terms", "/pricing/"]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("keeps the app and its API behind sign-in", () => {
    for (const path of [
      "/dashboard",
      "/campaigns",
      "/leads",
      "/leads/abc",
      "/follow-ups",
      "/api/leads",
      "/pricing-admin",
      "/pricing/secret",
    ]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});
