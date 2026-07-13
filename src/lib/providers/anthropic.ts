import type { MonthlyUsage, Period, ProviderConnector } from "./types";

// Anthropic Admin API — requires an Admin key ("sk-ant-admin01-..."), not a regular API key.
// Docs: https://docs.anthropic.com/en/api/admin-api/usage-cost/get-messages-usage-report
// Create one at: https://console.anthropic.com/settings/admin-keys

const ANTHROPIC_VERSION = "2023-06-01";

interface UsageBucket {
  starts_at: string;
  ends_at: string;
  results: {
    uncached_input_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
    output_tokens?: number;
    model?: string;
  }[];
}
interface CostBucket {
  starts_at: string;
  ends_at: string;
  results: {
    amount?: string; // decimal string USD
    model?: string;
  }[];
}

function isoRange(period: Period) {
  const start = new Date(Date.UTC(period.year, period.month - 1, 1)).toISOString();
  const end =
    period.month === 12
      ? new Date(Date.UTC(period.year + 1, 0, 1)).toISOString()
      : new Date(Date.UTC(period.year, period.month, 1)).toISOString();
  return { start, end };
}

async function fetchAll<T>(url: string, key: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined;
  do {
    const u = new URL(url);
    if (next) u.searchParams.set("page", next);
    const res = await fetch(u.toString(), {
      headers: { "x-api-key": key, "anthropic-version": ANTHROPIC_VERSION },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Anthropic Admin API ${res.status}`);
    const json = (await res.json()) as { data?: T[]; next_page?: string | null; has_more?: boolean };
    if (json.data) out.push(...json.data);
    next = json.has_more && json.next_page ? json.next_page : undefined;
  } while (next);
  return out;
}

export const anthropic: ProviderConnector = {
  id: "anthropic",
  label: "Anthropic",
  isStub: false,

  async validateKey(apiKey) {
    if (!apiKey.startsWith("sk-ant-admin")) return false;
    const res = await fetch("https://api.anthropic.com/v1/organizations/workspaces?limit=1", {
      headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
    });
    return res.ok;
  },

  async fetchMonthlyUsage(apiKey, period) {
    const { start, end } = isoRange(period);
    const base = "https://api.anthropic.com/v1/organizations/usage_report";

    const usageUrl =
      `${base}/messages?starting_at=${encodeURIComponent(start)}&ending_at=${encodeURIComponent(end)}` +
      `&bucket_width=1d&group_by[]=model`;
    const costUrl =
      `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${encodeURIComponent(start)}` +
      `&ending_at=${encodeURIComponent(end)}&bucket_width=1d&group_by[]=model`;

    const [usageBuckets, costBuckets] = await Promise.all([
      fetchAll<UsageBucket>(usageUrl, apiKey),
      fetchAll<CostBucket>(costUrl, apiKey).catch((err) => {
        console.error("[anthropic] cost_report fetch failed — costs will be estimated from tokens:", err instanceof Error ? err.message : String(err));
        return [] as CostBucket[];
      }),
    ]);

    const byModel = new Map<string, MonthlyUsage>();
    for (const b of usageBuckets) {
      for (const r of b.results ?? []) {
        const model = r.model ?? "unknown";
        const agg = byModel.get(model) ?? { model, inputTokens: 0, outputTokens: 0, spendUsd: 0 };
        agg.inputTokens +=
          (r.uncached_input_tokens ?? 0) +
          (r.cache_read_input_tokens ?? 0) +
          (r.cache_creation_input_tokens ?? 0);
        agg.outputTokens += r.output_tokens ?? 0;
        byModel.set(model, agg);
      }
    }

    // Costs are already grouped by model — sum straight in
    for (const b of costBuckets) {
      for (const r of b.results ?? []) {
        const model = r.model ?? "unknown";
        const agg = byModel.get(model) ?? { model, inputTokens: 0, outputTokens: 0, spendUsd: 0 };
        agg.spendUsd += Number(r.amount ?? 0);
        byModel.set(model, agg);
      }
    }

    return [...byModel.values()];
  },
};
