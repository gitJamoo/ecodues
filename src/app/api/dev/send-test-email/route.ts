import { NextResponse } from "next/server";
import { DEV_MODE } from "@/lib/dev-mode";
import { renderDonationEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!DEV_MODE) {
    return NextResponse.json({ ok: false, error: "Dev mode only" }, { status: 403 });
  }

  let to: string | undefined;
  try {
    const body = await req.json();
    to = typeof body?.to === "string" ? body.to.trim() : undefined;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!to || !/^\S+@\S+\.\S+$/.test(to)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
  }

  const now = new Date();
  const periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const { subject, html, text } = renderDonationEmail({
    displayName: "Dev User",
    periodLabel,
    damageUsd: 0.42,
    donationUsd: 0.84,
    charityName: "Clean Air Task Force",
    checkoutLink: "https://www.every.org/clean-air-task-force?amount=0.84&utm_source=ecodues&utm_campaign=dev-test",
  });

  const hasKey = !!process.env.RESEND_API_KEY;
  const sent = await sendEmail({ to, subject, html, text });

  if (!sent) {
    return NextResponse.json({
      ok: false,
      error: hasKey
        ? "Resend rejected the send — check server logs and RESEND_FROM domain verification."
        : "RESEND_API_KEY is not set. Add it to .env.local to send real emails.",
    }, { status: 500 });
  }

  return NextResponse.json({ ok: true, to, subject });
}
