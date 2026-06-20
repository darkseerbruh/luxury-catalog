# Luxury Catalog — Monetization Projections (re-run)

*Updated 2026-06-20. Re-run against the **updated UX + marketing strategy** (GEO layer, embedded video, social/expert layer, contributor-tier UGC pipeline, closet `want/have/had` + watchlist). Supersedes any earlier back-of-envelope numbers. Horizon: launch → month 12, matching `docs/marketing-plan.md`.*

> **One-line answer:** in the **base case** you take home **~$59K** across year one, exiting M12 at a **~$267K/yr gross run-rate** that keeps compounding mostly without you. Conservative ≈ **$18K** take-home; a TikTok-hit optimistic case ≈ **$264K**. The single biggest swing isn't traffic — it's **consignor referrals** (sellers, not shoppers). More on that below.

---

## What changed vs. the last run (why re-run at all)

The earlier model treated this as a one-stream **buyer-affiliate** site (traffic × outbound CTR × commission). The updated UX + marketing strategy changes the shape of the money in four ways:

1. **GEO is now the lead channel, not SEO alone.** Every bag page is front-loaded, fact-dense, schema-marked, named-author, with cited sources and a sitemap submitted to Bing (→ ChatGPT). That's a *compounding, faceless* traffic engine — so the traffic curve bends upward over the year instead of plateauing, and AI-referral traffic converts higher than ordinary search.
2. **The consignor-referral stream got promoted from footnote to pillar.** Marketing Decision 3 is explicit: your thrift/flipper users don't just *buy* — they *sell*. Routing a flipper through a TRR-style "Real Partners" consignor link is worth **~$1,250 per referred seller** vs. ~$10–80 for a buyer commission. The `want/have/had` closet (esp. **`had`** = previously-owned flippers) and a "where to sell what you found" CTA are the UX that captures this. **This is the highest-variance, highest-upside line in the whole model.**
3. **The contributor-tier UGC ladder is the recruiting pipeline for revenue stream #2** (Authentication Marketplace). Aficionado → Collector → Connoisseur → **Authenticator** → Curator credentials the very people who staff the marketplace, so the marketplace can switch on in M9 with supply already warm.
4. **Social/expert layer + watchlist alerts = retention & virality**, which the model expresses as a *faster, stickier traffic ramp* and a *registered-user base* that premium subscriptions convert against.

Net effect: same product, but the curve is steeper (GEO + social virality), revenue is diversified across **4 streams** instead of 1, and two of those streams (consignor, marketplace) are large-ticket and only loosely coupled to raw pageviews.

---

## The four revenue streams modeled

| Stream | When it turns on | Unit economics modeled | Notes |
|---|---|---|---|
| **1. Buyer affiliate** | Launch (M1) | visitors × outbound-CTR × click→sale × **blended $30–60/sale** | Conservative effective rate per Decision 3 (never model the headline 5%). Blended low because thrift/mid volume dominates ultra-luxury. |
| **2. Consignor referral** | ~M3–M6 | **$1,250 per referred consignor** (TRR Real Partners avg) | Lumpy, high-touch, huge per-unit. Captured via `had`-flipper UX + "where to sell" links. **Dominant swing factor.** |
| **3. Authentication marketplace** | M9 | **~$20 platform take** per completed authentication (≈25% of an $80 statement) | Thumbtack model. Supply fed by the contributor-tier ladder. |
| **4. Premium tools** | M9 | **$40/yr** (≈$3.33/mo) per active sub, converting a few % of registered users | Search-capability/alerts paywall only. **Catalog stays free forever.** |

**Costs:** ~$0 at launch (free tiers). Vercel Pro (~$20) from M5, Supabase Pro (~$25) from M6, Resend (~$20) from M8, plus Anthropic API at ~$0.0004–0.0008/visitor and ~$5/mo domain+misc. Costs stay trivial relative to revenue all year — this is the AI-first, one-operator advantage.

