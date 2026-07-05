import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Privacy Policy · EcoDues",
  description: "How EcoDues collects, stores, and uses your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/"><Logo size={24} /></Link>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in →</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground mb-4">
            Effective July 5, 2026
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground leading-relaxed">
            EcoDues (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is operated at{" "}
            <strong>ecodues.app</strong>. This policy explains what data we collect, why we collect
            it, who processes it, and what rights you have.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Data we collect</h2>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Account credentials</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you sign up with email and password, your credentials are managed by Supabase Auth
              — we never see your raw password. If you sign in with GitHub or Google OAuth, we receive
              only the profile information those providers expose (email address and display name). We
              store your display name so we can address you in emails.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">AI usage records</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We store the usage data you log or that we pull from connected provider APIs: provider
              name, model name, token counts, estimated spend, and the billing period. This is the core
              data that drives our emissions estimates and donation suggestions.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Provider API keys</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you connect an AI provider by pasting an API key, that key is encrypted at rest using
              AES-256-GCM before being written to the database. The key is decrypted only when we need
              to fetch your monthly usage totals from the provider&rsquo;s API, and is never logged or
              transmitted elsewhere.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">Subscription tier</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you select a consumer subscription plan (e.g., ChatGPT Plus) instead of connecting an
              API key, we store that tier selection so we can apply the correct monthly token estimates.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What we do not collect</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <li>We never receive your payment card details or bank information. Donations go directly to PayPal Giving Fund or Every.org under their terms — EcoDues is never in the payment flow.</li>
            <li>We do not run third-party advertising or sell your data to any third party.</li>
            <li>We do not track your browsing behavior across other sites.</li>
            <li>We do not read the content of your AI conversations — only token counts and spend figures.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Infrastructure and subprocessors</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subprocessor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data region</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium">Supabase</td>
                  <td className="px-4 py-3 text-muted-foreground">Database and authentication</td>
                  <td className="px-4 py-3 text-muted-foreground">US (AWS us-east-1)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Vercel</td>
                  <td className="px-4 py-3 text-muted-foreground">Hosting and edge compute</td>
                  <td className="px-4 py-3 text-muted-foreground">US / global edge</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Resend</td>
                  <td className="px-4 py-3 text-muted-foreground">Transactional email delivery</td>
                  <td className="px-4 py-3 text-muted-foreground">US</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">PayPal Giving Fund / Every.org</td>
                  <td className="px-4 py-3 text-muted-foreground">Donation checkout (you transact with them directly)</td>
                  <td className="px-4 py-3 text-muted-foreground">Their own infrastructure</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Emails we send</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We send transactional emails via Resend: monthly usage recaps, donation-ready
            notifications when your offset tab clears a charity&rsquo;s minimum, quarterly
            summaries, and API key error alerts. We do not send marketing emails. You can opt out
            of usage and donation emails at any time from <strong>Settings</strong> in your account,
            or via the unsubscribe link included in any email we send.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Data retention and deletion</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your data is retained for as long as your account is active. You can delete your account
            at any time from <strong>Settings</strong>, which removes your profile, usage records,
            emission estimates, donation ledger entries, and any stored provider connections (including
            encrypted API keys) from our database. Alternatively, email us at{" "}
            <a href="mailto:real.jamesmsmith@gmail.com" className="underline underline-offset-2">
              real.jamesmsmith@gmail.com
            </a>{" "}
            and we will delete your data within 30 days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Provider API keys are encrypted with AES-256-GCM using a server-side key before being
            stored. All data in transit is encrypted via TLS. Database rows are protected by
            row-level security (RLS) policies — users can only read and write their own data.
            Supabase Auth handles password hashing; we never store plaintext passwords.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions about this policy? Email{" "}
            <a href="mailto:real.jamesmsmith@gmail.com" className="underline underline-offset-2">
              real.jamesmsmith@gmail.com
            </a>
            . Site:{" "}
            <a href="https://ecodues.app" className="underline underline-offset-2">
              ecodues.app
            </a>
            .
          </p>
        </section>

        <div className="pt-6 border-t border-border flex items-center justify-between text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">← Home</Link>
          <div className="flex items-center gap-4">
            <Link href="/methodology" className="text-muted-foreground hover:text-foreground">Methodology</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
