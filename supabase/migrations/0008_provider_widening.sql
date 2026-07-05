-- Open the provider field to any text so users can connect subscriptions or
-- log usage from any AI service (Copilot, Cursor, Perplexity, Groq, xAI, and
-- any freeform "other" entry). The TypeScript layer keeps a curated union of
-- known IDs for autocomplete; unknown values are handled as manual/tier.

alter table provider_connections drop constraint if exists provider_connections_provider_check;
