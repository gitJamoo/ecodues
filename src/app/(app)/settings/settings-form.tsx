"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiplierSlider } from "@/components/multiplier-slider";
import { CharityPicker } from "@/components/charity-picker";
import { saveSettings, deleteAccount } from "@/lib/actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DialogClose } from "@/components/ui/dialog";

interface Profile {
  display_name: string | null;
  multiplier: number;
  charity_id: string | null;
  email_opt_out: boolean | null;
  leaderboard_opt_in?: boolean | null;
}
interface Charity { id: string; name: string; description: string; category: string; url?: string; min_donation_usd?: number }

export function SettingsForm({ profile, charities, totalDamageUsd, tabUsd }: {
  profile: Profile | null;
  charities: Charity[];
  totalDamageUsd?: number;
  tabUsd?: number;
}) {
  const [name, setName] = useState(profile?.display_name ?? "");
  const [multiplier, setMultiplier] = useState(Number(profile?.multiplier ?? 2));
  const [charityId, setCharityId] = useState<string | null>(profile?.charity_id ?? null);
  const [emailOptOut, setEmailOptOut] = useState(profile?.email_opt_out ?? false);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(profile?.leaderboard_opt_in ?? false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { theme, setTheme } = useTheme();

  async function handleSave() {
    setSaving(true);
    await saveSettings({ displayName: name, multiplier, charityId: charityId ?? undefined, emailOptOut, leaderboardOptIn });
    setSaving(false);
    toast.success("Settings saved");
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await deleteAccount();
    if (res && "error" in res) {
      toast.error(res.error as string);
      setDeleting(false);
    }
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
        <CharityPicker charities={charities} value={charityId} onChange={setCharityId} tabUsd={tabUsd} />
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

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="mb-0.5 block">Email notifications</Label>
          <p className="text-sm text-muted-foreground">Monthly donation reminders and key-error alerts</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!emailOptOut}
          onClick={() => setEmailOptOut(!emailOptOut)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!emailOptOut ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${!emailOptOut ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
        </button>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="mb-0.5 block">Appear on the leaderboard</Label>
          <p className="text-sm text-muted-foreground">Show your display name and donation totals on the public community page</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={leaderboardOptIn}
          onClick={() => setLeaderboardOptIn(!leaderboardOptIn)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${leaderboardOptIn ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${leaderboardOptIn ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
        </button>
      </div>

      <Separator />

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving…" : "Save settings"}
      </Button>

      <Separator />

      <div>
        <Label className="mb-1 block text-destructive">Danger zone</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          Delete account
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account, all usage records, emission estimates, and donation history.
              There is no undo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Deleting…" : "Yes, delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
