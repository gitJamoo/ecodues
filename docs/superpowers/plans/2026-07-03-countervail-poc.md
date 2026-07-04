# Countervail PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Countervail PoC — a Stripe-clean Next.js app where users log in, connect AI usage (API keys / tier / manual), see a cited CO₂e + dollar-damage estimate, and simulate a 1×–3× monthly donation cycle that fires on the 1st.

**Architecture:** Next.js App Router with Supabase (auth + Postgres + RLS). A pure, unit-tested emissions engine (`src/lib/emissions/`) is the core; provider connectors sit behind one interface (OpenRouter real, others stubbed); the monthly cycle is a pure computation plus a thin orchestrator called by both a cron route (`0 0 1 * *`) and a manual button. Donations are simulated ledger rows shaped for a later Every.org swap.

**Tech Stack:** Next.js 15 (App Router, TS), Tailwind v4 + shadcn/ui, Supabase (`@supabase/ssr`), Vitest, Recharts (via shadcn chart).

**Environment notes for the executor:**
- Windows machine; shell commands below are PowerShell-safe unless noted.
- Supabase: the app is built against env vars in `.env.local`. If no hosted Supabase project exists, run `npx supabase init && npx supabase start` (requires Docker) and use the local keys; otherwise leave `.env.example` populated and verify with `npm run build` + Vitest only. **Do not block on Supabase credentials** — all logic layers are testable without it.
- Auth for PoC = email/password + magic link (works on local Supabase with zero external config). Google OAuth button is present but hidden unless `NEXT_PUBLIC_GOOGLE_AUTH=1`.

---

## File structure

```
countervail/
  .env.example
  vercel.json                          # cron 0 0 1 * *
  vitest.config.ts
  supabase/migrations/0001_init.sql    # tables + RLS + charity seed
  src/
    lib/
      emissions/constants.ts           # model classes, Wh/token, PUE, grid, SCC, water, citations
      emissions/models.ts              # model name -> class
      emissions/tiers.ts               # subscription tier -> monthly token estimates
      emissions/engine.ts              # pure math (tokens/spend -> kWh/CO2e/$/donation)
      emissions/engine.test.ts
      emissions/models.test.ts
      providers/types.ts               # ProviderConnector, MonthlyUsage, Period
      providers/openrouter.ts          # real connector
      providers/stubs.ts               # openai/anthropic/gemini demo connectors
      providers/index.ts               # registry
      providers/openrouter.test.ts
      crypto.ts                        # AES-256-GCM for API keys
      crypto.test.ts
      cycle.ts                         # buildCycle (pure) + runMonthlyCycleForUser (orchestrator)
      cycle.test.ts
      format.ts                        # money/co2/month formatting
      supabase/server.ts               # server client (cookies)
      supabase/admin.ts                # service-role client (cron)
      supabase/middleware.ts
      actions.ts                       # server actions (connections, manual usage, settings, run-cycle)
      data.ts                          # typed reads for pages
    middleware.ts
    app/
      globals.css                      # Stripe-like theme tokens
      layout.tsx
      page.tsx                         # landing
      login/page.tsx
      auth/confirm/route.ts            # magic-link/OTP handler
      auth/signout/route.ts
      methodology/page.tsx
      onboarding/page.tsx              # 3-step wizard (client)
      api/cron/monthly/route.ts
      (app)/layout.tsx                 # sidebar shell
      (app)/dashboard/page.tsx
      (app)/providers/page.tsx
      (app)/donations/page.tsx
      (app)/settings/page.tsx
    components/
      stat-card.tsx
      trend-chart.tsx
      multiplier-slider.tsx
      provider-connect.tsx             # shared by onboarding + providers page
      charity-picker.tsx
      card-form-stub.tsx
      run-cycle-button.tsx
      ui/…                             # shadcn (CLI-generated)
```

Working directory for every task: `C:\Users\galav\source\repos\countervail`.

---

### Task 1: Scaffold

**Files:** entire Next.js scaffold; Modify: `package.json`, `vitest.config.ts`

- [ ] **Step 1: Scaffold Next.js in-place** (repo already has `docs/` + `.git`)

Run:
```powershell
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --use-npm --no-import-alias --turbopack
```
(If it balks at the non-empty dir, scaffold to `tmp-app` and move everything except `.git`/`docs` up.)

- [ ] **Step 2: Add deps**

```powershell
npm i @supabase/supabase-js @supabase/ssr
npm i -D vitest
```

- [ ] **Step 3: shadcn init + components**

```powershell
npx shadcn@latest init -y -b neutral
npx shadcn@latest add button card input label slider select table badge separator skeleton sonner chart dialog tabs
```

- [ ] **Step 4: `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["src/**/*.test.ts"] } });
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 5: Verify** — `npm run build` passes and `npm test` reports "no test files" (exit is fine).

- [ ] **Step 6: Commit** — `git add -A; git commit -m "chore: scaffold Next.js + shadcn + vitest"`

---

### Task 2: Emissions constants + model classification (TDD)

**Files:** Create `src/lib/emissions/constants.ts`, `src/lib/emissions/models.ts`, Test `src/lib/emissions/models.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/emissions/models.test.ts
import { describe, it, expect } from "vitest";
import { classifyModel } from "./models";

