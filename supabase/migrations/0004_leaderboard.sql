-- Leaderboard: aggregate donation totals across users (bypasses RLS via security definer)
create or replace function public.get_leaderboard(limit_n int default 20)
returns table(rank bigint, display_name text, total_donated numeric, donation_count bigint)
language sql security definer stable set search_path = ''
as $$
  select
    row_number() over (order by sum(dl.donation_usd) desc),
    coalesce(nullif(p.display_name, ''), 'Anonymous'),
    sum(dl.donation_usd),
    count(dl.id)
  from public.donation_ledger dl
  join public.profiles p on p.id = dl.user_id
  where dl.status in ('completed', 'simulated')
  group by dl.user_id, p.display_name
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
    coalesce(sum(dl.donation_usd), 0),
    count(distinct dl.user_id)
  from public.charities c
  left join public.donation_ledger dl on dl.charity_id = c.id
    and dl.status in ('completed', 'simulated')
  group by c.id, c.name
  order by 3 desc;
$$;
