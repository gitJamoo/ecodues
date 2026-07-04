import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Every.org sends a POST to this endpoint when a donation is confirmed.
// Configure the webhook URL in your Every.org partner dashboard:
//   https://your-domain.com/api/webhooks/every-org
//
// Set EVERY_ORG_WEBHOOK_TOKEN in env to validate incoming requests.
// Every.org docs: https://docs.every.org/docs/webhooks

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate webhook token if configured
  const webhookToken = process.env.EVERY_ORG_WEBHOOK_TOKEN;
  if (webhookToken) {
    const incoming = req.headers.get("x-every-org-webhook-token") ?? body.webhookToken;
    if (incoming !== webhookToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // We only care about successful charges
  const type = body.type as string | undefined;
  if (type !== "donation.succeeded" && type !== "donation.created") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const data = body.data as Record<string, unknown> | undefined;
  const partnerDonationId = data?.partnerDonationId as string | undefined;
  const everyOrgId = data?.id as string | undefined;

  if (!partnerDonationId) {
    return NextResponse.json({ error: "Missing partnerDonationId" }, { status: 400 });
  }

  // partnerDonationId format: "{userId}:{periodDate}" e.g. "abc-123:2026-06-01"
  const colonIdx = partnerDonationId.indexOf(":");
  if (colonIdx === -1) {
    return NextResponse.json({ error: "Malformed partnerDonationId" }, { status: 400 });
  }
  const userId = partnerDonationId.slice(0, colonIdx);
  const period = partnerDonationId.slice(colonIdx + 1);

  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_ledger")
    .update({ status: "completed", every_org_id: everyOrgId ?? null })
    .eq("user_id", userId)
    .eq("period", period);

  if (error) {
    console.error("[every-org webhook] DB update failed:", error.message);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
