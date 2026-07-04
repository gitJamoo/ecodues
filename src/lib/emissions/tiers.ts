import type { ModelClass } from "./constants";

export interface TierEstimate {
  id: string;
  provider: "openai" | "anthropic" | "gemini";
  label: string;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
  modelClass: ModelClass;
}

const M = 1_000_000;

export const TIER_ESTIMATES: TierEstimate[] = [
  { id: "chatgpt_free",    provider: "openai",    label: "ChatGPT Free",    monthlyInputTokens: 0.4 * M, monthlyOutputTokens: 0.15 * M, modelClass: "small" },
  { id: "chatgpt_plus",    provider: "openai",    label: "ChatGPT Plus",    monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
  { id: "chatgpt_pro",     provider: "openai",    label: "ChatGPT Pro",     monthlyInputTokens: 4 * M,   monthlyOutputTokens: 1.5 * M,  modelClass: "frontier" },
  { id: "claude_pro",      provider: "anthropic", label: "Claude Pro",      monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
  { id: "claude_max",      provider: "anthropic", label: "Claude Max",      monthlyInputTokens: 5 * M,   monthlyOutputTokens: 2 * M,    modelClass: "large" },
  { id: "gemini_free",     provider: "gemini",    label: "Gemini Free",     monthlyInputTokens: 0.4 * M, monthlyOutputTokens: 0.15 * M, modelClass: "small" },
  { id: "gemini_advanced", provider: "gemini",    label: "Google AI Pro",   monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
];

export const tierById = (id: string) => TIER_ESTIMATES.find(t => t.id === id.split(":")[0]);
