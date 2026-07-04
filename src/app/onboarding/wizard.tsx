"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProviderConnect } from "@/components/provider-connect";
import { CharityPicker } from "@/components/charity-picker";
import { MultiplierSlider } from "@/components/multiplier-slider";
import { CardFormStub } from "@/components/card-form-stub";
import { saveSettings, completeOnboarding } from "@/lib/actions";
import { toast } from "sonner";
import { usd } from "@/lib/format";

const STEPS = ["Connect usage", "Charity & multiplier", "Add card"];

interface Charity { id: string; name: string; description: string; category: string }

export function OnboardingWizard({ charities }: { charities: Charity[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [charityId, setCharityId] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(2);
  const [finishing, setFinishing] = useState(false);

  async function handleStep2Continue() {
    if (!charityId) { toast.error("Pick a charity first"); return; }
    await saveSettings({ charityId, multiplier });
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
    <div className="min-h-screen bg-muted flex items-start justify-center px-4 py-16">
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
              <span className={`text-xs ${i === step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
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
              <ProviderConnect connections={[]} />
              <Button className="w-full mt-6" onClick={() => setStep(1)}>Continue</Button>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-semibold text-base mb-1">Choose your charity & multiplier</h2>
              <p className="text-sm text-muted-foreground mb-5">Pick where your donations go and how much you want to offset.</p>
              <div className="space-y-6">
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
              <h2 className="font-semibold text-base mb-1">Add a payment method</h2>
              <p className="text-sm text-muted-foreground mb-5">Used for the monthly donation on the 1st of each month.</p>
              <CardFormStub onDone={handleFinish} />
              <div className="flex gap-3 mt-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 text-sm">Back</Button>
                <Button variant="ghost" onClick={handleFinish} disabled={finishing} className="flex-1 text-sm text-muted-foreground">
                  {finishing ? "Setting up…" : "Skip for now"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
