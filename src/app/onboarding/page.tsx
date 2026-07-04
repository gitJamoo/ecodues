import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./wizard";
import { DEV_MODE, DEV_CHARITIES } from "@/lib/dev-mode";

export default async function OnboardingPage() {
  if (DEV_MODE) {
    return <OnboardingWizard charities={DEV_CHARITIES} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.onboarded_at) redirect("/dashboard");

  const { data: charities } = await supabase.from("charities").select("*");

  return <OnboardingWizard charities={charities ?? []} />;
}
