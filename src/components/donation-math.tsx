"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PUE,
  GRID_KG_CO2E_PER_KWH,
  SOCIAL_COST_USD_PER_TON_CO2E,
  MODEL_CLASS_PROFILES,
} from "@/lib/emissions/constants";
import { Calculator } from "lucide-react";

interface DonationMathProps {
  kwh: number;
  kgCo2e: number;
  damageUsd: number;
  multiplier: number;
  donationUsd: number;
  charityName: string;
}

const n = (v: number, d = 4) => v.toFixed(d).replace(/\.?0+$/, "") || "0";

function Step({ index, title, formula, result }: { index: number; title: string; formula: string; result: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
        {index}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5 break-words">{formula}</p>
        <p className="text-xs mt-0.5"><span className="text-muted-foreground">=</span> <span className="font-medium tabular-nums">{result}</span></p>
      </div>
    </div>
  );
}

export function DonationMath({ kwh, kgCo2e, damageUsd, multiplier, donationUsd, charityName }: DonationMathProps) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors" />
        }
      >
        <Calculator className="w-3 h-3" />
        See how your next donation is calculated
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How your next donation is calculated</DialogTitle>
          <DialogDescription>
            Every step of the chain from your usage this cycle to the {`$${donationUsd.toFixed(2)}`} suggestion.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Step
            index={1}
            title="Usage → energy"
            formula={`tokens × Wh/token (by model class) × ${PUE} PUE`}
            result={`${n(kwh)} kWh`}
          />
          <Step
            index={2}
            title="Energy → emissions"
            formula={`${n(kwh)} kWh × ${GRID_KG_CO2E_PER_KWH} kg CO₂e/kWh (US grid avg)`}
            result={`${n(kgCo2e)} kg CO₂e`}
          />
          <Step
            index={3}
            title="Emissions → climate damage"
            formula={`${n(kgCo2e)} kg ÷ 1000 × $${SOCIAL_COST_USD_PER_TON_CO2E}/tonne (EPA social cost of carbon)`}
            result={`$${n(damageUsd)}`}
          />
          <Step
            index={4}
            title="Damage → your donation"
            formula={`$${n(damageUsd)} × ${multiplier}× multiplier, rounded up to the cent`}
            result={`$${donationUsd.toFixed(2)} to ${charityName}`}
          />
        </div>

        <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            Per-token energy by model class: small {MODEL_CLASS_PROFILES.small.whPerOutputToken} Wh ·
            medium {MODEL_CLASS_PROFILES.medium.whPerOutputToken} Wh ·
            large {MODEL_CLASS_PROFILES.large.whPerOutputToken} Wh ·
            frontier {MODEL_CLASS_PROFILES.frontier.whPerOutputToken} Wh (per output token; input tokens count at 10%).
            Every constant is cited on the{" "}
            <Link href="/methodology" className="underline underline-offset-2">methodology page</Link>.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
