import { getImpactData } from "@/lib/data";
import { usd } from "@/lib/format";

export const metadata = {
  title: "Community Impact · EcoDues",
  description:
    "Real-time community impact: total dollars donated to vetted climate charities through EcoDues. Every donation is tracked and verifiable.",
};

// Revalidate every 60 seconds so the page stays fresh without hammering the DB.
export const revalidate = 60;

export default async function ImpactPage() {
  const { totalDonated, charityCount, charityTotals } = await getImpactData();

  const maxCharity = Math.max(
    ...charityTotals.map((c: { total_donated: number }) => Number(c.total_donated)),
    1,
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-400 mb-4">
            Live · Updated every minute
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-foreground">
            Community impact
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-lg">
            Every dollar shown here was donated by an EcoDues user to a vetted
            climate charity through PayPal Giving Fund or Every.org. We never
            touch the money — 100% goes to the cause.
          </p>
        </div>

        {/* Hero stat */}
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Total donated by the community
          </p>
          <p className="text-5xl sm:text-6xl font-bold tracking-tight text-primary tabular-nums">
            {usd(totalDonated)}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            across{" "}
            <span className="font-semibold text-foreground">{charityCount}</span>{" "}
            vetted climate charities
          </p>
        </div>

        {/* Equivalents — give the number meaning */}
        {totalDonated > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Social cost of carbon offset",
                value: `${((totalDonated / 190) * 1000).toFixed(0)} kg CO₂e`,
                sub: `at $190/t SCC (EPA 2023)`,
              },
              {
                label: "Equivalent to",
                value: `${(totalDonated / 0.12).toFixed(0)} tree-years`,
                sub: "of carbon absorption",
              },
              {
                label: "Or driving",
                value: `${((totalDonated * 1000) / 190 / 0.404).toFixed(0)} miles`,
                sub: "offset from an avg US car",
              },
            ].map(({ label, value, sub }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-5 text-center"
              >
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {sub}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Charity breakdown */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Where the money goes
          </h2>
          <div className="space-y-3">
            {(charityTotals as { charity_id: string; charity_name: string; total_donated: number; donor_count: number }[]).map(
              (c) => {
                const amount = Number(c.total_donated);
                const barPct =
                  maxCharity > 0 ? (amount / maxCharity) * 100 : 0;
                const sharePct =
                  totalDonated > 0 ? (amount / totalDonated) * 100 : 0;
                return (
                  <div
                    key={c.charity_id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {c.charity_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.donor_count} donor
                          {c.donor_count !== 1 ? "s" : ""} ·{" "}
                          {sharePct.toFixed(1)}% of total
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-primary tabular-nums">
                        {usd(amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* Transparency note */}
        <section className="rounded-xl border border-border bg-muted/30 p-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            How we track this
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every donation is logged in our{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              donation_payments
            </code>{" "}
            table with a timestamp and external receipt ID. This page queries
            that table directly — no caching, no estimation. The amounts you see
            are real donations made by real users to real charities. For the
            full methodology behind how we calculate the suggested donation
            amount, see{" "}
            <a
              href="/methodology"
              className="underline underline-offset-2 hover:text-foreground"
            >
              our methodology
            </a>
            .
          </p>
        </section>

        {/* CTA */}
        <div className="text-center pt-4 pb-8">
          <p className="text-muted-foreground mb-4 text-sm">
            Want to see your name here?
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-8 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Join EcoDues — it&apos;s free
          </a>
        </div>
      </main>
    </div>
  );
}
