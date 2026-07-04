# EcoDues Design Document

## Brand Identity

**Name:** EcoDues  
**Tagline:** Make your AI use net-positive  
**Domain:** ecodues.org  
**Mission:** Automatically offset the environmental damage from AI inference — at twice the cost.

### Logo

Two leaf shapes stacked vertically on a dark rounded square (#081B17). The leaves share a gradient from light (#8CF76B) to brand green (#33C35D), evoking growth and forward motion. The mark is compact enough to work at 16px favicon size and scales to full-page hero treatment.

The name "EcoDues" communicates: you owe a debt (dues) to the ecology (eco). Not guilt — obligation met automatically.

### Color Palette

| Token | Hex | OKLCh | Use |
|---|---|---|---|
| Brand green | `#33C35D` | `oklch(0.69 0.19 145)` | Primary actions, active states, data highlights |
| Light green | `#8CF76B` | `oklch(0.83 0.18 135)` | Gradient start, decorative |
| Logo bg | `#081B17` | — | Logo background only |
| Slate 900 | `#0F172A` | `oklch(0.13 0.025 258)` | Body text, headings |
| Off-white | `#F8FAFC` | `oklch(0.975 0.003 260)` | Page backgrounds, muted surfaces |
| Mid-gray | ~`#6B7280` | `oklch(0.50 0.018 258)` | Secondary text, metadata |
| Border | — | `oklch(0.92 0.005 260)` | Dividers, card outlines |

No secondary brand color. The green is the only accent — used sparingly so it retains impact.

### Typography

**Font:** Geist (by Vercel) — served from the `geist` npm package, not Google Fonts, for Turbopack compatibility.

- **Geist Sans** — all body, labels, UI text. Variable registered as `--font-geist-sans`.
- **Geist Mono** — code, token counts, emission numbers. Variable registered as `--font-geist-mono`.

**Weight usage:**
- `font-semibold` (600) for headings, nav wordmark, card titles
- `font-medium` (500) for labels, button text
- Default weight (400) for body copy

**Scale:** Standard Tailwind type scale. `text-5xl font-semibold` for the landing hero; `text-sm` for all dashboard metadata.

---

## Layout System

### Public pages (landing, login, methodology)

Full-width with a `max-w-3xl` or `max-w-4xl` content column. Minimal chrome — top nav with logo left, actions right. White background. Footer is a single `border-t` line with methodology link.

### App pages (dashboard, providers, donations, settings)

Fixed left sidebar (`w-56`) with logo at top, nav links, and user email + sign-out at bottom. Main content area is `ml-56 px-8 py-10 max-w-5xl`. Background is `bg-muted/30` (very light gray wash) to distinguish from white card surfaces.

**Dev banner:** When `DEV_MODE=true`, an `h-8` orange fixed banner pins to the top. The sidebar and main content shift down `pt-8` to avoid overlap.

---

## Page Designs

### Landing (`/`)

Hero-centered layout. Badge pill with "Open source · Powered by Every.org". Large `text-5xl` heading: "Your AI has a footprint. **Erase it — twice.**" with the second line in `text-primary`. Single CTA button ("Get started free") in `rounded-full` style. Three `rounded-xl border` cards below for the three-step process.

### Login (`/login`)

White card on muted gray background. Logo centered above card. OAuth buttons (GitHub, Google) first, then `or` divider, then email/password tabs. Magic link option in ghost button below sign-in form.

### Dashboard (`/dashboard`)

Summary cards row: total CO₂e, damage USD, donation USD. Then a usage timeline chart. Then a connections summary. All using shadcn Card components with `rounded-xl border`.

### Providers (`/providers`)

Per-provider cards, each with a connect/disconnect toggle. API key input or tier picker depending on provider type. Subscription tier cards show name, token estimate, and a usage % slider (5–100%) for scaling. Live preview table updates as % changes.

### Settings (`/settings`)

Charity picker (card grid, one selected at a time — highlighted with `ring-2 ring-primary`). Multiplier slider (1×–3×, default 2×) with a live pill showing: `$X.XX damage × 2.00 = $Y.YY/mo`. Learn More links on charity cards open in new tab.

### Methodology (`/methodology`)

Long-form read. Single column, prose sizing. All constants cited inline in a `<table>` with source links. Versioned with `METHODOLOGY_VERSION` from constants.

---

## Component Patterns

### Cards

`rounded-xl border border-border bg-white p-6 shadow-sm` — the standard card. Never use `shadow-md` or higher; shadows are for modals/dropdowns only.

### Buttons

- Primary: `bg-primary text-primary-foreground hover:bg-primary/90` — green fill
- Outline: `border border-border bg-white hover:bg-muted` — for secondary actions
- Ghost: `hover:bg-muted` — for tertiary / destructive-adjacent

Pill style (`rounded-full`) used only on the landing CTA. All other buttons use default `rounded-md`.

### Slider

Custom native `<input type="range">` wrapper in `src/components/ui/slider.tsx`. Transparent range input handles all interaction; a CSS track/fill/thumb layer sits behind it. Exposes the same API as Radix Slider (`value: number[]`, `onValueChange: (v: number[]) => void`) for drop-in compatibility with shadcn consumers.

### Badges / pills

`inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary` — used for status indicators and the landing badge. Never use colored backgrounds other than `primary/10` or `muted`.

---

## Data Visualization

Charts use `recharts` via shadcn. Color tokens:
- `chart-1`: `#33C35D` (brand green) — primary series
- `chart-2`: `#8CF76B` (light green) — secondary series
- `chart-3–5`: desaturated greens / blues — tertiary

No pie charts. Bar or area charts only — CO₂e and donation amounts are naturally time-series data.

---

## Iconography

Lucide React icons throughout — same library as shadcn. Size `w-4 h-4` in nav and list items, `w-5 h-5` for standalone decorative icons. Stroke width default (1.5px). No filled icons.

---

## Voice & Copy

- Direct and factual, never alarmist
- Numbers are always shown with units (kg CO₂e, kWh, USD)
- "Damage" not "impact" — we use the social cost of carbon framing explicitly
- "Donate" not "offset" — we donate money to climate orgs, not buy carbon credits
- Short sentences. No em-dashes in UI copy (only in the methodology doc)

---

## Accessibility

- All interactive elements have visible focus rings (`ring-2 ring-ring`)
- Color is never the sole carrier of information (e.g., the slider shows a numeric value alongside the visual position)
- Charity picker cards use `role="radio"` semantics via the button element
- Minimum touch target `44px` via Tailwind `min-h-[44px]` on mobile-relevant controls
