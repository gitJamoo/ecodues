"use client";

import { Slider } from "@/components/ui/slider";

interface MultiplierSliderProps {
  value: number;
  onChange: (v: number) => void;
}

export function MultiplierSlider({ value, onChange }: MultiplierSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <span className="text-4xl font-semibold tabular-nums text-primary">{value.toFixed(2)}×</span>
        <span className="text-sm text-muted-foreground mb-1">
          {value === 1 ? "Net zero" : value <= 1.5 ? "Slightly net-positive" : value <= 2 ? "Net-positive" : "Super net-positive"}
        </span>
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
    </div>
  );
}
