import { getDashboardData } from "@/lib/data";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { usd, monthLabel } from "@/lib/format";
import { ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type LedgerRow = {
  id: string;
  period: string;
  damage_usd: number;
  multiplier: number;
  donation_usd: number;
  charity_id: string;
  status: string;
  checkout_link?: string | null;
};

export default async function DonationsPage() {
  const { ledger, charities } = await getDashboardData();

  const totalDonated = ledger.reduce((s: number, l: LedgerRow) => s + Number(l.donation_usd), 0);
  const pendingCount = ledger.filter((l: LedgerRow) => l.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your monthly offset ledger</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/export?type=usage" download>
            <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1.5" />Usage CSV</Button>
          </a>
          <a href="/api/export?type=ledger" download>
            <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1.5" />Ledger CSV</Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total donated" value={usd(totalDonated)} sub="via Every.org" accent />
        <StatCard label="Donation cycles" value={String(ledger.length)} sub="months tracked" />
      </div>

      {pendingCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm">
          <span className="text-amber-600 font-semibold shrink-0">Action needed</span>
          <span className="text-amber-800">
            {pendingCount === 1 ? "1 donation is" : `${pendingCount} donations are`} waiting for payment.
            Click <strong>Pay now</strong> next to each row to complete via Every.org.
            They handle your card, issue a tax receipt, and route the funds — we never touch your money.
          </span>
        </div>
      )}

      {ledger.length > 0 ? (
        <div className="rounded-xl border border-border overflow-x-auto bg-card">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Period</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Damage</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Multiplier</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Donation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Charity</th>
                <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(ledger as LedgerRow[]).map((l) => {
                const charity = charities.find((c: { id: string }) => c.id === l.charity_id);
                return (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">{monthLabel(l.period)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{usd(Number(l.damage_usd))}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(l.multiplier).toFixed(2)}×</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-primary">{usd(Number(l.donation_usd))}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{charity?.name ?? l.charity_id ?? "—"}</td>
                    <td className="px-4 py-3">
                      {l.status === "completed" && (
                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">Donated ✓</Badge>
                      )}
                      {l.status === "pending" && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Awaiting payment</Badge>
                      )}
                      {l.status === "simulated" && (
                        <Badge variant="secondary" className="text-[10px] text-muted-foreground">Simulated</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.checkout_link && l.status !== "completed" && (
                        <a
                          href={l.checkout_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
                        >
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
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">No donation cycles yet — run a cycle from the Dashboard.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Payments are processed by{" "}
        <a href="https://www.every.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          Every.org
        </a>
        {" "}— a 501(c)(3) public charity. They issue tax receipts and route funds to your chosen nonprofit. EcoDues never holds your money.
      </p>
    </div>
  );
}
