"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { logPayment } from "@/lib/actions";
import { usd } from "@/lib/format";
import { CheckCircle2, ExternalLink, Wallet, Info } from "lucide-react";
import { checkoutFor } from "@/lib/checkout";

interface Charity {
  id: string;
  name: string;
  everyOrgSlug?: string | null;
  every_org_slug?: string | null;
  paypalGivingFundUrl?: string | null;
  paypal_giving_fund_url?: string | null;
  min_donation_usd?: number;
}

interface TabBannerProps {
  tabUsd: number;
  charity: Charity | null;
}

export function TabBanner({ tabUsd, charity }: TabBannerProps) {
  const [open, setOpen] = useState(false);
  if (tabUsd <= 0) return null;

  const min = Number(charity?.min_donation_usd ?? 1);
  const checkout = checkoutFor(charity, tabUsd);
  const canDonate = tabUsd >= min && !!checkout;
  const remaining = Math.max(0, min - tabUsd);
  const pct = Math.min(100, Math.round((tabUsd / min) * 100));

  return (
    <>
      {canDonate && checkout ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                You&rsquo;ve accrued {usd(tabUsd)} — ready to offset
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/70 mt-0.5">
                Your tab crossed {charity?.name}&rsquo;s {usd(min)} minimum.{" "}
                {checkout.provider === "ppgf"
                  ? "PayPal Giving Fund passes 100% to the charity — PayPal covers all card fees."
                  : "Every.org handles the card and sends a tax receipt."}
              </p>
            </div>
          </div>
          {checkout.provider === "ppgf" && (
            <div className="flex items-start gap-2 rounded-md bg-white/60 dark:bg-black/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2 ml-8">
              <Info className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-100">
                PayPal Giving Fund can&rsquo;t pre-fill the amount. Enter{" "}
                <span className="font-semibold tabular-nums">{usd(tabUsd)}</span> on the PayPal page.
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pl-8">
            <a
              href={checkout.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-1.5 transition-colors"
            >
              {checkout.provider === "ppgf"
                ? `Donate ${usd(tabUsd)} via PayPal (100%)`
                : `Pay ${usd(tabUsd)} via Every.org`}{" "}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Log payment
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Wallet className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {usd(tabUsd)} built up · {usd(remaining)} to go
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We&rsquo;ll email a one-click Every.org link the moment your tab crosses {charity?.name ?? "your charity"}&rsquo;s {usd(min)} minimum. Or pick a lower-minimum charity — your tab carries over.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Log payment
            </Button>
          </div>
          <div className="ml-8 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <LogPaymentDialog
        open={open}
        onClose={() => setOpen(false)}
        tabUsd={tabUsd}
        charityMin={min}
        charityName={charity?.name ?? null}
      />
    </>
  );
}

interface LogPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  tabUsd: number;
  charityMin: number;
  charityName: string | null;
}

function LogPaymentDialog({ open, onClose, tabUsd, charityMin, charityName }: LogPaymentDialogProps) {
  const [amount, setAmount] = useState<string>(Math.min(tabUsd, charityMin).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    startTransition(async () => {
      const res = await logPayment({ amountUsd: n, method: "manual" });
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setDone(true);
      setTimeout(() => {
        setDone(false);
        onClose();
      }, 1200);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !pending) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Log a payment
          </DialogTitle>
          <DialogDescription>
            Enter what you actually donated. Your tab decreases by that amount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-1">
            <p className="text-xs text-muted-foreground">Current tab balance</p>
            <p className="text-2xl font-semibold text-primary tabular-nums">{usd(tabUsd)}</p>
            {charityName && (
              <p className="text-xs text-muted-foreground">Selected charity: {charityName} · {usd(charityMin)} min</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Amount paid (USD)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background pl-7 pr-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={pending || done}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(tabUsd.toFixed(2))}
                disabled={pending || done}
              >
                PAID MAX
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              PAID MAX fills in your entire tab ({usd(tabUsd)}).
            </p>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <Button
            className="w-full gap-2"
            onClick={submit}
            disabled={pending || done}
          >
            {done ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Logged
              </>
            ) : pending ? (
              "Logging..."
            ) : (
              `Log ${usd(Number(amount) || 0)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
