# Luxury Catalog — UX Evaluation & Improvement Report

> **What this is.** A grounded evaluation of how effectively the *current* design
> helps each of the five defined personas complete their use case, with concrete,
> prioritized UX improvements per flow and customer journey. Every finding cites
> repo evidence (`file:line`); every recommendation cites a research principle
> and/or a competitor precedent. The supporting research lives in
> `docs/ux/ux-research-brief.md` (NN/g canon + the eight competitor teardowns).
>
> **Method & rigor.** NN/g heuristic evaluation (the 10 usability heuristics) +
> per-use-case customer-journey walkthroughs. Severity uses Nielsen's 0–4 scale
> (0 = not a problem · 1 = cosmetic · 2 = minor · 3 = major · 4 = usability
> catastrophe).
>
> **Honest limitation.** This environment has no Supabase credentials
> (`docs/handoff.md`), so the app could not be runtime click-tested. The
> evaluation is conducted from source, design tokens, and the product docs.
> Recommendations are written to be re-validated against the running app when we
> implement together.
>
> **Guardrails respected.** All recommendations honor the non-negotiable
> constraints (never-invent data, no AI imagery, catalog free forever, Coach in
> scope, mobile-first 375px) and the engagement-strategy "don'ts" (no open DMs, no
> free-form posting).

---

## 1. The one-paragraph verdict

