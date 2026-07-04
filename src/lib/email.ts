const RESEND_API = "https://api.resend.com/emails";
const FROM = process.env.RESEND_FROM ?? "EcoDues <notifications@ecodues.app>";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to);
    return false;
  }
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html, text }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] fetch failed", err);
    return false;
  }
}

export function renderDonationEmail(opts: {
  displayName: string | null;
  periodLabel: string;
  damageUsd: number;
  donationUsd: number;
  charityName: string;
  checkoutLink: string;
}): { subject: string; html: string; text: string } {
  const { displayName, periodLabel, damageUsd, donationUsd, charityName, checkoutLink } = opts;
  const usd = (n: number) => `$${n.toFixed(2)}`;
  const name = displayName?.trim() || "there";
  const subject = `Your ${periodLabel} donation is ready — ${usd(donationUsd)} to ${charityName}`;

  const text = [
    `Hi ${name},`,
    ``,
    `Your AI usage for ${periodLabel} caused about ${usd(damageUsd)} in climate damage.`,
    `Suggested donation this month: ${usd(donationUsd)} to ${charityName}.`,
    ``,
    `Pay via Every.org (secure, tax-deductible receipt):`,
    checkoutLink,
    ``,
    `EcoDues never touches your money — Every.org is a 501(c)(3) that processes the`,
    `card and routes funds to the nonprofit directly.`,
    ``,
    `— EcoDues`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7e5">
        <tr><td style="padding:32px 32px 24px">
          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5a6b5a;margin-bottom:8px">EcoDues · ${escapeHtml(periodLabel)}</div>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em">Your donation is ready</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4a5a4a">
            Hi ${escapeHtml(name)} — your AI usage this month caused an estimated
            <strong style="color:#1a1a1a">${usd(damageUsd)}</strong> in climate damage.
            Here&rsquo;s a one-click way to offset it.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f5f0;border-radius:8px;margin:0 0 24px">
            <tr><td style="padding:20px 24px">
              <div style="font-size:13px;color:#5a6b5a;margin-bottom:4px">Donation this cycle</div>
              <div style="font-size:32px;font-weight:600;color:#1f5a2f;letter-spacing:-0.02em">${usd(donationUsd)}</div>
              <div style="font-size:13px;color:#5a6b5a;margin-top:6px">to ${escapeHtml(charityName)}</div>
            </td></tr>
          </table>

          <a href="${escapeAttr(checkoutLink)}" style="display:inline-block;background:#1f5a2f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:8px">Pay via Every.org →</a>

          <p style="margin:24px 0 0;font-size:12px;line-height:1.55;color:#7a8a7a">
            Every.org is a 501(c)(3) that processes the payment and issues a tax-deductible receipt.
            EcoDues never touches your money. This link is unique to you.
          </p>
        </td></tr>
      </table>
      <div style="max-width:560px;font-size:11px;color:#9aa89a;margin-top:16px;text-align:center">
        Sent by EcoDues · offset your AI footprint
      </div>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html, text };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
