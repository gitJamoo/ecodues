import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // New OAuth users need onboarding; existing users go to dashboard.
      // The onboarding page redirects to /dashboard if already onboarded.
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    // Log the raw error server-side; redirect the user to a generic error state.
    logger.error("auth/callback", "OAuth code exchange failed", {
      rawError: error.message,
    });
  } else {
    logger.warn("auth/callback", "OAuth callback received without a code parameter");
  }

  return NextResponse.redirect(new URL(`/login?error=oauth&next=${next}`, request.url));
}
