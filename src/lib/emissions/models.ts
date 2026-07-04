import type { ModelClass } from "./constants";

const PATTERNS: Array<[RegExp, ModelClass]> = [
  [/^chatgpt_pro$/, "frontier"],
  [/^claude_max$/, "large"],
  [/mini|flash|haiku|nano|lite|tiny|8b|9b|-7b/i, "small"],
  [/\bo1|\bo3|\bo4|deep-?research|-pro\b|reason/i, "frontier"],
  [/opus|gpt-4-turbo|gpt-4\.5|405b|ultra/i, "large"],
  [/gpt-4o|gpt-4\.1|sonnet|gemini.*pro|llama|mistral|deepseek|grok|qwen|command/i, "medium"],
];

export function classifyModel(model: string): ModelClass {
  for (const [re, cls] of PATTERNS) if (re.test(model)) return cls;
  return "medium";
}
