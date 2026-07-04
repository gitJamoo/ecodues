"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto";
import { connectorFor } from "@/lib/providers";
import type { ProviderId } from "@/lib/providers/types";
import { clampMultiplier } from "@/lib/emissions/engine";
import { runMonthlyCycleForUser, previousPeriod } from "@/lib/cycle";
import { DEV_MODE, DEV_USER } from "@/lib/dev-mode";

async function requireUser() {
  if (DEV_MODE) return { supabase: null as never, user: DEV_USER as never };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function connectApiKey(provider: ProviderId, apiKey: string) {
  if (DEV_MODE) {
    const connector = connectorFor(provider);
    return { ok: true, isStub: connector.isStub };
  }
  const { supabase, user } = await requireUser();
  const connector = connectorFor(provider);
  if (!(await connector.validateKey(apiKey))) {
    return { error: "That key didn't validate. Double-check and try again." };
  }
  await supabase.from("provider_connections").upsert({
    user_id: user.id, provider, kind: "api_key",
    encrypted_key: encryptSecret(apiKey), status: "active",
  }, { onConflict: "user_id,provider,kind" });
  revalidatePath("/providers");
  return { ok: true, isStub: connector.isStub };
}

export async function connectTier(provider: ProviderId, tierId: string) {
  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  await supabase.from("provider_connections").upsert({
    user_id: user.id, provider, kind: "tier", tier_id: tierId, status: "active",
  }, { onConflict: "user_id,provider,kind" });
  revalidatePath("/providers");
  return { ok: true };
}

export async function addManualUsage(
  provider: ProviderId,
  period: string,
  spendUsd: number,
  inputTokens: number,
  outputTokens: number,
) {
  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  await supabase.from("usage_records").insert({
    user_id: user.id, provider, model: "manual", period,
    input_tokens: inputTokens, output_tokens: outputTokens,
    spend_usd: spendUsd, source: "manual",
  });
  revalidatePath("/dashboard");
  revalidatePath("/providers");
  return { ok: true };
}

export async function removeConnection(id: string) {
  if (DEV_MODE) return;
  const { supabase } = await requireUser();
  await supabase.from("provider_connections").delete().eq("id", id);
  revalidatePath("/providers");
}

export async function saveSettings(form: {
  displayName?: string;
  multiplier?: number;
  charityId?: string;
  cardLast4?: string;
}) {
  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  const patch: Record<string, unknown> = {};
  if (form.displayName !== undefined) patch.display_name = form.displayName;
  if (form.multiplier !== undefined) patch.multiplier = clampMultiplier(form.multiplier);
  if (form.charityId !== undefined) patch.charity_id = form.charityId;
  if (form.cardLast4 !== undefined) patch.card_last4 = form.cardLast4;
  await supabase.from("profiles").update(patch).eq("id", user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function completeOnboarding() {
  if (DEV_MODE) return { ok: true, donationUsd: 0 };
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
  const result = await runMonthlyCycleForUser(supabase, user.id, previousPeriod(new Date()));
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
  if (DEV_MODE) return { ok: true };
  const { supabase, user } = await requireUser();
  await supabase.from("usage_records").update(patch).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function runCycleNow() {
  if (DEV_MODE) return { ok: true, donationUsd: 4.28, damageUsd: 2.14 };
  const { supabase, user } = await requireUser();
  const result = await runMonthlyCycleForUser(supabase, user.id, previousPeriod(new Date()));
  revalidatePath("/dashboard");
  revalidatePath("/donations");
  return { ok: true, donationUsd: result.donationUsd, damageUsd: result.totalDamageUsd };
}
