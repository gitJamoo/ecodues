-- Rewrite leaderboard functions to aggregate from donation_payments (0005 ticker model).
-- The old functions queried donation_ledger filtered by status in ('completed','simulated'),
-- but those statuses no longer exist after 0005 dropped the check constraint.
-- Real money is now captured in donation_payments; this migration switches both functions
-- to that table so the leaderboard and charity totals return accurate data.

create or replace function public.get_leaderboard(limit_n int default 20)
returns table(rank bigint, display_name text, total_donated numeric, donation_count bigint)
language sql security definer stable set search_path = ''
as $$
  select
    row_number() over (order by sum(dp.amount_usd) desc),
    coalesce(nullif(p.display_name, ''), 'Anonymous'),
    sum(dp.amount_usd),
    count(dp.id)
  from public.donation_payments dp
  join public.profiles p on p.id = dp.user_id
  group by dp.user_id, p.display_name
  order by 3 desc
  limit limit_n;
$$;

create or replace function public.get_charity_totals()
returns table(charity_id text, charity_name text, total_donated numeric, donor_count bigint)
language sql security definer stable set search_path = ''
as $$
  select
    c.id,
    c.name,
    coalesce(sum(dp.amount_usd), 0),
    count(distinct dp.user_id)
  from public.charities c
  left join public.donation_payments dp on dp.charity_id = c.id
  group by c.id, c.name
  order by 3 desc;
$$;
