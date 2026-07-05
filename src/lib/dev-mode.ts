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
  pending_donation_usd: 1.24,
  last_reminder_period: "2026-06-01",
  donation_provider: "every_org" as const,
  email_opt_out: false,
};

export const DEV_ESTIMATES = [
  { id: "est-1", user_id: DEV_USER.id, period: "2026-05", kwh: 2.4,  kg_co2e: 0.912, damage_usd: 0.173, provider: "openai",    model_class: "frontier", created_at: "2026-05-31T00:00:00.000Z" },
  { id: "est-2", user_id: DEV_USER.id, period: "2026-06", kwh: 3.1,  kg_co2e: 1.178, damage_usd: 0.224, provider: "anthropic", model_class: "large",    created_at: "2026-06-30T00:00:00.000Z" },
  { id: "est-3", user_id: DEV_USER.id, period: "2026-07", kwh: 1.85, kg_co2e: 0.703, damage_usd: 0.134, provider: "openrouter", model_class: "medium",  created_at: "2026-07-01T00:00:00.000Z" },
];

// Ticker-model rows: donation_usd is what was ACCRUED into the tab that month.
// Status "accrued" = still owed; "paid" = fully offset by a donation_payments row.
export const DEV_LEDGER = [
  { id: "led-1", user_id: DEV_USER.id, period: "2026-07", damage_usd: 0.134, multiplier: 2, donation_usd: 0.268, charity_id: "charity-1", status: "accrued", created_at: "2026-07-01T00:00:00.000Z", charities: { name: "Clean Air Task Force" } },
  { id: "led-2", user_id: DEV_USER.id, period: "2026-06", damage_usd: 0.224, multiplier: 2, donation_usd: 0.448, charity_id: "charity-1", status: "accrued", created_at: "2026-06-30T00:00:00.000Z", charities: { name: "Clean Air Task Force" } },
  { id: "led-3", user_id: DEV_USER.id, period: "2026-05", damage_usd: 0.173, multiplier: 2, donation_usd: 0.346, charity_id: "charity-1", status: "accrued", created_at: "2026-05-31T00:00:00.000Z", charities: { name: "Clean Air Task Force" } },
  { id: "led-4", user_id: DEV_USER.id, period: "2026-04", damage_usd: 0.091, multiplier: 2, donation_usd: 0.182, charity_id: "charity-1", status: "paid",    created_at: "2026-04-30T00:00:00.000Z", charities: { name: "Clean Air Task Force" } },
];

export const DEV_PAYMENTS = [
  { id: "pay-1", user_id: DEV_USER.id, charity_id: "charity-1", amount_usd: 0.18, paid_at: "2026-05-02T14:00:00.000Z", method: "manual", external_id: null,  checkout_link: null, notes: "Paid via Every.org receipt #4021" },
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
  { charity_id: "charity-1",  charity_name: "Clean Air Task Force",              total_donated: 87.45, donor_count: 6 },
  { charity_id: "charity-2",  charity_name: "Carbon180",                         total_donated: 32.10, donor_count: 3 },
  { charity_id: "charity-3",  charity_name: "Rewiring America",                  total_donated: 18.72, donor_count: 4 },
  { charity_id: "charity-4",  charity_name: "Cool Earth",                        total_donated: 12.50, donor_count: 2 },
  { charity_id: "charity-5",  charity_name: "Rainforest Trust",                  total_donated:  8.30, donor_count: 2 },
  { charity_id: "charity-6",  charity_name: "Giving Green",                      total_donated:  5.20, donor_count: 1 },
  { charity_id: "charity-7",  charity_name: "Project Drawdown",                  total_donated:  4.10, donor_count: 1 },
  { charity_id: "charity-8",  charity_name: "RMI",                               total_donated:  3.60, donor_count: 1 },
  { charity_id: "charity-9",  charity_name: "TerraPraxis",                       total_donated:  2.40, donor_count: 1 },
  { charity_id: "charity-10", charity_name: "Environmental Investigation Agency", total_donated: 1.80, donor_count: 1 },
];