describe("classifyModel", () => {
  it("maps known models to classes", () => {
    expect(classifyModel("gpt-4o-mini")).toBe("small");
    expect(classifyModel("claude-haiku-4-5-20251001")).toBe("small");
    expect(classifyModel("gemini-2.0-flash")).toBe("small");
    expect(classifyModel("gpt-4o")).toBe("medium");
    expect(classifyModel("claude-sonnet-4-6")).toBe("medium");
    expect(classifyModel("claude-opus-4-8")).toBe("large");
    expect(classifyModel("o3")).toBe("frontier");
    expect(classifyModel("openai/o1-pro")).toBe("frontier");
  });
  it("defaults unknown models to medium", () => {
    expect(classifyModel("mystery-model-9000")).toBe("medium");
  });
  it("checks -mini/-flash/-haiku before base-model patterns", () => {
    expect(classifyModel("openrouter/openai/gpt-4o-mini")).toBe("small");
  });
});
```

- [ ] **Step 2: Run** `npm test` → FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// src/lib/emissions/constants.ts
// All constants cited on /methodology. Sources: Epoch AI "How much energy does
// ChatGPT use?" (2025) ~0.3 Wh per GPT-4o query; Luccioni et al. 2024 (Power
// Hungry Processing); EPA 2023 SC-CO2 central estimate $190/t; US eGRID avg
// grid intensity; Uptime Institute PUE survey ~1.2 for hyperscalers.
export type ModelClass = "small" | "medium" | "large" | "frontier";

export interface ClassProfile {
  whPerOutputToken: number;   // decode energy
  blendedUsdPerMTok: number;  // used to back out tokens from $ spend
}

export const MODEL_CLASS_PROFILES: Record<ModelClass, ClassProfile> = {
  small:    { whPerOutputToken: 0.0002, blendedUsdPerMTok: 0.6 },
  medium:   { whPerOutputToken: 0.0006, blendedUsdPerMTok: 5 },
  large:    { whPerOutputToken: 0.0025, blendedUsdPerMTok: 15 },
  frontier: { whPerOutputToken: 0.006,  blendedUsdPerMTok: 40 },
};

export const INPUT_TOKEN_ENERGY_FRACTION = 0.1; // prefill ≪ decode
export const PUE = 1.2;
export const GRID_KG_CO2E_PER_KWH = 0.38;
export const WATER_L_PER_KWH = 0.55;
export const SOCIAL_COST_USD_PER_TON_CO2E = 190;
export const SPEND_INPUT_OUTPUT_SPLIT = { input: 0.75, output: 0.25 }; // typical API traffic
export const METHODOLOGY_VERSION = "2026-07.1";
```

```ts
// src/lib/emissions/models.ts
import type { ModelClass } from "./constants";

// Order matters: cheap-variant markers first, then frontier, then large, then base names.
const PATTERNS: Array<[RegExp, ModelClass]> = [
  [/mini|flash|haiku|nano|lite|tiny|8b|9b|-7b/i, "small"],
  [/\bo1|\bo3|\bo4|deep-?research|-pro\b|reason/i, "frontier"],
  [/opus|gpt-4-turbo|gpt-4\.5|405b|ultra/i, "large"],
  [/gpt-4o|gpt-4\.1|sonnet|gemini.*pro|llama|mistral|deepseek|grok|qwen|command/i, "medium"],
];

export function classifyModel(model: string): ModelClass {
  for (const [re, cls] of PATTERNS) if (re.test(model)) return cls;
  return "medium";
}
```

- [ ] **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add -A; git commit -m "feat: emissions constants and model classification"`

---

### Task 3: Emissions engine (TDD)

**Files:** Create `src/lib/emissions/engine.ts`, Test `src/lib/emissions/engine.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/emissions/engine.test.ts
import { describe, it, expect } from "vitest";
import { estimateFromTokens, estimateFromSpend, donationForDamage, clampMultiplier } from "./engine";

describe("estimateFromTokens", () => {
  it("computes kWh/CO2e/water/damage for medium class", () => {
    // 150k out + 300k in, medium: (150000 + 300000*0.1) * 0.0006 Wh = 108 Wh
    const e = estimateFromTokens({ modelClass: "medium", inputTokens: 300_000, outputTokens: 150_000 });
    expect(e.kwh).toBeCloseTo(0.108 * 1.2, 5);            // PUE applied
    expect(e.kgCo2e).toBeCloseTo(0.1296 * 0.38, 5);
    expect(e.litersWater).toBeCloseTo(0.1296 * 0.55, 5);
    expect(e.damageUsd).toBeCloseTo((0.1296 * 0.38 / 1000) * 190, 6);
  });
  it("returns zeros for zero usage", () => {
    const e = estimateFromTokens({ modelClass: "small", inputTokens: 0, outputTokens: 0 });
    expect(e.kwh).toBe(0); expect(e.damageUsd).toBe(0);
  });
});

describe("estimateFromSpend", () => {
  it("backs tokens out of spend then delegates to token math", () => {
    // $5 medium @ $5/MTok = 1M tokens, split 750k in / 250k out
    const viaSpend = estimateFromSpend("medium", 5);
    const viaTokens = estimateFromTokens({ modelClass: "medium", inputTokens: 750_000, outputTokens: 250_000 });
    expect(viaSpend.kwh).toBeCloseTo(viaTokens.kwh, 8);
  });
});

describe("donationForDamage", () => {
  it("multiplies and rounds up to whole cents", () => {
    expect(donationForDamage(0.0094, 2)).toBe(0.02);
    expect(donationForDamage(0, 2)).toBe(0);
  });
});

describe("clampMultiplier", () => {
  it("clamps to [1,3] and snaps to 0.25 steps", () => {
    expect(clampMultiplier(0.5)).toBe(1);
    expect(clampMultiplier(3.9)).toBe(3);
    expect(clampMultiplier(2.13)).toBe(2.25);
    expect(clampMultiplier(2)).toBe(2);
  });
});
```

- [ ] **Step 2: Run** `npm test` → FAIL.

- [ ] **Step 3: Implement**

```ts
// src/lib/emissions/engine.ts
import {
  MODEL_CLASS_PROFILES, INPUT_TOKEN_ENERGY_FRACTION, PUE,
  GRID_KG_CO2E_PER_KWH, WATER_L_PER_KWH, SOCIAL_COST_USD_PER_TON_CO2E,
  SPEND_INPUT_OUTPUT_SPLIT, type ModelClass,
} from "./constants";

export interface TokenUsage { modelClass: ModelClass; inputTokens: number; outputTokens: number }
export interface EmissionEstimate { kwh: number; kgCo2e: number; litersWater: number; damageUsd: number }

export function estimateFromTokens(u: TokenUsage): EmissionEstimate {
  const { whPerOutputToken } = MODEL_CLASS_PROFILES[u.modelClass];
  const effectiveTokens = u.outputTokens + u.inputTokens * INPUT_TOKEN_ENERGY_FRACTION;
  const kwh = (effectiveTokens * whPerOutputToken * PUE) / 1000;
  const kgCo2e = kwh * GRID_KG_CO2E_PER_KWH;
  return {
    kwh,
    kgCo2e,
    litersWater: kwh * WATER_L_PER_KWH,
    damageUsd: (kgCo2e / 1000) * SOCIAL_COST_USD_PER_TON_CO2E,
  };
}

