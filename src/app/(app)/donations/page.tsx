import { getDashboardData } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { usd, monthLabel } from "@/lib/format";

export default async function DonationsPage() {
  const { ledger, charities } = await getDashboardData();

  const totalDonated = ledger.reduce((s: number, l: { donation_usd: number }) => s + Number(l.donation_usd), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your simulated monthly offset ledger</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total simulated donations" value={usd(totalDonated)} sub="PoC — not real charges" accent />
        <StatCard label="Donation cycles" value={String(ledger.length)} sub="months" />
      </div>

      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Production flow:</strong> On the 1st of each month, your card is charged via Every.org, who routes the donation to your chosen charity and issues a tax receipt. We never hold your funds.
      </div>

      {ledger.length > 0 ? (
        <div className="rounded-xl border border-border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Period</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Damage</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Multiplier</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Donation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Charity</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l: { id: string; period: string; damage_usd: number; multiplier: number; donation_usd: number; charity_id: string; status: string }) => {
                const charity = charities.find((c: { id: string }) => c.id === l.charity_id);
                return (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">{monthLabel(l.period)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{usd(Number(l.damage_usd))}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(l.multiplier).toFixed(2)}×</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-primary">{usd(Number(l.donation_usd))}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{charity?.name ?? l.charity_id ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                        {l.status === "simulated" ? "Simulated (PoC)" : l.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No donation cycles yet — run a cycle from the Dashboard.</p>
        </div>
      )}
    </div>
  );
}
