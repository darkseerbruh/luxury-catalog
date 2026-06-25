# Luxury Catalog — Monetization Projections (re-run)

*Updated 2026-06-24. Two changes this run: (a) **DOWN-WEIGHTED the consignor-referral line** after the call with The RealReal's Real Partners lead — TRR Real Partners (the headline source of the old `$1,250`/referral) is **not viable for a digital aggregator** (relationship-based, no trackable codes/links, won't partner with sites that surface competing consignment options; see `docs/data-collection-handoff.md` §11), so the seller lever is now modeled at **~$250/referral** from niche consignment-affiliate programs (e.g. Madison Avenue Couture); (b) **ADDED a 5th stream — rental affiliate** (Vivrelle 20% via Awin, Rent the Runway 7% via Skimlinks), a recurring-membership referral that maps to the `want` intent and partly offsets the consignor loss. Supersedes the 2026-06-20 run. Horizon: launch → month 12, matching `docs/marketing-plan.md`.*

> **One-line answer:** in the **base case** you take home **~$32K** across year one, exiting M12 at a **~$155K/yr gross run-rate** that keeps compounding mostly without you. Conservative ≈ **$7.3K** take-home; a TikTok-hit optimistic case ≈ **$178K**. With TRR's consignor bounty off the table, the model no longer rides one lumpy line — it's now **diversified across 5 streams**, with **buyer affiliate (traffic-bound) as the backbone**. The biggest swing is **traffic** — i.e. whether GEO + a TikTok format land.

---

## What changed vs. the last run (why re-run at all)

The 2026-06-20 run made the **consignor-referral** stream the dominant pillar on the strength of TRR Real Partners' ~$1,250/referral. The 2026-06-24 call removed that assumption (no digital attribution mechanism exists for a site like this), and follow-up research added a new, reachable stream. So:

1. **GEO is the lead channel.** Every bag page is front-loaded, fact-dense, schema-marked, named-author, with cited sources and a sitemap submitted to Bing (→ ChatGPT). That's a *compounding, faceless* traffic engine — the curve bends upward over the year, and AI-referral traffic converts higher than ordinary search. **This, plus buyer affiliate, is the spine.**
2. **The consignor-referral stream is demoted to a small, speculative line** — ~$250/referral from niche consignment-affiliate programs, not $1,250. The `want/have/had` closet and "where to sell" CTA still capture it; it's just no longer the line the model rides on. **TRR's *buyer-side* affiliate (5%/7%, direct) is a separate program and is kept.**
3. **Rental affiliate is the new 5th stream.** Vivrelle (luxury bag/jewelry rental membership, **20%/sale via Awin** — already in hand) and Rent the Runway (**7% via Skimlinks** — already covered). It's a recurring-membership referral, reachable with **no new approval gate**, and it maps onto the **`want`** intent ("not ready to buy? rent it first") — a clean third transaction type alongside buy/sell.
4. **Contributor-tier UGC ladder** still feeds the Authentication Marketplace (M9), and **social/expert layer + watchlist alerts** still express as a faster, stickier traffic ramp and a registered-user base premium converts against.

Net effect: revenue is diversified across **5 streams**, the weight sits on **traffic-driven buyer affiliate + rental**, and the curve is *less lumpy and more reliable* than the prior run — lower ceiling than the old TRR-consignor fantasy, but far less single-point-of-failure.

---

## The five revenue streams modeled

| Stream | When it turns on | Unit economics modeled | Notes |
|---|---|---|---|
| **1. Buyer affiliate** | Launch (M1) | visitors × outbound-CTR × click→sale × **blended $30–60/sale** | Conservative effective rate per Decision 3 (never model the headline 5%). Blended low because thrift/mid volume dominates. **The backbone line.** |
| **2. Rental affiliate** | ~M2 | conversions × **~$40 blended** (Vivrelle 20% via Awin dominates; RTR 7% via Skimlinks) | Recurring-membership referral on the `want` intent. Reachable through networks already held — no approval gate. Modest but additive; partly offsets the consignor loss. |
| **3. Consignor referral** | ~M3–M6 | **~$250 per referred consignor** (niche consignment-affiliate, e.g. Madison Avenue Couture) | Down-weighted from $1,250 after TRR Real Partners was ruled out. Small, speculative, still lumpy. **No longer a dominant line.** |
| **4. Authentication marketplace** | M9 | **~$20 platform take** per completed authentication (≈25% of an $80 statement) | Thumbtack model. Supply fed by the contributor-tier ladder. |
| **5. Premium tools** | M9 | **$40/yr** (≈$3.33/mo) per active sub, converting a few % of registered users | Search-capability/alerts paywall only. **Catalog stays free forever.** |

**Costs:** ~$0 at launch (free tiers). Vercel Pro (~$20) from M5, Supabase Pro (~$25) from M6, Resend (~$20) from M8, plus Anthropic API at ~$0.0004–0.0008/visitor and ~$5/mo domain+misc. Costs stay trivial relative to revenue all year — the AI-first, one-operator advantage.