Luxury Catalog has **world-class data and a near-complete feature set, wrapped in
an information architecture that hides most of it.** The catalog's depth (the bag
page renders ~18 structured sections) and the breadth of shipped features (closet,
watchlist, quiz, Taste Map, recs, feed, leaderboard, identify, thrift-log) are
genuine strengths. But three systemic problems blunt the monetization the product
is built for: **(1) discoverability** — the home page and nav surface almost none
of the engagement/personalization features, so the cold-start and viral hooks are
orphaned; **(2) the use cases are not legible** — nothing on the entry surfaces
tells a collector, flipper, first-buyer, authenticator, or thrifter "this is for
you, start here"; and **(3) the decision point leaks** — on the bag page the
revenue actions (buy / save / watch) sit below ~15 dense sections, there is **no
valuation summary up front**, and the **highest-upside revenue stream ("where to
sell" / consignor referral) has no UX surface at all.** Fixing IA and decision-point
clarity — not building new features — is the highest-leverage work available.

---

## 2. Persona → flow matrix (where each use case lives today)

| Persona (use case) | Primary entry today | Core flow today | Monetization arrow | Biggest gap |
|---|---|---|---|---|
| **Serious collector / investor** | Search / brand pages | Bag page specs + price history | Premium tools (Rev 3/4); affiliate | No valuation/asset framing; price history buried & unframed; no portfolio value |
| **Resale flipper** | Search → bag page | Price history + where-to-buy | **Consignor referral (Rev 2 — highest upside)** | **No "where to sell" anywhere**; `had` status unused for selling |
| **First serious purchase** | Search → bag page | Specs + authentication + reviews | Buyer affiliate (Rev 1) | No "is it worth it / will it last" summary; dense scroll; reviews buried |
| **Authentication-paranoid** | Search / Identify → bag page | Auth markers + production records | Auth marketplace (Rev 3) | Trust signals scattered; no "how we authenticate"; no confidence summary up top |
| **Thrift / estate hunter (viral engine)** | `/identify` (camera) | Photo → ID → catalog match | Buyer affiliate + virality | Identify shows **no value** & **no buy/sell CTA** at peak intent; quiz/share loop orphaned |

**Cross-persona:** the **home page** (`src/app/page.tsx`) and **header nav**
(`src/app/layout.tsx`) are the same generic surface for all five — none is greeted
with their use case.

---

## 3. NN/g heuristic scorecard (per flow)

Worst severity per heuristic, with the driving issue. Blank = no notable issue.

| Flow / file | H1 Status | H2 Real-world | H3 Control/exit | H4 Consistency | H5 Error prev. | H6 Recognition | H7 Flexibility | H8 Minimalist | H9 Errors | H10 Help |
|---|---|---|---|---|---|---|---|---|---|---|
| **Home** `page.tsx` | — | 1 | — | 2 | — | **3** recognition: features not surfaced | **3** no fast paths to quiz/sell/identify | 1 | — | 2 no "what is this/who for" |
| **Nav** `layout.tsx` | 2 no active state | — | — | 2 | — | **3** quiz/watchlist/sell missing | 2 | 2 | — | — |
| **Search** `search/page.tsx` | 2 no loading | 1 | 1 | 2 | **2** no zero-result guards beyond request | **3** no facets/sort | **3** no filtering | 2 | 1 | 1 |
| **Bag page** `bag/[variantId]/page.tsx` | 1 | 1 | 2 no jump-nav | 2 | — | **3** CTAs below the fold; no value summary | **3** no in-page nav/accordions | **3** ~18 always-open sections | — | 2 |
| **BagActions** `BagActions.tsx` | 2 watch→target is 2-step | 1 | 2 | 1 | — | 2 | 2 | 1 | 2 generic error copy | — |
| **WhereToBuy** `WhereToBuy.tsx` | — | 1 | — | 1 | — | 2 | 2 | 1 | — | 2 no platform diff (price/condition) |
| **Quiz** `quiz/page.tsx` | 1 | — | 1 | 1 | — | **3** unreachable from home/nav | 2 | 1 | — | — |
| **Onboarding** `onboarding/page.tsx` | 1 | — | 1 | 1 | — | 2 no quiz hand-off | 2 | 1 | — | — |
| **Recommendations** `Recommendations.tsx` | — | 1 | — | 1 | — | 2 | 2 | 1 | — | 2 no "why recommended" |
| **Identify** `identify/page.tsx` | 1 | 1 | 1 | 1 | 1 | 2 | 2 | 1 | 2 | 1 — **but no value/CTA (journey gap, §4.5)** |
| **Closet** `closet/page.tsx` | — | — | 1 | 1 | — | 2 no value/portfolio | 2 | 1 | — | — |
| **Watchlist** `watchlist/page.tsx` | 1 | — | 1 | 1 | — | 2 | 2 | 1 | — | 1 |
| **Coveted Closets** `closets/page.tsx` | — | — | — | 1 | — | 2 discovery only via footer | 2 | 1 | — | — |
| **Profile** `profile/page.tsx` | — | 1 | 1 | 2 | — | 2 it's the *hidden hub* | **3** 9 link-pills, flat priority | 2 | — | — |

**Top heuristic themes:** **H6 Recognition rather than recall** and **H7
Flexibility/efficiency** are the repeated 3-severity failures — features exist but
users must *remember they exist* and navigate to Profile to reach them. **H8
Aesthetic/minimalist** fails on the bag page (everything always expanded) and
profile (flat pill wall).

---

## 4. Per-use-case customer-journey evaluations

Each walks **entry → discovery → research → decision → return**, with findings
(evidence) and the competitor pattern that proves the fix.

### 4.1 Serious collector / investor
**Entry/discovery.** Lands via search or brand page. No surface frames bags as an
asset class or greets the collector. *(H6; info-scent — research §2.)*
**Research.** The bag page has the raw material but **buries price intelligence**:
`PriceTrend` + a raw price list sit at `bag/[variantId]/page.tsx:560-589`, far below
the spec dump, with **no range toggles, no % change, no retail reference line**.
There is **no portfolio/collection value** in the closet (`closet/page.tsx` shows
per-item retail only, no totals/gain-loss).
**Decision/return.** No "track this as a position," no value-retention framing, no
weekly value digest.
**Recommendations (→ Rev 3/4 premium, Rev 1 affiliate):**
- Add a **price-history chart with 1Y/3Y/5Y/All toggles + bold % delta + retail
  reference line** (WatchCharts/StockX; brief §G/H) — reuse the existing
  `PriceTrend` component, move it **up**, and frame it.
- Add a **"Resale-Retention" leaderboard** and per-bag "trades at X% vs. retail"
  (WatchCharts Value Retention) — true for Birkins, editorial/GEO gold.
- Add **collection value + cost basis + gain/loss + weekly digest** to the closet
  (WatchCharts portfolio; Discogs whole-collection value).

### 4.2 Resale flipper — *the biggest monetization miss*
**Entry/research.** Same bag page; needs trend + liquidity. Gets a static price
list, no "how many sold / how fast / fair price."
**Decision.** **There is no "where to sell."** `affiliate.ts` builds buyer links
only; `WhereToBuy.tsx` is buy-only; the `had` closet status (`BagActions.tsx:13-17`)
captures "previously owned" but routes to nothing. **Consignor referral is the
highest-upside stream (~$12.5k/mo base case) and has zero surface.**
**Recommendations (→ Rev 2 consignor, the highest upside):**
- Build a **"Where to sell" fork** beside "Where to buy": **buyout vs. consignment**
  with **transparent published splits** and "you get ~$X now vs. ~$Y later" framing
  (Fashionphile/TRR; KBB value types — brief §I/J). This is the single
  highest-ROI revenue addition in the report.
- Wire the **`had` status and the closet "Had" group** to a "sell another / consign"
  CTA (engagement-strategy already calls for this).
- Add **sold-comps + a per-listing fairness verdict** ("X% below market") and a
  **Number-of-Sales liquidity stat** (StockX; WatchCharts — brief §G/H).

### 4.3 First serious purchase
**Entry.** High-anxiety researcher; no "start here / what to know before you buy"
path. **Research.** Strong authentication depth, but it's a **long undifferentiated
scroll** (`bag/[variantId]/page.tsx`, ~18 always-open sections, no jump nav) with
**reviews buried at :616**. No up-front "is it worth it / will it last" answer.
**Decision.** "Where to buy" links don't state **platform differences** (price /
condition / authentication) — NN/g "explicit differences" (brief §6).
**Recommendations (→ Rev 1 affiliate; sets up Rev 3 auth):**
- Add an **above-the-fold decision summary**: value range, "worth it" signal,
  durability/ages-well (see §5 idea), and a primary CTA (KBB valuation-as-hero;
  NN/g detail-page §3).
