import Link from "next/link";

export const metadata = {
  title: "Terms of Service · EcoDues",
  description: "The terms under which EcoDues provides its service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground mb-4">
            Effective July 5, 2026
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground leading-relaxed">
            These terms govern your use of EcoDues at{" "}
            <strong className="text-foreground">ecodues.app</strong>. By creating an account you agree to them. If
            you don&rsquo;t agree, please don&rsquo;t use the service.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Service provided as-is</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EcoDues is provided <strong className="text-foreground">&ldquo;as is&rdquo;</strong> and{" "}
            <strong className="text-foreground">&ldquo;as available,&rdquo;</strong> without warranty of any kind — express,
            implied, or statutory. We make no guarantees of uptime, accuracy, fitness for a
            particular purpose, or that the service will be error-free. We may change, pause, or
            discontinue the service at any time with reasonable notice where practical.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Emissions figures are estimates, not measurements</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EcoDues calculates the environmental impact of your AI usage using a{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
              published methodology
            </Link>{" "}
            based on published physical constants and peer-reviewed research. These figures are
            estimates. Actual energy consumption, carbon emissions, and climate damage depend on
            factors we cannot observe — data center location, cooling method, grid mix, hardware
            generation, and more. Do not treat EcoDues outputs as authoritative measurements for
            regulatory, scientific, or auditing purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Donations are voluntary and made by you</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            EcoDues suggests a donation amount based on your estimated climate impact. Suggested
            amounts are not bills, obligations, or charges. EcoDues never holds, processes, or
            receives your money. When you choose to donate, you do so directly through{" "}
            <strong className="text-foreground">PayPal Giving Fund</strong> or <strong className="text-foreground">Every.org</strong> under their
            respective terms of service and privacy policies. Your relationship with those
            platforms — including any disputes, refunds, or fee deductions — is entirely between
            you and them.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">No financial or tax advice</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nothing on EcoDues constitutes financial, tax, or legal advice. Whether a donation is
            tax-deductible depends on your jurisdiction and circumstances — consult a qualified
            advisor. Tax receipts, where applicable, are issued by PayPal Giving Fund or Every.org,
            not by EcoDues.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Eligibility and acceptable use</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <li>You must be at least 13 years old to use EcoDues.</li>
            <li>You may only connect API keys that you are authorized to use. Do not connect keys belonging to someone else or to an organization that has not granted you permission.</li>
            <li>Do not use EcoDues to violate the terms of service of any AI provider whose API key you connect.</li>
            <li>Do not attempt to reverse-engineer, scrape, overload, or otherwise abuse the service.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Account termination</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these terms, abuse
            the service, or engage in fraudulent activity. You may delete your own account at any
            time from Settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Limitation of liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To the fullest extent permitted by applicable law, EcoDues and its operators will not
            be liable for any indirect, incidental, special, consequential, or punitive damages
            arising out of your use of — or inability to use — the service, even if we have been
            advised of the possibility of such damages.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Changes to these terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update these terms from time to time. Material changes will be communicated via
            email or a notice in the app. Continued use of EcoDues after a change takes effect
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions about these terms? Email{" "}
            <a href="mailto:real.jamesmsmith@gmail.com" className="underline underline-offset-2 hover:text-foreground">
              real.jamesmsmith@gmail.com
            </a>
            . Site:{" "}
            <a href="https://ecodues.app" className="underline underline-offset-2 hover:text-foreground">
              ecodues.app
            </a>
            .
          </p>
        </section>

        <div className="pt-6 border-t border-border flex items-center justify-between text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">← Home</Link>
          <div className="flex items-center gap-4">
            <Link href="/methodology" className="text-muted-foreground hover:text-foreground">Methodology</Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