export function estimateFromSpend(modelClass: ModelClass, spendUsd: number): EmissionEstimate {
  const tokens = (spendUsd / MODEL_CLASS_PROFILES[modelClass].blendedUsdPerMTok) * 1_000_000;
  return estimateFromTokens({
    modelClass,
    inputTokens: tokens * SPEND_INPUT_OUTPUT_SPLIT.input,
    outputTokens: tokens * SPEND_INPUT_OUTPUT_SPLIT.output,
  });
}

export function donationForDamage(damageUsd: number, multiplier: number): number {
  if (damageUsd <= 0) return 0;
  return Math.ceil(damageUsd * multiplier * 100) / 100; // round UP to the cent — never under-donate
}

export function clampMultiplier(m: number): number {
  return Math.min(3, Math.max(1, Math.round(m * 4) / 4));
}
```

- [ ] **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat: emissions engine"`

---

### Task 4: Tier estimates

**Files:** Create `src/lib/emissions/tiers.ts` (covered by engine tests; data-only module)

- [ ] **Step 1: Implement** (data table; assumptions cited on /methodology: heavy chat user ≈ 40 msgs/day, ~400 out / 1200 in tokens per exchange)

```ts
// src/lib/emissions/tiers.ts
import type { ModelClass } from "./constants";

export interface TierEstimate {
  id: string; provider: "openai" | "anthropic" | "gemini";
  label: string; monthlyInputTokens: number; monthlyOutputTokens: number; modelClass: ModelClass;
}

const M = 1_000_000;
export const TIER_ESTIMATES: TierEstimate[] = [
  { id: "chatgpt_free",    provider: "openai",    label: "ChatGPT Free",     monthlyInputTokens: 0.4 * M, monthlyOutputTokens: 0.15 * M, modelClass: "small" },
  { id: "chatgpt_plus",    provider: "openai",    label: "ChatGPT Plus",     monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
  { id: "chatgpt_pro",     provider: "openai",    label: "ChatGPT Pro",      monthlyInputTokens: 4 * M,   monthlyOutputTokens: 1.5 * M,  modelClass: "frontier" },
  { id: "claude_pro",      provider: "anthropic", label: "Claude Pro",       monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
  { id: "claude_max",      provider: "anthropic", label: "Claude Max",       monthlyInputTokens: 5 * M,   monthlyOutputTokens: 2 * M,    modelClass: "large" },
  { id: "gemini_free",     provider: "gemini",    label: "Gemini Free",      monthlyInputTokens: 0.4 * M, monthlyOutputTokens: 0.15 * M, modelClass: "small" },
  { id: "gemini_advanced", provider: "gemini",    label: "Google AI Pro",    monthlyInputTokens: 1.4 * M, monthlyOutputTokens: 0.5 * M,  modelClass: "medium" },
];

export const tierById = (id: string) => TIER_ESTIMATES.find(t => t.id === id);
```

- [ ] **Step 2: Verify** `npm test` still passes and `npx tsc --noEmit` is clean.
- [ ] **Step 3: Commit** — `git commit -am "feat: subscription tier estimates"`

---

### Task 5: Crypto helper (TDD)

**Files:** Create `src/lib/crypto.ts`, Test `src/lib/crypto.test.ts`

- [ ] **Step 1: Failing test**

```ts
// src/lib/crypto.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret } from "./crypto";

beforeAll(() => { process.env.ENCRYPTION_KEY = "a".repeat(64); }); // 32-byte hex

describe("crypto", () => {
  it("round-trips", () => {
    const c = encryptSecret("sk-or-v1-abc123");
    expect(c).not.toContain("abc123");
    expect(decryptSecret(c)).toBe("sk-or-v1-abc123");
  });
  it("produces different ciphertext per call (random IV)", () => {
    expect(encryptSecret("x")).not.toBe(encryptSecret("x"));
  });
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**

```ts
// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function key(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error("ENCRYPTION_KEY must be 32 bytes hex");
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map(b => b.toString("base64")).join(".");
}

