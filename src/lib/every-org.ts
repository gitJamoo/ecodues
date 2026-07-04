const PARTNER_KEY = process.env.EVERY_ORG_PARTNER_KEY;
const API_BASE = "https://partners.every.org/v0.2";

export interface EveryOrgCheckout {
  checkoutToken: string;
  checkoutLink: string;
}

/**
 * Creates a hosted checkout via the Every.org Partner API.
 * Returns null if EVERY_ORG_PARTNER_KEY is not set — callers fall back to directLink().
 *
 * API docs: https://docs.every.org/docs/partner-api
 * Apply for a key: https://www.every.org/partners
 */
export async function createCheckout({
  nonprofitSlug,
  amountUsd,
  partnerDonationId,
}: {
  nonprofitSlug: string;
  amountUsd: number;
  partnerDonationId: string;
}): Promise<EveryOrgCheckout | null> {
  if (!PARTNER_KEY) return null;

  let res: Response;
  try {
    res = await fetch(
      `${API_BASE}/donate?partnerApiKey=${encodeURIComponent(PARTNER_KEY)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nonprofitSlug,
          amount: amountUsd,
          frequency: "ONCE",
          partnerDonationId,
        }),
        cache: "no-store",
      },
    );
  } catch (err) {
    console.error("[every-org] fetch failed:", err);
    return null;
  }

  if (!res.ok) {
    console.error("[every-org] API error:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const json = await res.json().catch(() => null);
  const d = json?.data;
  if (!d?.link) {
    console.error("[every-org] unexpected response shape:", json);
    return null;
  }

  return { checkoutToken: d.checkoutToken ?? "", checkoutLink: d.link };
}

/**
 * Constructs a direct Every.org donate URL with amount pre-filled.
 * Works without a Partner API key — amount is a suggestion, not enforced.
 *
 * Format per https://docs.every.org/docs/donate-link :
 *   query params → then the "#donate" fragment (which opens the modal).
 *   `amount` accepts a plain number; `frequency` must be ONCE|MONTHLY|YEARLY.
 *   Every.org enforces a $1 platform minimum.
 */
export function directLink(slug: string, amountUsd: number): string {
  const amt = Math.max(1, Math.ceil(amountUsd * 100) / 100);
  const amtParam = Number.isInteger(amt) ? String(amt) : amt.toFixed(2);
  return `https://www.every.org/${slug}?amount=${amtParam}&frequency=ONCE#donate`;
}
