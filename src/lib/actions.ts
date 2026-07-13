"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { connectorFor } from "@/lib/providers";
import type { ProviderId } from "@/lib/providers/types";
import { clampMultiplier } from "@/lib/emissions/engine";
import { runMonthlyCycleForUser, settlePeriodForUser, previousPeriod, currentPeriod, periodDateString } from "@/lib/cycle";
import { DEV_MODE, DEV_USER } from "@/lib/dev-mode";
import { rateLimit, RATE_LIMITED_ERROR } from "@/lib/rate-limit";
import { sendEmail, renderWelcomeEmail } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { logger } from "@/lib/logger";
import {
  apiKeySchema,
  labelSchema,
  displayNameSchema,
  tokensSchema,
  spendSchema,
  paymentAmountSchema,
  firstZodMessage,
} from "@/lib/validation";

async function requireUser() {
  if (DEV_MODE) return { supabase: null as never, user: DEV_USER as never };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function connectApiKey(provider: ProviderId, apiKey: string, label?: string) {
  // Validate inputs before hitting the database.
  const keyResult = apiKeySchema.safeParse(apiKey);
  if (!keyResult.success) return { error: firstZodMessage(keyResult.error) };

  const labelResult = labelSchema.safeParse(label);
  if (!labelResult.success) return { error: firstZodMessage(labelResult.error) };

  if (DEV_MODE) {
    const connector = connectorFor(provider);
    return { ok: true, isStub: connector.isStub };
  }
  const { supabase, user } = await requireUser();
  if (!rateLimit(`key:${user.id}`, 10, 60_000)) return { error: RATE_LIMITED_ERROR };
  const connector = connectorFor(provider);
  if (!(await connector.validateKey(apiKey))) {
    return { error: "That key didn't validate. Double-check and try again." };
  }
  const { error } = await supabase.from("provider_connections").insert({
    user_id: user.id, provider, kind: "api_key",
    encrypted_key: encryptSecret(apiKey), status: "active",
    label: label?.trim().slice(0, 64) || null,
  });
  if (error) {
    logger.error("connectApiKey", "DB insert failed", { userId: user.id, provider, dbError: error.message });
    return { error: "Couldn't save the connection — try again." };
  }
  revalidatePath("/providers");
  revalidatePath("/dashboard");
  return { ok: true, isStub: connector.isStub };
}

export async function connectTier(provider: ProviderId, tierId: string, opts?: { connectionId?: string; label?: string }) {
  // tierId must be a non-empty string.
  if (!tierId || typeof tierId !== "string" || tierId.trim().length === 0) {
    return { error: "Please select a plan." };
  }

  const labelResult = labelSchema.safeParse(opts?.label);
  if (!labelResult.success) return { error: firstZodMessage(labelResult.error) };

  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  const label = opts?.label?.trim().slice(0, 64) || null;
  if (opts?.connectionId) {
    // Editing an existing plan (dashboard "Subscription plans" rows).
    const { error } = await supabase.from("provider_connections")
      .update({ tier_id: tierId, status: "active", ...(label ? { label } : {}) })
      .eq("id", opts.connectionId).eq("user_id", user.id);
    if (error) {
      logger.error("connectTier", "DB update failed", { userId: user.id, provider, dbError: error.message });
      return { error: "Couldn't update the plan — try again." };
    }
  } else {
    const { error } = await supabase.from("provider_connections").insert({
      user_id: user.id, provider, kind: "tier", tier_id: tierId, status: "active", label,
    });
    if (error) {
      logger.error("connectTier", "DB insert failed", { userId: user.id, provider, dbError: error.message });
      return { error: "Couldn't save the plan — try again." };
    }
  }
  revalidatePath("/providers");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addManualUsage(
  provider: ProviderId,
  period: string,
  spendUsd: number,
  inputTokens: number,
  outputTokens: number,
) {
  // Validate numeric inputs.
  const spendResult = spendSchema.safeParse(spendUsd);
  if (!spendResult.success) return { error: firstZodMessage(spendResult.error) };

  const inResult = tokensSchema.safeParse(inputTokens);
  if (!inResult.success) return { error: firstZodMessage(inResult.error) };

  const outResult = tokensSchema.safeParse(outputTokens);
  if (!outResult.success) return { error: firstZodMessage(outResult.error) };

  // Validate period format and range.
  if (!/^\d{4}-\d{2}-01$/.test(period)) return { error: "Invalid period format." };
  if (period < "2022-11-01") return { error: "Period is too far in the past." };
  if (period > periodDateString(currentPeriod(new Date()))) return { error: "Cannot add usage for a future month." };

  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  if (!rateLimit(`usage:${user.id}`, 20, 60_000)) return { error: RATE_LIMITED_ERROR };
  const { error } = await supabase.from("usage_records").insert({
    user_id: user.id, provider, model: "manual", period,
    input_tokens: inputTokens, output_tokens: outputTokens,
    spend_usd: spendUsd, source: "manual",
  });
  if (error) {
    logger.error("addManualUsage", "DB insert failed", { userId: user.id, provider, dbError: error.message });
    return { error: "Couldn't save the usage record — try again." };
  }
  revalidatePath("/dashboard");
  revalidatePath("/providers");
  return { ok: true };
}

export async function removeConnection(id: string) {
  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("provider_connections").delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    logger.error("removeConnection", "DB delete failed", { userId: user.id, connectionId: id, dbError: error.message });
    return { error: "Couldn't remove the connection — try again." };
  }
  revalidatePath("/providers");
  return { ok: true };
}

export async function saveSettings(form: {
  displayName?: string;
  multiplier?: number;
  charityId?: string;
  cardLast4?: string;
  emailOptOut?: boolean;
  leaderboardOptIn?: boolean;
  showPlansInSources?: boolean;
}) {
  // Validate display name if provided.
  if (form.displayName !== undefined) {
    const result = displayNameSchema.safeParse(form.displayName);
    if (!result.success) return { error: firstZodMessage(result.error) };
  }

  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  if (!rateLimit(`settings:${user.id}`, 30, 60_000)) return { error: RATE_LIMITED_ERROR };
  const patch: Record<string, unknown> = {};
  if (form.displayName !== undefined) patch.display_name = form.displayName;
  if (form.multiplier !== undefined) patch.multiplier = clampMultiplier(form.multiplier);
  if (form.charityId !== undefined) patch.charity_id = form.charityId;
  if (form.cardLast4 !== undefined) patch.card_last4 = form.cardLast4;
  if (form.emailOptOut !== undefined) patch.email_opt_out = form.emailOptOut;
  if (form.leaderboardOptIn !== undefined) patch.leaderboard_opt_in = form.leaderboardOptIn;
  if (form.showPlansInSources !== undefined) patch.show_plans_in_sources = form.showPlansInSources;
  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    logger.error("saveSettings", "DB update failed", { userId: user.id, dbError: error.message });
    return { error: "Couldn't save settings — try again." };
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAccount() {
  if (DEV_MODE) return { ok: true };
  const { user } = await requireUser();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    logger.error("deleteAccount", "Admin deleteUser failed", { userId: user.id, rawError: error.message });
    return { error: "Something went wrong — please try again." };
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function completeOnboarding() {
  if (DEV_MODE) return { ok: true, donationUsd: 0 };
  const { supabase, user } = await requireUser();

  // Guard against double-submit: only send the welcome email on the first call.
  const { data: existing } = await supabase
    .from("profiles").select("onboarded_at").eq("id", user.id).single();
  const alreadyOnboarded = !!existing?.onboarded_at;

  await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);

  if (!alreadyOnboarded && user.email) {
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
    await sendEmail({
      to: user.email,
      ...renderWelcomeEmail({ displayName: profile?.display_name ?? null }),
      unsubscribeUrl: unsubscribeUrl(user.id),
    });
  }

  const result = await runMonthlyCycleForUser(supabase, user.id, previousPeriod(new Date()));
  // Also sync the in-progress month so the dashboard is populated immediately
  // instead of waiting for the next daily sync.
  await runMonthlyCycleForUser(supabase, user.id, currentPeriod(new Date()));
  revalidatePath("/dashboard");
  return { ok: true, donationUsd: result.donationUsd };
}

export async function updateUsageRecord(id: string, patch: {
  provider?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  spend_usd?: number;
}) {
  // Validate numeric fields if provided.
  if (patch.input_tokens !== undefined) {
    const r = tokensSchema.safeParse(patch.input_tokens);
    if (!r.success) return { error: firstZodMessage(r.error) };
  }
  if (patch.output_tokens !== undefined) {
    const r = tokensSchema.safeParse(patch.output_tokens);
    if (!r.success) return { error: firstZodMessage(r.error) };
  }
  if (patch.spend_usd !== undefined) {
    const r = spendSchema.safeParse(patch.spend_usd);
    if (!r.success) return { error: firstZodMessage(r.error) };
  }
  if (patch.provider !== undefined && (typeof patch.provider !== "string" || patch.provider.length > 64)) {
    return { error: "Invalid provider." };
  }
  if (patch.model !== undefined && (typeof patch.model !== "string" || patch.model.length > 64)) {
    return { error: "Invalid model name." };
  }

  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("usage_records").update(patch).eq("id", id).eq("user_id", user.id);
  if (error) {
    logger.error("updateUsageRecord", "DB update failed", { userId: user.id, recordId: id, dbError: error.message });
    return { error: "Couldn't update the record — try again." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function logPayment(form: {
  amountUsd: number;
  charityId?: string | null;
  method?: "manual" | "every_org" | "pledge";
  externalId?: string | null;
  notes?: string | null;
}) {
  // Validate amount with schema (covers > 0, finite, <= 1M).
  const amountResult = paymentAmountSchema.safeParse(Number(form.amountUsd));
  if (!amountResult.success) return { error: firstZodMessage(amountResult.error) };

  const amount = Math.round(amountResult.data * 100) / 100;

  if (DEV_MODE) return { ok: true, amountUsd: amount };

  const { supabase, user } = await requireUser();
  if (!rateLimit(`payment:${user.id}`, 10, 60_000)) return { error: RATE_LIMITED_ERROR };

  const { data: profile } = await supabase
    .from("profiles")
    .select("charity_id")
    .eq("id", user.id)
    .single();

  const charityId = form.charityId ?? profile?.charity_id ?? null;

  // Record the payment first — only decrement the tab if this succeeds so we
  // never reduce the balance without an audit trail.
  const { error: insertError } = await supabase.from("donation_payments").insert({
    user_id: user.id,
    charity_id: charityId,
    amount_usd: amount,
    method: form.method ?? "manual",
    external_id: form.externalId ?? null,
    notes: form.notes ?? null,
  });
  if (insertError) {
    logger.error("logPayment", "donation_payments insert failed", { userId: user.id, dbError: insertError.message });
    return { error: "Couldn't record the payment — try again." };
  }

  // Atomically decrement the tab to prevent race conditions on concurrent calls.
  const { data: nextTabRaw, error: rpcError } = await supabase
    .rpc("decrement_pending_donation", { p_user_id: user.id, p_amount: amount });
  if (rpcError || nextTabRaw === null) {
    logger.error("logPayment", "Tab decrement RPC failed", { userId: user.id, rpcError: rpcError?.message });
    return { error: "Couldn't update your balance — try again." };
  }
  const nextTab = Number(nextTabRaw);

  if (nextTab === 0) {
    await supabase
      .from("donation_ledger")
      .update({ status: "paid" })
      .eq("user_id", user.id)
      .in("status", ["accrued", "partially_paid"]);
  }

  revalidatePath("/dashboard");
  revalidatePath("/donations");
  return { ok: true, amountUsd: amount, tabUsd: nextTab };
}

export async function runCycleNow() {
  if (DEV_MODE) return { ok: true, donationUsd: 4.28, damageUsd: 2.14 };
  const { supabase, user } = await requireUser();
  if (!rateLimit(`cycle:${user.id}`, 6, 60_000)) return { error: RATE_LIMITED_ERROR };
  // Sync the in-progress month (live ticker). The previous month is finalized
  // by the monthly cron on the 1st, when the providers' ~30-day activity
  // windows still cover all of it — re-fetching it later can lose early days.
  const result = await runMonthlyCycleForUser(supabase, user.id, currentPeriod(new Date()));
  revalidatePath("/dashboard");
  revalidatePath("/donations");
  return { ok: true, donationUsd: result.donationUsd, damageUsd: result.totalDamageUsd };
}

const BACKFILL_MIN_PERIOD = "2022-11-01"; // ChatGPT launch
const BACKFILL_MAX_ENTRIES = 300;

export async function backfillUsage(entries: Array<{
  provider: string;
  period: string; // "YYYY-MM-01"
  model: string;  // tier id for plan-based backfill, "manual" for spend-based
  inputTokens: number;
  outputTokens: number;
  spendUsd: number;
}>) {
  if (DEV_MODE) return { ok: true, months: entries.length, addedToTabUsd: 1.23 };
  const { supabase, user } = await requireUser();
  if (!rateLimit(`backfill:${user.id}`, 5, 60_000)) return { error: RATE_LIMITED_ERROR };

  if (!Array.isArray(entries) || entries.length === 0) return { error: "Nothing to backfill." };
  if (entries.length > BACKFILL_MAX_ENTRIES) return { error: "Too many entries — backfill in smaller batches." };

  const currentStart = periodDateString(currentPeriod(new Date()));
  const clean = [];
  for (const e of entries) {
    // Period format and range (kept from original hand-rolled validation).
    if (!/^\d{4}-\d{2}-01$/.test(e.period)) return { error: `Invalid period "${e.period}".` };
    if (e.period < BACKFILL_MIN_PERIOD || e.period >= currentStart) {
      return { error: "Backfill months must be between Nov 2022 and last month." };
    }

    // Numeric fields — validated with shared zod schemas.
    const inResult = tokensSchema.safeParse(Number(e.inputTokens));
    if (!inResult.success) return { error: `Input tokens: ${firstZodMessage(inResult.error)}` };

    const outResult = tokensSchema.safeParse(Number(e.outputTokens));
    if (!outResult.success) return { error: `Output tokens: ${firstZodMessage(outResult.error)}` };

    const spendResult = spendSchema.safeParse(Number(e.spendUsd));
    if (!spendResult.success) return { error: `Spend: ${firstZodMessage(spendResult.error)}` };

    const inTok = Math.round(inResult.data);
    const outTok = Math.round(outResult.data);
    const spend = Math.round(spendResult.data * 100) / 100;

    if (inTok === 0 && outTok === 0 && spend === 0) continue;
    clean.push({
      user_id: user.id,
      provider: String(e.provider).toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 64),
      model: String(e.model).slice(0, 64) || "manual",
      period: e.period,
      input_tokens: inTok,
      output_tokens: outTok,
      spend_usd: spend,
      source: "backfill",
    });
  }
  if (clean.length === 0) return { error: "All entries were empty — nothing to backfill." };

  const { data: before } = await supabase.from("profiles").select("pending_donation_usd").eq("id", user.id).single();
  const { error } = await supabase.from("usage_records").insert(clean);
  if (error) {
    logger.error("backfillUsage", "DB insert failed", { userId: user.id, entryCount: clean.length, dbError: error.message });
    return { error: "Couldn't save backfill records — try again." };
  }

  // Re-settle every affected month so estimates + ledger + tab pick it up.
  const periods = [...new Set(clean.map(c => c.period))].sort();
  for (const p of periods) {
    const [y, m] = p.split("-").map(Number);
    await settlePeriodForUser(supabase, user.id, { year: y, month: m });
  }

  const { data: after } = await supabase.from("profiles").select("pending_donation_usd").eq("id", user.id).single();
  const addedToTabUsd = Math.max(0, Number(after?.pending_donation_usd ?? 0) - Number(before?.pending_donation_usd ?? 0));

  revalidatePath("/dashboard");
  revalidatePath("/donations");
  revalidatePath("/providers");
  return { ok: true, months: periods.length, addedToTabUsd };
}
