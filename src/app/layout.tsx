import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.app";

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
