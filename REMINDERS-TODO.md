# Reminders & Setup TODOs

---

## OAuth Setup (GitHub + Google)

Both providers are wired in the code. You just need to register the apps and paste the credentials into Supabase.

### GitHub

1. Go to **github.com → Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `http://localhost:3000` (update to your prod URL when deploying)
   - Authorization callback URL: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
2. Copy the **Client ID** and **Client Secret**
3. Paste into **Supabase dashboard → Authentication → Providers → GitHub**

### Google

1. Go to **console.cloud.google.com → APIs & Services → Credentials → Create OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
2. Copy the **Client ID** and **Client Secret**
3. Paste into **Supabase dashboard → Authentication → Providers → Google**

> No code changes needed — Supabase handles the OAuth flow and redirects back to `/auth/callback` in the app.

---

## Monthly Donation Emails (Resend)

The 1st-of-month cron builds a per-user Every.org checkout link and emails it. Each user gets a unique link based on their own usage.

1. Sign up at **[resend.com](https://resend.com)** (free tier: 3k emails/mo, 100/day)
2. Verify a sending domain: **Resend → Domains → Add Domain**, then follow the DNS instructions (SPF, DKIM). Until verified, you can only send from `onboarding@resend.dev` to your own email.
3. Create an API key: **[resend.com/api-keys](https://resend.com/api-keys)** → Create API Key (permission: `Sending access`)
4. Set env vars in Vercel:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM="EcoDues <notifications@your-verified-domain.com>"
   ```
5. If `RESEND_API_KEY` is unset, the cron still writes ledger rows — it just skips the email step (logged as a warning).

The dashboard also shows a **pending-payment notification banner** with the same link, so users who miss the email see it in-app until they pay.

---

## Provider Connectors — Where Users Get Keys

- **OpenRouter**: regular API key at [openrouter.ai/keys](https://openrouter.ai/keys)
- **OpenAI**: requires an **Admin key** (`sk-admin-...`) at [platform.openai.com/settings/organization/admin-keys](https://platform.openai.com/settings/organization/admin-keys). Regular API keys can't access the org usage endpoint.
- **Anthropic**: requires an **Admin key** (`sk-ant-admin01-...`) at [console.anthropic.com/settings/admin-keys](https://console.anthropic.com/settings/admin-keys)
- **Gemini**: no per-project usage API exists — use manual entry / paste-parse only. The API-key tab is hidden for this provider.

---

## First-Time Local Setup

1. Create `.env.local` in the project root (copy from `.env.example`)
2. Fill in Supabase URL, anon key, service role key
3. Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. Run the migration: paste `supabase/migrations/0001_init.sql` into Supabase SQL Editor and execute
5. `npm run dev` → open `http://localhost:3000`

---

## Deployment (Vercel)

- Add all `.env.local` vars to Vercel project settings → Environment Variables
- The monthly cron (`0 0 1 * *`) is configured in `vercel.json` — it fires automatically on Vercel
- Update OAuth callback URLs in GitHub/Google consoles to your production domain

---

## Production Payment Rail (Every.org)

- Sign up at [every.org/partners](https://www.every.org/partners) for a Partner API key
- Set `EVERY_ORG_PARTNER_KEY` in env — `src/lib/every-org.ts` starts using it automatically
- Without a key, the app falls back to a pre-filled direct donate URL (also fine — just no partner attribution)
- Every.org handles card processing, disbursement, and donor tax receipts — you never hold funds

---

## Marketing Tagline Ideas

> "1 minute, a couple cents each month, clean conscience, cleaner earth."
