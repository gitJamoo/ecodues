export type ProviderId = "openrouter" | "openai" | "anthropic" | "gemini";
export interface Period { year: number; month: number }
export interface MonthlyUsage { model: string; inputTokens: number; outputTokens: number; spendUsd: number }
export interface ProviderConnector {
  id: ProviderId;
  label: string;
  isStub: boolean;
  validateKey(apiKey: string): Promise<boolean>;
  fetchMonthlyUsage(apiKey: string, period: Period): Promise<MonthlyUsage[]>;
}
