"use client";

import Link from "next/link";

export function DevBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-orange-500 text-white text-xs font-semibold py-1.5 px-4">
      <span className="bg-white/20 rounded px-1.5 py-0.5 font-mono tracking-wide">DEV MODE</span>
      <span>Auth bypassed — Supabase not required.</span>
      <span className="text-white/70">·</span>
      <Link href="/onboarding" className="underline underline-offset-2 hover:text-white/80">Onboarding</Link>
      <Link href="/dashboard"  className="underline underline-offset-2 hover:text-white/80">Dashboard</Link>
      <Link href="/providers"  className="underline underline-offset-2 hover:text-white/80">Providers</Link>
      <Link href="/donations"  className="underline underline-offset-2 hover:text-white/80">Donations</Link>
      <Link href="/settings"   className="underline underline-offset-2 hover:text-white/80">Settings</Link>
    </div>
  );
}
