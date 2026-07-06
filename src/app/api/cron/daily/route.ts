import { createAdminClient } from "@/lib/supabase/admin";
import { runMonthlyCycleForUser, currentPeriod } from "@/lib/cycle";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 300;

/**
 * Daily ticker sync (03:00 UTC): refresh the IN-PROGRESS month for every
 * onboarded user — API connectors re-fetched, tier estimates prorated by days
 * elapsed — and accrue the delta into the tab. No emails here; threshold /
 * recap / quarterly emails stay with the monthly cron on the 1st.
 */
export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const period = currentPeriod(new Date());

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .not("onboarded_at", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<string, { damageUsd: number; donationUsd: number } | "error"> = {};
  for (const p of profiles ?? []) {
    try {
      const cycle = await runMonthlyCycleForUser(supabase, p.id, period);
      results[p.id] = { damageUsd: cycle.totalDamageUsd, donationUsd: cycle.donationUsd };
    } catch (err) {
      console.error("[cron/daily] user", p.id, err);
      results[p.id] = "error";
    }
  }
  return NextResponse.json({ period, users: Object.keys(results).length, results });
}