export function decryptSecret(payload: string): string {
  const [iv, tag, data] = payload.split(".").map(s => Buffer.from(s, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: Commit** `git commit -am "feat: AES-256-GCM secret encryption"`

---

### Task 6: Provider connectors (TDD for OpenRouter)

**Files:** Create `src/lib/providers/types.ts`, `openrouter.ts`, `stubs.ts`, `index.ts`; Test `src/lib/providers/openrouter.test.ts`

- [ ] **Step 1: types**

```ts
// src/lib/providers/types.ts
export type ProviderId = "openrouter" | "openai" | "anthropic" | "gemini";
export interface Period { year: number; month: number } // month 1-12
export interface MonthlyUsage { model: string; inputTokens: number; outputTokens: number; spendUsd: number }
export interface ProviderConnector {
  id: ProviderId;
  label: string;
  isStub: boolean;
  validateKey(apiKey: string): Promise<boolean>;
  fetchMonthlyUsage(apiKey: string, period: Period): Promise<MonthlyUsage[]>;
}
```

- [ ] **Step 2: Failing test (mock fetch)**

```ts
// src/lib/providers/openrouter.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { openrouter } from "./openrouter";

afterEach(() => vi.restoreAllMocks());

describe("openrouter connector", () => {
  it("aggregates activity rows for the requested month", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [
        { date: "2026-06-03", model: "openai/gpt-4o", prompt_tokens: 1000, completion_tokens: 500, usage: 0.02 },
        { date: "2026-06-14", model: "openai/gpt-4o", prompt_tokens: 3000, completion_tokens: 900, usage: 0.05 },
        { date: "2026-05-30", model: "openai/gpt-4o", prompt_tokens: 99, completion_tokens: 99, usage: 9 },
      ],
    }))));
    const rows = await openrouter.fetchMonthlyUsage("sk-or-x", { year: 2026, month: 6 });
    expect(rows).toEqual([{ model: "openai/gpt-4o", inputTokens: 4000, outputTokens: 1400, spendUsd: 0.07 }]);
  });
  it("validateKey true on 200, false on 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    expect(await openrouter.validateKey("bad")).toBe(false);
  });
});
```

- [ ] **Step 3: Run** → FAIL. **Step 4: Implement**

```ts
// src/lib/providers/openrouter.ts
import type { MonthlyUsage, Period, ProviderConnector } from "./types";

interface ActivityRow { date: string; model: string; prompt_tokens: number; completion_tokens: number; usage: number }

export const openrouter: ProviderConnector = {
  id: "openrouter", label: "OpenRouter", isStub: false,

  async validateKey(apiKey) {
    const res = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  },

  async fetchMonthlyUsage(apiKey, period) {
    const res = await fetch("https://openrouter.ai/api/v1/activity", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`OpenRouter activity failed: ${res.status}`);
    const { data } = (await res.json()) as { data: ActivityRow[] };
    const prefix = `${period.year}-${String(period.month).padStart(2, "0")}-`;
    const byModel = new Map<string, MonthlyUsage>();
    for (const row of data ?? []) {
      if (!row.date?.startsWith(prefix)) continue;
      const agg = byModel.get(row.model) ?? { model: row.model, inputTokens: 0, outputTokens: 0, spendUsd: 0 };
      agg.inputTokens += row.prompt_tokens ?? 0;
      agg.outputTokens += row.completion_tokens ?? 0;
      agg.spendUsd += row.usage ?? 0;
      byModel.set(row.model, agg);
    }
    return [...byModel.values()];
  },
};
```

```ts
// src/lib/providers/stubs.ts
// Demo connectors for providers whose usage APIs need org-admin keys the PoC
// doesn't collect. Deterministic per (key, period) so demos are stable.
import type { MonthlyUsage, Period, ProviderConnector, ProviderId } from "./types";

function seededUsage(id: ProviderId, period: Period): MonthlyUsage[] {
  const seed = period.year * 12 + period.month;
  const wobble = (n: number) => Math.round(n * (0.8 + ((seed * 9301 + 49297) % 233280) / 233280 * 0.4));
  const catalog: Record<string, MonthlyUsage[]> = {
    openai:    [{ model: "gpt-4o", inputTokens: wobble(900_000), outputTokens: wobble(280_000), spendUsd: wobble(6) },
                { model: "gpt-4o-mini", inputTokens: wobble(2_500_000), outputTokens: wobble(800_000), spendUsd: wobble(2) }],
    anthropic: [{ model: "claude-sonnet-4-6", inputTokens: wobble(1_200_000), outputTokens: wobble(350_000), spendUsd: wobble(9) }],
    gemini:    [{ model: "gemini-2.0-flash", inputTokens: wobble(1_800_000), outputTokens: wobble(500_000), spendUsd: wobble(1) }],
  };
  return catalog[id] ?? [];
}

function makeStub(id: ProviderId, label: string): ProviderConnector {
  return {
    id, label, isStub: true,
    validateKey: async (k) => k.length > 8,
    fetchMonthlyUsage: async (_k, period) => seededUsage(id, period),
  };
}

export const openaiStub = makeStub("openai", "OpenAI");
export const anthropicStub = makeStub("anthropic", "Anthropic");
export const geminiStub = makeStub("gemini", "Google Gemini");
```

```ts
// src/lib/providers/index.ts
import { openrouter } from "./openrouter";
import { openaiStub, anthropicStub, geminiStub } from "./stubs";
import type { ProviderConnector, ProviderId } from "./types";

export const CONNECTORS: Record<ProviderId, ProviderConnector> = {
  openrouter, openai: openaiStub, anthropic: anthropicStub, gemini: geminiStub,
};
export const connectorFor = (id: ProviderId) => CONNECTORS[id];
```

- [ ] **Step 5: Run** `npm test` → PASS. **Step 6: Commit** `git commit -am "feat: provider connectors (OpenRouter real, others stubbed)"`

---

### Task 7: Database schema + Supabase clients

**Files:** Create `supabase/migrations/0001_init.sql`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `.env.example`

- [ ] **Step 1: Migration SQL**

```sql
-- supabase/migrations/0001_init.sql
create table charities (
  id text primary key,            -- every.org slug
  name text not null,
  description text not null,
  category text not null
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  multiplier numeric(3,2) not null default 2.00 check (multiplier between 1 and 3),
  charity_id text references charities,
  card_last4 text,                -- stub: masked placeholder only, never real card data
  onboarded_at timestamptz
);

create table provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  provider text not null check (provider in ('openrouter','openai','anthropic','gemini')),
  kind text not null check (kind in ('api_key','tier','manual')),
  encrypted_key text,             -- api_key kind
  tier_id text,                   -- tier kind
  status text not null default 'active' check (status in ('active','error')),
  created_at timestamptz not null default now(),
  unique (user_id, provider, kind)
);

create table usage_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  provider text not null,
  model text not null,            -- model name, tier id, or 'manual'
  period date not null,           -- first day of month
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  spend_usd numeric(10,4) not null default 0,
  source text not null check (source in ('api','tier_estimate','manual')),
  created_at timestamptz not null default now()
);
create index usage_records_user_period on usage_records (user_id, period);

create table emission_estimates (
  id uuid primary key default gen_random_uuid(),
  usage_record_id uuid not null references usage_records on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  period date not null,
  kwh numeric(12,6) not null,
  kg_co2e numeric(12,6) not null,
  liters_water numeric(12,6) not null,
  damage_usd numeric(10,4) not null,
  methodology_version text not null
);

create table donation_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  period date not null,
  damage_usd numeric(10,4) not null,
  multiplier numeric(3,2) not null,
  donation_usd numeric(10,2) not null,
  charity_id text references charities,
  status text not null default 'simulated' check (status in ('simulated','pending','completed')),
  created_at timestamptz not null default now(),
  unique (user_id, period)
);

alter table profiles enable row level security;
alter table provider_connections enable row level security;
alter table usage_records enable row level security;
alter table emission_estimates enable row level security;
alter table donation_ledger enable row level security;
alter table charities enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own connections" on provider_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own usage" on usage_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own estimates" on emission_estimates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own ledger" on donation_ledger for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "charities readable" on charities for select using (true);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name) values (new.id, split_part(new.email, '@', 1));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into charities (id, name, description, category) values
 ('cleanairtaskforce', 'Clean Air Task Force', 'Advocates for technologies and policies to reach a zero-emissions, high-energy planet.', 'Policy'),
 ('rainforest-foundation-us', 'Rainforest Foundation US', 'Protects rainforests by securing land rights for indigenous communities.', 'Forests'),
 ('carbon180', 'Carbon180', 'Nonprofit driving carbon removal policy and innovation.', 'Carbon removal'),
 ('coolearth', 'Cool Earth', 'Backs indigenous peoples to keep rainforest standing.', 'Forests'),
 ('cleanenergybuyersinstitute', 'Clean Energy Buyers Institute', 'Decarbonizing the grid that powers data centers.', 'Grid'),
 ('givingreen', 'Giving Green Fund', 'Evidence-based fund allocating to the highest-impact climate initiatives.', 'Fund');
```

- [ ] **Step 2: Supabase clients**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all) => { try { all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    },
  );
}
```

```ts
// src/lib/supabase/admin.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
// Service-role client for the cron route ONLY. Bypasses RLS; never import in page code.
export const createAdminClient = () =>
  createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
```

```ts
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/providers", "/donations", "/settings", "/onboarding"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (all) => {
          all.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          all.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!user && PROTECTED.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}
