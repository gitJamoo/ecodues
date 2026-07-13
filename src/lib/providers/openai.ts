import type { MonthlyUsage, Period, ProviderConnector } from "./types";

// OpenAI Admin API — requires an Admin key ("sk-admin-..."), not a regular API key.
// Docs: https://platform.openai.com/docs/api-reference/usage
// Create one at: https://platform.openai.com/settings/organization/admin-keys

interface UsageBucket {
  start_time: number;
  end_time: number;
  results: {
    input_tokens?: number;
    output_tokens?: number;
    model?: string;
  }[];
}
interface CostBucket {
  start_time: number;
  end_time: number;
  results: {
    amount?: { value?: number; currency?: string };
    line_item?: string | null;
  }[];
}
interface EmbeddingsBucket {
  start_time: number;
  end_time: number;
  results: {
    input_tokens?: number;
    model?: string;
  }[];
}

function monthRange(period: Period): { startSec: number; endSec: number } {
  const start = Date.UTC(period.year, period.month - 1, 1) / 1000;
  const end =
    period.month === 12
      ? Date.UTC(period.year + 1, 0, 1) / 1000
      : Date.UTC(period.year, period.month, 1) / 1000;
  return { startSec: start, endSec: end };
}

async function fetchAll<T>(url: string, key: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined;
  do {
    const u = new URL(url);
    if (next) u.searchParams.set("page", next);
    const res = await fetch(u.toString(), {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`OpenAI Admin API ${res.status}`);
    const json = (await res.json()) as { data?: T[]; next_page?: string | null; has_more?: boolean };
    if (json.data) out.push(...json.data);
    next = json.has_more && json.next_page ? json.next_page : undefined;
  } while (next);
  return out;
}

export const openai: ProviderConnector = {
  id: "openai",
  label: "OpenAI",
  isStub: false,

  async validateKey(apiKey) {
    if (!apiKey.startsWith("sk-admin-")) return false;
    // Admin keys can list projects — cheapest auth check
    const res = await fetch("https://api.openai.com/v1/organization/projects?limit=1", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  },

  async fetchMonthlyUsage(apiKey, period) {
    const { startSec, endSec } = monthRange(period);
    const base = "https://api.openai.com/v1/organization";

    const usageUrl =
      `${base}/usage/completions?start_time=${startSec}&end_time=${endSec}` +
      `&bucket_width=1d&group_by=model&limit=31`;
    const costUrl =
      `${base}/costs?start_time=${startSec}&end_time=${endSec}&bucket_width=1d&limit=31`;
    const embeddingsUrl =
      `${base}/usage/embeddings?start_time=${startSec}&end_time=${endSec}` +
      `&bucket_width=1d&group_by=model&limit=31`;

    const [usageBuckets, costBuckets, embeddingBuckets] = await Promise.all([
      fetchAll<UsageBucket>(usageUrl, apiKey),
      fetchAll<CostBucket>(costUrl, apiKey),
      // Embedding usage may be absent for API keys without embedding usage — treat as optional
      fetchAll<EmbeddingsBucket>(embeddingsUrl, apiKey).catch(() => [] as EmbeddingsBucket[]),
    ]);

    // Aggregate completion tokens by model
    const byModel = new Map<string, MonthlyUsage>();
    for (const b of usageBuckets) {
      for (const r of b.results ?? []) {
        const model = r.model ?? "unknown";
        const agg = byModel.get(model) ?? { model, inputTokens: 0, outputTokens: 0, spendUsd: 0 };
        agg.inputTokens += r.input_tokens ?? 0;
        agg.outputTokens += r.output_tokens ?? 0;
        byModel.set(model, agg);
      }
    }

    // Costs come without per-model breakdown — total the org cost and split
    // proportionally by completion token share. Embedding costs are included in
    // the org total but embedding models are tracked separately below with
    // spendUsd=0, so the emissions engine uses token-based estimation for them.
    const totalCost = costBuckets.reduce(
      (s, b) => s + (b.results ?? []).reduce((a, r) => a + (r.amount?.value ?? 0), 0),
      0,
    );
    const totalCompletionTokens = [...byModel.values()].reduce(
      (s, m) => s + m.inputTokens + m.outputTokens,
      0,
    );
    if (totalCompletionTokens > 0 && totalCost > 0) {
      for (const m of byModel.values()) {
        const share = (m.inputTokens + m.outputTokens) / totalCompletionTokens;
        m.spendUsd = totalCost * share;
      }
    }

    // Merge embedding models — input tokens only, zero spend (estimated from tokens)
    for (const b of embeddingBuckets) {
      for (const r of b.results ?? []) {
        const model = r.model ?? "text-embedding-unknown";
        const agg = byModel.get(model) ?? { model, inputTokens: 0, outputTokens: 0, spendUsd: 0 };
        agg.inputTokens += r.input_tokens ?? 0;
        byModel.set(model, agg);
      }
    }

    return [...byModel.values()];
  },
};