// Every.org slugs verified against https://partners.every.org/v0.2/nonprofit/{slug}
// Platform default minimum donation is $1; a charity can raise it via min_value.
// If you add a charity, ping the API endpoint above first — a 404 slug is why
// checkout previously landed on Every.org's generic $10 fallback page.
// min_donation_usd = charity minimum on the selected provider (Every.org platform default is $1).
// paypalGivingFundUrl = PPGF page when the charity is enrolled; 100% delivered
// (PayPal absorbs card fees, PPGF takes no cut). PPGF does NOT support amount
// pre-fill — users must type the amount on landing.
// TODO(charity outreach): confirm each charity's real min_value with partners@every.org.
// TODO(charity outreach): ask non-enrolled charities to sign up for PPGF at paypal.com/us/enroll-charity.
export const DEV_CHARITIES = [
  { id: "charity-1",  name: "Clean Air Task Force",              description: "Founders Pledge top pick: neglected climate tech + policy (nuclear, geothermal, methane).",  category: "climate", url: "https://www.catf.us",              everyOrgSlug: "clean-air-task-force",  min_donation_usd: 1,  paypalGivingFundUrl: "https://www.paypal.com/us/fundraiser/charity/1301357" },
  { id: "charity-5",  name: "Rainforest Trust",                  description: "Purchases and permanently protects tropical forest habitat.",                                 category: "nature",  url: "https://www.rainforesttrust.org",  everyOrgSlug: "rainforest-trust",      min_donation_usd: 1,  paypalGivingFundUrl: "https://www.paypal.com/us/fundraiser/charity/25602" },
  { id: "charity-8",  name: "RMI",                               description: "Market-based decarbonization across power, industry, buildings, and transport.",             category: "energy",  url: "https://rmi.org",                  everyOrgSlug: "rmi",                   min_donation_usd: 1,  paypalGivingFundUrl: "https://www.paypal.com/us/fundraiser/charity/47750" },
  { id: "charity-2",  name: "Carbon180",                         description: "Giving Green recommended: U.S. policy advocacy for scalable carbon removal.",                category: "removal", url: "https://carbon180.org",            everyOrgSlug: "carbon180",             min_donation_usd: 10, paypalGivingFundUrl: null },
  { id: "charity-3",  name: "Rewiring America",                  description: "Electrifying homes and buildings to slash U.S. household emissions.",                        category: "energy",  url: "https://www.rewiringamerica.org",  everyOrgSlug: "rewiring-america-inc",  min_donation_usd: 10, paypalGivingFundUrl: null },
  { id: "charity-4",  name: "Cool Earth",                        description: "Community-led rainforest protection with indigenous partners.",                              category: "nature",  url: "https://www.coolearth.org",        everyOrgSlug: "coolearth",             min_donation_usd: 10, paypalGivingFundUrl: null },
  { id: "charity-6",  name: "Giving Green",                      description: "Evidence-based research identifying the highest-impact climate giving opportunities.",       category: "climate", url: "https://www.givinggreen.earth",    everyOrgSlug: "giving-green",          min_donation_usd: 10, paypalGivingFundUrl: null },
  { id: "charity-7",  name: "Project Drawdown",                  description: "Research and analysis mapping the most effective climate solutions worldwide.",              category: "climate", url: "https://drawdown.org",             everyOrgSlug: "drawdown",              min_donation_usd: 10, paypalGivingFundUrl: null },
  { id: "charity-9",  name: "TerraPraxis",                       description: "Repowering coal plants with advanced nuclear; hard-to-abate industrial decarbonization.",    category: "energy",  url: "https://www.terrapraxis.org",      everyOrgSlug: "terrapraxis",           min_donation_usd: 10, paypalGivingFundUrl: null },
  { id: "charity-10", name: "Environmental Investigation Agency", description: "Undercover investigations driving HFC and methane policy wins worldwide.",                  category: "climate", url: "https://eia-global.org",           everyOrgSlug: "eia-global",            min_donation_usd: 10, paypalGivingFundUrl: null },
];