```

```ts
// src/middleware.ts
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";
export async function middleware(request: NextRequest) { return updateSession(request); }
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron).*)"] };
```

- [ ] **Step 3: `.env.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=64-hex-chars-32-bytes   # openssl rand -hex 32
CRON_SECRET=any-long-random-string
# NEXT_PUBLIC_GOOGLE_AUTH=1            # enable once Google OAuth configured in Supabase
```

- [ ] **Step 4: Verify** `npx tsc --noEmit` clean. **Step 5: Commit** `git commit -am "feat: schema, RLS, supabase clients, middleware"`

---

### Task 8: Cycle logic (TDD)

**Files:** Create `src/lib/cycle.ts`, Test `src/lib/cycle.test.ts`

- [ ] **Step 1: Failing tests for the pure part**

```ts
// src/lib/cycle.test.ts
import { describe, it, expect } from "vitest";
import { buildCycle, previousPeriod, periodDateString } from "./cycle";

describe("previousPeriod", () => {
  it("handles January", () => expect(previousPeriod(new Date("2026-01-15"))).toEqual({ year: 2025, month: 12 }));
  it("handles mid-year", () => expect(previousPeriod(new Date("2026-07-01"))).toEqual({ year: 2026, month: 6 }));
});

describe("periodDateString", () => {
  it("formats first-of-month", () => expect(periodDateString({ year: 2026, month: 6 })).toBe("2026-06-01"));
});

