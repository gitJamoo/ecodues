import { getLeaderboardData } from "@/lib/data";
import { usd } from "@/lib/format";
import { Trophy } from "lucide-react";

export default async function LeaderboardPage() {
  const { leaderboard, charityTotals } = await getLeaderboardData();

  const maxCharity = Math.max(...charityTotals.map((c: { total_donated: number }) => Number(c.total_donated)), 1);
  const totalAllCharities = charityTotals.reduce((s: number, c: { total_donated: number }) => s + Number(c.total_donated), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Community impact</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Collective AI footprint offsets across all EcoDues users</p>
      </div>

      {/* Top donors */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-medium">Top donors</h2>
        </div>
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-12">Rank</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Total donated</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Cycles</th>
              </tr>
            </thead>
            <tbody>
              {(leaderboard as { rank: number; display_name: string; total_donated: number; donation_count: number }[]).map((row) => (
                <tr key={row.rank} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold
                      ${row.rank === 1 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" :
                        row.rank === 2 ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" :
                        row.rank === 3 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                        "bg-muted text-muted-foreground"}`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{row.display_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-primary font-medium">{usd(Number(row.total_donated))}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{row.donation_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By charity */}
      <div>
        <h2 className="text-sm font-medium mb-3">Donations by charity</h2>
        <div className="space-y-3">
          {(charityTotals as { charity_id: string; charity_name: string; total_donated: number; donor_count: number }[]).map((c) => {
            const pct = totalAllCharities > 0 ? (Number(c.total_donated) / totalAllCharities) * 100 : 0;
            const barPct = (Number(c.total_donated) / maxCharity) * 100;
            return (
              <div key={c.charity_id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{c.charity_name}</p>
                    <p className="text-xs text-muted-foreground">{c.donor_count} donor{c.donor_count !== 1 ? "s" : ""} · {pct.toFixed(1)}% of all donations</p>
                  </div>
                  <span className="text-sm font-semibold text-primary tabular-nums">{usd(Number(c.total_donated))}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${barPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
