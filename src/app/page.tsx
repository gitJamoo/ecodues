import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Logo size={26} />
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
          <Link href="/login">
            <Button variant="outline" size="sm">Sign in</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
          Open source · Powered by Every.org
        </div>
        <h1 className="text-5xl font-semibold tracking-tight leading-tight mb-6">
          Your AI has a footprint.<br />
          <span className="text-primary">Erase it — twice.</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
          Connect your AI provider accounts. We measure your inference emissions using peer-reviewed research,
          then automatically donate 2× the equivalent damage to climate charities every month.
        </p>
        <Link href="/login">
          <Button size="lg" className="rounded-full px-8">Get started free</Button>
        </Link>
      </main>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[
          { n: "1", title: "Connect", body: "Add your OpenRouter, OpenAI, Anthropic, or Gemini account. Or just pick your subscription tier." },
          { n: "2", title: "We measure", body: "We compute your monthly CO₂e footprint using published energy-per-token estimates and cite every constant." },
          { n: "3", title: "We donate 2×", body: "On the 1st of each month, we donate twice your damage to a climate charity you choose. Via Every.org — we never hold your money." },
        ].map(({ n, title, body }) => (
          <div key={n} className="rounded-xl border border-border p-6">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center mb-4">{n}</div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground">
        EcoDues PoC · <Link href="/methodology" className="underline underline-offset-2">Read the methodology</Link>
      </footer>
    </div>
  );
}