describe("buildCycle", () => {
  it("estimates each record and totals donation with multiplier", () => {
    const out = buildCycle(
      [
        { id: "r1", provider: "openrouter", model: "gpt-4o", input_tokens: 300_000, output_tokens: 150_000, spend_usd: 3, source: "api" },
        { id: "r2", provider: "openai", model: "manual", input_tokens: 0, output_tokens: 0, spend_usd: 10, source: "manual" },
      ],
      2.5,
    );
    expect(out.estimates).toHaveLength(2);
    expect(out.estimates[0].usageRecordId).toBe("r1");
    expect(out.totalDamageUsd).toBeGreaterThan(0);
    expect(out.donationUsd).toBe(Math.ceil(out.totalDamageUsd * 2.5 * 100) / 100);
  });
  it("uses spend-based estimation when tokens are absent", () => {
    const withTokens = buildCycle([{ id: "a", provider: "x", model: "gpt-4o", input_tokens: 1000, output_tokens: 1000, spend_usd: 0, source: "manual" }], 2);
    const withSpend = buildCycle([{ id: "b", provider: "x", model: "manual", input_tokens: 0, output_tokens: 0, spend_usd: 5, source: "manual" }], 2);
    expect(withTokens.totalDamageUsd).toBeGreaterThan(0);
    expect(withSpend.totalDamageUsd).toBeGreaterThan(0);
  });
  it("zero usage yields zero donation", () => {
    expect(buildCycle([], 3).donationUsd).toBe(0);
  });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**

```ts
// src/lib/cycle.ts
import { estimateFromTokens, estimateFromSpend, donationForDamage, type EmissionEstimate } from "./emissions/engine";
import { classifyModel } from "./emissions/models";
import { METHODOLOGY_VERSION } from "./emissions/constants";
import type { Period } from "./providers/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { connectorFor } from "./providers";
import { tierById } from "./emissions/tiers";
import { decryptSecret } from "./crypto";

export interface UsageRecordLike {
  id: string; provider: string; model: string;
  input_tokens: number; output_tokens: number; spend_usd: number; source: string;
}
export interface CycleResult {
  estimates: Array<EmissionEstimate & { usageRecordId: string }>;
  totalDamageUsd: number;
  donationUsd: number;
}

export function previousPeriod(now: Date): Period {
  const y = now.getUTCFullYear(), m = now.getUTCMonth() + 1; // 1-12
  return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };
}

export const periodDateString = (p: Period) => `${p.year}-${String(p.month).padStart(2, "0")}-01`;

export function buildCycle(records: UsageRecordLike[], multiplier: number): CycleResult {
  const estimates = records.map((r) => {
    const cls = classifyModel(r.model);
    const hasTokens = r.input_tokens > 0 || r.output_tokens > 0;
    const e = hasTokens
      ? estimateFromTokens({ modelClass: cls, inputTokens: r.input_tokens, outputTokens: r.output_tokens })
      : estimateFromSpend(cls, r.spend_usd);
    return { ...e, usageRecordId: r.id };
  });
  const totalDamageUsd = estimates.reduce((s, e) => s + e.damageUsd, 0);
  return { estimates, totalDamageUsd, donationUsd: donationForDamage(totalDamageUsd, multiplier) };
}

/**
 * Orchestrator used by both the cron route and the manual "Run monthly cycle"
 * button. Idempotent per (user, period): re-running replaces that period's
 * API-sourced usage, estimates, and ledger row.
 */
export async function runMonthlyCycleForUser(supabase: SupabaseClient, userId: string, period: Period): Promise<CycleResult> {
  const periodDate = periodDateString(period);

  const { data: profile } = await supabase.from("profiles").select("multiplier, charity_id").eq("id", userId).single();
  const { data: connections } = await supabase.from("provider_connections").select("*").eq("user_id", userId);

  // 1. Refresh API + tier usage (manual rows are user-owned; leave them).
  await supabase.from("usage_records").delete().eq("user_id", userId).eq("period", periodDate).in("source", ["api", "tier_estimate"]);

  for (const conn of connections ?? []) {
    if (conn.kind === "api_key" && conn.encrypted_key) {
      try {
        const rows = await connectorFor(conn.provider).fetchMonthlyUsage(decryptSecret(conn.encrypted_key), period);
        if (rows.length) await supabase.from("usage_records").insert(rows.map(r => ({
          user_id: userId, provider: conn.provider, model: r.model, period: periodDate,
          input_tokens: Math.round(r.inputTokens), output_tokens: Math.round(r.outputTokens),
          spend_usd: r.spendUsd, source: "api",
        })));
        if (conn.status !== "active") await supabase.from("provider_connections").update({ status: "active" }).eq("id", conn.id);
      } catch {
        await supabase.from("provider_connections").update({ status: "error" }).eq("id", conn.id);
      }
    } else if (conn.kind === "tier" && conn.tier_id) {
      const t = tierById(conn.tier_id);
      if (t) await supabase.from("usage_records").insert({
        user_id: userId, provider: conn.provider, model: t.id, period: periodDate,
        input_tokens: t.monthlyInputTokens, output_tokens: t.monthlyOutputTokens, spend_usd: 0, source: "tier_estimate",
      });
    }
  }

  // 2. Estimate everything for the period.
  const { data: records } = await supabase.from("usage_records").select("*").eq("user_id", userId).eq("period", periodDate);
  const result = buildCycle((records ?? []) as UsageRecordLike[], Number(profile?.multiplier ?? 2));

  await supabase.from("emission_estimates").delete().eq("user_id", userId).eq("period", periodDate);
  if (result.estimates.length) await supabase.from("emission_estimates").insert(result.estimates.map(e => ({
    usage_record_id: e.usageRecordId, user_id: userId, period: periodDate,
    kwh: e.kwh, kg_co2e: e.kgCo2e, liters_water: e.litersWater, damage_usd: e.damageUsd,
    methodology_version: METHODOLOGY_VERSION,
  })));

  // 3. Ledger row (simulated). Production: swap for an Every.org Partner API call.
  await supabase.from("donation_ledger").upsert({
    user_id: userId, period: periodDate, damage_usd: result.totalDamageUsd,
    multiplier: Number(profile?.multiplier ?? 2), donation_usd: result.donationUsd,
    charity_id: profile?.charity_id ?? null, status: "simulated",
  }, { onConflict: "user_id,period" });

  return result;
}
```

Note on classifyModel for tier records: tier ids like `chatgpt_plus` hit the default → "medium", which matches most tiers; `chatgpt_pro` contains "pro" → matched by the frontier regex `-pro\b` only with hyphen — tier record model strings are the tier id, and `tierById` classes are already applied at *estimate* time via record tokens, so class mismatch is acceptable noise for tiers whose class is medium. To be exact, tier usage inserts store `model: t.id` and classifyModel patterns include `[/chatgpt_pro|claude_max/, ...]`? — **Decision:** add two explicit patterns at the TOP of `PATTERNS` in models.ts during this task:

```ts
  [/^chatgpt_pro$/, "frontier"],
  [/^claude_max$/, "large"],
```

and extend `models.test.ts`:

```ts
  it("classifies tier ids", () => {
    expect(classifyModel("chatgpt_pro")).toBe("frontier");
    expect(classifyModel("claude_max")).toBe("large");
    expect(classifyModel("chatgpt_plus")).toBe("medium");
  });
```

- [ ] **Step 4: Run** `npm test` → PASS. **Step 5: Commit** `git commit -am "feat: monthly cycle (pure build + orchestrator)"`

---

### Task 9: Format helpers + server actions + data reads

**Files:** Create `src/lib/format.ts`, `src/lib/actions.ts`, `src/lib/data.ts`

- [ ] **Step 1: format.ts**

```ts
// src/lib/format.ts
export const usd = (n: number, digits = 2) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 4) }).format(n);

export const co2 = (kg: number) => (kg < 1 ? `${(kg * 1000).toFixed(0)} g` : `${kg.toFixed(2)} kg`) + " CO₂e";
export const energy = (kwh: number) => (kwh < 1 ? `${(kwh * 1000).toFixed(0)} Wh` : `${kwh.toFixed(2)} kWh`);
export const water = (l: number) => `${l.toFixed(1)} L`;
export const monthLabel = (isoDate: string) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
export const tokens = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}k` : `${n}`;
```

- [ ] **Step 2: actions.ts** (server actions; all check auth; revalidate paths)

```ts
// src/lib/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto";
import { connectorFor } from "@/lib/providers";
import type { ProviderId } from "@/lib/providers/types";
import { clampMultiplier } from "@/lib/emissions/engine";
import { runMonthlyCycleForUser, previousPeriod } from "@/lib/cycle";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function connectApiKey(provider: ProviderId, apiKey: string) {
  const { supabase, user } = await requireUser();
  const connector = connectorFor(provider);
  if (!(await connector.validateKey(apiKey))) return { error: "That key didn't validate. Double-check and try again." };
  await supabase.from("provider_connections").upsert({
    user_id: user.id, provider, kind: "api_key", encrypted_key: encryptSecret(apiKey), status: "active",
  }, { onConflict: "user_id,provider,kind" });
  revalidatePath("/providers");
  return { ok: true, isStub: connector.isStub };
}

export async function connectTier(provider: ProviderId, tierId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("provider_connections").upsert({
    user_id: user.id, provider, kind: "tier", tier_id: tierId, status: "active",
  }, { onConflict: "user_id,provider,kind" });
  revalidatePath("/providers");
  return { ok: true };
}

export async function addManualUsage(provider: ProviderId, period: string, spendUsd: number, inputTokens: number, outputTokens: number) {
  const { supabase, user } = await requireUser();
  await supabase.from("usage_records").insert({
    user_id: user.id, provider, model: "manual", period,
    input_tokens: inputTokens, output_tokens: outputTokens, spend_usd: spendUsd, source: "manual",
  });
  revalidatePath("/dashboard"); revalidatePath("/providers");
  return { ok: true };
}

export async function removeConnection(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("provider_connections").delete().eq("id", id);
  revalidatePath("/providers");
}

export async function saveSettings(form: { displayName?: string; multiplier?: number; charityId?: string; cardLast4?: string }) {
  const { supabase, user } = await requireUser();
  const patch: Record<string, unknown> = {};
  if (form.displayName !== undefined) patch.display_name = form.displayName;
  if (form.multiplier !== undefined) patch.multiplier = clampMultiplier(form.multiplier);
  if (form.charityId !== undefined) patch.charity_id = form.charityId;
  if (form.cardLast4 !== undefined) patch.card_last4 = form.cardLast4;
  await supabase.from("profiles").update(patch).eq("id", user.id);
  revalidatePath("/settings"); revalidatePath("/dashboard");
  return { ok: true };
}

export async function completeOnboarding() {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
  const result = await runMonthlyCycleForUser(supabase, user.id, previousPeriod(new Date()));
  revalidatePath("/dashboard");
  return { ok: true, donationUsd: result.donationUsd };
}

export async function runCycleNow() {
  const { supabase, user } = await requireUser();
  const result = await runMonthlyCycleForUser(supabase, user.id, previousPeriod(new Date()));
  revalidatePath("/dashboard"); revalidatePath("/donations");
  return { ok: true, donationUsd: result.donationUsd, damageUsd: result.totalDamageUsd };
}
```

- [ ] **Step 3: data.ts**

```ts
// src/lib/data.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getSessionUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getDashboardData() {
  const { supabase, user } = await getSessionUser();
  const [{ data: profile }, { data: estimates }, { data: ledger }, { data: usage }, { data: charities }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("emission_estimates").select("*").eq("user_id", user.id).order("period", { ascending: true }),
    supabase.from("donation_ledger").select("*, charities(name)").eq("user_id", user.id).order("period", { ascending: false }),
    supabase.from("usage_records").select("*").eq("user_id", user.id).order("period", { ascending: false }),
    supabase.from("charities").select("*"),
  ]);
  return { user, profile, estimates: estimates ?? [], ledger: ledger ?? [], usage: usage ?? [], charities: charities ?? [] };
}

