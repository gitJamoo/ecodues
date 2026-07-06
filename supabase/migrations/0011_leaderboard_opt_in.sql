-- Public leaderboard becomes opt-in: display names only appear with consent.
alter table profiles add column if not exists leaderboard_opt_in boolean not null default false;

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
  where p.leaderboard_opt_in
  group by dp.user_id, p.display_name
  order by 3 desc
  limit limit_n;
$$;
