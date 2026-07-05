import { createAdminClient } from "@/lib/supabase/admin";
import { connectorFor } from "@/lib/providers";
import { decryptSecret } from "@/lib/crypto";
import { sendEmail, renderKeyErrorEmail } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { NextResponse, type NextRequest } from "next/server";
import { providerById } from "@/lib/providers/catalog";

export const maxDuration = 300;

// Weekly sweep that validates every active API-key connection. If a key stops
// working, we flip the connection to status=error and email the user so they
// can reconnect BEFORE the monthly cycle needs the key on the 1st.
//
// Scheduled via vercel.json: "0 12 * * 0" (Sundays at 12:00 UTC).

interface Conn {
  id: string;
  user_id: string;
  provider: string;
  kind: string;
  status: string;
  encrypted_key: string | null;
}

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();

  const { data: connections, error } = await supabase
    .from("provider_connections")
    .select("id, user_id, provider, kind, status, encrypted_key")
    .eq("kind", "api_key")
    .eq("status", "active");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Group broken connections by user so each user gets one summary email
  // regardless of how many keys broke.
  const brokenByUser = new Map<string, string[]>();
  let checked = 0;
  let broken = 0;

  for (const conn of (connections ?? []) as Conn[]) {
    checked++;
    if (!conn.encrypted_key) continue;
    const connector = connectorFor(conn.provider as never);
    let ok = false;
    try {
      ok = await connector.validateKey(decryptSecret(conn.encrypted_key));
    } catch {
      ok = false;
    }
    if (ok) continue;

    broken++;
    await supabase
      .from("provider_connections")
      .update({ status: "error" })
      .eq("id", conn.id);

    const label = providerById(conn.provider)?.label ?? conn.provider;
    const arr = brokenByUser.get(conn.user_id) ?? [];
    arr.push(label);
    brokenByUser.set(conn.user_id, arr);
  }

  // Send one summary email per user with broken keys.
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.app";
  const reconnectUrl = `${base}/providers`;
  let emailed = 0;

  for (const [userId, brokenProviders] of brokenByUser) {
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const email = authData?.user?.email;
    if (!email) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email_opt_out")
      .eq("id", userId)
      .single();

    if (profile?.email_opt_out) continue;

    const rendered = renderKeyErrorEmail({
      displayName: profile?.display_name ?? null,
      brokenProviders,
      reconnectUrl,
    });
    const sent = await sendEmail({ to: email, ...rendered, unsubscribeUrl: unsubscribeUrl(userId) });
    if (sent) emailed++;
  }

  return NextResponse.json({
    checked,
    broken,
    usersNotified: emailed,
  });
}
