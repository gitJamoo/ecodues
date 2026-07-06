/**
 * Shared Zod validation schemas — safe to import in both client and server modules.
 *
 * Keep ALL schema changes here; callers in actions.ts and login/page.tsx
 * import these so the rules stay in sync across the stack.
 *
 * NOTE: Uses Zod v4 API. `required_error` / `invalid_type_error` constructor
 * params were removed in v4 — use `error` for a catch-all type-level message.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Valid email address, max 254 chars (RFC 5321 path limit). */
export const emailSchema = z
  .string({ error: "Enter a valid email address." })
  .email({ message: "Enter a valid email address." })
  .max(254, { message: "Email address is too long." });

/**
 * Password: 8–72 chars.
 * bcrypt silently truncates beyond 72 bytes, turning absurdly long inputs
 * into collisions — reject at the boundary.
 */
export const passwordSchema = z
  .string({ error: "Password is required." })
  .min(8, { message: "Password must be at least 8 characters." })
  .max(72, { message: "Password must be 72 characters or fewer." });

/** Combined sign-in / sign-up schema. */
export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/** Display name / username: 1–32 chars (after trimming whitespace). */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name must be at least 1 character." })
  .max(32, { message: "Name must be 32 characters or fewer." });

// ---------------------------------------------------------------------------
// Usage numbers
// ---------------------------------------------------------------------------

/**
 * Token counts for manual / backfill records.
 * Non-negative finite number, capped at 1 trillion (10¹²).
 */
export const tokensSchema = z
  .number({ error: "Enter a valid token count." })
  .min(0, { message: "Tokens must be 0 or greater." })
  .max(1e12, { message: "Token count is unrealistically large." })
  .refine(Number.isFinite, { message: "Enter a valid token count." });

/**
 * USD spend for manual / backfill records.
 * Non-negative, up to $1,000,000.
 */
export const spendSchema = z
  .number({ error: "Enter a valid spend amount." })
  .min(0, { message: "Spend must be 0 or greater." })
  .max(1_000_000, { message: "Spend amount is too large." })
  .refine(Number.isFinite, { message: "Enter a valid spend amount." });

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

/** Donation payment: strictly positive, up to $1,000,000. */
export const paymentAmountSchema = z
  .number({ error: "Enter a valid amount." })
  .gt(0, { message: "Amount must be greater than zero." })
  .max(1_000_000, { message: "Amount is too large." })
  .refine(Number.isFinite, { message: "Enter a valid amount." });

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------

/** API key: non-empty string, max 256 chars. */
export const apiKeySchema = z
  .string({ error: "API key is required." })
  .min(1, { message: "API key cannot be empty." })
  .max(256, { message: "API key is too long." });

/** Optional human-readable connection label, max 64 chars. */
export const labelSchema = z
  .string()
  .max(64, { message: "Label must be 64 characters or fewer." })
  .optional();

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Extract the first human-readable message from a ZodError. */
export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}
