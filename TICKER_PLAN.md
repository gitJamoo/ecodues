# Threshold Ticker — Design Plan

Aggregate small monthly damages into an **account tab** and only email a "pay now" link when the tab crosses the selected charity's minimum. Applies to any donation provider (Every.org today, Pledge later).

## Data model

New / changed columns (migration `0005_ticker.sql`):

```sql
-- 1. per-charity minimum (Every.org platform default = $1; may be higher per charity/provider)
alter table charities add column if not exists min_donation_usd numeric(10,2) not null default 1.00;

-- 2. running tab on the profile (cached; canonical = sum(ledger.donation_usd) - sum(payments.amount_usd))
alter table profiles add column if not exists pending_donation_usd numeric(10,2) not null default 0;
alter table profiles add column if not exists last_reminder_period date;  -- last month we emailed
alter table profiles add column if not exists donation_provider text not null default 'every_org'
  check (donation_provider in ('every_org','pledge'));

-- 3. audit trail of actual payments — one row per user-logged payment or webhook confirm
create table donation_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  charity_id text references charities,
  amount_usd numeric(10,2) not null check (amount_usd > 0),
  paid_at timestamptz not null default now(),
  method text not null default 'manual' check (method in ('manual','every_org','pledge')),
  external_id text,      -- Every.org / Pledge donation ID from webhook
  checkout_link text,    -- URL that was clicked (audit)
  notes text
);
alter table donation_payments enable row level security;
create policy "own payments" on donation_payments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index donation_payments_user_paid_at on donation_payments (user_id, paid_at desc);

-- 4. ledger becomes "accrual log" — extends existing statuses
alter table donation_ledger drop constraint donation_ledger_status_check;
alter table donation_ledger add constraint donation_ledger_status_check
  check (status in ('simulated','accrued','partially_paid','paid'));
-- migrate: 'pending' rows → 'accrued'
update donation_ledger set status = 'accrued' where status = 'pending';
```

**Semantics:**
- `donation_ledger` = one row per (user, period) — historical record of how much was added to the tab.
- `donation_payments` = one row per real payment. Free-form amount (user enters what they paid).
- `profiles.pending_donation_usd` = live tab balance, updated whenever ledger or payments change.
- Tab is an **account tab**, not per-charity. Carries over when user changes charity.

## Cycle flow (unchanged emissions math, new tail)

`runMonthlyCycleForUser`:
1. Compute usage → estimates → `donation_usd` for the period (existing).
2. Upsert `donation_ledger` row with `status = 'accrued'` (no checkout_link built here anymore).
3. `profiles.pending_donation_usd += donation_usd`.

## Cron flow (monthly, 1st of month)

For each onboarded user:
1. Run cycle (above).
2. Fetch profile + selected charity.
3. Compute `tab = profiles.pending_donation_usd`, `min = charity.min_donation_usd`.
4. Decide email variant:
   - **Threshold crossed** (`tab >= min`): "Time to offset — $X to Charity" with pre-filled checkout link.
   - **Quarter end + still under min** (period.month ∈ {3,6,9,12} && tab > 0 && tab < min): "Quarterly update — you've accrued $X. Not enough for {selected_charity} yet, but Y other charities accept donations at your level." List charities where `min_donation_usd <= tab`.
   - **Otherwise** (sub-threshold, non-quarter): monthly recap only — "Here's your footprint. You have $X in the tank, $Y to go."
5. `profiles.last_reminder_period = period`.

## Payment logging

User clicks the checkout link → pays on Every.org (or Pledge later) → returns to app.

**Path A — manual log (always available):**
- Dashboard button "Log a payment" opens a dialog:
  - Amount input (default = min(tab, charity_min); "PAID MAX" button = tab total)
  - Optional charity selector (defaults to current)
  - "Where did you pay?" (Every.org / Pledge / Other)
- Server action `logPayment({ amountUsd, charityId, method, externalId? })`:
  - Insert `donation_payments` row.
  - `profiles.pending_donation_usd -= amountUsd` (clamp ≥ 0).
  - Update matching `donation_ledger` rows to `paid` / `partially_paid` if we can reconcile.
- Optimistic UI updates the tab immediately.

**Path B — webhook (Every.org / Pledge):**
- Existing `/api/webhooks/every-org` route inserts `donation_payments` with `method='every_org'` + `external_id`.
- Decrement tab same as manual.
- Toast on next dashboard load.

## Dashboard UX changes

