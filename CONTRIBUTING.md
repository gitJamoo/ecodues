# Contributing to EcoDues

Thanks for your interest. The most valuable contributions are new provider connectors (many popular AI services still have no usage-pull path) and emissions-methodology improvements backed by citations. Bug fixes, UI polish, and test coverage are also very welcome.

## Dev setup

```bash
git clone https://github.com/gitJamoo/ecodues.git
cd ecodues
npm install
cp .env.example .env.local
```

Set `DEV_MODE=true` in `.env.local` — this bypasses Supabase auth entirely and serves stub data from `src/lib/dev-mode.ts`, so you can work on the UI and most logic without real credentials. Never set it in production.

```bash
npm run dev      # localhost:3000 (Turbopack)
```

## Quality gates (run before opening a PR)

```bash
npm test             # vitest — emissions engine, cycle math, unsubscribe tokens
npx tsc --noEmit     # TypeScript
npm run lint         # ESLint
```

All three must pass. PRs that break the type-check or test suite won't be merged.

## Adding a provider connector

This is the highest-value contribution. The pattern:

1. **Implement `ProviderConnector`** (from `src/lib/providers/types.ts`):
   - `id` — the provider's `KnownProviderId` string (add it to the union in `types.ts` if it's new).
   - `label` — human-readable name.
   - `isStub: false` — real connectors set this.
   - `validateKey(apiKey)` — hit the provider's auth/profile endpoint; return `true` only if the key is valid. Throw on network errors, return `false` on auth failures.
   - `fetchMonthlyUsage(apiKey, period)` — return `MonthlyUsage[]` for the given year/month. Aggregate by model across the month.

   See `src/lib/providers/openrouter.ts` for a minimal real example.

2. **Register it** in `src/lib/providers/index.ts` — add to the `REAL_CONNECTORS` map.

3. **Update `catalog.ts`** — find or add the provider's entry in `PROVIDER_CATALOG` (`src/lib/providers/catalog.ts`) and set `apiKeySupported: true` with a helpful `apiKeyHint` (what kind of key is needed, where to get it).

**No usage API?** If the provider doesn't expose per-user usage via a normal API key, keep it as a manual/tier-only stub. Use `makeManualStub` from `src/lib/providers/stubs.ts` (or the existing `geminiManual` pattern). `validateKey` must return `false` — the UI must never offer an API-key path we can't actually honor.

## Emissions methodology changes

Constants live in `src/lib/emissions/constants.ts`. Every constant must carry a code comment citing its source (paper, dataset, government estimate, year). If you're updating a value, update the citation too.

Model-classification regexes live in `src/lib/emissions/models.ts`. Order matters — patterns are tested top-to-bottom and the first match wins. Changes here require updated tests in `src/lib/emissions/models.test.ts`; the test suite is the spec. Add a new model string → expected class assertion for any pattern you add or change.

## Database migrations

Schema changes go in `supabase/migrations/` as a new sequentially-named `.sql` file (e.g. `0015_my_change.sql`). Include the migration file in your PR. Maintainers apply it to production via the Supabase MCP once the PR merges — don't apply it yourself to the prod project.

If your migration adds a column to `profiles`, also add the corresponding field to `DEV_PROFILE` in `src/lib/dev-mode.ts` or dev mode will break.

## Reporting security issues

Please do not open a public GitHub issue for security vulnerabilities. Email the maintainer directly with a description of the issue and steps to reproduce. We'll acknowledge within a few days and coordinate a fix before any public disclosure.

## A note on scope

EcoDues is intentionally simple and auditable — a complex dependency graph works against the "you can read the math" promise. Please open an issue before building something large so we can discuss fit first.
