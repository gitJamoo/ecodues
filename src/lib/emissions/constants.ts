export type ModelClass = "small" | "medium" | "large" | "frontier";

export interface ClassProfile {
  whPerOutputToken: number;
  blendedUsdPerMTok: number;
}

// Energy per token by model class (Epoch AI 2025; Luccioni et al. 2024)
export const MODEL_CLASS_PROFILES: Record<ModelClass, ClassProfile> = {
  small:    { whPerOutputToken: 0.0002, blendedUsdPerMTok: 0.6 },
  medium:   { whPerOutputToken: 0.0006, blendedUsdPerMTok: 5 },
  large:    { whPerOutputToken: 0.0025, blendedUsdPerMTok: 15 },
  frontier: { whPerOutputToken: 0.006,  blendedUsdPerMTok: 40 },
};

export const INPUT_TOKEN_ENERGY_FRACTION = 0.1;
export const PUE = 1.2;                          // Uptime Institute hyperscaler avg
export const GRID_KG_CO2E_PER_KWH = 0.38;       // US eGRID average
export const WATER_L_PER_KWH = 0.55;
export const SOCIAL_COST_USD_PER_TON_CO2E = 190; // EPA 2023 central estimate
export const SPEND_INPUT_OUTPUT_SPLIT = { input: 0.75, output: 0.25 };
export const METHODOLOGY_VERSION = "2026-07.1";
