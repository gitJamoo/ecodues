import { createHmac, timingSafeEqual } from "node:crypto";

function hmacKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error("ENCRYPTION_KEY must be 32 bytes hex");
  return Buffer.from(hex, "hex");
}

const ONE_YEAR_S = 365 * 24 * 60 * 60;

export function unsubscribeToken(userId: string, expiry: number): string {
  return createHmac("sha256", hmacKey()).update(`${userId}:${expiry}`).digest("hex");
}

export function verifyUnsubscribeToken(userId: string, token: string, expiry: number): boolean {
  try {
    if (Math.floor(Date.now() / 1000) > expiry) return false;
    const expected = Buffer.from(unsubscribeToken(userId, expiry), "hex");
    const provided = Buffer.from(token, "hex");
    return expected.length === provided.length && timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export function unsubscribeUrl(userId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.org";
  const expiry = Math.floor(Date.now() / 1000) + ONE_YEAR_S;
  const token = unsubscribeToken(userId, expiry);
  return `${base}/api/email/unsubscribe?uid=${encodeURIComponent(userId)}&token=${token}&exp=${expiry}`;
}
