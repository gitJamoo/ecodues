import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoDues — Make your AI use net-positive",
  description: "Connect your AI providers, see your inference footprint, and automatically donate to offset it — twice.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
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
