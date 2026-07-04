import { estimateFromTokens, estimateFromSpend, donationForDamage, type EmissionEstimate } from "./emissions/engine";
import { classifyModel } from "./emissions/models";
import { METHODOLOGY_VERSION } from "./emissions/constants";
import type { Period } from "./providers/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { connectorFor } from "./providers";
import { tierById } from "./emissions/tiers";
import { decryptSecret } from "./crypto";

export interface UsageRecordLike {
  id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  spend_usd: number;
  source: string;
}

export interface CycleResult {
  estimates: Array<EmissionEstimate & { usageRecordId: string }>;
  totalDamageUsd: number;
  donationUsd: number;
}

export function previousPeriod(now: Date): Period {
  const y = now.getUTCFullYear(), m = now.getUTCMonth() + 1;
  return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };
}

export const periodDateString = (p: Period) =>
  `${p.year}-${String(p.month).padStart(2, "0")}-01`;

export function buildCycle(records: UsageRecordLike[], multiplier: number): CycleResult {
  const estimates = records.map((r) => {
    const cls = classifyModel(r.model);
    const hasTokens = r.input_tokens > 0 || r.output_tokens > 0;
    const e = hasTokens
      ? estimateFromTokens(cls, r.input_tokens, r.output_tokens)
      : estimateFromSpend(cls, r.spend_usd);
    return { ...e, usageRecordId: r.id };
  });
  const totalDamageUsd = estimates.reduce((s, e) => s + e.damageUsd, 0);
  return { estimates, totalDamageUsd, donationUsd: donationForDamage(totalDamageUsd, multiplier) };
}

export async function runMonthlyCycleForUser(
  supabase: SupabaseClient,
  userId: string,
  period: Period,
): Promise<CycleResult> {
  const periodDate = periodDateString(period);

  const { data: profile } = await supabase.from("profiles").select("multiplier, charity_id").eq("id", userId).single();
  const { data: connections } = await supabase.from("provider_connections").select("*").eq("user_id", userId);

  // Refresh API + tier usage (manual rows stay)
  await supabase.from("usage_records").delete()
    .eq("user_id", userId).eq("period", periodDate).in("source", ["api", "tier_estimate"]);

  for (const conn of connections ?? []) {
    if (conn.kind === "api_key" && conn.encrypted_key) {
      try {
        const rows = await connectorFor(conn.provider).fetchMonthlyUsage(decryptSecret(conn.encrypted_key), period);
        if (rows.length) {
          await supabase.from("usage_records").insert(rows.map(r => ({
            user_id: userId, provider: conn.provider, model: r.model, period: periodDate,
            input_tokens: Math.round(r.inputTokens), output_tokens: Math.round(r.outputTokens),
            spend_usd: r.spendUsd, source: "api",
          })));
        }
        if (conn.status !== "active") {
          await supabase.from("provider_connections").update({ status: "active" }).eq("id", conn.id);
        }
      } catch {
        await supabase.from("provider_connections").update({ status: "error" }).eq("id", conn.id);
      }
    } else if (conn.kind === "tier" && conn.tier_id) {
      const [baseTierId, pctStr] = conn.tier_id.split(":");
      const pct = pctStr ? Math.min(1, Math.max(0, Number(pctStr) / 100)) : 1;
      const t = tierById(baseTierId);
      if (t) {
        await supabase.from("usage_records").insert({
          user_id: userId, provider: conn.provider, model: t.id, period: periodDate,
          input_tokens: Math.round(t.monthlyInputTokens * pct),
          output_tokens: Math.round(t.monthlyOutputTokens * pct),
          spend_usd: 0, source: "tier_estimate",
        });
      }
    }
  }

  const { data: records } = await supabase.from("usage_records").select("*").eq("user_id", userId).eq("period", periodDate);
  const result = buildCycle((records ?? []) as UsageRecordLike[], Number(profile?.multiplier ?? 2));

  // Write estimates
  await supabase.from("emission_estimates").delete().eq("user_id", userId).eq("period", periodDate);
  if (result.estimates.length) {
    await supabase.from("emission_estimates").insert(result.estimates.map(e => ({
      usage_record_id: e.usageRecordId, user_id: userId, period: periodDate,
      kwh: e.kwh, kg_co2e: e.kgCo2e, liters_water: e.litersWater, damage_usd: e.damageUsd,
      methodology_version: METHODOLOGY_VERSION,
    })));
  }

  // Simulated ledger row (swap this call for Every.org API in production)
  await supabase.from("donation_ledger").upsert({
    user_id: userId, period: periodDate,
    damage_usd: result.totalDamageUsd,
    multiplier: Number(profile?.multiplier ?? 2),
    donation_usd: result.donationUsd,
    charity_id: profile?.charity_id ?? null,
    status: "simulated",
  }, { onConflict: "user_id,period" });

  return result;
}
