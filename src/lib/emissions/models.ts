import type { ModelClass } from "./constants";

const PATTERNS: Array<[RegExp, ModelClass]> = [
  [/^chatgpt_pro$/, "frontier"],
  [/^claude_max$/, "large"],
  // Reasoning "mini" variants (o1-mini, o3-mini, o4-mini) run at medium cost despite the name.
  // \bo ensures this only matches model-name tokens starting at a word boundary,
  // so "gpt-4o-mini" (where the 'o' is mid-token) still falls through to the small rule.
  [/\bo[1-4]-mini/i, "medium"],
  // \bmini: word boundary so "gemini" doesn't match the "mini" substring
  [/\bmini|flash|haiku|nano|lite|tiny|8b|9b|-7b/i, "small"],
  // Embedding models produce no output tokens and have very low energy per token
  [/embed/i, "small"],
  // Gemini Pro is medium-class — must outrank the generic "-pro" frontier rule
  [/gemini.*pro/i, "medium"],
  [/\bo1|\bo3|\bo4|deep-?research|-pro\b|reason/i, "frontier"],
  // Specific large models — must precede the generic medium catch-all below
  [/deepseek.*(r\d|v[23])/i, "large"],   // R1/V2/V3 are 600B+ MoE models
  [/mistral.*large/i, "large"],
  [/llama.*maverick/i, "large"],          // Llama 4 Maverick (400B MoE)
  [/opus|gpt-4-turbo|gpt-4\.5|405b|ultra/i, "large"],
  [/gpt-4o|gpt-4\.1|sonnet|gemini.*pro|llama|mistral|deepseek|grok|qwen|command/i, "medium"],
];

export function classifyModel(model: string): ModelClass {
  for (const [re, cls] of PATTERNS) if (re.test(model)) return cls;
  return "medium";
}
