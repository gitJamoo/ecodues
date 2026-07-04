import type { MonthlyUsage, Period, ProviderConnector, ProviderId } from "./types";

function seededUsage(id: ProviderId, period: Period): MonthlyUsage[] {
  const seed = period.year * 12 + period.month;
  const wobble = (n: number) => Math.round(n * (0.8 + ((seed * 9301 + 49297) % 233280) / 233280 * 0.4));
  const catalog: Record<string, MonthlyUsage[]> = {
    openai:    [
      { model: "gpt-4o",      inputTokens: wobble(900_000),   outputTokens: wobble(280_000), spendUsd: wobble(6) },
      { model: "gpt-4o-mini", inputTokens: wobble(2_500_000), outputTokens: wobble(800_000), spendUsd: wobble(2) },
    ],
    anthropic: [{ model: "claude-sonnet-4-6", inputTokens: wobble(1_200_000), outputTokens: wobble(350_000), spendUsd: wobble(9) }],
    gemini:    [{ model: "gemini-2.0-flash",  inputTokens: wobble(1_800_000), outputTokens: wobble(500_000), spendUsd: wobble(1) }],
  };
  return catalog[id] ?? [];
}

function makeStub(id: ProviderId, label: string): ProviderConnector {
  return {
    id, label, isStub: true,
    validateKey: async (k) => k.length > 8,
    fetchMonthlyUsage: async (_k, period) => seededUsage(id, period),
  };
}

export const openaiStub    = makeStub("openai",    "OpenAI");
export const anthropicStub = makeStub("anthropic", "Anthropic");
export const geminiStub    = makeStub("gemini",    "Google Gemini");