**Take-home** = gross − operating costs − a **28% tax set-aside** (self-employment tax + a modest federal layer on positive net). That rate is a rough placeholder — your real number depends on your bracket, state, and the LLC's pass-through treatment. Treat take-home as "what lands after you reserve for taxes," not a filed return.

---

## Scenario assumptions at a glance

| Lever | Conservative | Base | Optimistic |
|---|---|---|---|
| M12 monthly visitors | 52K | 170K | 550K |
| Outbound CTR (decision point) | 3.0% | 4.5% | 6.0% |
| Click → sale conversion | 1.5% | 2.0% | 2.5% |
| Blended commission / sale | $30 | $45 | $60 |
| Rental conversions in M12 | 5/mo | 15/mo | 50/mo |
| Commission / rental conversion | $40 | $40 | $40 |
| Consignor referrals in M12 | 4/mo | 10/mo | 30/mo |
| Commission / consignor referral | $250 | $250 | $250 |
| Auth marketplace (M12) | 55/mo | 110/mo | 275/mo |
| Premium subs (M12, cumulative) | 75 | 210 | 650 |

The scenarios differ on *both* how fast the audience compounds *and* how well each visitor monetizes — so they fan out widely on purpose. Reality usually lands between Conservative and Base in months 1–6, then depends almost entirely on whether one TikTok format hits.

---

## Month-over-month take-home

All figures are **monthly**. "Take-home" is after costs and the 28% tax reserve.

### Base case (the planning number)

| Month | Visitors | Affiliate | Rental | Consignor | Auth Mkt | Premium | Gross | Pre-tax | **Take-home** |
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| M1 | 500 | $20 | $0 | $0 | $0 | $0 | $20 | $15 | **$11** |
| M2 | 1,800 | $73 | $40 | $0 | $0 | $0 | $113 | $107 | **$77** |
| M3 | 4,500 | $182 | $80 | $0 | $0 | $0 | $262 | $255 | **$184** |
| M4 | 9,000 | $364 | $120 | $250 | $0 | $0 | $734 | $724 | **$521** |
| M5 | 16,000 | $648 | $160 | $250 | $0 | $0 | $1,058 | $1,023 | **$737** |
| M6 | 26,000 | $1,053 | $200 | $500 | $0 | $0 | $1,753 | $1,687 | **$1,215** |
| M7 | 40,000 | $1,620 | $280 | $750 | $0 | $0 | $2,650 | $2,576 | **$1,855** |
| M8 | 58,000 | $2,349 | $360 | $1,000 | $0 | $0 | $3,709 | $3,604 | **$2,595** |
| M9 | 80,000 | $3,240 | $440 | $1,250 | $400 | $133 | $5,463 | $5,345 | **$3,848** |
| M10 | 105,000 | $4,252 | $480 | $1,500 | $800 | $267 | $7,299 | $7,166 | **$5,160** |
| M11 | 135,000 | $5,468 | $560 | $2,000 | $1,400 | $467 | $9,895 | $9,744 | **$7,016** |
| M12 | 170,000 | $6,885 | $600 | $2,500 | $2,200 | $700 | $12,885 | $12,713 | **$9,153** |
| **Yr-1** | | | | | | | | | **≈ $32,372** |

Exit run-rate (M12 × 12): **~$155K gross / ~$110K take-home annualized.**

### Conservative case

| Month | Visitors | Gross | **Take-home** |
|---|--:|--:|--:|
| M1 | 300 | $4 | **-$1** |
| M2 | 800 | $11 | **$4** |
| M3 | 1,800 | $64 | **$42** |
| M4 | 3,500 | $87 | **$58** |
| M5 | 6,000 | $121 | **$68** |
| M6 | 9,000 | $452 | **$287** |
| M7 | 13,000 | $506 | **$325** |
| M8 | 18,000 | $863 | **$565** |
| M9 | 25,000 | $1,208 | **$811** |
| M10 | 33,000 | $1,856 | **$1,276** |
| M11 | 42,000 | $2,344 | **$1,625** |
| M12 | 52,000 | $3,252 | **$2,276** |
| **Yr-1** | | | **≈ $7,336** |

### Optimistic case (a TikTok format hits)

| Month | Visitors | Gross | **Take-home** |
|---|--:|--:|--:|
| M1 | 1,200 | $148 | **$102** |
| M2 | 5,000 | $570 | **$404** |
| M3 | 14,000 | $2,000 | **$1,429** |
| M4 | 30,000 | $3,850 | **$2,751** |
| M5 | 55,000 | $6,760 | **$4,817** |
| M6 | 90,000 | $10,570 | **$7,522** |
| M7 | 135,000 | $15,610 | **$11,125** |
| M8 | 190,000 | $21,550 | **$15,356** |
| M9 | 260,000 | $30,240 | **$21,573** |
| M10 | 340,000 | $40,080 | **$28,612** |
| M11 | 430,000 | $51,690 | **$36,919** |
| M12 | 550,000 | $66,667 | **$47,633** |
| **Yr-1** | | | **≈ $178,243** |

