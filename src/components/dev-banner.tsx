"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export function DevBanner() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!email.trim()) {
      toast.error("Enter an email first");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/dev/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? `Send failed (${res.status})`);
        return;
      }
      toast.success(`Test email sent to ${data.to}`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-orange-500 text-white text-xs font-semibold py-1.5 px-4">
        <span className="bg-white/20 rounded px-1.5 py-0.5 font-mono tracking-wide">DEV MODE</span>
        <span>Auth bypassed — Supabase not required.</span>
        <span className="text-white/70">·</span>
        <Link href="/onboarding" className="underline underline-offset-2 hover:text-white/80">Onboarding</Link>
        <Link href="/dashboard"  className="underline underline-offset-2 hover:text-white/80">Dashboard</Link>
        <Link href="/providers"  className="underline underline-offset-2 hover:text-white/80">Providers</Link>
        <Link href="/donations"  className="underline underline-offset-2 hover:text-white/80">Donations</Link>
        <Link href="/settings"   className="underline underline-offset-2 hover:text-white/80">Settings</Link>
        <span className="text-white/70">·</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="underline underline-offset-2 hover:text-white/80"
        >
          Mock email send
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
          onClick={() => !sending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white text-foreground shadow-xl border border-border p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-base font-semibold">Send test donation email</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Uses the real Resend integration and the same template a user would receive on the 1st.
                Populated with mock data ($0.84 donation to Clean Air Task Force).
              </p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="test-email" className="text-xs font-medium">Recipient</label>
              <input
                id="test-email"
                type="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                  if (e.key === "Escape") setOpen(false);
                }}
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[11px] text-muted-foreground">
                Requires <code className="font-mono">RESEND_API_KEY</code> in <code className="font-mono">.env.local</code>. Sender defaults to <code className="font-mono">RESEND_FROM</code> or <code className="font-mono">notifications@ecodues.app</code>.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {sending ? "Sending…" : "Send test email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
