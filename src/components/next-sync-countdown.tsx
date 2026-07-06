"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// Must match the /api/cron/daily schedule in vercel.json ("0 3 * * *").
const SYNC_HOUR_UTC = 3;

function nextSync(now: Date): Date {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), SYNC_HOUR_UTC));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function NextSyncCountdown() {
  // null until mounted — avoids a server/client hydration mismatch.
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMsLeft(nextSync(new Date()).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const label = (() => {
    if (msLeft === null) return "—";
    const s = Math.max(0, Math.floor(msLeft / 1000));
    return `${Math.floor(s / 3600)}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
  })();

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums"
      title={msLeft !== null ? `Next automatic sync: ${nextSync(new Date()).toLocaleString()}` : undefined}
    >
      <Clock className="w-3.5 h-3.5" />
      Next sync in {label}
    </span>
  );
}
