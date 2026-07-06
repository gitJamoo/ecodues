"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderConnect } from "@/components/provider-connect";
import { BackfillUsage } from "@/components/backfill-usage";
import { CharityPicker } from "@/components/charity-picker";
import { MultiplierSlider } from "@/components/multiplier-slider";
import { saveSettings, completeOnboarding } from "@/lib/actions";
import { toast } from "sonner";
import { usd } from "@/lib/format";
import { Mail, ExternalLink, ShieldCheck } from "lucide-react";

const STEPS = ["Connect usage", "Charity & multiplier", "How you'll pay"];

interface Charity {
  id: string;
  name: string;
  description: string;
  category: string;
  paypalGivingFundUrl?: string | null;
  paypal_giving_fund_url?: string | null;
}

function isPpgf(c: Charity): boolean {
  return !!(c.paypalGivingFundUrl ?? c.paypal_giving_fund_url);
}

export function OnboardingWizard({ charities }: { charities: Charity[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Default to the first PPGF-enrolled charity so new users land on the
  // premier (100% pass-through) option. Fall back to whatever's first.
  const defaultCharityId = charities.find(isPpgf)?.id ?? charities[0]?.id ?? null;
  const [charityId, setCharityId] = useState<string | null>(defaultCharityId);
  const [multiplier, setMultiplier] = useState(2);
  const [username, setUsername] = useState("");
  const [finishing, setFinishing] = useState(false);

  async function handleStep2Continue() {
    if (!username.trim()) { toast.error("Pick a username first"); return; }
    if (!charityId) { toast.error("Pick a charity first"); return; }
    await saveSettings({ displayName: username.trim(), charityId, multiplier });
    setStep(2);
  }

  async function handleFinish() {
    setFinishing(true);
    const result = await completeOnboarding();
    setFinishing(false);
    if (result.ok) {
      toast.success(
        result.donationUsd > 0
          ? `You're in! First simulated donation: ${usd(result.donationUsd)}`
          : "You're in! Add some usage and run a cycle to see your impact.",
      );
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-start justify-center px-4 py-8 sm:py-16">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                i < step ? "bg-primary text-white"
                : i === step ? "bg-primary text-white"
                : "bg-border text-muted-foreground"
              }`}>{i + 1}</div>
              <span className={`hidden sm:inline text-xs ${i === step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
          {step === 0 && (
            <>
              <h2 className="font-semibold text-base mb-1">Tell us about your AI usage</h2>
              <p className="text-sm text-muted-foreground mb-5">
                No API key needed — you can paste your usage dashboard text, type in last month&apos;s spend, or pick your subscription plan. We&apos;ll handle the math.
              </p>
              <ProviderConnect connections={[]} periodMode="previous" />
              <div className="mt-4">
                <BackfillUsage />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: a subscription plan above already covers last month — backfill the months before that.
              </p>
              <Button className="w-full mt-6" onClick={() => setStep(1)}>Continue</Button>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-semibold text-base mb-1">Choose your charity & multiplier</h2>
              <p className="text-sm text-muted-foreground mb-1">Pick where your donations go and how much you want to offset.</p>
              <p className="text-xs text-muted-foreground mb-5">
                Not sure? Just pick something — you can change your charity, multiplier, and everything else anytime in Settings.
              </p>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">Username</p>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. carbonjames"
                    maxLength={32}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Shown on the leaderboard (if you opt in) and your shareable impact card.
                  </p>
                </div>
                <CharityPicker charities={charities} value={charityId} onChange={setCharityId} />
                <div>
                  <p className="text-sm font-medium mb-3">Donation multiplier</p>
                  <MultiplierSlider value={multiplier} onChange={setMultiplier} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                <Button onClick={handleStep2Continue} className="flex-1">Continue</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-base mb-1">You&apos;ll get an email with a one-click checkout link</h2>
              <p className="text-sm text-muted-foreground mb-5">
                We accrue your monthly impact into a running tab. When it clears your charity&rsquo;s minimum,
                we email you a checkout link — PayPal Giving Fund (100% pass-through) when supported, Every.org otherwise.
                You click, you pay, you get a tax receipt. EcoDues never touches your money.
              </p>

              <ul className="space-y-3 text-sm mb-6">
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span><span className="font-medium">Monthly email.</span> Sent when your tab reaches the charity&rsquo;s minimum, with a one-click checkout button.</span>
                </li>
                <li className="flex items-start gap-3">
                  <ExternalLink className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span><span className="font-medium">100% delivered where possible.</span> PayPal Giving Fund covers all card fees for enrolled charities. <Link href="/how-donations-work" className="underline underline-offset-2">How this works →</Link></span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span><span className="font-medium">No auto-charges.</span> Nothing is billed automatically — you always choose whether to pay.</span>
                </li>
              </ul>

              <p className="text-xs text-muted-foreground mb-6">
                Change your mind later? Charity, multiplier, and usage sources all live in <span className="font-medium text-foreground">Settings</span>. Nothing here is permanent.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handleFinish} disabled={finishing} className="flex-1">
                  {finishing ? "Finishing…" : "Finish setup"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
