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

export const DEV_CHARITIES = [
  { id: "charity-1", name: "Clean Air Task Force",          description: "Accelerating zero-carbon energy through policy and innovation.", category: "climate", url: "https://www.catf.us",                                             everyOrgSlug: "clean-air-task-force" },
  { id: "charity-2", name: "Carbon180",                     description: "Scaling carbon removal solutions.",                              category: "climate", url: "https://carbon180.org",                                           everyOrgSlug: "carbon-180" },
  { id: "charity-3", name: "Rewiring America",              description: "Electrifying everything to slash household emissions.",          category: "energy",  url: "https://www.rewiringamerica.org",                                 everyOrgSlug: "rewiring-america" },
  { id: "charity-4", name: "Cool Earth",                    description: "Protecting rainforest with local communities.",                  category: "nature",  url: "https://www.coolearth.org",                                      everyOrgSlug: "cool-earth" },
  { id: "charity-5", name: "Coalition for Rainforest Nations", description: "REDD+ financing to reduce deforestation.",                   category: "nature",  url: "https://www.rainforestcoalition.org",                            everyOrgSlug: "coalition-for-rainforest-nations" },
  { id: "charity-6", name: "Founders Pledge Climate Fund",  description: "Top-recommended charities by expert researchers.",              category: "climate", url: "https://founderspledge.com/funds/climate-change-fund",           everyOrgSlug: "giving-green-fund" },
];