- Add **jump-nav / accordions** to the bag page (progressive disclosure; mobile
  §9) — reuse the existing `Section` component (`bag/[variantId]/page.tsx:80-93`)
  as collapsible anchors.
- Surface **reviews higher** with a **distribution histogram + verified-owner
  badge** (IMDb; NN/g social proof — brief §D/§5).

### 4.4 Authentication-paranoid buyer
**Research.** The data is excellent (production records, serial tags, lock & key,
confidence badges) but **trust signals are scattered** across sections with no
**summary verdict** ("how to know this is real, in 5 checks") and **no "how we
authenticate / who sourced this"** module. Confidence badges exist per row
(`ConfidenceBadge`, `page.tsx:64-78`) but there's no page-level confidence.
**Decision/return.** No path toward the future authentication marketplace.
**Recommendations (→ Rev 3 auth marketplace):**
- Add an **enumerated "How to authenticate this bag" checklist** + a page-level
  **"how we source & verify" module** with named authority (StockX/GOAT enumerated
  process; Fashionphile named authenticators — brief §H/§I). *Specificity is the
  trust mechanic.*
- Add a **scannable authenticity-record concept** (unique ID + future QR) as the
  marketplace on-ramp (StockX tag; Fashionphile certificate) — honor it
  operationally (GOAT/FTC cautionary tale, brief §H).

### 4.5 Thrift / estate hunter — *the viral engine, under-converted*
**Entry.** `/identify` is genuinely good: camera-first with
`capture="environment"` (`identify/page.tsx:137-144`), confidence badge, visible
auth markers, catalog match. **This is the strongest single flow in the app.**
**Decision — the leak.** The header promises *"what it's worth"*
(`identify/page.tsx:106-109`) but the **result shows no value and no buy/sell CTA**
— the highest-intent moment in the whole product converts to a catalog link only.
The thrift-log CTA is good (`:166-176`) but value + affiliate are absent.
**Return/virality.** No shareable artifact from a find; the quiz/taste share-loop
is not connected here.
**Recommendations (→ Rev 1 affiliate + virality):**
- On the Identify result, add a **"what it's worth" range + "where to sell / where
  to buy" CTAs** (KBB 60-second valuation; StockX Last Sale — brief §J/§H). Highest
  intent in the product; currently un-monetized.
- Add a **shareable "I found a real ___" result card** (Letterboxd screenshot-ready
  surfaces — brief §C) to feed the TikTok acquisition loop the marketing plan banks on.

---

