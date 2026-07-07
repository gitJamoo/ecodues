-- handle_new_user is a SECURITY DEFINER trigger function (auth.users on-insert).
-- It was executable by anon/authenticated via /rest/v1/rpc/handle_new_user
-- (Supabase advisor 0028/0029). Only the trigger should ever run it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
