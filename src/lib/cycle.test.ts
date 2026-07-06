import { describe, it, expect } from "vitest";
import { buildCycle, previousPeriod, periodDateString, type UsageRecordLike } from "./cycle";
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