Notification banner (`dashboard/page.tsx`):
- Show tab balance always if `tab > 0`.
- If `tab >= charity_min`: existing amber "Pay now" banner + link.
- If `tab < charity_min`: quiet green info banner — "$X.XX built up. $Y.YY more until you can offset via {charity}. Or pick a charity with a lower minimum."
- New **"Log payment"** button on both variants + as a header action.

Charity picker (`charity-picker.tsx`):
- Small badge on each card: "Min $1" / "Min $5" / etc.
- New filter chip: "Show only charities you can donate to now" (filters by `min_donation_usd <= tab`).

## Provider abstraction (paves the way for Pledge)

New file `src/lib/donation-providers/index.ts`:

```ts
export type DonationProvider = 'every_org' | 'pledge';

export interface CheckoutRequest {
  charity: { every_org_slug?: string; pledge_id?: string; name: string };
  amountUsd: number;
  partnerDonationId: string;
}

export interface CheckoutResult {
  checkoutLink: string;
  externalId?: string;
}

export interface ProviderAdapter {
  minDonationUsd: number;
  buildCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
}
```

Adapters:
- `every-org.ts` (existing, wrapped)
- `pledge.ts` (stub until API key + docs from research agent land)

`profiles.donation_provider` picks which adapter to use. Charity picker filters to charities available on that provider.

## Rollout order (this branch)

1. ✅ Migration 0005 with new columns + payments table.
2. ✅ DEV_CHARITIES gets `min_donation_usd` field + DEV_PROFILE gets `pending_donation_usd`.
3. ✅ Refactor `cycle.ts` — accrue to tab, drop per-cycle checkout link.
4. ✅ Server action `logPayment`.
5. ✅ Dashboard banner + "Log payment" dialog.
6. ✅ Charity picker shows minimums.
7. ✅ Email templates: monthly recap, threshold-crossed, quarterly suggestion.
8. ✅ Cron branches by tab status.
9. ⏳ Pledge adapter (stub) + provider toggle in onboarding/settings — after research agent returns.
10. ⏳ Contact-charity + Pledge-signup TODO items.

## Pledge findings (2026-07-04 research)

**The "Pledge absorbs 100% of fees" belief is wrong for our use case.** Sources: pledge.to/pricing, help.pledgeling.com, developer.pledge.to.

- **Free the Fee mode** (hosted widget only, donations ≤ $1,000, donor-tipping enabled): charity gets 100%. This is the mode marketing pages describe.
- **Default API path** (server-to-server): Pledge deducts a **5% tech fee** and passes Stripe (2.9% + $0.30) through. On $1 → **$0.62 to charity (62%)**. On $5 → **$4.31 (86%)**.
- No hosted-checkout-URL endpoint like Every.org's `/donate` → `data.link`. Donor-facing surfaces are (a) an embeddable widget/iframe (`postMessage` on completion) or (b) the public organization page `pledge.to/organizations/{EIN}/{slug}` with no documented `?amount=` query pre-fill.
- Partner keys are not self-serve — must email `partners@pledge.to` for sandbox + prod keys. No published timeline.
- Charity DB is IRS-synced (~2M 501(c)(3)s), addressable by EIN. Charities are **listed by EIN** so we can hardcode.

**Implication for EcoDues:**
- Pledge is not a drop-in Every.org swap. Integration means embedding the widget in-app + listening for `postMessage`, OR redirecting to `pledge.to/organizations/{EIN}` (no pre-fill).
- To match Every.org's fee efficiency we'd need to enable Free the Fee — which requires user tipping (contradicts "one-click" story).
- **Recommendation:** treat Pledge as opt-in secondary. Every.org stays default. Ship the provider toggle UI + Pledge widget-embed adapter behind a feature flag; unblocks only when partner keys arrive.

Follow-ups → TODO:
- Email `partners@pledge.to` about hosted-checkout URL / static pre-fill, webhook schema, sandbox keys, forcing Free-the-Fee on via API.
- If they confirm no hosted-URL path, defer Pledge integration entirely.

## Open questions

- **Backfilling existing users:** on migration deploy, `pending_donation_usd = sum(ledger.donation_usd where status='pending')`. Ship as part of 0005.
- **Multi-charity payment:** if tab is $5 and user pays $2 to Charity A and $3 to Charity B in one week, do we UI both? Path A already supports it via separate log actions; no schema change.
- **Overpayment:** if user pays $10 on a $5 tab, tab goes to zero — the extra $5 is a "credit" toward next month? Or we ignore it? Simplest: clamp tab to zero, log full $10 (their choice, they get the karma).
