const RESEND_API = "https://api.resend.com/emails";
// Default sender lives on ecodues.org — the Resend-verified sending domain.
const FROM = process.env.RESEND_FROM ?? "EcoDues <notifications@ecodues.org>";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl?: string;
}

export async function sendEmail({ to, subject, html, text, unsubscribeUrl }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to);
    return false;
  }
  let finalHtml = html;
  let finalText = text;
  const extra: Record<string, unknown> = {};
  if (unsubscribeUrl) {
    const u = escapeAttr(unsubscribeUrl);
    finalHtml = html.replace(
      "</body></html>",
      `      <div style="max-width:560px;font-size:11px;color:#9aa89a;margin-top:4px;text-align:center"><a href="${u}" style="color:#9aa89a;text-decoration:underline">Unsubscribe from these emails</a></div>\n</body></html>`,
    );
    finalText = text + `\n\nUnsubscribe: ${unsubscribeUrl}`;
    extra.headers = { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" };
  }
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html: finalHtml, text: finalText, ...extra }),
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

export function renderWelcomeEmail(opts: {
  displayName: string | null;
}): { subject: string; html: string; text: string } {
  const name = opts.displayName?.trim() || "there";
  const subject = "Welcome to EcoDues — your AI footprint, offset";

  const text = [
    `Hi ${name},`,
    ``,
    `Welcome to EcoDues! Here's how it works from here:`,
    ``,
    `Each month we tally your AI usage, estimate the climate damage it caused`,
    `using our published methodology (https://ecodues.app/methodology), and add`,
    `the offset amount to your tab. When your tab crosses your charity's minimum,`,
    `we email you a one-click donation link — EcoDues never touches your money.`,
    ``,
    `Your first monthly email arrives on the 1st. Until then, connect your AI`,
    `providers for automatic tracking: https://ecodues.app/providers`,
    ``,
    `— EcoDues`,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7e5">
        <tr><td style="padding:32px 32px 24px">
          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5a6b5a;margin-bottom:8px">EcoDues · welcome</div>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em">Your AI use is about to go net-positive</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#4a5a4a">
            Hi ${escapeHtml(name)} — welcome to EcoDues. Each month we tally your AI usage,
            estimate the climate damage it caused using our
            <a href="https://ecodues.app/methodology" style="color:#1f5a2f">published methodology</a>,
            and add the offset to your tab.
          </p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4a5a4a">
            When your tab crosses your charity&rsquo;s minimum, you get a one-click donation
            link. EcoDues never touches your money &mdash; payments go straight to the
            nonprofit via PayPal Giving Fund or Every.org.
          </p>

          <a href="https://ecodues.app/providers" style="display:inline-block;background:#1f5a2f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:8px">Connect your providers →</a>

          <p style="margin:24px 0 0;font-size:12px;line-height:1.55;color:#7a8a7a">
            Your first monthly email arrives on the 1st. Connecting providers now means
            zero manual entry later.
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

export function renderDonationEmail(opts: {
  displayName: string | null;
  periodLabel: string;
  damageUsd: number;
  donationUsd: number;
  charityName: string;
  checkoutLink: string;
  provider: "ppgf" | "every_org";
}): { subject: string; html: string; text: string } {
  const { displayName, periodLabel, damageUsd, donationUsd, charityName, checkoutLink, provider } = opts;
  const usd = (n: number) => `$${n.toFixed(2)}`;
  const name = displayName?.trim() || "there";
  const isPpgf = provider === "ppgf";
  const providerLabel = isPpgf ? "PayPal Giving Fund" : "Every.org";
  const subject = `Your ${periodLabel} donation is ready — ${usd(donationUsd)} to ${charityName}`;

  const providerLineText = isPpgf
    ? [
        `Donate via PayPal Giving Fund — passes 100% to the charity (PayPal covers all card fees):`,
        checkoutLink,
        ``,
        `Heads up: PayPal Giving Fund does not pre-fill amounts. Please enter ${usd(donationUsd)} on the PayPal page.`,
      ]
    : [
        `Pay via Every.org (secure, tax-deductible receipt) — the amount is pre-filled:`,
        checkoutLink,
        ``,
        `Tip: check the "cover the fees" box on Every.org so 100% reaches the charity.`,
      ];

  const text = [
    `Hi ${name},`,
    ``,
    `Your AI usage for ${periodLabel} caused about ${usd(damageUsd)} in climate damage.`,
    `Suggested donation this month: ${usd(donationUsd)} to ${charityName}.`,
    ``,
    ...providerLineText,
    ``,
    `EcoDues never touches your money — ${providerLabel} processes the payment`,
    `and routes funds to the nonprofit directly, with a tax-deductible receipt.`,
    ``,
    `— EcoDues`,
  ].join("\n");

  const ppgfNoticeHtml = isPpgf
    ? `<div style="margin:0 0 20px;padding:12px 14px;border-radius:8px;background:#fff8e6;border:1px solid #f5d67a;font-size:12px;line-height:1.5;color:#7a5a10">
          <strong style="color:#5a4408">Enter ${usd(donationUsd)} on the PayPal page.</strong>
          PayPal Giving Fund doesn&rsquo;t pre-fill donation amounts — you&rsquo;ll need to type it in.
        </div>`
    : `<div style="margin:0 0 20px;padding:12px 14px;border-radius:8px;background:#eef5ee;border:1px solid #c5dbc5;font-size:12px;line-height:1.5;color:#3a4a3a">
          Check the <strong>&ldquo;cover the fees&rdquo;</strong> box on Every.org so 100% reaches ${escapeHtml(charityName)}.
        </div>`;

  const buttonBg = isPpgf ? "#003087" : "#1f5a2f";
  const buttonLabel = isPpgf ? "Donate via PayPal (100%) →" : "Pay via Every.org →";
  const feeLine = isPpgf
    ? `${escapeHtml(providerLabel)} is a 501(c)(3) that receives your gift and grants it to ${escapeHtml(charityName)}. PayPal absorbs all card processing — 100% reaches the charity.`
    : `Every.org is a 501(c)(3) that processes the payment and issues a tax-deductible receipt.`;

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
            Here&rsquo;s a one-click way to offset it via <strong>${escapeHtml(providerLabel)}</strong>.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f5f0;border-radius:8px;margin:0 0 20px">
            <tr><td style="padding:20px 24px">
              <div style="font-size:13px;color:#5a6b5a;margin-bottom:4px">Donation this cycle</div>
              <div style="font-size:32px;font-weight:600;color:#1f5a2f;letter-spacing:-0.02em">${usd(donationUsd)}</div>
              <div style="font-size:13px;color:#5a6b5a;margin-top:6px">to ${escapeHtml(charityName)}</div>
            </td></tr>
          </table>

          ${ppgfNoticeHtml}

          <a href="${escapeAttr(checkoutLink)}" style="display:inline-block;background:${buttonBg};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:8px">${buttonLabel}</a>

          <p style="margin:24px 0 0;font-size:12px;line-height:1.55;color:#7a8a7a">
            ${feeLine} EcoDues never touches your money. This link is unique to you.
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

export function renderMonthlyRecap(opts: {
  displayName: string | null;
  periodLabel: string;
  damageUsd: number;
  addedToTabUsd: number;
  tabUsd: number;
  charityName: string;
  minDonationUsd: number;
}): { subject: string; html: string; text: string } {
  const { displayName, periodLabel, damageUsd, addedToTabUsd, tabUsd, charityName, minDonationUsd } = opts;
  const usd = (n: number) => `$${n.toFixed(2)}`;
  const name = displayName?.trim() || "there";
  const remaining = Math.max(0, minDonationUsd - tabUsd);
  const pct = Math.min(100, Math.round((tabUsd / minDonationUsd) * 100));
  const subject = `Your ${periodLabel} footprint — ${usd(tabUsd)} in the tank`;

  const text = [
    `Hi ${name},`,
    ``,
    `Your AI usage for ${periodLabel} caused about ${usd(damageUsd)} in climate damage.`,
    `Added ${usd(addedToTabUsd)} to your offset tab — total balance is now ${usd(tabUsd)}.`,
    ``,
    `You need ${usd(remaining)} more before you can donate to ${charityName} (${usd(minDonationUsd)} minimum).`,
    `We'll email you a one-click Every.org link the moment you cross that line.`,
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
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em">Building up your offset tab</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4a5a4a">
            Hi ${escapeHtml(name)} — this month&rsquo;s AI usage caused an estimated
            <strong style="color:#1a1a1a">${usd(damageUsd)}</strong> in climate damage.
            We added <strong>${usd(addedToTabUsd)}</strong> to your tab.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f5f0;border-radius:8px;margin:0 0 20px">
            <tr><td style="padding:20px 24px">
              <div style="font-size:13px;color:#5a6b5a;margin-bottom:4px">Tab balance</div>
              <div style="font-size:32px;font-weight:600;color:#1f5a2f;letter-spacing:-0.02em">${usd(tabUsd)}</div>
              <div style="font-size:13px;color:#5a6b5a;margin-top:6px">${usd(remaining)} to go before you can donate to ${escapeHtml(charityName)}</div>
              <div style="margin-top:12px;height:6px;background:#dfe8df;border-radius:3px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:#1f5a2f"></div>
              </div>
            </td></tr>
          </table>

          <p style="margin:0 0 0;font-size:13px;line-height:1.55;color:#7a8a7a">
            We&rsquo;ll email a one-click Every.org link the moment your tab crosses ${escapeHtml(charityName)}&rsquo;s ${usd(minDonationUsd)} minimum.
            Prefer a charity with a lower minimum? Change it in your dashboard anytime — your tab carries over.
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

export function renderQuarterlyDigest(opts: {
  displayName: string | null;
  periodLabel: string;
  tabUsd: number;
  currentCharity: { name: string; minDonationUsd: number };
  reachableCharities: Array<{ name: string; minDonationUsd: number }>;
}): { subject: string; html: string; text: string } {
  const { displayName, periodLabel, tabUsd, currentCharity, reachableCharities } = opts;
  const usd = (n: number) => `$${n.toFixed(2)}`;
  const name = displayName?.trim() || "there";
  const subject = `Quarterly update — ${usd(tabUsd)} accrued, ${reachableCharities.length} charities in reach`;

  const listText = reachableCharities.length
    ? reachableCharities.map((c) => `  • ${c.name} (${usd(c.minDonationUsd)} min)`).join("\n")
    : "  (none yet — keep building)";

  const text = [
    `Hi ${name},`,
    ``,
    `A quarter has passed and your offset tab sits at ${usd(tabUsd)}.`,
    `That&rsquo;s still under ${currentCharity.name}&rsquo;s ${usd(currentCharity.minDonationUsd)} minimum,`,
    `but these charities accept donations at your level right now:`,
    ``,
    listText,
    ``,
    `Switch your selected charity in your dashboard — your tab carries over.`,
    ``,
    `— EcoDues`,
  ].join("\n");

  const listHtml = reachableCharities.length
    ? reachableCharities
        .map(
          (c) => `
              <tr><td style="padding:10px 0;border-top:1px solid #e5e7e5">
                <div style="font-size:14px;font-weight:500;color:#1a1a1a">${escapeHtml(c.name)}</div>
                <div style="font-size:12px;color:#7a8a7a;margin-top:2px">${usd(c.minDonationUsd)} minimum</div>
              </td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:10px 0;font-size:13px;color:#7a8a7a">No charities reachable yet — keep building.</td></tr>`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7e5">
        <tr><td style="padding:32px 32px 24px">
          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5a6b5a;margin-bottom:8px">EcoDues · quarterly update · ${escapeHtml(periodLabel)}</div>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em">Charities you can reach right now</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4a5a4a">
            Hi ${escapeHtml(name)} — your offset tab is at <strong style="color:#1a1a1a">${usd(tabUsd)}</strong>.
            That&rsquo;s still under ${escapeHtml(currentCharity.name)}&rsquo;s ${usd(currentCharity.minDonationUsd)} minimum,
            but you have options:
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px">
            ${listHtml}
          </table>

          <p style="margin:0 0 0;font-size:13px;line-height:1.55;color:#7a8a7a">
            Switch your selected charity in your dashboard — your tab carries over.
            Or stick with ${escapeHtml(currentCharity.name)} and keep building.
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

export function renderKeyErrorEmail(opts: {
  displayName: string | null;
  brokenProviders: string[];
  reconnectUrl: string;
}): { subject: string; html: string; text: string } {
  const { displayName, brokenProviders, reconnectUrl } = opts;
  const name = displayName?.trim() || "there";
  const list = brokenProviders.join(", ");
  const subject =
    brokenProviders.length === 1
      ? `Reconnect your ${brokenProviders[0]} key — auto-tracking is paused`
      : `Reconnect ${brokenProviders.length} API keys — auto-tracking is paused`;

  const text = [
    `Hi ${name},`,
    ``,
    `We tried to validate your API keys as part of our weekly health check and`,
    `one or more didn't work: ${list}.`,
    ``,
    `That means we can't auto-pull usage from ${brokenProviders.length === 1 ? "that provider" : "those providers"}`,
    `on the 1st when the monthly cycle runs. Nothing bad happens — we just won't`,
    `count that traffic against your offset unless you reconnect.`,
    ``,
    `Fix it in ~30 seconds:`,
    reconnectUrl,
    ``,
    `Common reasons keys stop working:`,
    `  · You rotated it in the provider dashboard`,
    `  · The Admin key was revoked by an org owner`,
    `  · The key expired (Anthropic Admin keys don't expire; OpenAI Admin keys can)`,
    ``,
    `— EcoDues`,
  ].join("\n");

  const listHtml = brokenProviders
    .map(
      (p) => `
              <tr><td style="padding:8px 0;border-top:1px solid #e5e7e5">
                <span style="font-family:ui-monospace,SFMono-Regular,monospace;font-size:13px;color:#1a1a1a">${escapeHtml(p)}</span>
              </td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7e5">
        <tr><td style="padding:32px 32px 24px">
          <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#a15a10;margin-bottom:8px">EcoDues · action needed</div>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;letter-spacing:-0.01em">Reconnect your API ${brokenProviders.length === 1 ? "key" : "keys"}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#4a5a4a">
            Hi ${escapeHtml(name)} — during this week&rsquo;s health check we couldn&rsquo;t validate
            ${brokenProviders.length === 1 ? "your key for" : "your keys for"}:
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e6;border:1px solid #f5d67a;border-radius:8px;padding:8px 16px;margin:0 0 20px">
            ${listHtml}
          </table>

          <p style="margin:0 0 20px;font-size:14px;line-height:1.55;color:#4a5a4a">
            Auto-pull is paused for ${brokenProviders.length === 1 ? "that provider" : "those providers"} until you reconnect.
            Reconnecting takes ~30 seconds — just paste a fresh Admin key.
          </p>

          <a href="${escapeAttr(reconnectUrl)}" style="display:inline-block;background:#1f5a2f;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:8px">Reconnect now →</a>

          <p style="margin:24px 0 0;font-size:12px;line-height:1.55;color:#7a8a7a">
            Not sure why it broke? Common reasons: you rotated it, an org owner revoked it,
            or (for OpenAI) the Admin key expired. EcoDues never touches your keys after
            you paste them — they&rsquo;re encrypted with AES-256 at rest.
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
