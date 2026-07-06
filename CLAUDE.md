# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Turbopack) at localhost:3000
npm run build    # production build
npm run lint     # eslint
npm test         # vitest suite (emissions engine, cycle math, unsubscribe tokens)
```

TypeScript is the other correctness check: `npx tsc --noEmit`.

**Dev mode** (bypasses Supabase auth entirely): set `DEV_MODE=true` in `.env.local`. All protected routes become accessible without a real session. Stub data is defined in `src/lib/dev-mode.ts`. Never set in production — it disables all auth.

## Architecture

### Data flow (ticker/threshold model)

```
User logs AI usage
  → stored in usage_records (provider, model, tokens, spend, period)
  → monthly cycle (cron /api/cron/monthly or manual) runs buildCycle()
  → emits emission_estimates (kWh, kg CO₂e, damage_usd)
  → donation_ledger row (damage × multiplier, status "accrued")
  → profiles.pending_donation_usd (the "tab") accrues the delta
  → when tab ≥ charity.min_donation_usd, cron emails a checkout link
  → user pays on PayPal Giving Fund / Every.org; logPayment() records it
    in donation_payments and decrements the tab
```

The core calculation is **pure and provider-agnostic** — `buildCycle()` in `src/lib/cycle.ts` takes `UsageRecordLike[]` and a multiplier, calls the emissions engine, and returns totals. No side effects.

### Emissions engine (`src/lib/emissions/`)

- `constants.ts` — all cited physical constants (PUE, grid intensity, SCC). Change constants here; nothing else needs updating.
- `models.ts` — `classifyModel(modelId)` maps any model string → `ModelClass` via ordered regex patterns. Pattern ORDER matters (e.g. the gemini-pro rule must outrank the generic `-pro` frontier rule). Tests in `models.test.ts` lock the behavior.
- `engine.ts` — `estimateFromTokens()`, `estimateFromSpend()`, `donationForDamage()`. Pure functions, no I/O.
- `tiers.ts` — `TIER_ESTIMATES`: hardcoded monthly token estimates per consumer subscription plan. `tier_id` stored in `provider_connections` can be `"chatgpt_plus"` or `"chatgpt_plus:75"` (the `:75` means 75% usage scaling, parsed in `cycle.ts`).

### Provider connectors (`src/lib/providers/`)

All connectors implement `ProviderConnector` from `types.ts`. **Real connectors**: OpenRouter (`/api/v1/activity`), OpenAI (Admin API key `sk-admin-…`), Anthropic (Admin key `sk-ant-admin01-…`). Everything else (Gemini, Copilot, Cursor, Groq, hyperscalers, …) is manual/tier-only via `makeManualStub` in `stubs.ts` — `validateKey` always rejects so the UI never offers an API-key path we can't honor. `catalog.ts` is the UI-facing metadata for 30+ providers (dashboard URLs, hints, tier availability). The registry in `index.ts` falls through to a manual stub for unknown ids.

### Auth & data access

- `src/proxy.ts` — Next.js 16 middleware equivalent (replaces deprecated `middleware.ts`). Redirects unauthenticated users away from protected routes.
- `src/lib/supabase/server.ts` — SSR client. `src/lib/supabase/admin.ts` — service-role client (crons, webhooks, unsubscribe, account deletion).
- `src/lib/data.ts` — `getDashboardData()`, `getConnections()`, leaderboard fetchers. Short-circuit to stub data when `DEV_MODE=true`.
- `src/lib/actions.ts` — all `"use server"` mutations. Each calls `requireUser()` first, then a best-effort in-memory rate limit (`src/lib/rate-limit.ts`).

### Crons & API routes

- `/api/cron/monthly` (1st, 00:00 UTC) — runs cycles for all onboarded users, sends threshold/recap/quarterly emails. `/api/cron/health-check` (Sun 12:00 UTC) — validates stored API keys, emails on breakage. Both require `Authorization: Bearer $CRON_SECRET` and export `maxDuration = 300`.
- `/api/email/unsubscribe` — one-click opt-out via HMAC token (`src/lib/unsubscribe.ts`, keyed by `ENCRYPTION_KEY`). All recurring emails carry `List-Unsubscribe` headers.
- `/api/export` — authenticated CSV export (`?type=usage|estimates|ledger|payments`).
- `/api/share-card` — public `next/og` image generator for the "Share your impact" dialog; treats all query params as hostile.
- `/api/webhooks/every-org` — inert (503) until `EVERY_ORG_WEBHOOK_TOKEN` is set; for the future Every.org Partner API.

### Database schema (`supabase/migrations/`)

Tables: `charities`, `profiles`, `provider_connections`, `usage_records`, `emission_estimates`, `donation_ledger`, `donation_payments`. RLS on all; users only see their own rows. `handle_new_user` trigger creates a `profiles` row on signup. Leaderboard reads go through `security definer` functions (`get_leaderboard` — filtered to `leaderboard_opt_in`, `get_charity_totals`), aggregating `donation_payments`. Migrations are applied to prod via the Supabase MCP `apply_migration` (tracked in the migrations ledger) — keep the local `.sql` files in sync with what was applied.

### Key implicit contracts

- **`DEV_PROFILE.onboarded_at`** must be non-null or the dashboard redirects to `/onboarding`.
- **`ENCRYPTION_KEY`** must be exactly 64 hex chars (32 bytes) — `encryptSecret()` in `src/lib/crypto.ts` throws otherwise. Unsubscribe tokens are HMACs keyed by it, so rotating it breaks outstanding unsubscribe links.
- **`donation_ledger.status`** vocabulary is `simulated | accrued | partially_paid | paid` (check constraint from migration 0005). Do not write `pending` or `completed`.
- **Slider component** (`src/components/ui/slider.tsx`) is a custom native `<input type="range">` wrapper — not the Base UI component. It expects `value: number[]` and `onValueChange: (v: number[]) => void`.
- **`CRON_SECRET`** must have no leading/trailing whitespace — Vercel rejects it at build time if it does.
- New columns on `profiles` must also be added to `DEV_PROFILE` in `src/lib/dev-mode.ts` or dev mode breaks.

### Production swap points

- **Every.org Partner API**: when partner keys arrive, wire `createCheckout()` in `src/lib/every-org.ts` into the cron email path and set `EVERY_ORG_WEBHOOK_TOKEN` to activate the webhook.
- **Google OAuth**: the login button is disabled ("coming soon") — register the Google Cloud OAuth app, add credentials in the Supabase dashboard, then re-enable the button in `src/app/login/page.tsx`.
- **Real provider connectors**: add new files following the `openrouter.ts` / `anthropic.ts` pattern and register in `src/lib/providers/index.ts`.
