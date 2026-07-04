# Countervail — Design Spec

**Date:** 2026-07-03
**Status:** Approved by user (name: Countervail)

## One-liner

A web app where you sign in, connect your AI usage (provider API keys, subscription tier, or manual entry), see a research-grounded estimate of your inference footprint in kg CO₂e and dollars, and automatically donate **2× the damage** to a climate charity every month — making your AI use net-positive, not just net-zero.

## Goals (PoC scope)

1. Log in with real auth (Supabase: Google OAuth + email magic link).
2. Onboard in under 2 minutes: connect usage → pick charity → add card (stubbed UI).
3. Compute a defensible monthly footprint and dollar damage from usage data.
4. Show a Stripe-quality dashboard: footprint, trend, per-provider activity, donation ledger.
5. Simulate the monthly donation cycle end-to-end without real payments.

## Non-goals (PoC)

- Real payment collection (Every.org integration comes later; Lemon Squeezy is **not** suitable — it is a merchant of record for digital products and its terms don't cover donation facilitation).
- Real OpenAI / Anthropic / Gemini usage connectors (stubbed behind the same interface; OpenRouter is the one real connector).
- Native/mobile apps, teams/orgs, public profiles.

## Users

Two personas, both served from day one:

- **API developers** — have API keys, want measured data. Served by connector path.
- **Consumer subscribers** (ChatGPT Plus, Claude Pro, etc.) — no token data available. Served by tier-average estimates or manual entry.

## Architecture

- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**
- **Supabase**: auth + Postgres. API keys encrypted at rest (AES-256-GCM with a server-side secret; never sent to the client after entry).
- **Vercel-style deployment target**; monthly cycle as a cron route (PoC also exposes a manual "Run monthly cycle" button).

### Design language

Stripe's interface language with an eco palette: Inter font, generous whitespace, hairline borders, muted grays, one green accent. Minimal, clean, no gradients-and-glassmorphism noise.

### Data model (Supabase Postgres)

- `profiles` — user id, display name, multiplier (default 2.0), chosen charity id
- `provider_connections` — user id, provider (openrouter | openai | anthropic | gemini), kind (api_key | tier | manual), encrypted key or tier name, status
- `usage_records` — user id, provider, model, period (month), input_tokens, output_tokens, spend_usd, source (api | tier_estimate | manual)
- `emission_estimates` — usage_record id, kwh, kg_co2e, liters_water, damage_usd, methodology_version
- `donation_ledger` — user id, period, damage_usd, donation_usd (= damage × multiplier), charity id, status (simulated | pending | completed)
- `charities` — name, EIN/every.org slug, description, logo

### Usage input (three paths, all in onboarding AND dashboard)

1. **API keys** — user pastes a key; app polls the provider's usage endpoint monthly.
   - OpenRouter: real implementation (activity/credits API — simplest to integrate).
   - OpenAI / Anthropic / Gemini: same `ProviderConnector` interface, stub implementations returning realistic mock data, clearly labeled in the UI as "demo data" for the PoC.
2. **Subscription tier** — user selects e.g. "ChatGPT Plus"; footprint from published average-usage estimates per tier.
3. **Manual entry** — monthly spend ($) or token counts, per provider.

### Emissions engine (the credibility core)

A pure, dependency-free TypeScript module (`lib/emissions/`), unit-tested with Vitest:

```
kWh      = tokens × Wh_per_token(model_class) × PUE / 1000
kg CO₂e  = kWh × grid_intensity(kg/kWh)
damage $ = kg CO₂e / 1000 × social_cost_of_carbon($/tCO₂e)
donation = damage × multiplier (default 2×)
```

- Constants sourced from published research (Luccioni et al., Epoch AI estimates, EPA social cost of carbon ≈ $190/tCO₂e) and cited on a public **Methodology** page.
- Model classes (small / medium / large / frontier) map model names → Wh/token bands so new models don't break the engine.
- Water usage (liters) computed as a secondary stat.
- `methodology_version` stored per estimate so numbers remain auditable when constants update.

### Donations (stubbed for PoC)

- Charity picker seeded with ~6 climate charities (e.g. Clean Air Task Force, Climeworks-adjacent removal funds, Rainforest Foundation).
- Fake "add debit card" UI (Stripe-like card form, stores nothing but a masked placeholder).
- "Run monthly cycle" computes the period's damage, writes a `donation_ledger` row with status `simulated`, and shows it in the ledger: "Would donate $0.30 to Clean Air Task Force."
- Production path (documented, not built): Every.org Partner API — user → Every.org → charity; we never hold funds.

## Pages

1. **Landing** — one-screen pitch, methodology teaser, CTA.
2. **Login** — Supabase auth.
3. **Onboarding** (3 steps): connect usage → pick charity + multiplier → add card (stub) → done.
4. **Dashboard** — big "footprint this month" stat, dollar damage, donation preview, trend chart, per-provider activity table.
5. **Providers** — manage connections, add any of the three input types.
6. **Donations** — ledger of simulated/completed donations.
7. **Methodology** — public page with every constant, formula, and citation.
8. **Settings** — profile, multiplier, charity, delete account.

## Error handling

- Provider API failures: connection marked `error` with retry; dashboard shows last-known data with a staleness badge.
- Invalid API key on entry: validated with a live test call before saving.
- No usage data yet: empty states with clear next actions (Stripe-style).

## Testing

- Vitest unit tests for the emissions engine (per-model-class math, dollarization, multiplier, edge cases: zero usage, unknown model → default class).
- Everything else verified by running the app.

## Legal summary (research findings, not legal advice)

- **Donation-API route eliminates the hard problems.** Money flows user → Every.org (itself a 501(c)(3)) → charity. No custody of funds → no money-transmitter licensing, no state charitable-solicitation registrations, no donor-receipt obligations (Every.org issues receipts).
- **No nonprofit entity needed to launch.** An LLC (or nothing, pre-revenue) can operate a free tool that facilitates donations. Form your own 501(c)(3) later (Form 1023-EZ, $275 fee, ~2–6 months) only if you want grants or your own fund.
- **Lemon Squeezy is the wrong rail** for donations (digital-products merchant of record; ToS mismatch). Every.org now; Stripe direct later if ever needed.
- Auto-charging a card monthly requires clear consent UX and easy cancellation regardless of rail (FTC negative-option rule).

## Name

**Countervail** — "to offset with equal force" (here, double). Runner-ups considered: Twofold, Net Positive, Amends, Overcast. Branding is string-level and trivially renameable.
