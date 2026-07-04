"use client";

import { Slider } from "@/components/ui/slider";
import { donationForDamage } from "@/lib/emissions/engine";
import { usd } from "@/lib/format";

interface MultiplierSliderProps {
  value: number;
  onChange: (v: number) => void;
  /** If provided, shows a live "damage → donation" calculation */
  damageUsd?: number;
}

const LABEL: Record<string, string> = {
  "1":    "Net zero",
  "1.25": "Just above zero",
  "1.5":  "Slightly net-positive",
  "1.75": "Moderately net-positive",
  "2":    "Net-positive (default)",
  "2.25": "Well net-positive",
  "2.5":  "Strongly net-positive",
  "2.75": "Very strongly net-positive",
  "3":    "Super net-positive",
};

export function MultiplierSlider({ value: rawValue, onChange, damageUsd }: MultiplierSliderProps) {
  const value = typeof rawValue === "number" && !isNaN(rawValue) ? rawValue : 2;
  const label = LABEL[value.toFixed(2)] ?? LABEL[String(value)] ?? "Net-positive";

  const donationPreview = damageUsd != null && damageUsd > 0
    ? donationForDamage(damageUsd, value)
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <span className="text-4xl font-semibold tabular-nums text-primary">{value.toFixed(2)}×</span>
        <span className="text-sm text-muted-foreground mb-1">{label}</span>
      </div>

      <Slider
        min={1} max={3} step={0.25}
        value={[value]}
        onValueChange={(vals) => onChange((vals as number[])[0])}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1× (net zero)</span>
        <span>2× (default)</span>
        <span>3× (max)</span>
      </div>

      {/* Live calculation preview */}
      {donationPreview != null ? (
        <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2.5 text-sm flex items-center justify-between">
          <span className="text-muted-foreground">
            {usd(damageUsd!)} damage&nbsp;×&nbsp;{value.toFixed(2)}&nbsp;=
          </span>
          <span className="font-semibold text-primary">{usd(donationPreview)}/mo</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Add usage data to see your estimated monthly donation.
        </p>
      )}
    </div>
  );
}
