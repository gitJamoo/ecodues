import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

// Public, unauthenticated page — params are hostile input. Same sanitizers
// as /api/share-card; only sanitized values are forwarded to the image URL.
const num = (v: string | undefined, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
};
const str = (v: string | undefined, maxLen: number) =>
  (v ?? "").replace(/[^\p{L}\p{N} .,'&()-]/gu, "").slice(0, maxLen);

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function parseCard(sp: Record<string, string | string[] | undefined>) {
  const period = str(first(sp.period), 24) || "This month";
  const name = str(first(sp.name), 32);
  const kg = num(first(sp.kg), 1_000_000);
  const mult = num(first(sp.mult), 100);

  const params = new URLSearchParams({
    period,
    kg: String(kg),
    kwh: String(num(first(sp.kwh), 10_000_000)),
    damage: String(num(first(sp.damage), 1_000_000)),
    donated: String(num(first(sp.donated), 1_000_000)),
    mult: String(mult),
  });
  if (name) params.set("name", name);

  return { period, name, kg, mult, imageUrl: `/api/share-card?${params.toString()}` };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { period, name, kg, mult, imageUrl } = parseCard(await searchParams);
  const title = name ? `${name}'s AI footprint · EcoDues` : "My AI footprint · EcoDues";
  const description = `${kg.toFixed(2)} kg of CO₂e (${period.toLowerCase()}) — offset ${mult > 0 ? `${mult}× ` : ""}through climate donations.`;
  return {
    title,
    description,
    // Individual share links shouldn't compete with the homepage in search.
    robots: { index: false },
    openGraph: {
      title,
      description,
      siteName: "EcoDues",
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: { searchParams: SearchParams }) {
  const { period, name, imageUrl } = parseCard(await searchParams);
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/"><Logo size={24} /></Link>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in →</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16 space-y-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {name ? `${name}'s AI footprint` : "An AI footprint"} — and the offset erasing it
        </h1>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`EcoDues impact card for ${period}`}
          className="w-full rounded-xl border border-border"
          width={1200}
          height={630}
        />
        <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
          EcoDues measures the emissions behind your AI usage with a cited, auditable
          methodology — then helps you donate a multiple of the damage to climate charities.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-full px-8">Track your own footprint</Button>
        </Link>
      </main>
    </div>
  );
}
