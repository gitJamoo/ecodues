import type { MonthlyUsage, ProviderConnector } from "./types";

interface ActivityRow {
  date: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  usage: number;
}

export const openrouter: ProviderConnector = {
  id: "openrouter",
  label: "OpenRouter",
  isStub: false,

  async validateKey(apiKey) {
    const res = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  },

  async fetchMonthlyUsage(apiKey, period) {
    const res = await fetch("https://openrouter.ai/api/v1/activity", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`OpenRouter activity failed: ${res.status}`);
    const json = (await res.json()) as { data?: ActivityRow[] };
    const data = json.data ?? [];
    const prefix = `${period.year}-${String(period.month).padStart(2, "0")}-`;
    const byModel = new Map<string, MonthlyUsage>();
    for (const row of data) {
      if (!row.date?.startsWith(prefix)) continue;
      const agg = byModel.get(row.model) ?? { model: row.model, inputTokens: 0, outputTokens: 0, spendUsd: 0 };
      agg.inputTokens += row.prompt_tokens ?? 0;
      agg.outputTokens += row.completion_tokens ?? 0;
      agg.spendUsd += row.usage ?? 0;
      byModel.set(row.model, agg);
    }
    return [...byModel.values()];
  },
};
