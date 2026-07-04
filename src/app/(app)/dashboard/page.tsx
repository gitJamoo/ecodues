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
import { ExternalLink } from "lucide-react";
import { classifyModel } from "@/lib/emissions/models";
import { estimateFromTokens, estimateFromSpend, donationForDamage } from "@/lib/emissions/engine";

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
  const charityName  = charities.find((c: { id: string }) => c.id === profile?.charity_id)?.name ?? "—";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your AI inference footprint and offset</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm">Edit settings</Button>
          </Link>
          <RunCycleButton />
        </div>
      </div>

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

          {/* Period breakdown */}
          {periods.length > 0 && (
            <div>
              <h2 className="text-sm font-medium mb-3">By period</h2>
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <table className="w-full text-sm">
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
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <table className="w-full text-sm">
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
                            {l.status === "completed" && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Donated ✓</Badge>}
                            {l.status === "pending"   && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Awaiting payment</Badge>}
                            {l.status === "simulated" && <Badge variant="secondary" className="text-[10px]">Simulated</Badge>}
                          </td>
                          <td className="px-4 py-3">
                            {l.checkout_link && l.status !== "completed" && (
                              <a href={l.checkout_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors">
                                Pay now <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </td>
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
