import { MODEL_CLASS_PROFILES, PUE, GRID_KG_CO2E_PER_KWH, WATER_L_PER_KWH, SOCIAL_COST_USD_PER_TON_CO2E, INPUT_TOKEN_ENERGY_FRACTION, METHODOLOGY_VERSION } from "@/lib/emissions/constants";
import Link from "next/link";

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="font-semibold text-base tracking-tight">EcoDues</Link>
        <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in →</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground mb-4">
            Version {METHODOLOGY_VERSION}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Methodology</h1>
          <p className="text-muted-foreground leading-relaxed">
            How we estimate the environmental cost of AI inference, and how we translate it into a donation amount.
            Every constant is cited; every formula is auditable.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">The formula</h2>
          <div className="bg-muted rounded-xl p-5 font-mono text-sm space-y-1.5 leading-relaxed">
            <p>kWh = (output_tokens + input_tokens × {INPUT_TOKEN_ENERGY_FRACTION}) × Wh/token × PUE / 1000</p>
            <p>kg CO₂e = kWh × grid_intensity</p>
            <p>liters H₂O = kWh × water_intensity</p>
            <p>damage_$ = (kg CO₂e / 1000) × social_cost_of_carbon</p>
            <p>donation = damage_$ × multiplier</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Constants</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Constant</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Value</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="px-4 py-3">PUE (data center overhead)</td><td className="px-4 py-3 text-right tabular-nums">{PUE}</td><td className="px-4 py-3 text-muted-foreground text-xs">Uptime Institute Global Survey 2023</td></tr>
                <tr><td className="px-4 py-3">Grid intensity</td><td className="px-4 py-3 text-right tabular-nums">{GRID_KG_CO2E_PER_KWH} kg CO₂e/kWh</td><td className="px-4 py-3 text-muted-foreground text-xs">US EPA eGRID national average 2022</td></tr>
                <tr><td className="px-4 py-3">Water intensity</td><td className="px-4 py-3 text-right tabular-nums">{WATER_L_PER_KWH} L/kWh</td><td className="px-4 py-3 text-muted-foreground text-xs">Li et al. 2023, "Making AI Less Thirsty"</td></tr>
                <tr><td className="px-4 py-3">Social cost of carbon</td><td className="px-4 py-3 text-right tabular-nums">${SOCIAL_COST_USD_PER_TON_CO2E}/t CO₂e</td><td className="px-4 py-3 text-muted-foreground text-xs">US EPA 2023 SC-GHG report, central estimate</td></tr>
                <tr><td className="px-4 py-3">Input token energy fraction</td><td className="px-4 py-3 text-right tabular-nums">{INPUT_TOKEN_ENERGY_FRACTION}×</td><td className="px-4 py-3 text-muted-foreground text-xs">Prefill ≪ decode; Luccioni et al. 2024</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Energy per token by model class</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Class</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Wh / output token</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Blended $/MTok (for spend fallback)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(Object.entries(MODEL_CLASS_PROFILES) as [string, { whPerOutputToken: number; blendedUsdPerMTok: number }][]).map(([cls, p]) => (
                  <tr key={cls}>
                    <td className="px-4 py-3 capitalize">{cls}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-xs">{p.whPerOutputToken}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-xs">${p.blendedUsdPerMTok}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Limitations</h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5 leading-relaxed">
            <li>These are estimates, not measurements. Actual energy use varies by data center location, cooling method, utilization, and hardware generation.</li>
            <li>We use a US-average grid intensity. Many large providers use significant renewable energy, which would reduce real-world emissions.</li>
            <li>Subscription tier estimates are derived from published average-usage studies and are inherently approximate.</li>
            <li>The social cost of carbon is contested. $190/t is the EPA 2023 central estimate; ranges from ~$50 to $400+ depending on discount rate and model.</li>
            <li>We donate 2× the estimated damage by default, which is designed to overshoot under any reasonable uncertainty range.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Citations</h2>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 leading-relaxed">
            <li>Luccioni, A., Jernite, Y., &amp; Strubell, E. (2024). <em>Power Hungry Processing: Watts Driving the Cost of AI Deployment?</em> ACM FAccT 2024.</li>
            <li>Epoch AI (2025). <em>How much energy does ChatGPT use?</em></li>
            <li>US EPA (2023). <em>Report on the Social Cost of Greenhouse Gases.</em></li>
            <li>US EPA eGRID (2022). <em>Emissions &amp; Generation Resource Integrated Database.</em></li>
            <li>Uptime Institute (2023). <em>Global Data Center Survey.</em></li>
            <li>Li, P. et al. (2023). <em>Making AI Less &quot;Thirsty&quot;: Uncovering and Addressing the Secret Water Footprint of AI Models.</em></li>
          </ol>
        </section>
      </main>
    </div>
  );
}
