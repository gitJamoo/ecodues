import { openrouter } from "./openrouter";
import { openai } from "./openai";
import { anthropic } from "./anthropic";
import { geminiManual } from "./stubs";
import { makeManualStub } from "./stubs";
import type { ProviderConnector, KnownProviderId, ProviderId } from "./types";

// Real connectors. Everything else falls through to a manual stub that always
// rejects API-key validation (so the UI never offers an API-key path we can't
// honor) and returns zero usage from the cron pull (tier + manual rows drive
// the numbers for those providers).
const REAL_CONNECTORS: Partial<Record<KnownProviderId, ProviderConnector>> = {
  openrouter,
  openai,
  anthropic,
  gemini: geminiManual,
};

export const connectorFor = (id: ProviderId): ProviderConnector =>
  REAL_CONNECTORS[id as KnownProviderId] ?? makeManualStub(id as KnownProviderId);

export type { ProviderId, KnownProviderId, ProviderConnector } from "./types";
