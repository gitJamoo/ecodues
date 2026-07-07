---
name: ecodues-stats
description: Comprehensive EcoDues admin stats — signups, onboarding funnel, connections, usage, emissions covered, donation tab/paid totals. Pulls live numbers from the prod Supabase. Use when the user asks for stats, growth, signups, totals, or "how is the site doing".
---

# EcoDues admin stats

Query the production Supabase (project id `fxuhprgstuoruwcwbspt`) with the
`mcp__supabase__execute_sql` tool and present a compact report. Run these as
ONE combined query where possible to keep it fast:

```sql
select
  (select count(*) from auth.users)                                          as users_total,
  (select count(*) from auth.users where created_at > now() - interval '7 days')  as users_7d,
  (select count(*) from auth.users where created_at > now() - interval '30 days') as users_30d,
  (select count(*) from profiles where onboarded_at is not null)             as users_onboarded,
  (select count(*) from profiles where leaderboard_opt_in)                   as leaderboard_opt_ins,
  (select count(*) from provider_connections)                                as connections,
  (select count(*) from provider_connections where status = 'error')         as connections_errored,
  (select count(*) from usage_records)                                       as usage_records,
  (select coalesce(sum(kwh), 0) from emission_estimates)                     as total_kwh,
  (select coalesce(sum(kg_co2e), 0) from emission_estimates)                 as total_kg_co2e,
  (select coalesce(sum(damage_usd), 0) from emission_estimates)              as total_damage_usd,
  (select coalesce(sum(pending_donation_usd), 0) from profiles)              as tabs_outstanding_usd,
  (select coalesce(sum(donation_usd), 0) from donation_ledger)               as donations_accrued_usd,
  (select coalesce(sum(amount_usd), 0) from donation_payments)               as donations_paid_usd,
  (select count(*) from donation_payments)                                   as payments_count;
```

Then two small breakdowns:

```sql
select provider, kind, count(*) from provider_connections group by 1, 2 order by 3 desc;
```

```sql
select c.name, coalesce(sum(p.amount_usd), 0) as paid_usd, count(p.id) as payments
from charities c left join donation_payments p on p.charity_id = c.id
group by c.name order by paid_usd desc;
```

## Report format

Lead with the headline numbers (users, onboarded %, emissions covered in kg
CO₂e, donations paid vs outstanding tab). Then a short table for connections
by provider and charities by donations. Convert damage/donation numbers to
dollars with 2 decimals; kWh/kg with 1 decimal. Call out anything unhealthy:
errored connections, tabs stuck above charity minimums, zero-usage users.

## What this cannot show

- **Total visitors / page views** live in Vercel Web Analytics (the app uses
  `@vercel/analytics`); there is no public query API — check
  https://vercel.com/dashboard → project → Analytics.
- Email deliverability lives in the Resend dashboard.
