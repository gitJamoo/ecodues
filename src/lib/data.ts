import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getDashboardData() {
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
  const { supabase, user } = await getSessionUser();
  const { data } = await supabase.from("provider_connections").select("*").eq("user_id", user.id).order("created_at");
  return data ?? [];
}
