# Future Ideas — EcoDues

Handwritten notes. Not prioritized. Just things worth building someday.

---

## Gamification / Leaderboards

- Public leaderboard of top donators (opt-in, anonymous or named)
- Badges: "First offset", "Net-positive 3 months in a row", "1kg CO2e offset", etc.
- Monthly streak tracker — how many consecutive months you've been net-positive
- "Impact score" that combines donation size + multiplier choice + streak
- Team / org view — companies can see their collective footprint and compete internally
- Share card: shareable image showing your monthly impact (like Spotify Wrapped but for AI carbon)

---

## Claude Code Auto-Embed

- Dashboard widget that auto-detects Claude Code CLI usage from `~/.claude/` usage logs
- Background agent or tray app that watches Claude Code session files and pushes token counts to EcoDues automatically — zero manual entry for Claude Code users
- Could piggyback on Claude Code's existing session metadata (model used, token counts per session)
- OAuth or API key flow so Claude Code users just click "Connect Claude Code" and it wires up
- Potential: official Anthropic integration so token counts flow directly, no scraping

---

## Payment & Donation Rail

- Wire Every.org Partner API for real donations (swap the `status: "simulated"` ledger rows)
- Accrual logic: if monthly damage < $1, carry forward to next month to avoid micro-charges
- Donor receipt flow via Every.org (they handle tax receipts automatically)
- Multiple charity splits — donate X% to one, Y% to another
- One-time "catch-up" donation button for retroactive offsetting

---

## Data & Accuracy

- Real OpenAI, Anthropic, Gemini usage API connectors (currently stubbed with demo data)
- Per-datacenter grid intensity (GCP/AWS/Azure all publish region-level carbon data)
- Hardware-aware estimates — A100 vs H100 vs TPU have different Wh/token profiles
- Update methodology constants automatically when new research publishes (versioned)

---

## Ticker / threshold model follow-ups

- Contact any charity with `min_donation_usd > $5` (currently RMI @ $10) to see if they'll accept $1 platform-min via Every.org — user unlocks that tier as soon as they switch.
- Email `partners@pledge.to` for: sandbox + prod partner keys, hosted-checkout URL endpoint (if any), webhook schema for `donation.completed`, whether Free-the-Fee can be forced on server-to-server charges.
- Evaluate Pledge Free-the-Fee widget-embed feasibility (donor tips absorb fees) — spec says only works ≤$1000 with donor tipping enabled. If that constraint fits our sub-$5 accrual model, the widget path may beat Every.org on fee efficiency.
- Once Pledge partner keys land, ship the `donation_provider` toggle in onboarding + settings and expose per-charity provider availability.

## Other

- Mobile app or browser extension for passive tracking
- Nonprofit 501(c)(3) filing once validated (Form 1023-EZ, ~$275, 2-6 months)
- Open-source the emissions engine as a standalone npm package

BEFORE LAUNCH -- CRITICAL::::

- Clean up my twitter (what can people see?)
- Create new twitter
- Add a "Challenge" letter - challenge AI companies to embrace this and automatically do a match - also mention sponsors are always welcome
- Add face to site (credibility)
- Fix scrolling + mobile issues!!!!!!!
- Test OFC
- MAKE SIZZLE REEL

LIST OF PEOPLE TO REACH OUT TO 4 BOOST

- John Sweet
- Peter
- Eddy El Chaar
- Dan Lamet
- That one Mozilla guy (Check Email - had an interview)
- Eric something from ELC
- Maybe Patrick Lumber people
