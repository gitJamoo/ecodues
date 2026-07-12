import Link from "next/link";
import { Check, X, Sparkles, Info } from "lucide-react";

export const metadata = {
  title: "How donations work · EcoDues",
  description:
    "PayPal Giving Fund vs. Every.org: fees, minimums, and why we split charities into two groups.",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does EcoDues take a cut of my donation?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. EcoDues never takes your money. It accrues your monthly climate impact into a running tab, then emails you a checkout link that points directly to PayPal Giving Fund or Every.org.",
      },
    },
    {
      "@type": "Question",
      name: "What percentage of my donation reaches the charity?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Through PayPal Giving Fund, 100% — PayPal absorbs all card processing fees. Every.org is the fallback for charities not enrolled with PayPal Giving Fund; it deducts a payment-processing fee, so EcoDues sets a $10 minimum there to keep fee efficiency reasonable.",
      },
    },
    {
      "@type": "Question",
      name: "When do I get a donation link?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "EcoDues accrues your estimated climate damage (times your chosen multiplier) into a monthly tab. When the tab clears your chosen charity's minimum, you receive an email with a one-click checkout link.",
      },
    },
  ],
};

export default function HowDonationsWorkPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground mb-4">
            Donation checkout providers
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-foreground">How donations work</h1>
          <p className="text-muted-foreground leading-relaxed">
            EcoDues never takes your money. We accrue your monthly climate impact into a
            running tab, then email you a checkout link when it clears your charity&rsquo;s
            minimum. Depending on the charity, that link points to one of two
            providers — and each has different fee mechanics. Here&rsquo;s how they compare.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Short version</h2>
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-sm leading-relaxed">
                <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">Prefer PayPal Giving Fund when available.</p>
                <p className="text-blue-900/80 dark:text-blue-100/80">
                  PPGF delivers <strong>100%</strong> of your gift to the charity — PayPal absorbs all card
                  processing fees. Every.org is our fallback for charities that aren&rsquo;t yet
                  enrolled with PPGF; it deducts a payment-processing fee, so we set a
                  <strong> $10 minimum</strong> there to keep fee efficiency reasonable.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Side-by-side</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">&nbsp;</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      PayPal Giving Fund
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Every.org</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-background">
                  <td className="px-4 py-3 font-medium text-foreground">% delivered to charity</td>
                  <td className="px-4 py-3 text-foreground">100% (PayPal covers card fees)</td>
                  <td className="px-4 py-3 text-muted-foreground">~85–92% (payment-processing fee deducted; higher when donor covers fees)</td>
                </tr>
                <tr className="bg-background">
                  <td className="px-4 py-3 font-medium text-foreground">Minimum donation</td>
                  <td className="px-4 py-3 text-foreground">$1</td>
                  <td className="px-4 py-3 text-muted-foreground">$10 (EcoDues internal minimum to keep fees reasonable)</td>
                </tr>
                <tr className="bg-background">
                  <td className="px-4 py-3 font-medium text-foreground">Amount pre-fill from email</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <X className="w-3.5 h-3.5" /> You type the amount on PayPal
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Check className="w-3.5 h-3.5 text-primary" /> Pre-filled from your tab
                    </span>
                  </td>
                </tr>
                <tr className="bg-background">
                  <td className="px-4 py-3 font-medium text-foreground">Tax-deductible receipt</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Check className="w-3.5 h-3.5 text-primary" /> Automatic (US)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Check className="w-3.5 h-3.5 text-primary" /> Automatic (US)
                    </span>
                  </td>
                </tr>
                <tr className="bg-background">
                  <td className="px-4 py-3 font-medium text-foreground">Payment methods</td>
                  <td className="px-4 py-3 text-foreground">PayPal balance, cards, bank</td>
                  <td className="px-4 py-3 text-muted-foreground">Cards, bank, Apple/Google Pay, crypto</td>
                </tr>
                <tr className="bg-background">
                  <td className="px-4 py-3 font-medium text-foreground">Charity coverage</td>
                  <td className="px-4 py-3 text-muted-foreground">A subset of our list — must be enrolled with PPGF</td>
                  <td className="px-4 py-3 text-muted-foreground">Nearly every US 501(c)(3)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Why raise Every.org to a $10 minimum?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Every.org&rsquo;s payment processing carries a per-transaction fee (roughly
            $0.30 + a percentage). At a $1 donation, that fee eats a huge share of the
            gift — you&rsquo;d be sending a nonprofit maybe 60–65 cents on the dollar.
            At $10, fee efficiency climbs to ~92% (higher when you check &ldquo;cover the
            fees&rdquo; on their checkout page).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            PPGF has no such threshold: PayPal absorbs the card fees regardless of amount,
            so we keep the PPGF minimum at $1. That&rsquo;s why we recommend picking a
            PPGF-enrolled charity when your favorite is on the list — smaller monthly tabs
            still clear, and every penny reaches the charity.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">The one catch with PPGF</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <div className="text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                <p className="font-medium mb-1">You type the amount yourself on PayPal.</p>
                <p className="text-amber-900/80 dark:text-amber-100/80">
                  PayPal Giving Fund&rsquo;s hosted donation page doesn&rsquo;t accept a
                  pre-filled amount in the URL. Our monthly email tells you the exact
                  figure (e.g., <span className="font-mono">$1.24</span>) — you just paste
                  or type it on the PayPal page. It&rsquo;s an extra five seconds in
                  exchange for 100% pass-through.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">EcoDues is a suggestion, never a charge</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We don&rsquo;t take your card. We don&rsquo;t hold your money. We estimate the
            damage your AI usage caused, multiply it by your chosen offset factor, and
            when your tab clears the charity&rsquo;s minimum we send you a link. You
            decide whether to donate, and to whom. Change charity, adjust multiplier, or
            skip a month — nothing about this system runs on autopilot.
          </p>
        </section>

        <div className="pt-6 border-t border-border flex items-center justify-between text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">← Home</Link>
          <Link href="/methodology" className="text-muted-foreground hover:text-foreground">Methodology →</Link>
        </div>
      </main>
    </div>
  );
}
