import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data";
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

type UsageRow    = { id: string; period: string; provider: string; model: string; input_tokens: number; output_tokens: number; spend_usd: number; source: string };
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

  // Live stats for this cycle
  const cycle = liveStatsFrom(currentUsage);
  const nextDonation = donationForDamage(cycle.damageUsd, multiplier);

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

          {currentUsage.length > 0 ? (
            <div>
              <h2 className="text-sm font-medium mb-3">Usage records</h2>
              <UsageTable usage={currentUsage} multiplier={multiplier} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground mb-3">No usage recorded this month yet</p>
              <Link href="/providers">
                <Button variant="outline" size="sm">Connect a provider</Button>
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
                            {l.status === "accrued"         && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">On tab</Badge>}
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
