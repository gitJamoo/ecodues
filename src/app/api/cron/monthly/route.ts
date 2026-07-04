import { createAdminClient } from "@/lib/supabase/admin";
import { runMonthlyCycleForUser, previousPeriod } from "@/lib/cycle";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const period = previousPeriod(new Date());
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .not("onboarded_at", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Record<string, number> = {};
  for (const p of profiles ?? []) {
    try {
      results[p.id] = (await runMonthlyCycleForUser(supabase, p.id, period)).donationUsd;
    } catch {
      results[p.id] = -1;
    }
  }
  return NextResponse.json({ period, users: Object.keys(results).length, results });
}
