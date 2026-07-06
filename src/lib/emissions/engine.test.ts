import { describe, it, expect } from "vitest";
import {
  estimateFromTokens,
  estimateFromSpend,
  donationForDamage,
  clampMultiplier,
} from "./engine";
import {
  MODEL_CLASS_PROFILES,
  INPUT_TOKEN_ENERGY_FRACTION,
  PUE,
  GRID_KG_CO2E_PER_KWH,
  WATER_L_PER_KWH,
  SOCIAL_COST_USD_PER_TON_CO2E,
  SPEND_INPUT_OUTPUT_SPLIT,
} from "./constants";

describe("estimateFromTokens", () => {
  it("computes the published formula exactly (medium class)", () => {
    const input = 1_000_000;
    const output = 500_000;
    const { whPerOutputToken } = MODEL_CLASS_PROFILES.medium;
    const effective = output + input * INPUT_TOKEN_ENERGY_FRACTION;
    const kwh = (effective * whPerOutputToken * PUE) / 1000;
    const kg = kwh * GRID_KG_CO2E_PER_KWH;

    const e = estimateFromTokens("medium", input, output);
    expect(e.kwh).toBeCloseTo(kwh, 10);
    expect(e.kgCo2e).toBeCloseTo(kg, 10);
    expect(e.litersWater).toBeCloseTo(kwh * WATER_L_PER_KWH, 10);
    expect(e.damageUsd).toBeCloseTo((kg / 1000) * SOCIAL_COST_USD_PER_TON_CO2E, 10);
  });

  it("input tokens cost a fraction of output tokens", () => {
    const outputOnly = estimateFromTokens("large", 0, 1000);
    const inputOnly = estimateFromTokens("large", 1000, 0);
    expect(inputOnly.kwh).toBeCloseTo(outputOnly.kwh * INPUT_TOKEN_ENERGY_FRACTION, 10);
  });

  it("scales linearly with tokens", () => {
    const one = estimateFromTokens("frontier", 100, 100);
    const ten = estimateFromTokens("frontier", 1000, 1000);
    expect(ten.kwh).toBeCloseTo(one.kwh * 10, 10);
  });

  it("frontier > large > medium > small per token", () => {
    const per = (cls: Parameters<typeof estimateFromTokens>[0]) =>
      estimateFromTokens(cls, 0, 1000).kwh;
    expect(per("frontier")).toBeGreaterThan(per("large"));
    expect(per("large")).toBeGreaterThan(per("medium"));
    expect(per("medium")).toBeGreaterThan(per("small"));
  });

  it("zero tokens → zero everything", () => {
    const e = estimateFromTokens("medium", 0, 0);
    expect(e.kwh).toBe(0);
    expect(e.kgCo2e).toBe(0);
    expect(e.litersWater).toBe(0);
    expect(e.damageUsd).toBe(0);
  });
});

describe("estimateFromSpend", () => {
  it("derives tokens from blended price then reuses the token path", () => {
    const spend = 10;
    const cls = "medium" as const;
    const tokens = (spend / MODEL_CLASS_PROFILES[cls].blendedUsdPerMTok) * 1_000_000;
    const expected = estimateFromTokens(
      cls,
      tokens * SPEND_INPUT_OUTPUT_SPLIT.input,
      tokens * SPEND_INPUT_OUTPUT_SPLIT.output,
    );
    expect(estimateFromSpend(cls, spend)).toEqual(expected);
  });

  it("zero spend → zero estimate", () => {
    expect(estimateFromSpend("small", 0).kwh).toBe(0);
  });
});

describe("donationForDamage", () => {
  it("multiplies and rounds UP to the cent", () => {
    expect(donationForDamage(1, 2)).toBe(2);
    expect(donationForDamage(0.111, 2)).toBe(0.23); // 0.222 → ceil → 0.23
    expect(donationForDamage(0.005, 1)).toBe(0.01);
  });

  it("returns 0 for non-positive damage", () => {
    expect(donationForDamage(0, 2)).toBe(0);
    expect(donationForDamage(-5, 2)).toBe(0);
  });
});

describe("clampMultiplier", () => {
  it("clamps to [1, 3]", () => {
    expect(clampMultiplier(0)).toBe(1);
    expect(clampMultiplier(99)).toBe(3);
  });
  it("snaps to quarter steps", () => {
    expect(clampMultiplier(1.13)).toBe(1.25);
    expect(clampMultiplier(2.1)).toBe(2);
    expect(clampMultiplier(1.875)).toBe(2);
  });
});
