import { estimateFromTokens, estimateFromSpend, donationForDamage, type EmissionEstimate } from "./emissions/engine";
import { classifyModel } from "./emissions/models";
import { METHODOLOGY_VERSION } from "./emissions/constants";
import type { Period } from "./providers/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { connectorFor } from "./providers";
import { tierById } from "./emissions/tiers";
import { decryptSecret } from "./crypto";
import { logger } from "./logger";

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

export function currentPeriod(now: Date): Period {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

/**
 * Fraction of the period's month that has elapsed (UTC). 1 for past months.
 * Used to prorate subscription-tier estimates when the daily cron settles the
 * in-progress month, so a monthly plan accrues gradually instead of dumping a
 * full month's estimate on day 1.
 */
export function monthFractionElapsed(period: Period, now: Date): number {
  const cur = currentPeriod(now);
  if (period.year !== cur.year || period.month !== cur.month) return 1;
  const daysInMonth = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();
  return Math.min(1, now.getUTCDate() / daysInMonth);
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
  const tierFraction = monthFractionElapsed(period, new Date());

  const { data: connections } = await supabase.from("provider_connections").select("*").eq("user_id", userId);

  // Collect all new rows BEFORE deleting old ones so a connector outage does
  // not wipe data we already have for that month — we only delete once all
  // fetches have completed (success or error).
  const newRows: Array<{
    user_id: string; provider: string; model: string; period: string;
    input_tokens: number; output_tokens: number; spend_usd: number;
    source: string; connection_id: string;
  }> = [];

  for (const conn of connections ?? []) {
    if (conn.kind === "api_key" && conn.encrypted_key) {
      try {
        const rows = await connectorFor(conn.provider).fetchMonthlyUsage(decryptSecret(conn.encrypted_key), period);
        for (const r of rows) {
          newRows.push({
            user_id: userId, provider: conn.provider, model: r.model, period: periodDate,
            input_tokens: Math.round(r.inputTokens), output_tokens: Math.round(r.outputTokens),
            spend_usd: r.spendUsd, source: "api", connection_id: conn.id,
          });
        }
        if (conn.status !== "active") {
          await supabase.from("provider_connections").update({ status: "active" }).eq("id", conn.id);
        }
      } catch (err) {
        logger.error("cycle", "connector usage fetch failed", {
          userId, provider: conn.provider, connectionId: conn.id,
          rawError: err instanceof Error ? err.message : String(err),
        });
        await supabase.from("provider_connections").update({ status: "error" }).eq("id", conn.id);
      }
    } else if (conn.kind === "tier" && conn.tier_id) {
      const [baseTierId, pctStr] = conn.tier_id.split(":");
      const pct = pctStr ? Math.min(1, Math.max(0, Number(pctStr) / 100)) : 1;
      const t = tierById(baseTierId);
      if (t) {
        newRows.push({
          user_id: userId, provider: conn.provider, model: t.id, period: periodDate,
          input_tokens: Math.round(t.monthlyInputTokens * pct * tierFraction),
          output_tokens: Math.round(t.monthlyOutputTokens * pct * tierFraction),
          spend_usd: 0, source: "tier_estimate", connection_id: conn.id,
        });
      }
    }
  }

  // Safe to delete now — all connector fetches are complete.
  await supabase.from("usage_records").delete()
    .eq("user_id", userId).eq("period", periodDate).in("source", ["api", "tier_estimate"]);

  if (newRows.length) {
    await supabase.from("usage_records").insert(newRows);
  }

  return settlePeriodForUser(supabase, userId, period);
}

/**
 * Recompute a period from whatever usage_records it currently holds — no
 * connector fetches. Writes emission_estimates, upserts the ledger row, and
 * moves the tab by the delta. Safe to re-run; used by cycles and by backfill.
 */
export async function settlePeriodForUser(
  supabase: SupabaseClient,
  userId: string,
  period: Period,
): Promise<CycleResult> {
  const periodDate = periodDateString(period);

  const { data: profile } = await supabase
    .from("profiles")
    .select("multiplier, charity_id, pending_donation_usd")
    .eq("id", userId)
    .single();

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

  // Ticker model: accrue this cycle's donation into the account tab. The
  // checkout link is NOT built here anymore — the cron decides when to email
  // one based on whether the tab has crossed the charity's minimum.
  const isReRun = result.estimates.length > 0 || result.donationUsd > 0;
  if (isReRun) {
    // If this period already had a ledger row (re-run of the same cycle),
    // subtract the old amount before adding the new one so the tab stays true.
    const { data: prior } = await supabase
      .from("donation_ledger")
      .select("donation_usd, status")
      .eq("user_id", userId)
      .eq("period", periodDate)
      .maybeSingle();
    const prevAmount = Number(prior?.donation_usd ?? 0);
    const prevStatus = (prior?.status as string | null) ?? null;
    const delta = result.donationUsd - prevAmount;

    // Preserve status if the period is already settled — don't clobber "paid"
    // rows back to "accrued" when the monthly cron re-finalizes the period.
    const newStatus = prevStatus === "paid" || prevStatus === "partially_paid" ? prevStatus : "accrued";

    await supabase.from("donation_ledger").upsert({
      user_id: userId, period: periodDate,
      damage_usd: result.totalDamageUsd,
      multiplier: Number(profile?.multiplier ?? 2),
      donation_usd: result.donationUsd,
      charity_id: profile?.charity_id ?? null,
      status: newStatus,
    }, { onConflict: "user_id,period" });

    if (delta !== 0) {
      const nextTab = Math.max(0, Number(profile?.pending_donation_usd ?? 0) + delta);
      await supabase.from("profiles").update({ pending_donation_usd: nextTab }).eq("id", userId);
    }
  }

  return result;
}
