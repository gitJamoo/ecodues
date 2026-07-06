"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { backfillUsage } from "@/lib/actions";
import { TIER_ESTIMATES, tierById } from "@/lib/emissions/tiers";
import { estimateFromTokens, estimateFromSpend } from "@/lib/emissions/engine";
import { classifyModel } from "@/lib/emissions/models";
import { PROVIDER_CATALOG, providerById } from "@/lib/providers/catalog";
import { usd, co2, monthLabel } from "@/lib/format";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const MIN_MONTH = "2022-11"; // ChatGPT launch

function ym(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function previousMonthYm(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return ym(d);
}

function monthsBetween(sinceYm: string, endYm: string): string[] {
  const out: string[] = [];
  let [y, m] = sinceYm.split("-").map(Number);
  const [ey, em] = endYm.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

const tierProviders = [...new Set(TIER_ESTIMATES.map(t => t.provider))];

export function BackfillUsage({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<"plan" | "spend">("plan");
  const [provider, setProvider] = useState<string>("");
  const [tierId, setTierId] = useState<string>("");
  const [avgSpend, setAvgSpend] = useState<string>("");
  const [sinceMonth, setSinceMonth] = useState<string>("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const maxMonth = previousMonthYm();
  const months = useMemo(() => {
    if (!sinceMonth || sinceMonth < MIN_MONTH || sinceMonth > maxMonth) return [];
    return monthsBetween(sinceMonth, maxMonth);
  }, [sinceMonth, maxMonth]);

  const tier = tierById(tierId);
  const provTiers = TIER_ESTIMATES.filter(t => t.provider === provider);

  const ready =
    months.length > 0 &&
    provider &&
    (mode === "plan" ? !!tier : Number(avgSpend) > 0);

  // Per-month values with defaults: % of plan usage, or $ spend.
  const valueFor = (m: string) => overrides[m] ?? (mode === "plan" ? "100" : avgSpend);

  const preview = useMemo(() => {
    if (!ready) return null;
    let kgCo2e = 0, damageUsd = 0;
    for (const m of months) {
      if (mode === "plan" && tier) {
        const pct = Math.min(100, Math.max(0, Number(valueFor(m)) || 0)) / 100;
        const e = estimateFromTokens(tier.modelClass, tier.monthlyInputTokens * pct, tier.monthlyOutputTokens * pct);
        kgCo2e += e.kgCo2e; damageUsd += e.damageUsd;
      } else {
        const spend = Math.max(0, Number(valueFor(m)) || 0);
        const e = estimateFromSpend(classifyModel("manual"), spend);
        kgCo2e += e.kgCo2e; damageUsd += e.damageUsd;
      }
    }
    return { kgCo2e, damageUsd };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, months, mode, tier, overrides, avgSpend]);

  async function submit() {
    if (!ready) return;
    setSubmitting(true);
    const entries = months.map((m) => {
      if (mode === "plan" && tier) {
        const pct = Math.min(100, Math.max(0, Number(valueFor(m)) || 0)) / 100;
        return {
          provider,
          period: `${m}-01`,
          model: tier.id,
          inputTokens: Math.round(tier.monthlyInputTokens * pct),
          outputTokens: Math.round(tier.monthlyOutputTokens * pct),
          spendUsd: 0,
        };
      }
      return {
        provider,
        period: `${m}-01`,
        model: "manual",
        inputTokens: 0,
        outputTokens: 0,
        spendUsd: Math.max(0, Number(valueFor(m)) || 0),
      };
    });
    const res = await backfillUsage(entries);
    setSubmitting(false);
    if ("error" in res && res.error) { toast.error(res.error); return; }
    if (res.ok) {
      toast.success(
        `Backfilled ${res.months} month${res.months === 1 ? "" : "s"} — ${usd(res.addedToTabUsd ?? 0)} added to your tab`,
      );
      setSinceMonth("");
      setOverrides({});
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <button
        className="flex w-full items-center justify-between gap-2 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-medium">Been using AI for a while? Backfill past usage</h3>
            <p className="text-xs text-muted-foreground">
              Add your usage back to Nov 2022, month by month, and back-pay the damage into your tab.
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as "plan" | "spend"); setProvider(""); setTierId(""); setOverrides({}); }}>
            <TabsList className="bg-muted">
              <TabsTrigger value="plan" className="text-xs">Subscription plan</TabsTrigger>
              <TabsTrigger value="spend" className="text-xs">Monthly API spend</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Provider</Label>
              <Select value={provider || undefined} onValueChange={(v: string | null) => { if (v) { setProvider(v); setTierId(""); } }}>
                <SelectTrigger className="text-sm h-8"><SelectValue placeholder="Pick a provider" /></SelectTrigger>
                <SelectContent>
                  {(mode === "plan"
                    ? tierProviders.map(pid => ({ id: pid, label: providerById(pid)?.label ?? pid }))
                    : PROVIDER_CATALOG.map(p => ({ id: p.id, label: p.label }))
                  ).map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "plan" ? (
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Plan</Label>
                <Select value={tierId || undefined} onValueChange={(v: string | null) => { if (v) setTierId(v); }}>
                  <SelectTrigger className="text-sm h-8" disabled={!provider}>
                    <SelectValue placeholder={provider ? "Pick your plan" : "Pick a provider first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {provTiers.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-sm">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Avg monthly spend ($)</Label>
                <Input
                  type="number" min="0" step="0.01" placeholder="e.g. 25"
                  value={avgSpend}
                  onChange={e => setAvgSpend(e.target.value)}
                  className="text-sm h-8"
                />
              </div>
            )}

            <div>
              <Label className="text-[11px] text-muted-foreground mb-1 block">Using it since</Label>
              <Input
                type="month"
                min={MIN_MONTH}
                max={maxMonth}
                value={sinceMonth}
                onChange={e => setSinceMonth(e.target.value)}
                className="text-sm h-8"
              />
            </div>
          </div>

          {months.length > 0 && ready && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {months.length} month{months.length === 1 ? "" : "s"} — tweak any month
                  ({mode === "plan" ? "% of plan usage" : "$ spent"}), or leave the defaults.
                </p>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {months.map((m) => (
                      <div key={m} className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border/60 sm:odd:border-r">
                        <span className="text-xs text-muted-foreground">{monthLabel(`${m}-01`)}</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number" min="0"
                            max={mode === "plan" ? 100 : undefined}
                            step={mode === "plan" ? 5 : 0.01}
                            value={valueFor(m)}
                            onChange={e => setOverrides(o => ({ ...o, [m]: e.target.value }))}
                            className="text-xs h-7 w-20 text-right"
                          />
                          <span className="text-[10px] text-muted-foreground w-4">{mode === "plan" ? "%" : "$"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {preview && (
                <div className="rounded-lg bg-muted border border-border px-3 py-2.5 text-xs">
                  <span className="text-muted-foreground">Estimated total: </span>
                  <span className="font-medium">{co2(preview.kgCo2e)}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="font-medium">{usd(preview.damageUsd)} damage</span>
                  <span className="text-muted-foreground"> — your multiplier is applied on top when it lands on your tab.</span>
                </div>
              )}

              <Button size="sm" className="h-8" onClick={submit} disabled={submitting}>
                {submitting ? "Backfilling…" : `Backfill ${months.length} month${months.length === 1 ? "" : "s"}`}
              </Button>
            </>
          )}

          {sinceMonth && months.length === 0 && (
            <p className="text-xs text-amber-600">Pick a month between Nov 2022 and last month.</p>
          )}
        </div>
      )}
    </div>
  );
}
