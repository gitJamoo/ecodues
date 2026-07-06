import { redirect } from "next/navigation";
import { getDashboardData, getConnections } from "@/lib/data";
import { tierById } from "@/lib/emissions/tiers";
import { StatCard } from "@/components/stat-card";
import { RunCycleButton } from "@/components/run-cycle-button";
import { UsageTable } from "@/components/usage-table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { co2, energy, usd, monthLabel, co2Equivalents, kwhEquivalents } from "@/lib/format";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { classifyModel } from "@/lib/emissions/models";
import { estimateFromTokens, estimateFromSpend, donationForDamage } from "@/lib/emissions/engine";
import { TabBanner } from "@/components/tab-banner";
import { ShareImpact } from "@/components/share-impact";
import { computeBadges, computeStreak } from "@/lib/badges";
import { SubscriptionPlans, type TierConnection } from "@/components/subscription-plans";
import { DonationMath } from "@/components/donation-math";
import { UsageSources, type UsageSourceEntry } from "@/components/usage-sources";
import { providerById } from "@/lib/providers/catalog";

type UsageRow    = { id: string; period: string; provider: string; model: string; input_tokens: number; output_tokens: number; spend_usd: number; source: string; connection_id?: string | null };
type Conn        = { id: string; provider: string; kind: string; tier_id?: string | null; status: string; label?: string | null };
type EstimateRow = { period: string; kwh: number; kg_co2e: number; damage_usd: number };
type LedgerRow   = { id: string; period: string; damage_usd: number; multiplier: number; donation_usd: number; charity_id: string; status: string; checkout_link?: string | null; charities?: { name: string } | null };

function liveStatsFrom(rows: UsageRow[]) {
  return rows.reduce((acc, u) => {
    const cls = classifyModel(u.model);
    const hasTokens = u.input_tokens > 0 || u.output_tokens > 0;
    const est = hasTokens
      ? estimateFromTokens(cls, u.input_tokens, u.output_tokens)
      : estimateFromSpend(cls, Number(u.spend_usd));
    return { kwh: acc.kwh + est.kwh, kgCo2e: acc.kgCo2e + est.kgCo2e, damageUsd: acc.damageUsd + est.damageUsd };
  }, { kwh: 0, kgCo2e: 0, damageUsd: 0 });
}

