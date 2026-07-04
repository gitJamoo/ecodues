import { openrouter } from "./openrouter";
import { openai } from "./openai";
import { anthropic } from "./anthropic";
import { geminiManual } from "./stubs";
import type { ProviderConnector, ProviderId } from "./types";

export const CONNECTORS: Record<ProviderId, ProviderConnector> = {
  openrouter,
  openai,
  anthropic,
  gemini: geminiManual,
};

export const connectorFor = (id: ProviderId) => CONNECTORS[id];
export type { ProviderId, ProviderConnector } from "./types";
