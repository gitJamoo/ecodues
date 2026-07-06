# EcoDues

**Offset the climate damage of your AI usage.** EcoDues tallies your monthly AI usage across providers, estimates the energy, CO₂e, and social cost it caused using a [published methodology](https://ecodues.org/methodology), and nudges you to donate the offset (at a multiplier you choose) to vetted climate charities — via PayPal Giving Fund or Every.org. EcoDues never touches your money.

Live at **[ecodues.org](https://ecodues.org)**.

## How it works

1. **Connect** — link AI providers with an API key (OpenRouter, OpenAI, Anthropic admin keys), pick your subscription tier (ChatGPT Plus, Claude Pro, Copilot, Cursor, …), or log usage manually.
2. **We measure** — on the 1st of each month a cycle runs: usage → kWh → kg CO₂e → damage in USD (social cost of carbon).
3. **You donate** — damage × your multiplier accrues to your tab. When it crosses your charity's minimum, you get a one-click donation link. 100% goes to the charity via PayPal Giving Fund where available.

## Development

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys etc.
npm run dev                  # localhost:3000
npm test                     # vitest suite (emissions engine)
npm run build                # production build
npx tsc --noEmit             # type check
```

Set `DEV_MODE=true` in `.env.local` to bypass auth entirely and work with stub data (see `src/lib/dev-mode.ts`). Never set it in production.

## Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth) · Tailwind v4 · Resend (email) · Vercel (hosting + crons)

Architecture notes live in [CLAUDE.md](./CLAUDE.md). Database migrations are in `supabase/migrations/`.

## Transparency

- The full emissions methodology, with cited constants, is at [/methodology](https://ecodues.org/methodology).
- Every user can export all of their data as CSV from the app.
- The emissions engine is pure TypeScript (`src/lib/emissions/`) with a test suite locking in the math.

## Contributing

Issues and PRs welcome — especially new provider connectors (see `src/lib/providers/openrouter.ts` for the pattern) and methodology improvements with citations.