## 5. Cross-cutting findings

**F1 — Discoverability collapse (severity 3, systemic).** Home (`page.tsx`) surfaces
hero search, "It bags," logged-in feed/closet/recs, and brand/fit/carry — but **not
the quiz, watchlist, coveted closets, taste map, or thrift-log**. Nav
(`layout.tsx:46-104`) omits **Quiz, Watchlist, Coveted Closets, and any "sell"
entry**; those live only in the **footer** or on the **Profile** page
(`profile/page.tsx:53-110`, a flat wall of 9 link-pills). NN/g: *"discoverability is
cut almost in half by hiding main navigation."* The cold-start + viral hooks the
product depends on are effectively invisible. **This is the top finding.**

**F2 — Use cases aren't legible (severity 3).** The home hero leads with a generic
"The Luxury Catalog knows style" (`page.tsx:49-50`). None of the five personas is
greeted or routed. KBB makes its single use case the hero of the site; we make ours
invisible. Monetization can't be "plain as day" if the use cases aren't.

**F3 — No faceted search (severity 3).** `search/page.tsx` returns brand/style cards
with **no filters, no sort, no facets, no result counts per attribute**, despite the
catalog holding exactly the structured attributes (material, hardware, size, era,
carry, fits) that faceted navigation is built for. NN/g/Baymard rank this as a core
e-commerce capability; Discogs Wantlist filters are the collector analog.

**F4 — Decision-point burial (severity 3).** On the bag page, `WhereToBuy` (:605)
and `BagActions` (:608) sit below ~18 sections; there's no above-the-fold
value/price summary and no sticky action bar. NN/g detail-page + decision-point
guidance: essentials and the primary CTA belong up front; thumb-zone placement on
mobile.

**F5 — Logged-out experience is thin (severity 2).** Logged-out home shows only a
"create account" closet stub (`page.tsx:126-138`); the quiz (the no-account viral
hook) isn't offered. The GEO/TikTok strategy drives *strangers* to the site — they
need a use-case-legible, low-commitment first action (reciprocity; brief §4).

**F6 — Accessibility / contrast (severity 2).** Heavy use of opacity-reduced
`text-muted/60` and `/70` on near-black (`--color-bg:#0e0d0c`, `--color-muted:#a89c87`
in `globals.css`) for captions, "coming soon," and source text likely fails WCAG AA
contrast. Audit and floor secondary text at AA.

**F7 — Recommendation explainability (severity 2).** `Recommendations.tsx` has a
graceful cold-start stub (good) but rendered recs carry **no "why"** label. NN/g:
explaining the basis improves trust and click-through; IMDb "More Like This" is
attribute-grounded.

---

## 6. Prioritized improvement backlog

Impact × Effort (both H/M/L). "Arrow" = revenue stream strengthened. Ordered by
leverage. **Tier 1 = do first; mostly IA/surfacing, not new features.**

### Tier 1 — discoverability & use-case legibility (high impact, low–med effort)
| # | Improvement | Impact | Effort | Arrow | Grounding |
|---|---|---|---|---|---|
| 1 | **Persona-legible home + nav**: a "what do you want to do?" router (Collect / Flip / Buy my first / Authenticate / I found one) + add Quiz, Watchlist, Sell, Identify to nav | H | M | All | KBB valuation-as-hero; NN/g info-scent/discoverability (F1, F2) |
| 2 | **Surface the quiz as a front-door** on home (logged-out too) + **hand off from onboarding** | H | L | Rec→Rev1/3 | StoryGraph; NN/g cold-start/reciprocity (F1) |
| 3 | **Move price/value + primary CTA above the fold** on the bag page; **sticky action bar** (Save/Watch/Buy/Sell) | H | M | Rev1/2 | KBB; NN/g detail-page + decision-point (F4) |
| 4 | **"Where to sell" fork** (buyout vs. consign, transparent splits) + wire `had` status | H | M | **Rev2 (highest upside)** | Fashionphile/TRR; KBB value types (§4.2) |
| 5 | **Identify result: add value range + buy/sell CTA + shareable card** | H | M | Rev1+viral | KBB/StockX; Letterboxd (§4.5) |

