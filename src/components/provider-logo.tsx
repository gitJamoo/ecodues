"use client";

import { cn } from "@/lib/utils";
// Mono = raw SVG path only, no @lobehub/ui or antd-style dependency
import OpenAI from "@lobehub/icons/es/OpenAI";
import Anthropic from "@lobehub/icons/es/Anthropic";
import OpenRouter from "@lobehub/icons/es/OpenRouter";
import Gemini from "@lobehub/icons/es/Gemini";

interface ProviderLogoProps {
  provider: "openrouter" | "openai" | "anthropic" | "gemini";
  size?: number;
  className?: string;
}

// Brand bg/fg sourced from each provider's style.js constants
const PROVIDER_STYLES = {
  openai:     { bg: "#000000", fg: "#ffffff" },
  anthropic:  { bg: "#F1F0E8", fg: "#141413" },
  openrouter: { bg: "#6566F1", fg: "#ffffff" },
  gemini:     { bg: "#ffffff", fg: "#4285F4", border: true },
} as const;

export function ProviderLogo({ provider, size = 32, className }: ProviderLogoProps) {
  const style = PROVIDER_STYLES[provider];
  const iconSize = size * 0.6;
  const radius = size * 0.2;

  // Each default export IS the Mono component (CompoundedIcon = typeof Mono & {...})
  const Icon = { openai: OpenAI, anthropic: Anthropic, openrouter: OpenRouter, gemini: Gemini }[provider];

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: style.bg,
        color: style.fg,
        border: "border" in style ? "1px solid #e5e7eb" : undefined,
        flexShrink: 0,
      }}
    >
      <Icon size={iconSize} />
    </span>
  );
}