export async function getConnections() {
  const { supabase, user } = await getSessionUser();
  const { data } = await supabase.from("provider_connections").select("*").eq("user_id", user.id).order("created_at");
  return data ?? [];
}
```

- [ ] **Step 4: Verify** `npx tsc --noEmit`. **Step 5: Commit** `git commit -am "feat: server actions and data reads"`

---

### Task 10: Theme + landing + login + auth routes

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`; Create `src/app/login/page.tsx`, `src/app/auth/confirm/route.ts`, `src/app/auth/signout/route.ts`

- [ ] **Step 1: Theme.** In `globals.css`, override shadcn tokens for the Stripe-like look (light, hairline borders, green accent). Key overrides inside `:root`:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.24 0.02 260);          /* stripe ink #30313d-ish */
  --muted: oklch(0.975 0.003 260);
  --muted-foreground: oklch(0.55 0.02 260);
  --border: oklch(0.92 0.005 260);
  --primary: oklch(0.55 0.15 155);              /* countervail green */
  --primary-foreground: oklch(0.99 0 0);
  --ring: oklch(0.55 0.15 155);
  --radius: 0.5rem;
}
```

In `layout.tsx`: Inter via `next/font/google`, metadata title "Countervail — Make your AI use net-positive", `<Toaster />` from sonner mounted.

- [ ] **Step 2: Landing `page.tsx`** — single screen: nav (logo word "Countervail", links Methodology / Sign in), hero ("Your AI has a footprint. Erase it — twice."), 3-step explainer cards (Connect → We measure → We donate 2×), footer linking /methodology. Use Card/Button; no images.

- [ ] **Step 3: Login page** (client component): email+password sign-in/sign-up tabs plus "email me a magic link" button, via `createBrowserClient` from `@supabase/ssr`. On success `router.push("/dashboard")` (middleware guards). Google button rendered only when `process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1"`.

- [ ] **Step 4: Auth routes**

```ts
// src/app/auth/confirm/route.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) redirect("/onboarding");
  }
  redirect("/login?error=confirm");
}
```

