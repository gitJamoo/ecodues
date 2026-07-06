import { ImageResponse } from "next/og";

export const alt = "EcoDues — Make your AI use net-positive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 18, height: 18, borderRadius: 9, background: "#5fd07f" }} />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: "#f2f7f2", letterSpacing: -1 }}>EcoDues</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 800, color: "#f2f7f2", letterSpacing: -3, lineHeight: 1.1 }}>
            <div style={{ display: "flex" }}>Your AI has a footprint.</div>
            <div style={{ display: "flex", color: "#5fd07f" }}>Erase it.</div>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#cfe3cf", maxWidth: 900, lineHeight: 1.4 }}>
            Measure your inference emissions and donate 1–3× the damage to climate charities you choose.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, color: "#9fbf9f" }}>Open source · Powered by PayPal &amp; Every.org</div>
          <div style={{ display: "flex", fontSize: 26, color: "#9fbf9f" }}>ecodues.app</div>
        </div>
      </div>
    ),
    size,
  );
}
