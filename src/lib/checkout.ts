import { directLink } from "@/lib/every-org";

export type CheckoutProvider = "ppgf" | "every_org";

export interface CheckoutOption {
  provider: CheckoutProvider;
  url: string;
  /** True when the URL does not pre-fill the amount and the user must type it. */
  requiresManualAmount: boolean;
  /** Marketing line for UI: "100% to charity" for PPGF, softer for Every.org. */
  feeNote: string;
}

interface CharityLike {
  paypal_giving_fund_url?: string | null;
  paypalGivingFundUrl?: string | null;
  every_org_slug?: string | null;
  everyOrgSlug?: string | null;
}

function ppgfUrl(c: CharityLike): string | null {
  return (c.paypal_giving_fund_url ?? c.paypalGivingFundUrl ?? null) as string | null;
}

function everyOrgSlug(c: CharityLike): string | null {
  return (c.every_org_slug ?? c.everyOrgSlug ?? null) as string | null;
}

export function hasPpgf(c: CharityLike | null | undefined): boolean {
  return !!c && !!ppgfUrl(c);
}

/**
 * Picks the best checkout for a charity, preferring PPGF (100% to charity)
 * over Every.org (~85–92% delivered depending on donor-covers-fees toggle).
 *
 * PPGF cannot pre-fill amount, so callers must show the user the amount to type.
 * Every.org supports amount + frequency pre-fill via the direct-link scheme.
 */
export function checkoutFor(charity: CharityLike | null | undefined, amountUsd: number): CheckoutOption | null {
  if (!charity) return null;
  const ppgf = ppgfUrl(charity);
  if (ppgf) {
    return {
      provider: "ppgf",
      url: ppgf,
      requiresManualAmount: true,
      feeNote: "100% to charity — PayPal covers all card fees",
    };
  }
  const slug = everyOrgSlug(charity);
  if (slug) {
    return {
      provider: "every_org",
      url: directLink(slug, amountUsd),
      requiresManualAmount: false,
      feeNote: "Check \"cover the fees\" on Every.org to send 100%",
    };
  }
  return null;
}