### Tier 2 — research & trust depth (high impact, med effort)
| # | Improvement | Impact | Effort | Arrow | Grounding |
|---|---|---|---|---|---|
| 6 | **Faceted search/filter** (facets + counts, mobile tray, applied chips, sort) | H | M | Rev1 | NN/g/Baymard; Discogs (F3) |
| 7 | **Bag-page jump-nav + accordions** (progressive disclosure) | M | M | Rev1 | NN/g progressive disclosure/mobile (F4) |
| 8 | **Price-history chart: range toggles + % delta + retail line**; reuse `PriceTrend` | H | M | Rev1/3 | WatchCharts/StockX (§4.1) |
| 9 | **"How to authenticate" checklist + "how we verify" module** | M | M | Rev3 | StockX/GOAT; Fashionphile (§4.4) |
| 10 | **Reviews up + distribution histogram + verified-owner badge** | M | M | Rev1 | IMDb; NN/g social proof (§4.3) |
| 11 | **Every attribute is a link to a filtered index** | M | M | Rev1/SEO | IMDb (brief §D) |

### Tier 3 — engagement, identity & retention (med impact, med–high effort)
| # | Improvement | Impact | Effort | Arrow | Grounding |
|---|---|---|---|---|---|
| 12 | **Explainable recs ("Because you saved…"), placed high, never empty** | M | L | Rev1 | NN/g rec UX; IMDb (F7) |
| 13 | **Taste Map as completeness-meter progress** (never 0%) | M | M | Rec→Rev1/3 | Zeigarnik/goal-gradient; StoryGraph |
| 14 | **"My Four Grails" + "Year in Bags" exportable recap** | M | M | Viral | Letterboxd (brief §C) |
| 15 | **Collection value + gain/loss + weekly digest** | M | M | Rev3/4 | WatchCharts portfolio; Discogs |
| 16 | **Relative, resettable leaderboards + XP-for-value**; extend Coveted Closets | M | M | Engagement | NN/g gamification; Goodreads |
| 17 | **Crowd-upvoted lists / Listopia** ("Best Bags Under $2k") | M | M | SEO/Rev1 | Goodreads/Letterboxd |
| 18 | **Multi-axis subjective voting** (build quality/holds-value/worth-it) | M | M | Data/Rev1 | Fragrantica (brief §F) |
| 19 | **Contrast/accessibility audit** (floor secondary text at WCAG AA) | M | L | All | WCAG; NN/g (F6) |

### Tier 4 — data-dependent (high impact, high effort; gated)
| # | Improvement | Impact | Effort | Arrow | Grounding |
|---|---|---|---|---|---|
| 20 | **Durability / "Ages-Well" signal** — observed resale **condition × age** by material, confidence-rated, sample-size shown | H | H | Rev3/4 | Fragrantica character-bar; WatchCharts value-retention. **Honesty guardrails:** biased/survivorship sample → present as observed distribution by age cohort w/ confidence; compute at material level first. **Dependency:** ingest resale condition+age at scale. (User-proposed.) |
| 21 | **Resale-Retention / "Bags Above Retail" index + leaderboard** | M | H | Rev1/SEO | WatchCharts (§4.1) |

---

## 7. Recommended first implementation slice

If we implement together in one focused pass, do **Tier 1 #1–#5** — they are mostly
**information-architecture and surfacing work on existing features** (not new
systems), they make the use cases "plain as day," and **#4 (where-to-sell) and #3/#5
(decision-point + Identify monetization)** directly turn on the two revenue arrows
that currently have no UX surface. Concretely, the smallest high-value start is:
**(a)** a persona router + nav additions on `page.tsx`/`layout.tsx`, **(b)** a
sticky action bar + above-the-fold value summary on `bag/[variantId]/page.tsx`, and
**(c)** a "Where to sell" component beside `WhereToBuy.tsx` reusing the
`affiliate.ts` pattern. Each is independently shippable and independently testable
against the running app.

---

## 8. Sources
Full citations (NN/g canon + all eight competitor teardowns, with URLs) are in
**`docs/ux/ux-research-brief.md`**. Repo evidence is cited inline above as
`file:line`. Internal docs referenced: `docs/product-brief.md`,
`docs/marketing-plan.md`, `docs/engagement-strategy.md`, `docs/handoff.md`,
`docs/monetization-projections.md`.
