// Set DEV_MODE=true in .env.local to bypass Supabase auth entirely.
// Never set this in production.
export const DEV_MODE = process.env.DEV_MODE === "true";

export const DEV_USER = {
  id: "dev-user-00000000-0000-0000-0000-000000000000",
  email: "dev@localhost",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as const;

export const DEV_PROFILE = {
  id: DEV_USER.id,
  display_name: "Dev User",
  charity_id: "charity-1",
  multiplier: 2,
  onboarded_at: "2026-01-01T00:00:00.000Z",
};

export const DEV_ESTIMATES = [
  { id: "est-1", user_id: DEV_USER.id, period: "2026-05", kwh: 2.4,  kg_co2e: 0.912, damage_usd: 0.173, provider: "openai",    model_class: "frontier", created_at: "2026-05-31T00:00:00.000Z" },
  { id: "est-2", user_id: DEV_USER.id, period: "2026-06", kwh: 3.1,  kg_co2e: 1.178, damage_usd: 0.224, provider: "anthropic", model_class: "large",    created_at: "2026-06-30T00:00:00.000Z" },
  { id: "est-3", user_id: DEV_USER.id, period: "2026-07", kwh: 1.85, kg_co2e: 0.703, damage_usd: 0.134, provider: "openrouter", model_class: "medium",  created_at: "2026-07-01T00:00:00.000Z" },
];

export const DEV_LEDGER = [
  { id: "led-1", user_id: DEV_USER.id, period: "2026-07", damage_usd: 0.134, multiplier: 2, donation_usd: 0.268, charity_id: "charity-1", status: "simulated", created_at: "2026-07-01T00:00:00.000Z", charities: { name: "Clean Air Task Force" } },
  { id: "led-2", user_id: DEV_USER.id, period: "2026-06", damage_usd: 0.224, multiplier: 2, donation_usd: 0.448, charity_id: "charity-1", status: "simulated", created_at: "2026-06-30T00:00:00.000Z", charities: { name: "Clean Air Task Force" } },
  { id: "led-3", user_id: DEV_USER.id, period: "2026-05", damage_usd: 0.173, multiplier: 2, donation_usd: 0.346, charity_id: "charity-1", status: "simulated", created_at: "2026-05-31T00:00:00.000Z", charities: { name: "Clean Air Task Force" } },
];

export const DEV_USAGE = [
  { id: "use-1", user_id: DEV_USER.id, period: "2026-07", provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct", input_tokens: 800000,  output_tokens: 200000, spend_usd: 1.00, source: "api_key", created_at: "2026-07-01T00:00:00.000Z" },
  { id: "use-2", user_id: DEV_USER.id, period: "2026-06", provider: "anthropic",  model: "claude-3-5-sonnet-20241022",        input_tokens: 300000,  output_tokens:  80000, spend_usd: 4.30, source: "api_key", created_at: "2026-06-30T00:00:00.000Z" },
  { id: "use-3", user_id: DEV_USER.id, period: "2026-06", provider: "openai",     model: "gpt-4o",                            input_tokens: 500000,  output_tokens: 125000, spend_usd: 6.25, source: "api_key", created_at: "2026-06-29T00:00:00.000Z" },
  { id: "use-4", user_id: DEV_USER.id, period: "2026-05", provider: "openai",     model: "gpt-4o-mini",                       input_tokens: 2000000, output_tokens: 400000, spend_usd: 2.00, source: "api_key", created_at: "2026-05-31T00:00:00.000Z" },
];

export const DEV_LEADERBOARD = [
  { rank: 1, display_name: "EarthLover42",   total_donated: 48.20, donation_count: 12 },
  { rank: 2, display_name: "ClimateNerd",    total_donated: 32.55, donation_count:  8 },
  { rank: 3, display_name: "GreenCoder",     total_donated: 19.80, donation_count:  5 },
  { rank: 4, display_name: "Dev User",       total_donated:  1.06, donation_count:  3 },
  { rank: 5, display_name: "SolarPunk",      total_donated: 15.40, donation_count:  4 },
  { rank: 6, display_name: "Anonymous",      total_donated: 12.00, donation_count:  3 },
  { rank: 7, display_name: "DataCarbon",     total_donated:  9.75, donation_count:  3 },
  { rank: 8, display_name: "BytesForEarth",  total_donated:  7.20, donation_count:  2 },
];

export const DEV_CHARITY_TOTALS = [
  { charity_id: "charity-1", charity_name: "Clean Air Task Force",           total_donated: 87.45, donor_count: 6 },
  { charity_id: "charity-2", charity_name: "Carbon180",                      total_donated: 32.10, donor_count: 3 },
  { charity_id: "charity-3", charity_name: "Rewiring America",               total_donated: 18.72, donor_count: 4 },
  { charity_id: "charity-4", charity_name: "Cool Earth",                     total_donated: 12.50, donor_count: 2 },
  { charity_id: "charity-5", charity_name: "Coalition for Rainforest Nations",total_donated:  8.30, donor_count: 2 },
  { charity_id: "charity-6", charity_name: "Founders Pledge Climate Fund",   total_donated:  5.20, donor_count: 1 },
];

export const DEV_CHARITIES = [
  { id: "charity-1", name: "Clean Air Task Force",          description: "Accelerating zero-carbon energy through policy and innovation.", category: "climate", url: "https://www.catf.us",                                             everyOrgSlug: "clean-air-task-force" },
  { id: "charity-2", name: "Carbon180",                     description: "Scaling carbon removal solutions.",                              category: "climate", url: "https://carbon180.org",                                           everyOrgSlug: "carbon-180" },
  { id: "charity-3", name: "Rewiring America",              description: "Electrifying everything to slash household emissions.",          category: "energy",  url: "https://www.rewiringamerica.org",                                 everyOrgSlug: "rewiring-america" },
  { id: "charity-4", name: "Cool Earth",                    description: "Protecting rainforest with local communities.",                  category: "nature",  url: "https://www.coolearth.org",                                      everyOrgSlug: "cool-earth" },
  { id: "charity-5", name: "Coalition for Rainforest Nations", description: "REDD+ financing to reduce deforestation.",                   category: "nature",  url: "https://www.rainforestcoalition.org",                            everyOrgSlug: "coalition-for-rainforest-nations" },
  { id: "charity-6", name: "Founders Pledge Climate Fund",  description: "Top-recommended charities by expert researchers.",              category: "climate", url: "https://founderspledge.com/funds/climate-change-fund",           everyOrgSlug: "giving-green-fund" },
];