```ts
// src/app/auth/signout/route.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

- [ ] **Step 5: Verify** `npm run build`. **Step 6: Commit** `git commit -am "feat: theme, landing, login, auth routes"`

---

### Task 11: App shell + shared components

**Files:** Create `src/app/(app)/layout.tsx`, `src/components/stat-card.tsx`, `src/components/multiplier-slider.tsx`, `src/components/trend-chart.tsx`, `src/components/run-cycle-button.tsx`

- [ ] **Step 1: Shell.** `(app)/layout.tsx`: fixed 220px left sidebar (logo, nav items Dashboard / Providers / Donations / Methodology / Settings with lucide icons, sign-out at bottom), content area `max-w-5xl mx-auto px-8 py-10`. Server component; reads user email for the footer chip.

- [ ] **Step 2: stat-card.tsx** — label (13px muted), value (28px semibold tabular-nums), optional sub-line and tooltip; Stripe's balance-card feel.

- [ ] **Step 3: multiplier-slider.tsx** (client) — shadcn Slider `min={1} max={3} step={0.25}`, big "2×" readout, captions: 1× "Net zero", >1× "Net positive". Props: `value`, `onChange`.

- [ ] **Step 4: trend-chart.tsx** (client) — shadcn ChartContainer + recharts AreaChart of monthly `kg_co2e` and `damage_usd`; props: `data: Array<{ period: string; kgCo2e: number; damageUsd: number }>`.

- [ ] **Step 5: run-cycle-button.tsx** (client) — calls `runCycleNow()` server action with pending state, then `toast.success("Cycle complete — would donate " + usd(donationUsd))`.

- [ ] **Step 6: Verify** `npm run build`. **Step 7: Commit** `git commit -am "feat: app shell and shared components"`

---

### Task 12: Onboarding wizard

**Files:** Create `src/app/onboarding/page.tsx` (server: fetch charities + connections) + `src/components/onboarding-wizard.tsx` (client), `src/components/provider-connect.tsx`, `src/components/charity-picker.tsx`, `src/components/card-form-stub.tsx`

- [ ] **Step 1: provider-connect.tsx** (client, reused on /providers): for each provider (OpenRouter, OpenAI, Anthropic, Gemini) a card with three tabs — **API key** (input + Connect → `connectApiKey`; on `isStub` show badge "demo data in PoC"), **Subscription** (Select of that provider's tiers from `TIER_ESTIMATES` → `connectTier`), **Manual** (spend $ or token counts for last month → `addManualUsage` with `period = periodDateString(previousPeriod(new Date()))`). Connected state shows green dot + Remove.

- [ ] **Step 2: charity-picker.tsx** (client): radio-card grid of charities (name, category badge, description).

- [ ] **Step 3: card-form-stub.tsx** (client): Stripe-look card inputs (number/exp/CVC, `inputMode="numeric"`, auto-format spaces). Validates length only, stores **last 4 digits only** via `saveSettings({ cardLast4 })`. Banner: "Proof of concept — no card data is stored or charged. Production uses Every.org."

- [ ] **Step 4: onboarding-wizard.tsx**: 3 steps with progress header (1 Connect usage → 2 Charity & multiplier → 3 Card), Continue/Back; step 2 combines CharityPicker + MultiplierSlider (saves via `saveSettings`); step 3 CardFormStub then `completeOnboarding()` → toast with first simulated donation → `router.push("/dashboard")`. Skip logic: step 1 requires ≥1 connection or manual record.

- [ ] **Step 5: Verify** `npm run build`. **Step 6: Commit** `git commit -am "feat: onboarding wizard"`

---

### Task 13: Dashboard, Providers, Donations, Settings pages

**Files:** Create the four `(app)/*/page.tsx`

- [ ] **Step 1: Dashboard** (`(app)/dashboard/page.tsx`, server): `getDashboardData()`; if `!profile.onboarded_at` redirect `/onboarding`. Layout: month heading + RunCycleButton; 4 StatCards (Footprint `co2()`, Energy `energy()`, Damage `usd(…, 2)` with 4-decimal tooltip, Next donation `usd(donation)` + "×N to {charity}"); TrendChart (estimates grouped by period); usage table (Provider / Model / Tokens / Spend / Source badge). Empty state → "Connect a provider" CTA to /providers.

- [ ] **Step 2: Providers** (`(app)/providers/page.tsx`, server): `getConnections()` + render `<ProviderConnect connections={…} />`; staleness/error badge per connection (`status === "error"` → amber "reconnect" hint).

- [ ] **Step 3: Donations** (`(app)/donations/page.tsx`, server): ledger table (Period `monthLabel` / Damage / Multiplier ×N / Donation / Charity / Status badge: `simulated` gray "Simulated (PoC)") + explainer card: production flow = card charged via Every.org on the 1st, we never hold funds. Total-to-date StatCard.

- [ ] **Step 4: Settings** (`(app)/settings/page.tsx`, server + small client form): display name input, MultiplierSlider, CharityPicker (compact), card-on-file (masked `•••• {last4}` + replace via CardFormStub), sign-out, and a "Danger zone" delete-account card (calls a `deleteAccount` action added to actions.ts: `supabase.auth.admin` NOT available client-side — PoC scope: the button shows toast "Contact support in PoC"; do not fake deletion).

- [ ] **Step 5: Verify** `npm run build`. **Step 6: Commit** `git commit -am "feat: dashboard, providers, donations, settings"`

---

### Task 14: Methodology page + cron route + vercel.json

**Files:** Create `src/app/methodology/page.tsx`, `src/app/api/cron/monthly/route.ts`, `vercel.json`

- [ ] **Step 1: Methodology page** (static server component, public): renders the formula pipeline, a table of `MODEL_CLASS_PROFILES` (imported — single source of truth), constants (PUE 1.2, grid 0.38 kg/kWh, water 0.55 L/kWh, SCC $190/t, input-token fraction 0.1), `METHODOLOGY_VERSION`, and citations list (Epoch AI 2025; Luccioni, Jernite & Strubell 2024; EPA 2023 SC-GHG report; Uptime Institute PUE survey; eGRID). Honest-limitations section: estimates not measurements; provider mix unknown; tier numbers are averages.

- [ ] **Step 2: Cron route**

```ts
// src/app/api/cron/monthly/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { runMonthlyCycleForUser, previousPeriod } from "@/lib/cycle";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const period = previousPeriod(new Date());
  const { data: profiles, error } = await supabase.from("profiles").select("id").not("onboarded_at", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results: Record<string, number> = {};
  for (const p of profiles ?? []) {
    try { results[p.id] = (await runMonthlyCycleForUser(supabase, p.id, period)).donationUsd; }
    catch { results[p.id] = -1; }
  }
  return NextResponse.json({ period, users: Object.keys(results).length, results });
}
```

- [ ] **Step 3: vercel.json**

```json
{ "crons": [{ "path": "/api/cron/monthly", "schedule": "0 0 1 * *" }] }
```

- [ ] **Step 4: Verify** `npm run build`. **Step 5: Commit** `git commit -am "feat: methodology page and monthly cron"`

---

### Task 15: Final verification + README

**Files:** Create `README.md`

- [ ] **Step 1:** `npm test` → all green. `npm run build` → clean. `npx tsc --noEmit` → clean.
- [ ] **Step 2:** If Docker available: `npx supabase init; npx supabase start`, put local keys + `openssl rand -hex 32` encryption key in `.env.local`, `npm run dev`, walk the flow: sign up → onboarding (manual entry $10 OpenAI, charity, slider 2.5×, fake card) → dashboard shows stats → Run monthly cycle → donations ledger row appears. If Docker unavailable, note it and stop at build verification.
- [ ] **Step 3: README** — what it is, setup (Supabase project → run migration → `.env.local` from `.env.example` → `npm run dev`), architecture map, methodology pointer, production TODOs (Every.org Partner API swap, real OpenAI/Anthropic/Gemini connectors, min-donation accrual, Google OAuth).
- [ ] **Step 4: Commit** `git commit -am "docs: README"`

---

## Self-review notes

- **Spec coverage:** three usage paths (T6/T12), slider 1–3×/0.25/default 2 (T3 clamp, T11 slider, schema check), cycle on the 1st (T14 cron + T8 orchestrator + manual button T11), simulated Every.org-shaped ledger (T7 schema, T8), methodology page with citations (T14), Stripe-like shadcn UI (T10–13), RLS + encrypted keys (T5/T7), empty/error states (T13). Legal deliverables live in the spec, not code.
- **Known deviation from spec:** auth is email/password + magic link; Google OAuth is env-gated because it needs the user's Google Cloud OAuth credentials. Documented in README.
- **Type consistency check:** `EmissionEstimate` exported from engine and reused in cycle; `Period` from providers/types reused in cycle; `UsageRecordLike` matches snake_case DB rows; `donationForDamage` rounds up, mirrored in cycle test.
