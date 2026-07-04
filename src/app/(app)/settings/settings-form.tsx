"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiplierSlider } from "@/components/multiplier-slider";
import { CharityPicker } from "@/components/charity-picker";
import { CardFormStub } from "@/components/card-form-stub";
import { saveSettings } from "@/lib/actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface Profile {
  display_name: string | null;
  multiplier: number;
  charity_id: string | null;
  card_last4: string | null;
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

  async function handleSave() {
    setSaving(true);
    await saveSettings({ displayName: name, multiplier, charityId: charityId ?? undefined });
    setSaving(false);
    toast.success("Settings saved");
  }

  return (
    <div className="space-y-6 bg-white rounded-xl border border-border p-6">
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
        <Label className="mb-1 block">Payment method</Label>
        {profile?.card_last4 ? (
          <p className="text-sm text-muted-foreground mb-3">Card on file: •••• {profile.card_last4}</p>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">No card on file</p>
        )}
        <CardFormStub />
      </div>

      <Separator />

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
