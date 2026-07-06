import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "a".repeat(64);
  process.env.NEXT_PUBLIC_SITE_URL = "https://ecodues.app";
});

describe("unsubscribe tokens", () => {
  it("round-trips a valid token", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = await import("./unsubscribe");
    const uid = "user-123";
    expect(verifyUnsubscribeToken(uid, unsubscribeToken(uid))).toBe(true);
  });

  it("rejects a token for a different user", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = await import("./unsubscribe");
    expect(verifyUnsubscribeToken("user-b", unsubscribeToken("user-a"))).toBe(false);
  });

  it("rejects tampered and malformed tokens", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = await import("./unsubscribe");
    const t = unsubscribeToken("user-123");
    const flipped = (t[0] === "0" ? "1" : "0") + t.slice(1);
    expect(verifyUnsubscribeToken("user-123", flipped)).toBe(false);
    expect(verifyUnsubscribeToken("user-123", "")).toBe(false);
    expect(verifyUnsubscribeToken("user-123", "not-hex!")).toBe(false);
  });

  it("builds a well-formed unsubscribe URL", async () => {
    const { unsubscribeUrl, unsubscribeToken } = await import("./unsubscribe");
    const url = unsubscribeUrl("user-123");
    expect(url).toBe(
      `https://ecodues.app/api/email/unsubscribe?uid=user-123&token=${unsubscribeToken("user-123")}`,
    );
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
