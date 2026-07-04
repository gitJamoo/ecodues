export interface ParsedStatement {
  spendUsd: number;
  inputTokens: number;
  outputTokens: number;
  confidence: "high" | "low";
  notes: string[];
}

// Extracts spend and token counts from free-form pasted dashboard text.
// Handles most common formats from OpenAI, Anthropic, OpenRouter, Google dashboards.
export function parseStatement(text: string): ParsedStatement | null {
  if (!text.trim()) return null;

  const notes: string[] = [];
  let spendUsd = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  // ---- Dollar amounts ----
  // Match "$12.34", "$1,234.56", "12.34 USD", "USD 12.34"
  const dollarMatches = [
    ...text.matchAll(/\$\s*([\d,]+\.?\d*)/g),
    ...text.matchAll(/([\d,]+\.?\d*)\s*USD/gi),
    ...text.matchAll(/USD\s*([\d,]+\.?\d*)/gi),
  ];
  const amounts = dollarMatches
    .map(m => parseFloat(m[1].replace(/,/g, "")))
    .filter(n => !isNaN(n) && n > 0 && n < 10_000);

  if (amounts.length > 0) {
    // Use the largest single dollar amount as total spend
    spendUsd = Math.max(...amounts);
    notes.push(`Detected spend: $${spendUsd.toFixed(2)}`);
  }

  // ---- Token counts ----
  // "1,234,567 tokens", "1.2M tokens", "1.2M input tokens", "350K output tokens"
  const tokenPatterns: Array<[RegExp, "input" | "output" | "total"]> = [
    [/([\d,.]+)\s*[Mm]\s*(input|prompt)\s*tokens?/i,  "input"],
    [/([\d,.]+)\s*[Mm]\s*(output|completion)\s*tokens?/i, "output"],
    [/([\d,.]+)\s*[Kk]\s*(input|prompt)\s*tokens?/i,  "input"],
    [/([\d,.]+)\s*[Kk]\s*(output|completion)\s*tokens?/i, "output"],
    [/([\d,]+)\s*(input|prompt)\s*tokens?/i,           "input"],
    [/([\d,]+)\s*(output|completion)\s*tokens?/i,      "output"],
    [/([\d,.]+)\s*[Mm]\s*tokens?/i,                   "total"],
    [/([\d,.]+)\s*[Kk]\s*tokens?/i,                   "total"],
    [/([\d,]+)\s*tokens?/i,                            "total"],
  ];

  for (const [re, kind] of tokenPatterns) {
    const m = text.match(re);
    if (!m) continue;
    let n = parseFloat(m[1].replace(/,/g, ""));
    if (isNaN(n)) continue;
    // Scale K / M suffixes
    if (/[Mm]/.test(m[0].replace(m[1], "").slice(0, 3))) n *= 1_000_000;
    else if (/[Kk]/.test(m[0].replace(m[1], "").slice(0, 3))) n *= 1_000;

    if (kind === "input" && inputTokens === 0)  { inputTokens  = Math.round(n); notes.push(`Input tokens: ${inputTokens.toLocaleString()}`); }
    if (kind === "output" && outputTokens === 0) { outputTokens = Math.round(n); notes.push(`Output tokens: ${outputTokens.toLocaleString()}`); }
    if (kind === "total" && inputTokens === 0 && outputTokens === 0) {
      // Split total 75/25 input/output
      inputTokens  = Math.round(n * 0.75);
      outputTokens = Math.round(n * 0.25);
      notes.push(`Total tokens ${Math.round(n).toLocaleString()} → split 75% input / 25% output`);
    }
  }

  if (spendUsd === 0 && inputTokens === 0 && outputTokens === 0) return null;

  const confidence: "high" | "low" =
    (spendUsd > 0 || (inputTokens > 0 && outputTokens > 0)) ? "high" : "low";

  return { spendUsd, inputTokens, outputTokens, confidence, notes };
}
