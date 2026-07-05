import type { KnownProviderId, ProviderConnector } from "./types";

// Google Gemini has no per-project usage API. This "connector" only exists so
// the UI has a provider entry — users log Gemini usage via manual entry / paste-parse.
// Any attempt to connect an API key is rejected with a helpful message.
export const geminiManual: ProviderConnector = {
  id: "gemini",
  label: "Google Gemini",
  isStub: true,
  validateKey: async () => false,
  fetchMonthlyUsage: async () => [],
};

// Generic manual-only stub for any provider that has no reliable usage-pull API
// via a normal user key (Groq, Together, DeepSeek, xAI, Perplexity, etc.).
// The cron still walks the connection, gets zero rows, and moves on — the tier
// or manual usage rows already sitting in `usage_records` drive the numbers.
export function makeManualStub(id: KnownProviderId): ProviderConnector {
  return {
    id,
    label: id,
    isStub: true,
    validateKey: async () => false,
    fetchMonthlyUsage: async () => [],
  };
}
