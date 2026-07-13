-- Atomic tab decrement for logPayment. Using UPDATE...RETURNING instead of
-- read-modify-write prevents the race condition where two concurrent calls
-- both read the same pending_donation_usd, compute independent nextTab values,
-- and overwrite each other. Returns the new balance (never below 0).
create or replace function public.decrement_pending_donation(p_user_id uuid, p_amount numeric)
returns numeric
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set pending_donation_usd = greatest(0, pending_donation_usd - p_amount)
  where id = p_user_id
    and id = auth.uid()
  returning pending_donation_usd;
$$;
