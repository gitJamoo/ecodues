// Known provider IDs — the union hint is preserved for autocomplete, but the
// `& {}` trick lets `usage_records.provider` and free-form "other" entries
// also accept any string. The DB constraint on provider_connections.provider
// was widened in migration 0008_provider_widening.sql.
export type KnownProviderId =
  // Real API-key connectors
  | "openrouter"
  | "openai"
  | "anthropic"
  // Consumer subscriptions / tier-based
  | "gemini"
  | "github_copilot"
  | "cursor"
  | "windsurf"
  | "perplexity"
  | "poe"
  | "grok"
  | "kagi"
  | "you"
  | "meta_ai"
  | "character_ai"
  | "v0"
  | "replit_ai"
  // Manual / paste-only (no reliable regular-key usage endpoint)
  | "groq"
  | "together"
  | "fireworks"
  | "deepseek"
  | "mistral"
  | "cohere"
  | "xai_api"
  | "replicate"
  | "fal"
  | "huggingface"
  | "vertex_ai"
  | "azure_openai"
  | "aws_bedrock"
  | "ibm_watsonx"
  | "cerebras"
  | "sambanova"
  // Catch-all — user-typed provider name
  | "other";

export type ProviderId = KnownProviderId | (string & {});

export interface Period { year: number; month: number }
export interface MonthlyUsage { model: string; inputTokens: number; outputTokens: number; spendUsd: number }
export interface ProviderConnector {
  id: KnownProviderId;
  label: string;
  isStub: boolean;
  validateKey(apiKey: string): Promise<boolean>;
  fetchMonthlyUsage(apiKey: string, period: Period): Promise<MonthlyUsage[]>;
}