export default async function DashboardPage() {
  const { profile, estimates, ledger, usage, charities } = await getDashboardData();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const multiplier   = Number(profile.multiplier ?? 2);
  const selectedCharity = charities.find((c: { id: string }) => c.id === profile?.charity_id) ?? null;
  const charityName  = selectedCharity?.name ?? "—";
  const tabUsd = Number((profile as { pending_donation_usd?: number }).pending_donation_usd ?? 0);

  // Current period = current month (usage that will be processed in the next cycle)
  const now  = new Date();
  const currentPeriodPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const currentUsage = (usage as UsageRow[]).filter(u => u.period.startsWith(currentPeriodPrefix));

  const connections = (await getConnections()) as Conn[];
  const tierConns = connections.filter((c) => c.kind === "tier" && c.tier_id);

  // Attribute this month's rows to the connection that produced them. Legacy
  // rows (written before connection_id existed) fall back to the first
  // matching connection of the right kind; manual/backfill rows go to their
  // own bucket.
  const rowsByConn = new Map<string, UsageRow[]>();
  const manualRows: UsageRow[] = [];
  for (const u of currentUsage) {
    let cid = u.connection_id ?? null;
    if (!cid) {
      if (u.source === "api") cid = connections.find((c) => c.provider === u.provider && c.kind === "api_key")?.id ?? null;
      else if (u.source === "tier_estimate") cid = connections.find((c) => c.provider === u.provider && c.kind === "tier")?.id ?? null;
    }
    if (cid) rowsByConn.set(cid, [...(rowsByConn.get(cid) ?? []), u]);
    else manualRows.push(u);
  }

  // Tier plans whose prorated rows haven't been materialized by a sync yet
  // still get a live prorated estimate, so a just-connected plan shows up
  // immediately without double counting after the next sync.
  const daysInMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
  const monthFrac = Math.min(1, now.getUTCDate() / daysInMonth);
  const pendingTierEstimate = (c: Conn) => {
    const t = tierById(String(c.tier_id));
    if (!t) return null;
    const pctStr = String(c.tier_id).split(":")[1];
    const pct = pctStr ? Math.min(1, Math.max(0, Number(pctStr) / 100)) : 1;
    return estimateFromTokens(t.modelClass, t.monthlyInputTokens * pct * monthFrac, t.monthlyOutputTokens * pct * monthFrac);
  };
  const pendingTierStats = tierConns
    .filter((c) => (rowsByConn.get(c.id) ?? []).length === 0)
    .reduce((acc, c) => {
      const est = pendingTierEstimate(c);
      return est
        ? { kwh: acc.kwh + est.kwh, kgCo2e: acc.kgCo2e + est.kgCo2e, damageUsd: acc.damageUsd + est.damageUsd }
        : acc;
    }, { kwh: 0, kgCo2e: 0, damageUsd: 0 });

  // Live stats for this cycle = month-to-date records + not-yet-synced plans
  const usageStats = liveStatsFrom(currentUsage);
  const cycle = {
    kwh: usageStats.kwh + pendingTierStats.kwh,
    kgCo2e: usageStats.kgCo2e + pendingTierStats.kgCo2e,
    damageUsd: usageStats.damageUsd + pendingTierStats.damageUsd,
  };
  const nextDonation = donationForDamage(cycle.damageUsd, multiplier);

  // Per-source breakdown for the "Usage by source" section. Plan estimates
  // are hidden by default (they have their own section below) — opt in via
  // the "Show plans in Usage by source" settings toggle.
  const showPlansInSources = Boolean((profile as { show_plans_in_sources?: boolean }).show_plans_in_sources);
  const sourceConnections = connections.filter((c) => showPlansInSources || c.kind !== "tier");
  const sourceEntries: UsageSourceEntry[] = sourceConnections.map((c) => {
    const rows = rowsByConn.get(c.id) ?? [];
    const meta = providerById(c.provider);
    const providerLabel = meta?.label ?? c.provider;
    const tierLabel = c.kind === "tier" ? tierById(String(c.tier_id ?? ""))?.label ?? "plan" : null;
    const name = c.label || tierLabel || "API key";
    const status = (c.status === "error" ? "error" : "active") as "active" | "error";
    if (rows.length > 0) {
      const stats = liveStatsFrom(rows);
      return {
        id: c.id, provider: c.provider, providerLabel, name,
        kind: (c.kind === "tier" ? "tier" : "api_key") as UsageSourceEntry["kind"], status,
        kgCo2e: stats.kgCo2e, damageUsd: stats.damageUsd,
        spendUsd: rows.reduce((s, r) => s + Number(r.spend_usd), 0),
        isEstimate: c.kind === "tier",
        note: c.kind === "tier" ? "Plan estimate, prorated to today" : "Synced from provider API",
      };
    }
    const est = c.kind === "tier" ? pendingTierEstimate(c) : null;
    return {
      id: c.id, provider: c.provider, providerLabel, name,
      kind: (c.kind === "tier" ? "tier" : "api_key") as UsageSourceEntry["kind"], status,
      kgCo2e: est?.kgCo2e ?? 0, damageUsd: est?.damageUsd ?? 0, spendUsd: 0,
      isEstimate: true,
      note: c.kind === "tier"
        ? "Plan estimate — first sync pending"
        : status === "error" ? "Last sync failed — check this key on the Providers page" : "No usage synced yet",
    };
  });
  if (manualRows.length > 0) {
    const stats = liveStatsFrom(manualRows);
    sourceEntries.push({
      id: "__manual", provider: "manual", providerLabel: "Manual", name: "Logged & backfilled usage",
      kind: "manual", status: "active",
      kgCo2e: stats.kgCo2e, damageUsd: stats.damageUsd,
      spendUsd: manualRows.reduce((s, r) => s + Number(r.spend_usd), 0),
      isEstimate: false, note: "Entered by you",
    });
  }

  // History: aggregate from committed emission_estimates
  const histKgCo2e = (estimates as EstimateRow[]).reduce((s, e) => s + Number(e.kg_co2e), 0);
  const histKwh    = (estimates as EstimateRow[]).reduce((s, e) => s + Number(e.kwh), 0);
  const histDamage = (estimates as EstimateRow[]).reduce((s, e) => s + Number(e.damage_usd), 0);
  const totalDonated = (ledger as LedgerRow[]).reduce((s, l) => s + Number(l.donation_usd), 0);
  const periods = [...new Set((estimates as EstimateRow[]).map(e => e.period))].sort();

  const anyPaid = (ledger as LedgerRow[]).some(l => l.status === "paid" || l.status === "partially_paid");
  const streak = computeStreak(periods);
  const badges = computeBadges({ periods, totalKgCo2e: histKgCo2e, anyPaid, multiplier });

  // Share card: current cycle if it has usage, otherwise all-time totals.
  const hasCycleData = cycle.kgCo2e > 0;
  const share = hasCycleData
    ? { label: now.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }), kg: cycle.kgCo2e, kwh: cycle.kwh, damage: cycle.damageUsd, donation: nextDonation }
    : { label: "All time", kg: histKgCo2e, kwh: histKwh, damage: histDamage, donation: totalDonated };
  const showShare = share.kg > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your AI inference footprint and offset</p>
        </div>
        <div className="flex items-center gap-2">
          {showShare && (
            <ShareImpact
              periodLabel={share.label}
              kgCo2e={share.kg}
              kwh={share.kwh}
              damageUsd={share.damage}
              donationUsd={share.donation}
              multiplier={multiplier}
              displayName={(profile as { display_name?: string | null }).display_name}
            />
          )}
          <Link href="/settings">
            <Button variant="outline" size="sm">Edit settings</Button>
          </Link>
          <RunCycleButton />
        </div>
      </div>

      <TabBanner tabUsd={tabUsd} charity={selectedCharity} />

      <Tabs defaultValue="cycle" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cycle">This cycle</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ── This cycle ── */}
        <TabsContent value="cycle" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Footprint" value={co2(cycle.kgCo2e)} sub="this cycle" info={co2Equivalents(cycle.kgCo2e)} />
            <StatCard label="Energy"    value={energy(cycle.kwh)} sub="this cycle" info={kwhEquivalents(cycle.kwh)} />
            <StatCard label="Damage"    value={usd(cycle.damageUsd)} sub="social cost of carbon" />
            <StatCard label="Next donation" value={usd(nextDonation)} sub={charityName} accent />
          </div>

          <div className="flex justify-end -mt-3">
            <DonationMath
              kwh={cycle.kwh}
              kgCo2e={cycle.kgCo2e}
              damageUsd={cycle.damageUsd}
              multiplier={multiplier}
              donationUsd={nextDonation}
              charityName={charityName}
            />
          </div>

          <UsageSources entries={sourceEntries} />

          <SubscriptionPlans connections={tierConns as TierConnection[]} />

          {currentUsage.length > 0 ? (
            <div>
              <h2 className="text-sm font-medium mb-3">Usage records</h2>
              <UsageTable usage={currentUsage} multiplier={multiplier} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {cycle.kgCo2e > 0
                  ? "No usage records committed for this month yet — the stats above are live plan estimates. Records appear after the next sync."
                  : "No usage recorded this month yet"}
              </p>
              <Link href="/providers">
                <Button variant="outline" size="sm">Don&apos;t see your usage? Check here!</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* ── History ── */}
        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="All-time CO₂e"  value={co2(histKgCo2e)}    sub="committed cycles" />
            <StatCard label="All-time energy" value={energy(histKwh)}    sub="committed cycles" />
            <StatCard label="Total damage"    value={usd(histDamage)}    sub="social cost of carbon" />
            <StatCard label="Total donated"   value={usd(totalDonated)}  sub="via Every.org" accent />
          </div>

          {/* Streak + badges */}
          <div>
            <h2 className="text-sm font-medium mb-3">
              Badges{streak > 1 && <span className="ml-2 text-xs font-normal text-muted-foreground">🔥 {streak}-month streak</span>}
            </h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div
                  key={b.id}
                  title={b.description}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium
                    ${b.earned
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground/60"}`}
                >
                  {b.earned ? "✓" : "○"} {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Period breakdown */}
          {periods.length > 0 && (
            <div>
              <h2 className="text-sm font-medium mb-3">By period</h2>
              <div className="rounded-xl border border-border overflow-x-auto bg-card">
                <table className="w-full text-sm min-w-[340px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Month</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">CO₂e</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Damage</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Donation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => {
                      const pe = (estimates as EstimateRow[]).filter(e => e.period === period);
                      const pl = (ledger as LedgerRow[]).find(l => l.period === period);
                      return (
                        <tr key={period} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 text-muted-foreground">{monthLabel(period)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{co2(pe.reduce((s, e) => s + Number(e.kg_co2e), 0))}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{usd(pe.reduce((s, e) => s + Number(e.damage_usd), 0))}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-primary">{pl ? usd(Number(pl.donation_usd)) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment history */}
          {ledger.length > 0 ? (
            <div>
              <h2 className="text-sm font-medium mb-3">Payment history</h2>
              <div className="rounded-xl border border-border overflow-x-auto bg-card">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Period</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Damage</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Multiplier</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Donation</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Charity</th>
                      <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {(ledger as LedgerRow[]).map((l) => {
                      const charity = charities.find((c: { id: string }) => c.id === l.charity_id);
                      return (
                        <tr key={l.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 text-muted-foreground">{monthLabel(l.period)}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{usd(Number(l.damage_usd))}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{Number(l.multiplier ?? multiplier).toFixed(2)}×</td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-primary">{usd(Number(l.donation_usd))}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{charity?.name ?? l.charities?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            {l.status === "paid"            && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Paid ✓</Badge>}
                            {l.status === "partially_paid"  && <Badge variant="outline" className="text-[10px] text-primary border-primary/40">Partially paid</Badge>}
                            {l.status === "accrued"         && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700">On tab</Badge>}
                            {l.status === "simulated"       && <Badge variant="secondary" className="text-[10px]">Simulated</Badge>}
                          </td>
                          <td className="px-4 py-3" />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">No payment history yet — run a cycle to generate your first donation.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
