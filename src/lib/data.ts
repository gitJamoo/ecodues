import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DEV_MODE, DEV_USER, DEV_PROFILE, DEV_CHARITIES, DEV_ESTIMATES, DEV_LEDGER, DEV_USAGE, DEV_LEADERBOARD, DEV_CHARITY_TOTALS } from "@/lib/dev-mode";

export async function getSessionUser() {
  if (DEV_MODE) return { supabase: null as never, user: DEV_USER as never };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getDashboardData() {
  if (DEV_MODE) {
    return {
      user: DEV_USER,
      profile: DEV_PROFILE,
      estimates: DEV_ESTIMATES,
      ledger: DEV_LEDGER,
      usage: DEV_USAGE,
      charities: DEV_CHARITIES,
    };
  }
  const { supabase, user } = await getSessionUser();
  const [{ data: profile }, { data: estimates }, { data: ledger }, { data: usage }, { data: charities }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("emission_estimates").select("*").eq("user_id", user.id).order("period", { ascending: true }),
      supabase.from("donation_ledger").select("*, charities(name)").eq("user_id", user.id).order("period", { ascending: false }),
      supabase.from("usage_records").select("*").eq("user_id", user.id).order("period", { ascending: false }),
      supabase.from("charities").select("*"),
    ]);
  return {
    user,
    profile,
    estimates: estimates ?? [],
    ledger: ledger ?? [],
    usage: usage ?? [],
    charities: charities ?? [],
  };
}

export async function getConnections() {
  if (DEV_MODE) return [];
  const { supabase, user } = await getSessionUser();
  const { data } = await supabase.from("provider_connections").select("*").eq("user_id", user.id).order("created_at");
  return data ?? [];
}

export async function getLeaderboardData() {
  if (DEV_MODE) {
    return { leaderboard: DEV_LEADERBOARD, charityTotals: DEV_CHARITY_TOTALS };
  }
  const supabase = await createClient();
  const [{ data: leaderboard }, { data: charityTotals }] = await Promise.all([
    supabase.rpc("get_leaderboard", { limit_n: 20 }),
    supabase.rpc("get_charity_totals"),
  ]);
  return { leaderboard: leaderboard ?? [], charityTotals: charityTotals ?? [] };
}
