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

## Marketing Tagline Ideas

> "1 minute, a couple cents each month, clean conscience, cleaner earth."

---

## Production Payment Rail (Every.org)

- Sign up at every.org for a Partner API key
- In `src/lib/cycle.ts`, find the comment `// Simulated ledger row (swap this call for Every.org API in production)`
- Replace the `supabase.from("donation_ledger").upsert(...)` block with a POST to the Every.org charge endpoint
- Every.org handles card processing, disbursement, and donor tax receipts — you never hold funds
