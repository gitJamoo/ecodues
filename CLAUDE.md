# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (Turbopack) at localhost:3000
npm run build    # production build
npm run lint     # eslint
```

No test suite exists yet. TypeScript is the primary correctness check: `npx tsc --noEmit`.

**Dev mode** (bypasses Supabase auth entirely): set `DEV_MODE=true` in `.env.local`. All protected routes become accessible without a real session. Stub data is defined in `src/lib/dev-mode.ts`.

## Architecture

### Data flow

```
User logs AI usage
  → stored in usage_records (provider, model, tokens, spend, period)
  → monthly cycle (cron or manual) runs buildCycle()
  → emits emission_estimates (kWh, kg CO₂e, damage_usd)
  → donation_ledger row written (damage × multiplier = donation_usd, status "simulated")
```

The entire calculation is **pure and provider-agnostic** — `buildCycle()` in `src/lib/cycle.ts` takes `UsageRecordLike[]` and a multiplier, calls the emissions engine, and returns totals. No side effects.

### Emissions engine (`src/lib/emissions/`)

- `constants.ts` — all cited physical constants (PUE, grid intensity, SCC). Change constants here; nothing else needs updating.
- `models.ts` — `classifyModel(modelId)` maps any model string → `ModelClass` via ordered regex patterns. Add new model patterns here.
- `engine.ts` — `estimateFromTokens()`, `estimateFromSpend()`, `donationForDamage()`. Pure functions, no I/O.
- `tiers.ts` — `TIER_ESTIMATES`: hardcoded monthly token estimates per consumer subscription plan. `tier_id` stored in `provider_connections` can be `"chatgpt_plus"` or `"chatgpt_plus:75"` (the `:75` means 75% usage scaling, parsed in `cycle.ts`).

### Provider connectors (`src/lib/providers/`)

All connectors implement `ProviderConnector` from `types.ts`. OpenRouter is real (hits `/api/v1/activity`). OpenAI, Anthropic, Gemini are deterministic stubs (`stubs.ts`) — they return seeded fake data. The registry in `index.ts` is keyed by `ProviderId`.

### Auth & data access

- `src/proxy.ts` — Next.js 16 middleware equivalent (replaces deprecated `middleware.ts`). Redirects unauthenticated users away from protected routes.
- `src/lib/supabase/server.ts` — SSR Supabase client (server components/actions).
- `src/lib/data.ts` — `getDashboardData()`, `getConnections()`. Both short-circuit to stub data when `DEV_MODE=true`.
- `src/lib/actions.ts` — all `"use server"` mutations. Each action calls `requireUser()` first (also short-circuits in dev mode).

### Database schema (`supabase/migrations/0001_init.sql`)

Five tables: `charities`, `profiles`, `provider_connections`, `usage_records`, `emission_estimates`, `donation_ledger`. RLS is enabled on all; users can only read/write their own rows. A `handle_new_user` trigger auto-creates a `profiles` row on signup. Run migrations by pasting SQL into the Supabase dashboard SQL editor.

### Key implicit contracts

- **`DEV_PROFILE.onboarded_at`** must be non-null or the dashboard redirects to `/onboarding` (line 12 of `dashboard/page.tsx`).
- **`ENCRYPTION_KEY`** must be exactly 64 hex chars (32 bytes) — `encryptSecret()` in `src/lib/crypto.ts` will throw otherwise.
- **Slider component** (`src/components/ui/slider.tsx`) is a custom native `<input type="range">` wrapper — not the Base UI component. It expects `value: number[]` and `onValueChange: (v: number[]) => void`.
- **`CRON_SECRET`** must have no leading/trailing whitespace — Vercel rejects it at build time if it does.

### Production swap points

- **Donations**: `src/lib/cycle.ts` near the end — replace the `donation_ledger` upsert block with an Every.org Partner API call.
- **OAuth**: No code changes needed — register GitHub/Google OAuth apps and add credentials in Supabase dashboard (see `REMINDERS-TODO.md`).
- **Real provider connectors**: Implement `validateKey` + `fetchMonthlyUsage` in `src/lib/providers/stubs.ts` or add new files following the `openrouter.ts` pattern.
