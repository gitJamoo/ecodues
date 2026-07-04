import { getDashboardData } from "@/lib/data";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const { profile, charities, estimates } = await getDashboardData();
  const totalDamageUsd = (estimates as Array<{ damage_usd: number }>)
    .reduce((s, e) => s + Number(e.damage_usd), 0);
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and donation preferences</p>
      </div>
      <SettingsForm profile={profile} charities={charities} totalDamageUsd={totalDamageUsd} />
    </div>
  );
}
