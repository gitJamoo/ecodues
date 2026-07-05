import { createAdminClient } from "@/lib/supabase/admin";
import { runMonthlyCycleForUser, previousPeriod, periodDateString } from "@/lib/cycle";
import {
  sendEmail,
  renderDonationEmail,
  renderMonthlyRecap,
  renderQuarterlyDigest,
} from "@/lib/email";
import { checkoutFor } from "@/lib/checkout";
import { monthLabel } from "@/lib/format";
import { unsubscribeUrl } from "@/lib/unsubscribe";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 300;

type EmailVariant = "threshold" | "quarterly" | "recap" | "none";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const period = previousPeriod(new Date());
  const periodDate = periodDateString(period);
  const isQuarterEnd = [3, 6, 9, 12].includes(period.month);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .not("onboarded_at", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<string, { donation: number; variant: EmailVariant; emailed: boolean }> = {};
  for (const p of profiles ?? []) {
    try {
      const cycle = await runMonthlyCycleForUser(supabase, p.id, period);

      // Reload the profile — cycle just wrote the new tab balance.
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, charity_id, pending_donation_usd, email_opt_out")
        .eq("id", p.id)
        .single();

      const tab = Number(profile?.pending_donation_usd ?? 0);
      const displayName = profile?.display_name ?? null;

      const { data: charity } = profile?.charity_id
        ? await supabase
            .from("charities")
            .select("id, name, every_org_slug, paypal_giving_fund_url, min_donation_usd")
            .eq("id", profile.charity_id)
            .single()
        : { data: null };

      const charityName = charity?.name ?? "your chosen charity";
      const charityMin = Number(charity?.min_donation_usd ?? 1);

      const { data: authData } = await supabase.auth.admin.getUserById(p.id);
      const email = authData?.user?.email;

      let variant: EmailVariant = "none";
      let emailed = false;

      if (!email || profile?.email_opt_out) {
        results[p.id] = { donation: cycle.donationUsd, variant, emailed };
        continue;
      }

      const checkout = tab > 0 ? checkoutFor(charity ?? null, tab) : null;

      if (tab >= charityMin && checkout) {
        variant = "threshold";
        const rendered = renderDonationEmail({
          displayName,
          periodLabel: monthLabel(periodDate),
          damageUsd: cycle.totalDamageUsd,
          donationUsd: tab,
          charityName,
          checkoutLink: checkout.url,
          provider: checkout.provider,
        });
        emailed = await sendEmail({ to: email, ...rendered, unsubscribeUrl: unsubscribeUrl(p.id) });
      } else if (isQuarterEnd && tab > 0 && tab < charityMin) {
        const { data: reachable } = await supabase
          .from("charities")
          .select("name, min_donation_usd")
          .lte("min_donation_usd", tab)
          .order("min_donation_usd", { ascending: true });
        variant = "quarterly";
        const rendered = renderQuarterlyDigest({
          displayName,
          periodLabel: monthLabel(periodDate),
          tabUsd: tab,
          currentCharity: { name: charityName, minDonationUsd: charityMin },
          reachableCharities: (reachable ?? []).map((c) => ({
            name: c.name as string,
            minDonationUsd: Number(c.min_donation_usd),
          })),
        });
        emailed = await sendEmail({ to: email, ...rendered, unsubscribeUrl: unsubscribeUrl(p.id) });
      } else if (cycle.donationUsd > 0) {
        variant = "recap";
        const rendered = renderMonthlyRecap({
          displayName,
          periodLabel: monthLabel(periodDate),
          damageUsd: cycle.totalDamageUsd,
          addedToTabUsd: cycle.donationUsd,
          tabUsd: tab,
          charityName,
          minDonationUsd: charityMin,
        });
        emailed = await sendEmail({ to: email, ...rendered, unsubscribeUrl: unsubscribeUrl(p.id) });
      }

      if (emailed) {
        await supabase
          .from("profiles")
          .update({ last_reminder_period: periodDate })
          .eq("id", p.id);
      }

      results[p.id] = { donation: cycle.donationUsd, variant, emailed };
    } catch (err) {
      console.error("[cron/monthly] user", p.id, err);
      results[p.id] = { donation: -1, variant: "none", emailed: false };
    }
  }
  return NextResponse.json({ period, users: Object.keys(results).length, results });
}