**Take-home** = gross − operating costs − a **28% tax set-aside** (self-employment tax + a modest federal layer on positive net). That rate is a rough placeholder — your real number depends on your bracket, state, and the LLC's pass-through treatment. Treat take-home as "what lands after you reserve for taxes," not a filed return.

---

## Scenario assumptions at a glance

| Lever | Conservative | Base | Optimistic |
|---|---|---|---|
| M12 monthly visitors | 52K | 170K | 550K |
| Outbound CTR (decision point) | 3.0% | 4.5% | 6.0% |
| Click → sale conversion | 1.5% | 2.0% | 2.5% |
| Blended commission / sale | $30 | $45 | $60 |
| Consignor referrals in M12 | 4/mo | 10/mo | 30/mo |
| Auth marketplace (M12) | 55/mo | 110/mo | 275/mo |
| Premium subs (M12, cumulative) | 75 | 210 | 650 |

The scenarios differ on *both* how fast the audience compounds *and* how well each visitor monetizes — so they fan out widely on purpose. Reality usually lands between Conservative and Base in months 1–6, then depends almost entirely on whether one TikTok format hits and whether the consignor pipeline takes.

---

## Month-over-month take-home

All figures are **monthly**. "Take-home" is after costs and the 28% tax reserve.

### Base case (the planning number)

| Month | Visitors | Affiliate | Consignor | Auth Mkt | Premium | Gross | Pre-tax | **Take-home** |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| M1 | 500 | $20 | $0 | $0 | $0 | $20 | $15 | **$11** |
| M2 | 1,800 | $73 | $0 | $0 | $0 | $73 | $67 | **$48** |
| M3 | 4,500 | $182 | $0 | $0 | $0 | $182 | $175 | **$126** |
| M4 | 9,000 | $364 | $1,250 | $0 | $0 | $1,614 | $1,604 | **$1,155** |
| M5 | 16,000 | $648 | $1,250 | $0 | $0 | $1,898 | $1,863 | **$1,342** |
| M6 | 26,000 | $1,053 | $2,500 | $0 | $0 | $3,553 | $3,487 | **$2,511** |
| M7 | 40,000 | $1,620 | $3,750 | $0 | $0 | $5,370 | $5,296 | **$3,813** |
| M8 | 58,000 | $2,349 | $5,000 | $0 | $0 | $7,349 | $7,244 | **$5,216** |
| M9 | 80,000 | $3,240 | $6,250 | $400 | $133 | $10,023 | $9,905 | **$7,132** |
| M10 | 105,000 | $4,252 | $7,500 | $800 | $267 | $12,819 | $12,686 | **$9,134** |
| M11 | 135,000 | $5,468 | $10,000 | $1,400 | $467 | $17,334 | $17,183 | **$12,372** |
| M12 | 170,000 | $6,885 | $12,500 | $2,200 | $700 | $22,285 | $22,113 | **$15,921** |
| **Yr-1** | | | | | | | | **≈ $58,780** |

Exit run-rate (M12 × 12): **~$267K gross / ~$191K take-home annualized.**

### Conservative case

| Month | Visitors | Gross | **Take-home** |
|---|--:|--:|--:|
| M1 | 300 | $4 | **-$1** |
| M2 | 800 | $11 | **$4** |
| M3 | 1,800 | $24 | **$13** |
| M4 | 3,500 | $47 | **$29** |
| M5 | 6,000 | $81 | **$39** |
| M6 | 9,000 | $1,372 | **$949** |
| M7 | 13,000 | $1,426 | **$987** |
| M8 | 18,000 | $2,743 | **$1,919** |
| M9 | 25,000 | $3,088 | **$2,165** |
| M10 | 33,000 | $4,696 | **$3,321** |
| M11 | 42,000 | $5,184 | **$3,670** |
| M12 | 52,000 | $7,052 | **$5,012** |
| **Yr-1** | | | **≈ $18,107** |

### Optimistic case (a TikTok format hits + consignor pipeline takes)

