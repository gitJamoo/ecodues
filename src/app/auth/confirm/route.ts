import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) redirect("/onboarding");
    // Log the raw Supabase error server-side only — never expose it to the client.
    logger.error("auth/confirm", "OTP verification failed", {
      type,
      rawError: error.message,
    });
  } else {
    logger.warn("auth/confirm", "Missing token_hash or type in confirm link", {
      hasToken: !!token_hash,
      hasType: !!type,
    });
  }
  redirect("/login?error=confirm");
}
