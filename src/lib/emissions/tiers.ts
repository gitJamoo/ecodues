import type { ModelClass } from "./constants";
import type { KnownProviderId } from "../providers/types";

export interface TierEstimate {
  id: string;
  provider: KnownProviderId;
  label: string;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
  modelClass: ModelClass;
}

const M = 1_000_000;

// Monthly token estimates per consumer subscription plan.
// Sources: provider docs, published usage studies, and reasoned bounds when
// vendors don't publish numbers. Numbers are order-of-magnitude, not audited —
// the tier estimate is the least-precise usage input we accept, hence the
// heavy multiplier (2×) sitting on top of it in donation math.
export const TIER_ESTIMATES: TierEstimate[] = [
  // ── OpenAI / ChatGPT ──
  { id: "chatgpt_free",    provider: "openai",    label: "ChatGPT Free",    monthlyInputTokens: 0.4 * M, monthlyOutputTokens: 0.15 * M, modelClass: "small" },
  { id: "chatgpt_plus",    provider: "openai",    label: "ChatGPT Plus ($20)", monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
  { id: "chatgpt_pro",     provider: "openai",    label: "ChatGPT Pro ($200)", monthlyInputTokens: 4 * M,   monthlyOutputTokens: 1.5 * M,  modelClass: "frontier" },
  { id: "chatgpt_team",    provider: "openai",    label: "ChatGPT Team (per seat)", monthlyInputTokens: 2 * M, monthlyOutputTokens: 0.7 * M, modelClass: "medium" },

  // ── Anthropic / Claude ──
  { id: "claude_pro",      provider: "anthropic", label: "Claude Pro ($20)", monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
  { id: "claude_max_100",  provider: "anthropic", label: "Claude Max ($100)", monthlyInputTokens: 5 * M,  monthlyOutputTokens: 2 * M,    modelClass: "large" },
  { id: "claude_max_200",  provider: "anthropic", label: "Claude Max ($200)", monthlyInputTokens: 12 * M, monthlyOutputTokens: 4.5 * M,  modelClass: "frontier" },

  // ── Google Gemini ──
  { id: "gemini_free",     provider: "gemini",    label: "Gemini Free",     monthlyInputTokens: 0.4 * M, monthlyOutputTokens: 0.15 * M, modelClass: "small" },
  { id: "gemini_advanced", provider: "gemini",    label: "Google AI Pro ($20)", monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
  { id: "gemini_ultra",    provider: "gemini",    label: "Google AI Ultra ($250)", monthlyInputTokens: 6 * M, monthlyOutputTokens: 2 * M, modelClass: "frontier" },

  // ── Coding assistants ──
  { id: "copilot_individual", provider: "github_copilot", label: "GitHub Copilot ($10)",  monthlyInputTokens: 8 * M,  monthlyOutputTokens: 1 * M,  modelClass: "medium" },
  { id: "copilot_business",   provider: "github_copilot", label: "Copilot Business ($19)", monthlyInputTokens: 12 * M, monthlyOutputTokens: 1.5 * M, modelClass: "medium" },
  { id: "copilot_pro",        provider: "github_copilot", label: "Copilot Pro ($39)",     monthlyInputTokens: 20 * M, monthlyOutputTokens: 2.5 * M, modelClass: "large" },
  { id: "cursor_hobby",       provider: "cursor",         label: "Cursor Hobby (free)",  monthlyInputTokens: 5 * M,   monthlyOutputTokens: 0.5 * M, modelClass: "medium" },
  { id: "cursor_pro",         provider: "cursor",         label: "Cursor Pro ($20)",     monthlyInputTokens: 25 * M,  monthlyOutputTokens: 3 * M,   modelClass: "large" },
  { id: "cursor_business",    provider: "cursor",         label: "Cursor Business ($40)", monthlyInputTokens: 40 * M, monthlyOutputTokens: 5 * M,  modelClass: "large" },
  { id: "windsurf_pro",       provider: "windsurf",       label: "Windsurf Pro ($15)",   monthlyInputTokens: 20 * M,  monthlyOutputTokens: 2.5 * M, modelClass: "large" },
  { id: "windsurf_ultimate",  provider: "windsurf",       label: "Windsurf Ultimate ($60)", monthlyInputTokens: 60 * M, monthlyOutputTokens: 7 * M, modelClass: "frontier" },
  { id: "replit_ai_core",     provider: "replit_ai",      label: "Replit Core ($20)",    monthlyInputTokens: 8 * M,   monthlyOutputTokens: 1 * M,   modelClass: "medium" },
  { id: "v0_premium",         provider: "v0",             label: "v0 Premium ($20)",     monthlyInputTokens: 5 * M,   monthlyOutputTokens: 1.5 * M, modelClass: "large" },

  // ── Search & assistants ──
  { id: "perplexity_free",    provider: "perplexity",     label: "Perplexity Free",      monthlyInputTokens: 0.5 * M, monthlyOutputTokens: 0.15 * M, modelClass: "medium" },
  { id: "perplexity_pro",     provider: "perplexity",     label: "Perplexity Pro ($20)", monthlyInputTokens: 3 * M,   monthlyOutputTokens: 0.8 * M,  modelClass: "large" },
  { id: "perplexity_max",     provider: "perplexity",     label: "Perplexity Max ($200)", monthlyInputTokens: 10 * M, monthlyOutputTokens: 3 * M,   modelClass: "frontier" },
  { id: "kagi_ultimate",      provider: "kagi",           label: "Kagi Ultimate ($25)",  monthlyInputTokens: 2 * M,   monthlyOutputTokens: 0.5 * M, modelClass: "large" },
  { id: "you_pro",            provider: "you",            label: "You.com Pro ($20)",    monthlyInputTokens: 1.5 * M, monthlyOutputTokens: 0.4 * M, modelClass: "medium" },

  // ── Poe (aggregator) ──
  { id: "poe_premium",        provider: "poe",            label: "Poe Premium ($20)",    monthlyInputTokens: 2 * M,   monthlyOutputTokens: 0.7 * M, modelClass: "large" },

  // ── Grok / X ──
  { id: "grok_free",          provider: "grok",           label: "Grok Free (X)",         monthlyInputTokens: 0.4 * M, monthlyOutputTokens: 0.15 * M, modelClass: "medium" },
  { id: "grok_premium",       provider: "grok",           label: "X Premium ($8)",        monthlyInputTokens: 1 * M,   monthlyOutputTokens: 0.3 * M, modelClass: "medium" },
  { id: "grok_premium_plus",  provider: "grok",           label: "X Premium+ ($40)",      monthlyInputTokens: 3 * M,   monthlyOutputTokens: 0.9 * M, modelClass: "large" },

  // ── Character.ai ──
  { id: "character_plus",     provider: "character_ai",   label: "Character.ai+ ($10)",  monthlyInputTokens: 3 * M,   monthlyOutputTokens: 1 * M,   modelClass: "medium" },

  // ── Meta AI (free but recurring usage) ──
  { id: "meta_ai_free",       provider: "meta_ai",        label: "Meta AI (WhatsApp/IG)", monthlyInputTokens: 0.3 * M, monthlyOutputTokens: 0.1 * M, modelClass: "medium" },

  // ── Anthropic Claude Team ──
  { id: "claude_team",        provider: "anthropic",      label: "Claude Team ($25/seat)", monthlyInputTokens: 3 * M,   monthlyOutputTokens: 1 * M,   modelClass: "medium" },

  // ── OpenAI ChatGPT Enterprise ──
  { id: "chatgpt_enterprise", provider: "openai",         label: "ChatGPT Enterprise", monthlyInputTokens: 5 * M,   monthlyOutputTokens: 1.8 * M, modelClass: "large" },

  // ── Microsoft 365 Copilot ──
  { id: "microsoft_copilot_personal", provider: "microsoft_copilot", label: "Copilot Personal ($20)", monthlyInputTokens: 1.5 * M, monthlyOutputTokens: 0.4 * M, modelClass: "medium" },
  { id: "microsoft_copilot_business", provider: "microsoft_copilot", label: "M365 Copilot ($30/seat)", monthlyInputTokens: 3 * M,   monthlyOutputTokens: 0.8 * M, modelClass: "medium" },

  // ── Notion AI ──
  { id: "notion_ai_bundled",  provider: "notion_ai",      label: "Notion AI (bundled with plan)", monthlyInputTokens: 0.8 * M, monthlyOutputTokens: 0.3 * M, modelClass: "medium" },
];

export const tierById = (id: string) => TIER_ESTIMATES.find(t => t.id === id.split(":")[0]);
