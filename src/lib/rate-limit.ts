// Best-effort in-memory sliding-window rate limiter, zero dependencies.
//
// Under Vercel Fluid Compute instances are reused across requests, so this
// catches bursts from a single user, but it is NOT a distributed limiter —
// separate instances keep separate counters. Upgrade path: @upstash/ratelimit.
//
// Note: signup itself goes browser → Supabase directly and never touches our
// server, so it can't be limited here — Supabase's built-in auth rate limits
// plus email confirmation cover that surface.

const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

/** Returns true if the call is allowed, false if the key is over the limit. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size > MAX_KEYS) buckets.clear();

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

export const RATE_LIMITED_ERROR = "Too many requests — try again in a minute.";