| Month | Visitors | Gross | **Take-home** |
|---|--:|--:|--:|
| M1 | 1,200 | $108 | **$73** |
| M2 | 5,000 | $450 | **$318** |
| M3 | 14,000 | $3,760 | **$2,696** |
| M4 | 30,000 | $6,450 | **$4,623** |
| M5 | 55,000 | $11,200 | **$8,014** |
| M6 | 90,000 | $16,850 | **$12,044** |
| M7 | 135,000 | $24,650 | **$17,634** |
| M8 | 190,000 | $33,350 | **$23,852** |
| M9 | 260,000 | $44,800 | **$32,056** |
| M10 | 340,000 | $58,400 | **$41,802** |
| M11 | 430,000 | $74,850 | **$53,594** |
| M12 | 550,000 | $94,667 | **$67,793** |
| **Yr-1** | | | **≈ $264,499** |

---

## How to read this

- **The first three months are nearly $0 — and that's correct, not a red flag.** Programmatic SEO/GEO takes 8–16 weeks to get indexed and cited; you're building the asset, not harvesting it. Your take-home in Q1 comes from whichever TikTok video pops, not from the site.
- **The inflection is the consignor referral, not pageviews.** Notice in the Conservative table that take-home jumps from ~$39 to ~$949 the month the *first* consignor referral lands. One flipper who lists their Goodwill find through your link ≈ **125 buyer-side commissions**. If there's one place to spend product+content effort beyond GEO, it's the "where to sell what you found" path and the `had`/flipper experience that feeds it. Get TRR/Fashionphile/Vestiaire/Rebag **consignor-referral** approvals early (M0–M2) — they gate this entire line.
- **Affiliate is the floor; the other three streams are the ceiling.** Buyer affiliate scales smoothly and predictably with traffic — it's your reliable base. Consignor, marketplace, and premium are step-functions that can each independently 2–3× a month's take-home.
- **Costs never matter this year.** Even in the optimistic case, M12 operating cost is ~$510 against ~$95K gross. The constraint is your time and the strategy, exactly as the marketing plan argues — not money out the door.

## Sensitivities (what would move the base case most)

| If this changes… | Effect on Yr-1 take-home |
|---|---|
| Consignor referrals 2× (base 10→20/mo by M12) | **+~$22K** (biggest single lever) |
| Traffic ramp slips one full quarter | **−~$20K** (pushes the compounding tail out of the window) |
| Effective affiliate rate halves (program cuts) | **−~$12K** — and exactly why Decision 3 says diversify across 4 platforms × 2 program types |
| Auth marketplace launches M6 instead of M9 | **+~$3–5K** (and warms supply via the tier ladder sooner) |
| Premium priced $50 + 2× conversion | **+~$3K** (smallest lever in yr 1; it's a yr-2 compounder, not a yr-1 mover) |

## Honest caveats

- **These are possibility curves, not forecasts.** No live traffic data exists yet (pre-launch, DB not runtime-tested). Every input is a defensible estimate, not an observation. Recalibrate the moment you have 4–6 weeks of real PostHog data on outbound CTR and per-visitor value — those two numbers collapse most of the uncertainty.
- **The consignor `$1,250` is an industry *average*, and the volume is a guess.** It's lumpy and high-touch (you're referring people who *sell*, which takes more convincing than a buy link). Don't bank on it for fixed expenses until you've seen a few actually pay out.
- **Tax is a placeholder.** The 28% set-aside is a rough SE-tax-plus-federal reserve. Talk to an accountant about the LLC's treatment, quarterly estimated payments, and your state before treating take-home as spendable.
- **GEO is a bet on a 2026 dynamic.** The plan's thesis — AI assistants preferentially cite fact-dense, sourced content — is well-supported but still young. If AI-citation traffic underperforms, the curve looks more like Conservative.

*Model source + all assumptions live in this doc; numbers were generated from a single consistent calculation so the streams always tie out to the totals. To re-run with new inputs, adjust the assumption tables above.*
