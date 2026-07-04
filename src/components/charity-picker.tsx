"use client";

import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";
import { CharityLogo } from "@/components/charity-logo";

interface Charity {
  id: string;
  name: string;
  description: string;
  category: string;
  url?: string;
  min_donation_usd?: number;
  paypalGivingFundUrl?: string | null;
  paypal_giving_fund_url?: string | null;
}

interface CharityPickerProps {
  charities: Charity[];
  value: string | null;
  onChange: (id: string) => void;
  tabUsd?: number;
}

function isPpgf(c: Charity): boolean {
  return !!(c.paypalGivingFundUrl ?? c.paypal_giving_fund_url);
}

export function CharityPicker({ charities, value, onChange, tabUsd }: CharityPickerProps) {
  const ppgfCharities = charities.filter(isPpgf);
  const everyOrgCharities = charities.filter((c) => !isPpgf(c));

  return (
    <>
      {/* PPGF section — premier */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              Premier · PayPal Giving Fund
            </h3>
          </div>
          <Link
            href="/how-donations-work"
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Why the two options?
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          <strong className="text-foreground">100% of your donation reaches the charity</strong> — PayPal covers all card fees.
          Minimum $1. Recommended for most donors.
        </p>
        <CharityGrid
          charities={ppgfCharities}
          value={value}
          onChange={onChange}
          tabUsd={tabUsd}
        />
      </div>

      {/* Every.org section */}
      {everyOrgCharities.length > 0 && (
        <div className="mt-6 pt-5 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Every.org · $10 minimum
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Every.org deducts a payment-processing fee (~85–92% reaches the charity depending on donor-covers-fees).
            Set to a <strong className="text-foreground">$10 minimum</strong> so fee efficiency stays reasonable.
            Pick these only if your preferred charity isn&rsquo;t on PayPal Giving Fund.
          </p>
          <CharityGrid
            charities={everyOrgCharities}
            value={value}
            onChange={onChange}
            tabUsd={tabUsd}
          />
        </div>
      )}

      <div className="mt-4 text-center">
        <a
          href="https://github.com/gitJamoo/ecodues/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Missing some? Let us know!
        </a>
      </div>
    </>
  );
}

function CharityGrid({
  charities,
  value,
  onChange,
  tabUsd,
}: {
  charities: Charity[];
  value: string | null;
  onChange: (id: string) => void;
  tabUsd?: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {charities.map((c) => {
        const min = Number(c.min_donation_usd ?? 1);
        const reachable = tabUsd === undefined ? true : tabUsd >= min;
        const hasPpgf = isPpgf(c);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              value === c.id
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              <CharityLogo name={c.name} url={c.url} size={36} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <p className="text-sm font-medium leading-snug">{c.name}</p>
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
                    {c.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {hasPpgf ? (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      title="PayPal Giving Fund covers all card fees — 100% delivered to charity"
                    >
                      PayPal · 100% · $1 min
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        reachable
                          ? "bg-muted-foreground/10 text-muted-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Every.org · $10 min
                    </span>
                  )}
                  {tabUsd !== undefined && reachable && (
                    <span className="text-[10px] text-primary font-medium">reachable now</span>
                  )}
                </div>
              </div>
            </div>
            {c.url && (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium ml-12"
              >
                Learn more <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </button>
        );
      })}
    </div>
  );
}
