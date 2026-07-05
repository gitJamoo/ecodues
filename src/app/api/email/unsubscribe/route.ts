import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  if (!uid || !token || !verifyUnsubscribeToken(uid, token)) {
    return new Response("Invalid or missing unsubscribe token.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").update({ email_opt_out: true }).eq("id", uid);
  if (error) {
    return new Response("Failed to unsubscribe. Please try again.", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecodues.app";
  const settingsUrl = `${base}/settings`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Unsubscribed — EcoDues</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f6f7f6;color:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh}
.card{background:#fff;border-radius:12px;border:1px solid #e5e7e5;padding:40px 48px;max-width:480px;text-align:center}
h1{margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em}
p{margin:0 0 20px;font-size:15px;line-height:1.55;color:#4a5a4a}
a{color:#1f5a2f;font-weight:500;text-decoration:none}
a:hover{text-decoration:underline}
</style></head>
<body>
  <div class="card">
    <div style="font-size:36px;margin-bottom:16px">&#10003;</div>
    <h1>You're unsubscribed</h1>
    <p>You won't receive any more emails from EcoDues.<br>You can re-enable emails anytime in Settings.</p>
    <a href="${settingsUrl}">Go to Settings &rarr;</a>
  </div>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
