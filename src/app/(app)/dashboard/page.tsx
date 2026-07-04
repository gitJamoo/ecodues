import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { RunCycleButton } from "@/components/run-cycle-button";
import { co2, energy, usd, monthLabel, tokens } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { profile, estimates, ledger, usage, charities } = await getDashboardData();
  if (!profile?.onboarded_at) redirect("/onboarding");

  // Aggregate current period totals
  const totalKgCo2e = estimates.reduce((s: number, e: { kg_co2e: number }) => s + Number(e.kg_co2e), 0);
  const totalKwh    = estimates.reduce((s: number, e: { kwh: number }) => s + Number(e.kwh), 0);
  const totalDamage = estimates.reduce((s: number, e: { damage_usd: number }) => s + Number(e.damage_usd), 0);
  const nextDonation = ledger[0] ? Number(ledger[0].donation_usd) : 0;
  const charityName = charities.find((c: { id: string }) => c.id === profile?.charity_id)?.name ?? "—";

  const periods = [...new Set(estimates.map((e: { period: string }) => e.period))].sort();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your AI inference footprint and offset</p>
        </div>
        <RunCycleButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Footprint" value={co2(totalKgCo2e)} sub="all time" />
        <StatCard label="Energy" value={energy(totalKwh)} sub="all time" />
        <StatCard label="Damage" value={usd(totalDamage)} sub="social cost of carbon" />
        <StatCard label="Next donation" value={usd(nextDonation)} sub={charityName} accent />
      </div>

      {/* Period table */}
      {periods.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3">By period</h2>
          <div className="rounded-xl border border-border overflow-hidden bg-white">
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
                  const pEstimates = estimates.filter((e: { period: string }) => e.period === period);
                  const pLedger = ledger.find((l: { period: string }) => l.period === period);
                  const pkgCo2e = pEstimates.reduce((s: number, e: { kg_co2e: number }) => s + Number(e.kg_co2e), 0);
                  const pdamage = pEstimates.reduce((s: number, e: { damage_usd: number }) => s + Number(e.damage_usd), 0);
                  return (
                    <tr key={period} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted-foreground">{monthLabel(period)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{co2(pkgCo2e)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{usd(pdamage)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-primary">{pLedger ? usd(Number(pLedger.donation_usd)) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage detail */}
      {usage.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium mb-3">Usage records</h2>
          <div className="rounded-xl border border-border overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Provider</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Model</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tokens in</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Tokens out</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Spend</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {usage.slice(0, 20).map((u: { id: string; provider: string; model: string; input_tokens: number; output_tokens: number; spend_usd: number; source: string }) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 capitalize">{u.provider}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.model}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{tokens(u.input_tokens)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{tokens(u.output_tokens)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{usd(Number(u.spend_usd))}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px]">{u.source}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">No usage data yet</p>
          <Link href="/providers">
            <Button variant="outline" size="sm">Connect a provider</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
