"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { connectTier, removeConnection } from "@/lib/actions";
import { TIER_ESTIMATES } from "@/lib/emissions/tiers";
import { estimateFromTokens } from "@/lib/emissions/engine";
import { providerById } from "@/lib/providers/catalog";
import { usd, co2 } from "@/lib/format";
import { ProviderLogo } from "@/components/provider-logo";
import { X } from "lucide-react";
import { toast } from "sonner";

const LOGO_SUPPORTED = new Set(["openai", "anthropic", "openrouter", "gemini"]);

export interface TierConnection {
  id: string;
  provider: string;
  tier_id: string;
  label?: string | null;
}

function parseTierId(tierId: string): { baseId: string; pct: number } {
  const [baseId, pctStr] = tierId.split(":");
  const pct = pctStr ? Math.min(100, Math.max(0, Number(pctStr))) : 100;
  return { baseId, pct: Number.isFinite(pct) ? pct : 100 };
}

function PlanRow({ conn }: { conn: TierConnection }) {
  const router = useRouter();
  const initial = parseTierId(conn.tier_id);
  const [tierId, setTierId] = useState(initial.baseId);
  const [pct, setPct] = useState(initial.pct);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const providerTiers = TIER_ESTIMATES.filter((t) => t.provider === conn.provider);
  const tier = TIER_ESTIMATES.find((t) => t.id === tierId);
  const meta = providerById(conn.provider);
  const frac = pct / 100;
  const est = tier
    ? estimateFromTokens(tier.modelClass, tier.monthlyInputTokens * frac, tier.monthlyOutputTokens * frac)
    : null;
  const dirty = tierId !== initial.baseId || pct !== initial.pct;

  async function save() {
    setSaving(true);
    // Update THIS row — users can hold several plans per provider now.
    await connectTier(conn.provider as never, pct < 100 ? `${tierId}:${pct}` : tierId, { connectionId: conn.id });
    setSaving(false);
    toast.success("Plan updated — reflected in this cycle's projection");
    router.refresh();
  }

  async function remove() {
    setRemoving(true);
    await removeConnection(conn.id);
    toast.success("Plan removed");
    router.refresh();
  }

  return (
    /* Mobile: stacked (flex-col); Desktop (sm+): single-line wrapped row */
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 px-4 py-3 border-b border-border last:border-0">
      {/* Provider name */}
      <div className="flex items-center gap-2 sm:min-w-[140px]">
        {LOGO_SUPPORTED.has(conn.provider)
          ? <ProviderLogo provider={conn.provider as "openai" | "anthropic" | "openrouter" | "gemini"} size={16} />
          : <span className="inline-flex w-4 h-4 shrink-0 rounded bg-muted-foreground/20" />}
        <span className="text-sm font-medium">
          {meta?.label ?? conn.provider}
          {conn.label && <span className="text-xs text-muted-foreground font-normal ml-1.5">· {conn.label}</span>}
        </span>
      </div>

      {/* Plan select — full-width on mobile, fixed w-44 on sm+ */}
      <div className="sm:w-44">
        <Select value={tierId} onValueChange={(v: string | null) => { if (v) setTierId(v); }}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {providerTiers.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Slider + % label */}
      <div className="flex items-center gap-2 sm:flex-1 sm:min-w-[160px]">
        <Slider value={[pct]} onValueChange={(v: number[]) => setPct(v[0])} min={5} max={100} step={5} />
        <span className="text-xs text-muted-foreground tabular-nums w-14 shrink-0">{pct}% use</span>
      </div>

      {/* Estimate text + action buttons.
          Mobile: one flex row (estimate left, buttons right via ml-auto).
          Desktop (sm+): sm:contents unwraps children into the parent flex row. */}
      <div className="flex items-center gap-2 sm:contents">
        {est && (
          <span className="flex-1 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            ≈ {co2(est.kgCo2e)} · {usd(est.damageUsd)}/mo
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto sm:ml-auto">
          {dirty && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={remove} disabled={removing} title="Remove plan">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionPlans({ connections }: { connections: TierConnection[] }) {
  if (connections.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium">Subscription plans</h2>
        <Link href="/providers" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
          Add more
        </Link>
      </div>
      <div className="rounded-xl border border-border bg-card">
        {connections.map((c) => <PlanRow key={c.id} conn={c} />)}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Accrues into this cycle&apos;s stats a little each day (prorated through the month) via the daily sync.
      </p>
    </div>
  );
}
