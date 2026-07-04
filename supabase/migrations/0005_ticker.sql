-- Ticker / threshold model — accrue small monthly damages into a per-account
-- tab; only prompt payment when tab crosses the selected charity's minimum.

-- 1. Per-charity minimum donation (Every.org platform default = $1).
alter table charities add column if not exists min_donation_usd numeric(10,2) not null default 1.00;

-- 2. Tab + reminder tracking on the profile.
alter table profiles add column if not exists pending_donation_usd numeric(10,2) not null default 0;
alter table profiles add column if not exists last_reminder_period date;
alter table profiles add column if not exists donation_provider text not null default 'every_org'
  check (donation_provider in ('every_org','pledge'));

-- 3. Audit trail of actual payments (user-logged or webhook-confirmed).
create table if not exists donation_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  charity_id text references charities,
  amount_usd numeric(10,2) not null check (amount_usd > 0),
  paid_at timestamptz not null default now(),
  method text not null default 'manual' check (method in ('manual','every_org','pledge')),
  external_id text,
  checkout_link text,
  notes text
);
alter table donation_payments enable row level security;
create policy "own payments" on donation_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists donation_payments_user_paid_at
  on donation_payments (user_id, paid_at desc);

-- 4. Extend ledger status vocabulary. Old "pending" rows had checkout links
-- pre-generated per cycle — under the ticker model those roll into the tab
-- and stay in "accrued" until a payment covers them.
alter table donation_ledger drop constraint if exists donation_ledger_status_check;
alter table donation_ledger add constraint donation_ledger_status_check
  check (status in ('simulated','accrued','partially_paid','paid'));

update donation_ledger set status = 'accrued' where status = 'pending';

-- 5. Backfill the tab for anyone with pre-ticker accrued rows.
update profiles p
set    pending_donation_usd = coalesce((
  select sum(l.donation_usd)
  from   donation_ledger l
  where  l.user_id = p.id
  and    l.status in ('accrued','partially_paid')
), 0);
