import { openrouter } from "./openrouter";
import { openaiStub, anthropicStub, geminiStub } from "./stubs";
import type { ProviderConnector, ProviderId } from "./types";

export const CONNECTORS: Record<ProviderId, ProviderConnector> = {
  openrouter,
  openai:    openaiStub,
  anthropic: anthropicStub,
  gemini:    geminiStub,
};

export const connectorFor = (id: ProviderId) => CONNECTORS[id];
export type { ProviderId, ProviderConnector } from "./types";
