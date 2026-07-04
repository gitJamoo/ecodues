"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  className,
  disabled,
}: SliderProps) {
  const val = value?.[0] ?? defaultValue?.[0] ?? min;
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  // Offset corrects thumb position so it stays within the track at both ends
  const thumbOffset = `calc(${pct}% + ${(50 - pct) * 0.16}px)`;

  return (
    <div className={cn("relative flex h-5 w-full select-none items-center", className)}>
      {/* Track */}
      <div className="pointer-events-none absolute h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${pct}%` }} />
      </div>

      {/* Thumb (visual only — pointer-events off so input handles interaction) */}
      <div
        aria-hidden
        className="pointer-events-none absolute size-4 -translate-x-1/2 rounded-full border-2 border-primary bg-white shadow transition-shadow"
        style={{ left: thumbOffset }}
      />

      {/* Native input handles all interaction */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={e => onValueChange?.([Number(e.target.value)])}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </div>
  );
}

export { Slider };
