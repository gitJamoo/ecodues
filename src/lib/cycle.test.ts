import { describe, it, expect } from "vitest";
import { buildCycle, previousPeriod, currentPeriod, monthFractionElapsed, periodDateString, type UsageRecordLike } from "./cycle";
import { estimateFromTokens, estimateFromSpend, donationForDamage } from "./emissions/engine";
import { classifyModel } from "./emissions/models";

const rec = (over: Partial<UsageRecordLike>): UsageRecordLike => ({
  id: "r1",
  provider: "openai",
  model: "gpt-4o",
  input_tokens: 0,
  output_tokens: 0,
  spend_usd: 0,
  source: "manual",
  ...over,
});

describe("buildCycle", () => {
  it("uses token-based estimates when tokens are present", () => {
    const r = rec({ input_tokens: 1000, output_tokens: 2000, spend_usd: 999 });
    const { estimates } = buildCycle([r], 2);
    const expected = estimateFromTokens(classifyModel(r.model), 1000, 2000);
    expect(estimates[0].kwh).toBe(expected.kwh);
    expect(estimates[0].usageRecordId).toBe("r1");
  });

  it("falls back to spend-based estimates when tokens are zero", () => {
    const r = rec({ spend_usd: 25 });
    const { estimates } = buildCycle([r], 2);
    const expected = estimateFromSpend(classifyModel(r.model), 25);
    expect(estimates[0].kwh).toBe(expected.kwh);
  });

  it("sums damage across records and applies the multiplier", () => {
    const rows = [
      rec({ id: "a", output_tokens: 100_000 }),
      rec({ id: "b", model: "claude-opus-4-8", output_tokens: 100_000 }),
    ];
    const result = buildCycle(rows, 2.5);
    const total = result.estimates.reduce((s, e) => s + e.damageUsd, 0);
    expect(result.totalDamageUsd).toBeCloseTo(total, 10);
    expect(result.donationUsd).toBe(donationForDamage(total, 2.5));
  });

  it("empty input → zero totals", () => {
    const result = buildCycle([], 2);
    expect(result.estimates).toHaveLength(0);
    expect(result.totalDamageUsd).toBe(0);
    expect(result.donationUsd).toBe(0);
  });
});

describe("previousPeriod", () => {
  it("mid-year returns prior month", () => {
    expect(previousPeriod(new Date(Date.UTC(2026, 6, 5)))).toEqual({ year: 2026, month: 6 });
  });
  it("January rolls back to December of prior year", () => {
    expect(previousPeriod(new Date(Date.UTC(2026, 0, 1)))).toEqual({ year: 2025, month: 12 });
  });
});

describe("periodDateString", () => {
  it("zero-pads the month", () => {
    expect(periodDateString({ year: 2026, month: 6 })).toBe("2026-06-01");
    expect(periodDateString({ year: 2026, month: 12 })).toBe("2026-12-01");
  });
});

describe("currentPeriod", () => {
  it("returns the UTC month of the given date", () => {
    expect(currentPeriod(new Date(Date.UTC(2026, 6, 5)))).toEqual({ year: 2026, month: 7 });
    expect(currentPeriod(new Date(Date.UTC(2026, 0, 31)))).toEqual({ year: 2026, month: 1 });
  });
});

describe("monthFractionElapsed", () => {
  it("returns 1 for past months", () => {
    expect(monthFractionElapsed({ year: 2026, month: 6 }, new Date(Date.UTC(2026, 6, 5)))).toBe(1);
    expect(monthFractionElapsed({ year: 2025, month: 12 }, new Date(Date.UTC(2026, 6, 5)))).toBe(1);
  });

  it("prorates the in-progress month by days elapsed", () => {
    // July 5 → 5/31 of July elapsed
    expect(monthFractionElapsed({ year: 2026, month: 7 }, new Date(Date.UTC(2026, 6, 5)))).toBeCloseTo(5 / 31, 10);
    // Feb 14 2026 (28-day month) → 14/28
    expect(monthFractionElapsed({ year: 2026, month: 2 }, new Date(Date.UTC(2026, 1, 14)))).toBeCloseTo(0.5, 10);
  });

  it("reaches 1 on the last day of the month", () => {
    expect(monthFractionElapsed({ year: 2026, month: 7 }, new Date(Date.UTC(2026, 6, 31)))).toBe(1);
  });
});
