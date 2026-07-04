"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiplierSlider } from "@/components/multiplier-slider";
import { CharityPicker } from "@/components/charity-picker";
import { saveSettings } from "@/lib/actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface Profile {
  display_name: string | null;
  multiplier: number;
  charity_id: string | null;
}
interface Charity { id: string; name: string; description: string; category: string; url?: string }

export function SettingsForm({ profile, charities, totalDamageUsd }: {
  profile: Profile | null;
  charities: Charity[];
  totalDamageUsd?: number;
}) {
  const [name, setName] = useState(profile?.display_name ?? "");
  const [multiplier, setMultiplier] = useState(Number(profile?.multiplier ?? 2));
  const [charityId, setCharityId] = useState<string | null>(profile?.charity_id ?? null);
  const [saving, setSaving] = useState(false);
  const { theme, setTheme } = useTheme();

  async function handleSave() {
    setSaving(true);
    await saveSettings({ displayName: name, multiplier, charityId: charityId ?? undefined });
    setSaving(false);
    toast.success("Settings saved");
  }

  const themes = [
    { value: "light",  label: "Light",  Icon: SunIcon },
    { value: "dark",   label: "Dark",   Icon: MoonIcon },
    { value: "system", label: "System", Icon: MonitorIcon },
  ];

  return (
    <div className="space-y-6 bg-card rounded-xl border border-border p-6">
      <div className="space-y-2">
        <Label>Display name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
      </div>

      <Separator />

      <div>
        <Label className="mb-3 block">Donation multiplier</Label>
        <MultiplierSlider value={multiplier} onChange={setMultiplier} damageUsd={totalDamageUsd} />
      </div>

      <Separator />

      <div>
        <Label className="mb-3 block">Charity</Label>
        <CharityPicker charities={charities} value={charityId} onChange={setCharityId} />
      </div>

      <Separator />

      <div>
        <Label className="mb-1 block">How payment works</Label>
        <p className="text-sm text-muted-foreground">
          On the 1st of each month we email you a one-click Every.org checkout link at your chosen multiplier.
          You pay directly on Every.org and get a tax receipt — EcoDues never touches your money and never charges you automatically.
        </p>
      </div>

      <Separator />

      <div>
        <Label className="mb-3 block">Appearance</Label>
        <div className="flex gap-2">
          {themes.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors
                ${theme === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
