import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEV_MODE, DEV_USER, DEV_ESTIMATES, DEV_LEDGER } from "@/lib/dev-mode";

// Authenticated CSV export of the caller's own data. Transparency feature:
// everything EcoDues stores about your usage is downloadable.
//   GET /api/export?type=usage|estimates|ledger|payments   (default: usage)

const TABLES = {
  usage: {
    table: "usage_records",
    columns: ["period", "provider", "model", "input_tokens", "output_tokens", "spend_usd", "source", "created_at"],
    order: "period",
  },
  estimates: {
    table: "emission_estimates",
    columns: ["period", "kwh", "kg_co2e", "liters_water", "damage_usd", "methodology_version", "created_at"],
    order: "period",
  },
  ledger: {
    table: "donation_ledger",
    columns: ["period", "damage_usd", "multiplier", "donation_usd", "charity_id", "status", "created_at"],
    order: "period",
  },
  payments: {
    table: "donation_payments",
    columns: ["paid_at", "amount_usd", "charity_id", "method", "external_id", "notes"],
    order: "paid_at",
  },
} as const;

type ExportType = keyof typeof TABLES;

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(columns: readonly string[], rows: Record<string, unknown>[]): string {
  const header = columns.join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(",")).join("\n");
  return body ? `${header}\n${body}\n` : `${header}\n`;
}

export async function GET(req: NextRequest) {
  const typeParam = (req.nextUrl.searchParams.get("type") ?? "usage") as ExportType;
  const spec = TABLES[typeParam];
  if (!spec) return NextResponse.json({ error: "Unknown export type" }, { status: 400 });

  let rows: Record<string, unknown>[];
  if (DEV_MODE) {
    const devData: Record<ExportType, Record<string, unknown>[]> = {
      usage: [],
      estimates: DEV_ESTIMATES as unknown as Record<string, unknown>[],
      ledger: DEV_LEDGER as unknown as Record<string, unknown>[],
      payments: [],
    };
    rows = devData[typeParam];
    void DEV_USER;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase
      .from(spec.table)
      .select(spec.columns.join(","))
      .eq("user_id", user.id)
      .order(spec.order, { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    rows = (data ?? []) as unknown as Record<string, unknown>[];
  }

  const csv = toCsv(spec.columns, rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ecodues-${typeParam}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
