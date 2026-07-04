import { createAdminClient } from "@/lib/supabase/admin";
import { runMonthlyCycleForUser, previousPeriod, periodDateString } from "@/lib/cycle";
import { sendEmail, renderDonationEmail } from "@/lib/email";
import { monthLabel } from "@/lib/format";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const period = previousPeriod(new Date());
  const periodDate = periodDateString(period);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .not("onboarded_at", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<string, { donation: number; emailed: boolean }> = {};
  for (const p of profiles ?? []) {
    try {
      const cycle = await runMonthlyCycleForUser(supabase, p.id, period);
      let emailed = false;

      if (cycle.donationUsd > 0) {
        // Grab the auth email + freshly-written ledger row for the checkout link
        const [{ data: authData }, { data: ledger }] = await Promise.all([
          supabase.auth.admin.getUserById(p.id),
          supabase
            .from("donation_ledger")
            .select("checkout_link, charity_id, charities(name)")
            .eq("user_id", p.id)
            .eq("period", periodDate)
            .single(),
        ]);
        const email = authData?.user?.email;
        const checkoutLink = (ledger as { checkout_link?: string | null } | null)?.checkout_link;
        const charityName =
          (ledger as { charities?: { name?: string } | null } | null)?.charities?.name ?? "your chosen charity";

        if (email && checkoutLink) {
          const rendered = renderDonationEmail({
            displayName: (p as { display_name?: string | null }).display_name ?? null,
            periodLabel: monthLabel(periodDate),
            damageUsd: cycle.totalDamageUsd,
            donationUsd: cycle.donationUsd,
            charityName,
            checkoutLink,
          });
          emailed = await sendEmail({ to: email, ...rendered });
        }
      }
      results[p.id] = { donation: cycle.donationUsd, emailed };
    } catch {
      results[p.id] = { donation: -1, emailed: false };
    }
  }
  return NextResponse.json({ period, users: Object.keys(results).length, results });
}
