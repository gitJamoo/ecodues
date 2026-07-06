import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // OAuth codes can land on the root when Supabase's redirect-URL allowlist
  // rejects the requested redirectTo and falls back to the Site URL
  // (observed with GitHub login: /?code=...). Forward them to the callback
  // so the code-for-session exchange still runs.
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/" && searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron).*)"],
};
