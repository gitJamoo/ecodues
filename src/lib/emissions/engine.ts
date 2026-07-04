import {
  MODEL_CLASS_PROFILES, INPUT_TOKEN_ENERGY_FRACTION, PUE,
  GRID_KG_CO2E_PER_KWH, WATER_L_PER_KWH, SOCIAL_COST_USD_PER_TON_CO2E,
  SPEND_INPUT_OUTPUT_SPLIT, type ModelClass,
} from "./constants";

export interface EmissionEstimate {
  kwh: number;
  kgCo2e: number;
  litersWater: number;
  damageUsd: number;
}

export function estimateFromTokens(modelClass: ModelClass, inputTokens: number, outputTokens: number): EmissionEstimate {
  const { whPerOutputToken } = MODEL_CLASS_PROFILES[modelClass];
  const effectiveTokens = outputTokens + inputTokens * INPUT_TOKEN_ENERGY_FRACTION;
  const kwh = (effectiveTokens * whPerOutputToken * PUE) / 1000;
  const kgCo2e = kwh * GRID_KG_CO2E_PER_KWH;
  return {
    kwh,
    kgCo2e,
    litersWater: kwh * WATER_L_PER_KWH,
    damageUsd: (kgCo2e / 1000) * SOCIAL_COST_USD_PER_TON_CO2E,
  };
}

export function estimateFromSpend(modelClass: ModelClass, spendUsd: number): EmissionEstimate {
  const tokens = (spendUsd / MODEL_CLASS_PROFILES[modelClass].blendedUsdPerMTok) * 1_000_000;
  return estimateFromTokens(
    modelClass,
    tokens * SPEND_INPUT_OUTPUT_SPLIT.input,
    tokens * SPEND_INPUT_OUTPUT_SPLIT.output,
  );
}

export function donationForDamage(damageUsd: number, multiplier: number): number {
  if (damageUsd <= 0) return 0;
  return Math.ceil(damageUsd * multiplier * 100) / 100;
}

export function clampMultiplier(m: number): number {
  return Math.min(3, Math.max(1, Math.round(m * 4) / 4));
}
