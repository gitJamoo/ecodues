"use client";

import { cn } from "@/lib/utils";
// Import Mono directly to avoid the barrel re-exporting Avatar (which needs @lobehub/ui)
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import AnthropicMono from "@lobehub/icons/es/Anthropic/components/Mono";
import OpenRouterMono from "@lobehub/icons/es/OpenRouter/components/Mono";
import GeminiMono from "@lobehub/icons/es/Gemini/components/Mono";

interface ProviderLogoProps {
  provider: "openrouter" | "openai" | "anthropic" | "gemini";
  size?: number;
  className?: string;
}

// Brand bg/fg sourced from each provider's style.js constants
const PROVIDER_STYLES = {
  openai:     { bg: "#000000", fg: "#ffffff", border: false },
  anthropic:  { bg: "#F1F0E8", fg: "#141413", border: false },
  openrouter: { bg: "#6566F1", fg: "#ffffff", border: false },
  gemini:     { bg: "#ffffff", fg: "#4285F4", border: true  },
} as const;

const ICONS = {
  openai:     OpenAIMono,
  anthropic:  AnthropicMono,
  openrouter: OpenRouterMono,
  gemini:     GeminiMono,
};

export function ProviderLogo({ provider, size = 32, className }: ProviderLogoProps) {
  const style = PROVIDER_STYLES[provider];
  const Icon = ICONS[provider];

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        background: style.bg,
        color: style.fg,
        border: style.border ? "1px solid #e5e7eb" : undefined,
        flexShrink: 0,
      }}
    >
      <Icon size={size * 0.6} />
    </span>
  );
}
