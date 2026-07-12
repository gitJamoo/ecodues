import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.org";

// Structured data for search engines and AI answer engines. Rendered on every
// page; page-specific facts live on the pages themselves.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "EcoDues",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
      sameAs: ["https://github.com/gitJamoo/ecodues"],
      contactPoint: {
        "@type": "ContactPoint",
        email: "real.jamesmsmith@gmail.com",
        contactType: "customer support",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "EcoDues",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: "EcoDues",
      url: SITE_URL,
      description:
        "EcoDues tallies your monthly AI usage across providers, estimates the energy, CO₂e, and social cost it caused using a cited methodology, and helps you donate the offset to vetted climate charities. 100% of donations go to the charity.",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@id": `${SITE_URL}/#organization` },
      featureList: [
        "Track AI usage across OpenAI, Anthropic, OpenRouter, and 30+ providers",
        "Estimate energy (kWh), emissions (kg CO₂e), and social cost (USD) of AI inference",
        "Donate the offset to vetted climate charities via PayPal Giving Fund or Every.org",
        "Fully cited, open-source emissions methodology",
        "CSV export of all personal data",
      ],
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "EcoDues | Make your AI use net-positive",
  description: "Connect your AI providers, see your inference footprint, and automatically donate to offset it — twice.",
  openGraph: {
    title: "EcoDues | Make your AI use net-positive",
    description: "Connect your AI providers, see your inference footprint, and automatically donate to offset it — twice.",
    url: "/",
    siteName: "EcoDues",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoDues | Make your AI use net-positive",
    description: "Connect your AI providers, see your inference footprint, and automatically donate to offset it — twice.",
  },
  // Icons come from the app/ file conventions (icon.svg, icon.png,
  // apple-icon.png) — declaring them here too made browsers pick between
  // duplicate <link rel="icon"> tags.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-full font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
