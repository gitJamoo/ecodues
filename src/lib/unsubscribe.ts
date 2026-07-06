import { createHmac, timingSafeEqual } from "node:crypto";

function hmacKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error("ENCRYPTION_KEY must be 32 bytes hex");
  return Buffer.from(hex, "hex");
}

export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", hmacKey()).update(userId).digest("hex");
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  try {
    const expected = Buffer.from(unsubscribeToken(userId), "hex");
    const provided = Buffer.from(token, "hex");
    return expected.length === provided.length && timingSafeEqual(expected, provided);
  } catch {
    return false;
  }
}

export function unsubscribeUrl(userId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.org";
  const token = unsubscribeToken(userId);
  return `${base}/api/email/unsubscribe?uid=${encodeURIComponent(userId)}&token=${token}`;
}