---

## How to read this

- **The first three months are nearly $0 — and that's correct, not a red flag.** Programmatic SEO/GEO takes 8–16 weeks to get indexed and cited; you're building the asset, not harvesting it. Your take-home in Q1 comes from whichever TikTok video pops, not from the site.
- **Traffic is the inflection now, not any single lumpy line.** With the consignor line down-weighted, the curve is driven by buyer affiliate + rental, both of which scale with pageviews — so the single most valuable thing you can do is the GEO/content engine. The old "one flipper referral ≈ 125 buyer commissions" math no longer holds (at $250 it's ≈ 5–8 buyer commissions).
- **Buyer affiliate is the spine; rental, consignor, marketplace, premium are upside.** Affiliate and rental scale predictably with traffic — the reliable base. Consignor (now small), marketplace, and premium are step-functions on top; marketplace and premium are the better year-2 bets for re-establishing a high-margin line.
- **Costs never matter this year.** Even optimistic, M12 operating cost is ~$510 against ~$67K gross. The constraint is your time and the strategy, not money out the door.

## Sensitivities (what would move the base case most)

| If this changes… | Effect on Yr-1 take-home |
|---|---|
| Traffic ramp slips one full quarter | **−~$10–12K** (the biggest single lever — affiliate + rental are traffic-bound) |
| Effective affiliate rate halves (program cuts) | **−~$9K** — exactly why Decision 3 says diversify across platforms |
| Rental conversions 2× (base 15→30/mo) | **+~$2.5K** (cheap, reachable upside — networks already in hand) |
| A real digital seller-lever is found (per-referral back toward $1,250) | **+~$22K** — the upside that re-opens if a *trackable* consignor program is sourced |
| Auth marketplace launches M6 instead of M9 | **+~$3–5K** (and warms supply via the tier ladder sooner) |
| Premium priced $50 + 2× conversion | **+~$3K** (smallest yr-1 lever; a yr-2 compounder) |

## Other streams to consider (not yet modeled)

Researched 2026-06-24, kept out of the numbers above until pursued — see `docs/data-collection-handoff.md` §11 for networks/terms:

- **Insurance lead-gen — BriteCo:** $10 **per lead** (CPL, pays on the lead not a sale) via ShareASale (= Awin, already held). Fits the **`have`** state (owners insure what they keep). Low effort, on-brand (protection = trust). Jewelers Mutual/Lavalier have no public affiliate (agent channel).
- **Amazon Associates:** two fits — care/accessories (base shapers, organizers, leather care; fits `have`) **and** actual bags (contemporary brands + Amazon Luxury Stores → a buyer-affiliate channel). Authenticity guardrail: link only Amazon-fulfilled/brand-sold/Luxury Stores items, not third-party marketplace "designer" listings. Low rates + 24h cookie, but broad coverage.
- **Repair/restoration:** no public affiliate programs (Leather Spa, Leather Surgeons, The Handbag Spa/Clinic are direct/agent). Would need bespoke referral deals — not turnkey.
- **Premium display ads** (Raptive/Mediavine, ~50–100K sessions/mo): the biggest *passive* line at scale, but a UX/trust tax — gate carefully given the premium positioning.
- **B2B data/insights** from the per-spec price DB — your actual moat; a year-2+ "WatchCharts for bags" play.
- **Digital products / courses** ("how to authenticate") off the expert-contributor ladder.

## Honest caveats

- **These are possibility curves, not forecasts.** No live traffic data exists yet (pre-launch, DB not runtime-tested). Every input is a defensible estimate, not an observation. Recalibrate the moment you have 4–6 weeks of real PostHog data on outbound CTR and per-visitor value — those two numbers collapse most of the uncertainty.
- **The seller lever is deliberately conservative now — and could swing either way.** $250/referral is a placeholder for niche consignment-affiliate commissions; volumes are guesses. If you find a resale partner offering *trackable, digital* consignor-referral links at a real bounty, this line re-inflates fast (see the sensitivity row). Until then, don't bank on it.
- **Rental is new and unproven for this audience.** $40/conversion and the volumes are estimates; rental-membership conversion off a catalog `want` signal hasn't been observed. It's reachable cheaply, so it's worth turning on — but treat the line as upside, not a floor.
- **TRR Real Partners is excluded on purpose, not by oversight.** The 2026-06-24 call established it can't be wired into a digital aggregator. Don't re-add a $1,250 consignor line citing TRR unless their program model changes.
- **Tax is a placeholder.** The 28% set-aside is a rough SE-tax-plus-federal reserve. Talk to an accountant about the LLC's treatment, quarterly estimated payments, and your state before treating take-home as spendable.
- **GEO is a bet on a 2026 dynamic.** The thesis — AI assistants preferentially cite fact-dense, sourced content — is well-supported but still young. If AI-citation traffic underperforms, the curve looks more like Conservative.

*Model source + all assumptions live in this doc; numbers were generated from a single consistent calculation so the streams always tie out to the totals. To re-run with new inputs, adjust the assumption tables above.*
