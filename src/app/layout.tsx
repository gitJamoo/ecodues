import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "EcoDues — Make your AI use net-positive",
  description: "Connect your AI providers, see your inference footprint, and automatically donate to offset it — twice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
