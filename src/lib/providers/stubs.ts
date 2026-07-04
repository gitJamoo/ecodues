import type { ProviderConnector } from "./types";

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
