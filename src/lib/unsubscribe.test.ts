import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "a".repeat(64);
  process.env.NEXT_PUBLIC_SITE_URL = "https://ecodues.org";
});

describe("unsubscribe tokens", () => {
  it("round-trips a valid token", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = await import("./unsubscribe");
    const uid = "user-123";
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    expect(verifyUnsubscribeToken(uid, unsubscribeToken(uid, expiry), expiry)).toBe(true);
  });

  it("rejects a token for a different user", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = await import("./unsubscribe");
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    expect(verifyUnsubscribeToken("user-b", unsubscribeToken("user-a", expiry), expiry)).toBe(false);
  });

  it("rejects tampered and malformed tokens", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = await import("./unsubscribe");
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const t = unsubscribeToken("user-123", expiry);
    const flipped = (t[0] === "0" ? "1" : "0") + t.slice(1);
    expect(verifyUnsubscribeToken("user-123", flipped, expiry)).toBe(false);
    expect(verifyUnsubscribeToken("user-123", "", expiry)).toBe(false);
    expect(verifyUnsubscribeToken("user-123", "not-hex!", expiry)).toBe(false);
  });

  it("rejects expired tokens", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = await import("./unsubscribe");
    const expiry = Math.floor(Date.now() / 1000) - 1;
    const t = unsubscribeToken("user-123", expiry);
    expect(verifyUnsubscribeToken("user-123", t, expiry)).toBe(false);
  });

  it("builds a well-formed unsubscribe URL with expiry", async () => {
    const { unsubscribeUrl } = await import("./unsubscribe");
    const url = unsubscribeUrl("user-123");
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/email/unsubscribe");
    expect(parsed.searchParams.get("uid")).toBe("user-123");
    expect(parsed.searchParams.get("token")).toMatch(/^[0-9a-f]{64}$/);
    const exp = Number(parsed.searchParams.get("exp"));
    expect(exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

describe("badges (bonus coverage)", () => {
  it("computeStreak counts consecutive months ending at latest", async () => {
    const { computeStreak } = await import("./badges");
    expect(computeStreak([])).toBe(0);
    expect(computeStreak(["2026-05-01"])).toBe(1);
    expect(computeStreak(["2026-04-01", "2026-05-01", "2026-06-01"])).toBe(3);
    expect(computeStreak(["2026-01-01", "2026-05-01", "2026-06-01"])).toBe(2);
    expect(computeStreak(["2025-12-01", "2026-01-01"])).toBe(2); // year rollover
  });
});
