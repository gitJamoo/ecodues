import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { LOGO_DATA_URI } from "@/lib/brand";

export const runtime = "edge";

// Public, unauthenticated image generator — params are hostile input.
const num = (v: string | null, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0;
};
const str = (v: string | null, maxLen: number) =>
  (v ?? "").replace(/[^\p{L}\p{N} .,'&()-]/gu, "").slice(0, maxLen);

const fmt = (n: number, digits = 1) =>
  n >= 100 ? Math.round(n).toLocaleString("en-US") : n.toFixed(digits);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const period = str(q.get("period"), 24) || "This month";
  const name = str(q.get("name"), 32);
  const kg = num(q.get("kg"), 1_000_000);
  const kwh = num(q.get("kwh"), 10_000_000);
  const damage = num(q.get("damage"), 1_000_000);
  const donated = num(q.get("donated"), 1_000_000);
  const mult = num(q.get("mult"), 100);

  const stat = (label: string, value: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", fontSize: 22, color: "#9fbf9f", letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: "#f2f7f2" }}>{value}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #0c1f10 0%, #14351c 55%, #1f5a2f 100%)",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_DATA_URI} width={36} height={36} alt="" style={{ borderRadius: 8 }} />
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#f2f7f2", letterSpacing: -1 }}>EcoDues</div>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#9fbf9f" }}>{period}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 26, color: "#9fbf9f" }}>
            {name ? `${name}'s AI footprint` : "My AI footprint"}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <div style={{ display: "flex", fontSize: 130, fontWeight: 800, color: "#5fd07f", letterSpacing: -4 }}>
              {fmt(kg, 2)} kg
            </div>
            <div style={{ display: "flex", fontSize: 40, color: "#cfe3cf" }}>CO₂e</div>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#e8f2e8" }}>
            …and I&apos;m offsetting {mult > 0 ? `${fmt(mult, 1)}× ` : ""}the damage it caused.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 56 }}>
            {stat("Energy", `${fmt(kwh)} kWh`)}
            {stat("Climate damage", `$${fmt(damage, 2)}`)}
            {stat("Pledged to charity", `$${fmt(donated, 2)}`)}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#9fbf9f" }}>ecodues.org</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600" },
    },
  );
}
