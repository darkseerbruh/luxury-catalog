# Data + content worklist (live autonomous queue)

*The running queue for the "capture data, mine it, write articles" task. Per
`docs/preferences.md` rule 9 + the Autonomous run protocol: pick the top ⬜, do it, commit,
mark it ✅ with a one-line result, drop to the next. Never stop to summarize. A fresh chat
resumes from here. Method is documented in `docs/data-collection-handoff.md` §12 (get_page_text
transport; load-sold.ts; audit-coverage.ts) and `docs/research-drafts/poshmark-ebay-sold-capture.md`.*

Status key: ⬜ todo · 🔄 in progress · ✅ done (with result + date)

## PAGE-DEPTH: descriptions + intro years on new styles (started 2026-07-10)
*The 229 styles promoted 2026-07-09/10 are bare (name only) — descriptions dropped to 30%,
year_introduced ~0%. Thin pages rank + convert worse. Descriptions must be SOURCED (factuality
bar), not generated, so this runs via the archivist + `apply-style-depth.ts` (review-gated).*
- ✅ **Top-15 new styles by comp count** — DONE 2026-07-10. Archivist sourced, spot-checked,
  applied 15 descriptions + 5 cleanly-sourced years (Kelly To Go 2020, Soft Trunk 2019, New
  Wave 2018, Vanity 2020, Serpenti Forever 2011) via `apply-style-depth.ts`. Drafts archived
  at `supabase/ingest/data/style-depth-batch1.json`. Bold stripped (detail page renders plain text).
- ✅ **Batch 2 (ranks 16-45, 30 styles)** — DONE 2026-07-10. 30 descriptions + 4 years live
  (Lockit 1958, La Medusa 2021, Falabella 2009, Dior Vibe 2022). Coverage 30% → 34%, years 8 → 17.
  Drafts at `supabase/ingest/data/style-depth-batch2.json`. Found Chanel Uniform (1056) = NOT a
  retail model (staff-uniform program), flagged for removal in style-bucket-audit.md.
- ✅ **Batch 3 (final ≥20-comp tranche, 29 styles)** — DONE 2026-07-10. 29 descriptions + 5 years
  (Diorever 2016, Snapshot 2018, Réjane 1903, LV Biker 2025, Chloé Nile 2016). Drafts at
  `supabase/ingest/data/style-depth-batch3.json`. Accents restored on apply (Ebène/Hermès/Réjane).
- ✅ **≥20-comp set COMPLETE** — 74 sourced descriptions across 3 batches; coverage 30% → 37%,
  years 8 → 22. Every fact archivist-sourced + spot-checked; unsourced years held null.
- ✅ **11 styles promoted 2026-07-10 (TRR sweep backlog)** — DONE 2026-07-10. Archivist-sourced,
  spot-checked, applied 11 descriptions + 3 cleanly-sourced years (Surène 2018, Hermès Sac à
  Dépêches 1928, SL Bea 2023) via `apply-style-depth.ts`. Drafts at
  `supabase/ingest/data/style-depth-trr-backlog.json`. 8 vintage-LV years held null (no clean house
  debut record — factuality bar). Flags carried in the JSON `note` fields: Vivacité (1280) is the
  ~2004 vintage Viva-Cité, a NAME COLLISION with a later modern "Vivacité"; Odyssée (1281) name also
  reused on women's pieces (confirm by canvas); Cartouchière sizes read PM/MM/GM in sources not
  17/22/26.
- 🔄 **CORE-ICON gap (785 bare styles, discovered 2026-07-10)** — the big one. `probe-bare-styles.ts`
  found 785 of 1000 styles carry a placeholder stub (`"Permanent collection (tier 1) — catalog
  backbone."`, 49 chars, even has an em dash) or empty description. **559 have ≥10 comps, 370 have ≥20** —
  these are the highest-traffic pages on the site (Chanel Boy 4,030 comps, LV Speedy 2,912, Hermès
  Evelyne 1,833, Keepall 1,732, WOC 1,730, Gucci Ophidia 1,697) running NO real description. This
  dwarfs the promoted-style gaps below. Method unchanged: archivist-sourced (factuality bar, plain
  text, no em dash, year null unless cleanly sourced) → review → `apply-style-depth.ts`. Working top
  tranche first (highest comps = highest ROI). Batch files: `data/style-depth-icons-batch*.json`.
  - ✅ **Batch 1 (top 25 by comps, ≥580)** — DONE 2026-07-10. 25 descriptions + 18 sourced years live
    (Boy 2011, Speedy 1930, Evelyne 1978, Keepall 1930, Ophidia 2018, Chanel 19 2019, Horsebit 1955→2020,
    Book Tote 2018, OnTheGo 2019, Constance 1959, Gabrielle 2017, Loulou 2017, Luggage 2010, Jackie 1961→2020,
    Capucines 2013, 2.55 Reissue 2005, Lindy 2007). 7 years held null (WOC, Vanity Case, Pochette Métis,
    Herbag, Bumbag, Blondie, Kate — disputed/undocumented debut). 0 em dashes. Drafts
    `data/style-depth-icons-batch1.json`. Verified persisted (stub gone).
  - ✅ **Batch 2 (ranks 26-50, ≥361)** — DONE 2026-07-10. 25 descriptions + 20 sourced years live
    (Loewe Puzzle 2014, Bolide 1923, Sac de Jour 2013, Antigona 2011, Deauville 2012, Twist 2015,
    NéoNoé 2017, Coussin 2021, Chanel 22/25 2022/2025, Bamboo 1947/Diana 1991, Rockstud 2010,
    Pochette Accessoires 1992, Le 5 à 7 2021, Belt 2015). 5 held null (Lou, City, Saint-Louis, Soho
    Disco, Jet Set). **Flagged style 537 'Reissue' = probable dup of 423 '2.55 Reissue'** →
    `docs/style-bucket-audit.md` for human-gated merge (both described, not auto-merged).
  - 🔄 **Batch 3 (ranks 51-75, ≥217)** — archivist sourcing (2026-07-10).
  - ⬜ **Batches 4+ (ranks 76-559, <217 comps)** — queued; same method, highest-comps first. Full ranked
    list from `probe-bare-styles.ts` (559 bare styles ≥10 comps).
- ⬜ **Thin tail (~76 new styles < 10 comps)** — DEFERRED by design: a sourced description costs
  more than the near-zero traffic returns. Revisit when they accrue comps or on explicit request.
  Same method: archivist batch → `apply-style-depth.ts`.
- ✅ **Category-bucket audit** — DONE 2026-07-10. Review list at `docs/style-bucket-audit.md`:
  7 archivist-confirmed category/motif buckets + 5 token-flagged needs-review + Chanel Urban
  Essentials seasonal. Strongest merge candidate = the 3 Gucci GG-Supreme logo entries. NO merges
  applied (needs human spot-check per pipeline rule). Superseded detail below:
- 🗂️ (audit detail) archivist flagged 7 of the top 15 as category/motif descriptors,
  NOT single models: Gucci Belt Bag, Prada Triangle, Gucci Neo Vintage, Gucci Emblem, Celine
  Macadam, Gucci Retro Interlocking G, Chanel Pearl Crush (design detail); + Chanel Urban
  Essentials is seasonal (no permanent name). The 3 Gucci GG-Supreme logo entries (Neo Vintage /
  Emblem / Retro Interlocking G) overlap and may be collapsible. NEEDS REVIEW before merge — per
  [[catalog_promotion_pipeline]] style dups are NOT bulk-mergeable (silhouette buckets are
  intentional). Producing the full-catalog audit list next.

## SEARCH-GAP POINTERS (from article-engine cross-feed rule 3)
- ✅ **"goyard"** — RESOLVED (verified 2026-07-10). The 2026-06-28 miss predates the
  2026-07-02 Goyard sweep; Goyard now has a brand row + 33 styles + 52 variants, and
  `legacySearch` (the `searchCatalog` fallback the live `/search` uses) matches brand
  name via `ilike`, so "goyard"/"Goyard"/"goyard tote" all resolve. `searched_not_found`
  holds no goyard row. Verified against prod with the anon client. No code change needed.
  *(Latent, out of scope: `hybrid-search.ts` bm25 brand/style-name match only scans an
  arbitrary 60-row window; brand search is covered in practice because `searchCatalog`
  runs alongside and merges. Worth tightening if under-match ever recurs.)*
- ✅ **"alma" ×3** — CAPTURE BLOCKER RESOLVED (verified 2026-07-10). LV Alma (style 434) already
  has **1,563 price comps across 9 size variants** from the 2026-07-02 LV sweep: Fashionphile 1,212
  (fixed-price = realized per [[fashionphile_fixed_price]]), TLC 219, TRR 131, eBay 1. Size medians
  are article-ready — BB $1,636/n622, PM $950/n545, Mini $1,386/n241, Nano $1,595/n37, GM $995/n52,
  MM $1,090/n43. The data bar is met; the remaining work is WRITING the article (moves to the
  article-engine lane, `docs/article-backlog.md`), not a capture. Page-depth note: style 434's
  description is a 49-char stub + no year_introduced — worth a depth pass (core icon, high demand).
  ✅ **ARTICLE PUBLISHED 2026-07-10** (owner said "just post it") — post **#38**, slug
  `louis-vuitton-alma-what-its-worth`, topic→Alma(434), `status=published`, via `seed-alma-article.ts`
  (idempotent, body-canon guard). Copywriter-drafted (voice canon), data bar deduped by listing_ref:
  BB $1,565/n197, PM $895/n179, Mini $1,381/n130, GM $1,033/n18, MM $928/n16, Nano $1,695/n9; framed
  asking-not-sold + estimate-not-appraisal; body renderer-clean (0 em dashes / stray tokens). Also
  fixed the page-depth gap: Alma page (434) now has a real sourced description + year_introduced=1934.
  Draft archived `docs/research-drafts/lv-alma-value-draft.md`. OPEN (revise on-site if wanted, DB body
  is canon): the "Mini" size (n=130) is a market label, not an official LV Alma size (LV = Nano/BB/PM/
  MM/GM). ✅ **CHART WIRED 2026-07-10**: `AlmaSizeChart` (`[diagram: alma-size-chart]`, registered in
  `articles/[slug]/page.tsx`) replaced the inline median bullets in the body — 6 sizes, small-vs-large
  colored to show "size tracks desire", deduped/dated/asking-framed. Article renders `force-dynamic`
  so the published body is live now; the NEW chart component needs the next prod `vercel --prod`
  promote (hers) to appear.

## FULL-CATALOG MODEL SWEEP (owner greenlit 2026-07-02) — ✅ DONE same day
*Goal: every real handbag model per brand gets a canonical style + variants + Fashionphile
asking rows, closing the icon-scope gap (measured 2026-07-02: only 60.0% of FP's 6,250+ live
LV listings matched a catalog style). Bags + carried pouches in scope; SLGs (wallets/key/card)
deferred. Method per brand (all free, products.json): `sweep-mine.ts <slug> "<Brand>"` (mines
model clusters + merges full dump) → curate `supabase/ingest/sweep-targets/<slug>.json` →
`scaffold-from-spec.ts <slug> --write` → `fashionphile.ts --raw` → `load:prices fashionphile
--write` → `summary:refresh` → commit. Net-new styles ONLY — never reshape hand-managed icon
size buckets (2026-06-30 collision lesson).*

Queue (priority order; tick with counts + date):
- ✅ Louis Vuitton DONE 2026-07-02: 121 sweep targets / ~60 models (clusters >=10 listings), 134 styles+variants created, 3,800 FP rows loaded 0 unresolved. Speedy Soft + LV x TM excluded from classic Speedy buckets (hardcoded excludes updated). Flags: Neverfull GM skipped (hand-managed size labels, data lane to reconcile); tail clusters <10 listings not targeted.
- ✅ Chanel DONE 2026-07-02 (80 targets: flap-family sizes disambiguated w/ shared exclude set, Blazy lines Souplissimo/Kelly Shopper added, vanity+clutch families; 57 styles/variants created; cumulative 6,990 FP rows loaded 0 unresolved) · ✅ Hermès (35 targets: Birkin 40 + Mini Kelly 20 gaps closed, Evelyne/Picotin/Constance/Lindy/Herbag/Jypsiere/Bolide/24-24 + pouches) · ✅ Goyard (25 targets: Artois/Anjou/Boheme/Belvedere/Saigon sized + Senat/Alpin/Vendome/новые) · ✅ The Row (16 targets: Park/90s/Banana/Peggy/Marlo/Half Moon) — ultra-luxury DONE 2026-07-02, cumulative 8,712 FP rows 0 unresolved
- ✅ Premium tier DONE 2026-07-02: Gucci 40 targets (Marmont/Dionysus/Soho/Jackie/Ophidia/Horsebit/Blondie + Neo Vintage/Milano/Softbit) · Prada 19 (Re-Editions/Galleria/Cleo + Arqué/Aimée/Darling) · Fendi 17 (Baguette family/Peekaboo/Spy/Mon Trésor/First/Fendigraphy) · Balenciaga 16 (City+Le City/Hourglass/Rodeo/Bel Air) · Miu Miu 8 (Wander/Ivy/Aventure/Arcadie; FP thin at 212 products) · Valentino 10 · Givenchy 15 (Antigona sized/Pandora/Voyou). Cumulative 11,305 FP rows, 0 unresolved.
- ❌ Coach: ZERO Fashionphile inventory (premium-only consignor). Coach + Kate Spade + Longchamp + Michael Kors stay on the eBay/Poshmark browser-gated path (monthly re-capture task).
- ✅ Mid tier DONE 2026-07-02: SL 23 targets (Loulou/Niki/Kate/Le 5 à 7/Triquilt) · Celine 21 (Luggage/Triomphe/Box/Ava/16/Camille) · Dior 24 (Lady Dior sized/Saddle/Book Tote/Bobby/Caro) · Bottega 15 (Jodie/Andiamo/Hop/Pouch) · Loewe 17 (Puzzle family/Basket/Flamenco/Squeeze) · Chloé 14 (Paddington!/Marcie/Faye/Woody) · McQueen 3 · Mulberry 4 · Jacquemus 8 · Off-White 2
- ✅ Burberry 10 targets · ✅ Telfar 3 (Shopping Bag S/M/L) · ❌ Kate Spade/Longchamp/Michael Kors: zero FP inventory (browser-gated path)
- ✅ RESULT (2026-07-02): 14,093 price rows added today (price_history now 56,440; styles 697). Final load 14,087 mapped / 0 unresolved. Coverage of live FP listings vs catalog styles: LV 60.0% → 80.5% (rest = out-of-scope SLGs/silk), Chanel 96.3%. Speedy Soft contamination cleaned (93 pre-sweep rows deleted from classic Speedy buckets; excludes added to hardcoded targets).
## CATALOGUE COMPLETION RUN (owner: "do them all, on a loop, until done" 2026-07-02) — 🔄 IN PROGRESS
*Finish line A (resale-complete) then a B (current-line) prototype. Units, tick as done:*
- ✅ U1 DONE 2026-07-02: +69 tail targets across 9 brands (+947 rows, cumulative 15,158 mapped, 0 unresolved). Catches: LV CarryAll was never targeted (44 live listings), Neverfull GM label workaround, SL Jamie, Gucci Sylvie, Balenciaga First.
- ✅ U2 DONE 2026-07-02: 502 eBay live-listing rows (Coach 311 across Tabby/Pillow/Willow/Brooklyn/Rogue/Swinger + Knott 59 + Le Pliage 67 + Hamilton 65), 0 unresolved. Method: Firecrawl MCP search-page scrapes (9 credits total, no per-item pass; local FIRECRAWL_API_KEY absent, CLI path needs it, MCP does not). eBay targets added to firecrawl-ebay.ts for future keyed runs. Search-level = title/price/url only; item-specifics enrichment = the metered follow-up.
- ✅ U3 DONE 2026-07-02: 99 Vestiaire rows via Firecrawl MCP search pages (7 credits): Miu Miu Ivy 15 + Arcadie 15, Prada Arqué 15 + Aimée 15, Fendi Spy 15, The Row 90s 15 (Mini split!) + Peggy 9 incl 8 SOLD rows (Vestiaire shows sold listings = first realized The Row data). Colorway/material/region parsed from slugs onto every row. Remainder for a later 1-credit-each pass: Darling, Fendigraphy, First, Loco, Bow.
- 🔄 U-DEALS-MIDTIER (queued 2026-07-05 by the UX persona review): the colour+material
  BLOCKER is now largely cleared (2026-07-10) — instead of the metered Firecrawl item-page
  scrape, backfilled colour/material from eBay TITLES via `enrich-specs.ts --platform=eBay`
  (Haiku, guardrailed "only what's stated", non-null-only writes so structured values are
  never wiped). Result: eBay colorway 3 → 689, material → 1,149; **488 eBay rows now carry
  BOTH material+colour** (the `isConfidentBasis` requirement), incl. clean Coach comps
  (Tabby/Chalk/Pebble Leather, Swinger/Candy Pink…). So eBay-sourced mid-tier styles can now
  compute like-for-like fair value = deal badges. ⬜ REMAINING: the deals SURFACE also needs
  FRESH LIVE mid-tier inventory (the sold/expired rows can't badge as "for sale"); a live
  mid-tier eBay capture cadence is the last piece. ~1,355 eBay rows stay colour-null (titles
  state no colour — held null, never guessed).
- ✅ U4 DONE 2026-07-02: price_history 57,165 (+14,818 today), styles 761, variants 1,388. FINISH LINE A: ~substantially closed for the 24 FP-carried brands (LV 80.5% / Chanel 96.3% of live listings, bags-only scope); Coach + 3 thrift brands now have eBay live-ask coverage; thin premium brands have a Vestiaire second source. Remaining A items: SLG expansion (decided: later, owner-gated), Vestiaire remainder (Darling/Fendigraphy/First/Loco/Bow), eBay item-specifics enrichment (metered).
- ✅ U5 DONE 2026-07-02: Loewe brand-site prototype PROVEN (Firecrawl, 1 credit, no bot-block on loewe.com). Runbook: scrape /women/bags with links format; line names = URL path segment (/bags/puzzle/), model+size+material in product slug; diff path segments vs catalog style names; ~34 pages for full Loewe (~34 credits). FOUND + created 8 current-line styles resale doesn't surface yet: Scarf Bag/Backpack, Amazona 180, Cala, Bilbao Bucket, Braid Basket, Punch Hole Hobo, Hammock Flip (16 variants, zz-loewe-current-line.json). B rollout per big house = a later session; big-house sites (LV/Chanel/Gucci) likely harder than Loewe, test before assuming.
- ✅ U6 wrap in progress 2026-07-02 (gate + merge below)


- ✅ CONTENT FOLLOW-UP DONE 2026-07-10: refreshed the three charts carrying stale June-26 comps against current deduped medians (live asking, USD, dedupe by `listing_ref`). NeverfullSizeChart: MM $1,245→$1,515 (n=345), PM $1,185→$1,583 (n=36); "cost about the same" thesis holds (within ~5%). IconicPricesChart + EntryBagsChart (shared the stale $1,245/$911): all bars re-pulled — Marmont small $911→$1,095 (n=183), Speedy 30 $1,623→$1,375 (n=148), Chanel Flap med $6,000→$6,205 (n=614), Kelly 32 $12,410→$12,345 (n=37), Birkin 30 $18,000→$20,335 (n=133). Date labels moved June→July 2026; `launch-articles.ts` STALE_FIGURES hints refreshed. All figures stamped with n + 2026-07-10.
- ⬜ FOLLOW-UPS: Neverfull GM label reconcile (hand-managed variant labels vs sweep convention); SLG scope DECIDED 2026-07-02: yes eventually, NOT now (owner). Revisit on her green light; tail clusters <10 listings untargeted; monthly re-capture now covers ALL sweep targets automatically (same TARGETS path).

## LV gap-series capture + day-one articles (2026-07-02) — DONE
- ✅ 5 new LV styles created + scaffolded (Liv Pochette #685, Montsouris #686, Slouchy #687, Cosmetic Pouch #688, Lineup #689; Boulogne #550 got NM/GM/30/35 variants). TARGETS added to sources/fashionphile.ts (tokens anchored; collabs/straps/vibe excluded).
- ✅ Fashionphile collection pass: 117 rows loaded (products.json path, free), summary refreshed. Notable reads: Montsouris PM $1,995 (n=11) vs vintage MM $995 (n=12); Slouchy is MM-led (n=10, $2,410); Neverfull PM = MM at $1,450 in monogram (n=153/491); Lineup too thin (n=2).
- ✅ PUBLISHED #33 chanel-in-2026-explained (topic: Chanel 25 #520) + #34 lv-bags-nobody-talks-about (topic: Alma #434) via seed-trend-articles.ts, owner said "publish" 2026-07-02. Every [DATA] slot filled from prod with n+date; [VERIFY] facts checked (chanel.com 1910/Boy, LV heritage Alma 1934) or kept hedged (Blazy maxi-flap dates stay "creators report").

## Hero p2p SOLD capture (eBay completed sales → load-sold.ts → refresh-summary)
- ✅ Coach Tabby 20/26/Std + Rogue all sizes — 421 rows (2026-06-26)
- ✅ Chanel Classic Flap Medium v199 — 78 rows, median $3,846 (2026-06-26)
- ✅ LV Neverfull MM v218 — 87 rows, median $770 vs $1,245 ask (2026-06-26)
- ✅ LV Speedy DONE (style 433: v497/498 + Bandoulière v934); 146 sold, median $593 (2026-06-26)
- ⛔ Hermès Birkin/Kelly eBay SKIPPED (deliberate): eBay is dominated by counterfeits/replicas/parts; genuine \$15k+ Hermès sells via specialist auction, not eBay. Loading eBay 'sold' would inject fake-priced noise onto hero variants (never-invent). Use a specialist source if ever needed.
- ✅ Gucci GG Marmont small v207 sold — 46 rows, median $780 (2026-06-26)
- ✅ Dior Lady Dior Mini/Small/Med/Large sold — 46 rows (2026-06-26)
- ✅ Dior Saddle Medium/Mini sold — 88 rows, median ~$1,600 (2026-06-26)
- ✅ Coach other models DONE: Brooklyn v606 (169, $225), Pillow Tabby v598/599 (83, $200), Willow v610 (54, $160), all eBay sold (2026-06-26)
- ⬜ Poshmark cross-source for other heroes (Neverfull, Flap) when desired
- ✅ Poshmark cross-source for Coach Tabby 26 — 24 recent sold, median $250 (vs eBay $198); both confirm ~$200-250, well under $365 ask (2026-06-26)

## Mid-tier breadth (absent brands — create curated variants, then capture)
- ✅ Michael Kors created (brand 401, Jet Set style 514, v928/929); Jet Set tote sold — 80 rows, median $80 (2026-06-26)
- ✅ Kate Spade DONE: Knott (v925/926, 116 rows, med $120) + Sam (v927, 50 rows, med $100), eBay sold (2026-06-26)
- ✅ Longchamp created (brand 402, Le Pliage style 515, v930/931); nylon tote sold — 84 rows, median $99.50 (2026-06-26)
- ✅ Mulberry created (brand 403, Bayswater 516/v932 + Alexa 517/v933); Bayswater sold — 93 rows, median $519, holds best of mid-tier (2026-06-26)

## New backbone brands (2026-06-28) — ONE-PASS capture (scaffold → all surfaces → load → summarize)

*Per the §0 capture standard: each new house's T1 styles need variants scaffolded FIRST
(loader drops zero-variant styles), then capture every source, load, refresh. Engines:
Fashionphile + Wayback = server fetch; TRR/Vestiaire/Rebag/etc = Firecrawl (bot-block
defeated, no Chrome session needed). eBay API + affiliate feeds dead (see §0a).*

> **🔬 Firecrawl probe (2026-06-30, in-session MCP, ~16 credits, Balenciaga City test) — UPDATES §0d:**
> - **Vestiaire = the cheap rich winner.** ONE search scrape = **5 credits** returns price + **colour +
>   material** + region per listing (data sits in the page; NO per-listing detail scrape needed). So a
>   whole-catalog Vestiaire pass ≈ 5 cr × ~56 styles ≈ **~280 credits — fits the FREE 1k tier**, even monthly.
> - **TheRealReal has HARDENED since 2026-06-28.** Search page still works (5 cr, price + title). But
>   **product/detail pages are now PerimeterX-captcha-blocked even on the stealth proxy** (403, still
>   burns 5 cr for nothing). The old ~2.85-cr/listing detail path is currently DEAD. TRR now gives only
>   price + material-from-title (no colour). Treat TRR as search-only + low priority until PX is solved.
> - **BLOCKER PROVEN (2026-06-30, $0 local dry-run): Vestiaire cannot be cleanly loaded per-variant.**
>   Search titles carry NO size (all null); the loader then piles EVERY size-less row onto the style's
>   first variant (tested: 13 mixed-size Antigona rows all landed on variant 1013 = Antigona **Mini**),
>   which would corrupt that variant's median. Size only exists on the Vestiaire DETAIL page as raw
>   DIMENSIONS ("12in x 10in x 6in"), needing fuzzy per-style dimension→label mapping to load cleanly.
> - **Verdict (my take): do NOT bulk-load Vestiaire per-variant.** Fashionphile already gives these
>   styles clean per-variant medians; the marginal lift (colour/material spread + region) doesn't beat
>   the dimension-mapping build + mis-size risk. **Better uses of Vestiaire:** (1) STYLE-LEVEL spread
>   stats for content (ad-hoc capture, cited in an article, no DB load) — e.g. "Antigona $198-$1,610
>   across colours on Vestiaire"; (2) single-variant styles only, where size-less rows are unambiguous.
> - TheRealReal detail stays PX-blocked. Net: the paid Firecrawl pass is NOT worth it right now; the
>   free Fashionphile per-variant medians stand as the clean dataset.

> **Method (2026-06-30, unattended Fashionphile pass):** `sources/fashionphile-collection.ts <slug>`
> server-fetches the brand's `products.json` (FREE, no Firecrawl credits) → `fashionphile.ts --raw`
> maps to TARGETS → `load:prices fashionphile --write` → `summary:refresh`. **Brand guard added to
> `mapRawRecord`** (matches a target only when the handle's brand == target brand) after a bug where
> loose substring tokens cross-matched (e.g. Valentino "rockstud-spike" → a Celine target). Sweep
> stray rows with `clean-fp-contamination.ts [--write]`. TRR/Vestiaire (Firecrawl, spends credits =
> owner-gated) + eBay sold (browser) remain per-brand ⬜ sub-items.

- 🔄 **Goyard** — ✅ Saint Louis PM/GM Fashionphile (refreshed 2026-06-30: PM med $2,462 n=258, GM med $2,495 n=117). ✅ Remaining styles 2026-06-30 (234 rows w/ Saint Louis refresh): Anjou Mini $2,930/n24 + PM, Artois MM $3,092/n12 + PM $2,945/n18, Belvédère PM $2,785/n19, Saïgon Mini $3,890/n11 + PM, Rouette PM, Bohème $2,995/n23. ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **The Row** — ✅ Soft Margaux 10/12/15/17 Fashionphile (refreshed 2026-06-30: med $4,495/$5,325/$6,445/$6,130, n=25/13/26/16). ✅ Remaining styles 2026-06-30 (59 rows): Margaux $6,455/n3, Half Moon $1,175/n3, Bindle $1,375/n1, Park Tote Medium $1,850/n9 + Large $1,950/n5 + Std $1,850/n7, Terrasse $4,045/n2. ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Balenciaga** — ✅ Fashionphile (2026-06-30, 111 rows): Le Cagole XS $1,072/n20 + Mini $695/n3, Hourglass XS $1,087/n20 + Small $1,150/n21, City(le-city) Small $2,220/n13 + Medium $2,605/n15, Neo Classic Nano $1,175/n6, Velo $1,130/n8, Papier $640/n3. ⬜ TRR/Vestiaire (Firecrawl, credits) + eBay sold (keys)
- 🔄 **Chloé** — ✅ Fashionphile (2026-06-30, 108 rows): Marcie Mini $650/Small $1,095/Medium $775, Faye Mini $460/Small $375/Medium $550, Woody Tote Medium $635/Large $1,010, Drew $505/n9, Aby Medium $1,017/n2, C Bag Mini $895/n1. Penelope=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Givenchy** — ✅ Fashionphile (2026-06-30, 115 rows): Antigona Mini $1,255/n35 + Small $1,015/n29 + Medium $1,050/n11, Pandora Mini $650/Small $485/Medium $450, 4G Small $830/Medium $1,150, Voyou Nano $750/Medium $800, Cut Out Mini/Small, GV3 $692/n2. ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Valentino** — ✅ Fashionphile (2026-06-30, 40 rows, slug `valentino-garavani`): Rockstud Spike Small $972/Medium $1,207/n8/Large $1,075, Roman Stud Small $1,420/Medium $1,392/Large $1,345, Locò Small $1,650/n7 + Standard $1,230, One Stud $660, VLogo Signature Mini $950, Supervee $1,142. (Vsling has no catalog style row — skipped.) ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Alexander McQueen** — ✅ Fashionphile (2026-06-30, 13 rows; thin feed n=37): The Knuckle $1,225/n4, The Bow Tote $620/n2, Skull $607/n6, Manta $1,800/n1. Jewelled Satchel=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Off-White** — ✅ Fashionphile (2026-06-30, 14 rows; tiny feed n=18): Binder Clip Mini $340/n9, Jitney $595/n5. Burrow=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Jacquemus** — ✅ Fashionphile (2026-06-30, 56 rows): Le Chiquito $495/n26, Le Bambino $650/n9, Le Grand Bambino $737/n16, Le Bambimou $760/n5. Le Chouchou=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Miu Miu** — ✅ Fashionphile (2026-06-30, 42 rows): Wander $2,000/n5, Arcadie $2,422/n6, Aventure $2,845/n11, Matelassé $667/n20 (excl. wander/arcadie/aventure handles). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- 🔄 **Burberry** — ✅ Fashionphile (2026-06-30): Lola (Mini $570/Small $675 — refreshed), + remaining styles 39 rows: Banner Medium $730/n10 + Large $762, Note $1,060/n8, Title $995/n3, TB Bag Small/Medium, Pocket Mini $795. Catherine=no inventory (skipped). ⬜ TRR/Vestiaire (Firecrawl) + eBay sold
- ✅ **Mulberry** (existing mid-tier) — Fashionphile asking added 2026-06-30 (17 rows): Bayswater Small $1,095/n9 + Mini $1,020, Alexa Medium $555/Mini $945/Small (fills the empty Alexa style). Lily/Amberley/Antony have FP inventory but need NEW style rows (deferred — owner-gated like promote-newstyle).

> **✅ FREE Fashionphile pass COMPLETE (2026-06-30).** All 11 backbone brands + Goyard/The Row
> remainders + Mulberry captured: **856 rows / 81 new variants** in one autonomous run, 0
> contamination (brand guard added). Catalog 806→887 variants, 41,523→42,379 price rows. Merged to
> `main` (FF b7aab74→…). **Remaining per-brand ⬜ are PAID/gated:** TRR + Vestiaire need a Firecrawl
> credit budget (owner greenlight per §0c), eBay sold needs the browser session. Next free lever =
> a Redeluxe/Couture USA open-Shopify-feed adapter (registry §0b) for a second free asking surface.

**✅ DONE 2026-07-10 — Redeluxe + Couture USA Shopify feed adapters (both wired daily):**
- `redeluxe-crawl.ts`/`redeluxe.ts` + `redeluxe-refresh.yml` (daily); `couture-usa-crawl.ts`/
  `couture-usa.ts` + `couture-usa-refresh.yml` (daily). Free, no key beyond the Supabase service role.
- **SAFETY satisfied via guard (b):** only `canonicalModel` dictionary-hits go to the curated load
  (same resolver TLC ships to prod); every unnamable live bag routes to `--discovered-only`, which
  never loose-matches a curated variant. So the fuzzy `scoreStyleMatch` only ever runs on
  dictionary-backed model names, not raw titles. Nothing thrown away (unnamable → discovered evidence).
- Verified (2-page samples, 0 invalid): Redeluxe 175 named + 45 discovered; Couture USA 202 named
  (10 houses, colour on 199/202) + 95 discovered.
- ⬜ Follow-up: a few discovered rows carry the store name as brand ("REDELUXE") — harmless noise in
  the evidence layer; a vendor-is-a-house guard could drop them. Rebag stays gated on its CJ approval.
- Emit `platform:"Redeluxe"`/`"Couture USA"`, `price_type:"listed"`, `source_url` per listing, condition
  from tags. Then `load:prices <source> --write` → `summary:refresh` → run `clean-fp-contamination`-style
  brand check before trusting it.

## Promotion / catalog
- ✅ OWNER-GREENLIT 2026-06-26: promote-newstyle.ts created 16 new bag styles + 20 variants + 612 asking rows (Multi Pochette, GST, Chanel 25, Padlock, Camera Bag, Félicie, Graceful, Trendy CC, Noé, Trio, Loop, Artsy, Deauville, Sunset, Lady D-Lite, CarryAll); 8 apparel/junk clusters excluded by blocklist
  PLUS min=10 pass: +25 styles, +30 variants, +404 rows (Diane, Favorite, Boulogne, Delightful, Palermo, Tivoli, Reissue, Hop, Sylvie, Boston, Diorama, In-The-Loop, Jige, Trim, Jamie, Urban Spirit...). Strengthened blocklist excludes footwear/apparel/colour-soup. Total: 41 styles, 50 variants, ~1,016 rows.
- ⬜ Resolve the ambiguous Neverfull "MM" duplicate (v868) across canvases (manual). DIAGNOSED
  2026-07-10 (read-only, NOT executed — hand-managed icon + feeds shipped NeverfullSizeChart, so
  left for a careful pass): style 218 has 4 MM variants. v218/v220/v221 are the CLEAN canvas-split
  MMs (Monogram / Damier Ebène / Damier Azur, full curated attributes + retail + years). **v868 is a
  null-attribute catch-all** (created 2026-06-26 by a sweep, market_availability="resale", ~400
  mixed-canvas rows: Damier Ebène + Canvas Beige + Leather Black…). Fix = route v868's rows to the
  right canvas MM by each row's material/colorway, then delete v868; then re-verify NeverfullSizeChart
  MM (currently cited $1,515 / n=345) since its median shifts. Semi-destructive → owner-aware pass.

## Articles (write as DRAFTS, wire + chart + seed, gates green)
- ✅ #15 what-a-coach-tabby-actually-sells-for (CoachResaleRealityChart) (2026-06-26)
- ✅ #16 does-a-smaller-bag-cost-more (SizePriceCurveChart) (2026-06-26)
- ✅ Neverfull vs Speedy DONE (2026-06-27): wired as LIVE draft `neverfull-vs-speedy` via
  seed-neverfull-speedy.ts (LV/Neverfull-tagged so CTA renders). Angle = the reversal: Speedy
  out-searches Neverfull (Trends 27.8 vs 17.9; Neverfull fading 5y) AND lists higher (Speedy 30
  $1,623 vs MM $1,245) but SELLS for less (MM $770/n87 vs Speedy 30 $566/n93). NeverfullSpeedyChart
  rebuilt to the self-updating async ask-vs-sold pattern (getMedians on v218/v498, baked fallback).
  Gates green. Owner publishes.
- ✅ "Most searched vs most expensive" LIVE draft post #20 (SearchVsPriceChart): Kelly/Birkin top both; Flap least-searched yet 3rd priciest (2026-06-26)
- ✅ "Dior Saddle is back" LIVE draft post (dior-saddle-resale-price), reuses ask-vs-sold-gap chart (2026-06-26)
- ✅ "The asking-price illusion" LIVE draft post #17 (AskVsSoldGapChart) (2026-06-26)

## Trends
- ✅ 7-set Google Trends pull recorded (`docs/research-drafts/trends-keyword-pull.md`) (2026-06-26)

## Mid-tier insight (2026-06-26) — ready to wire as article
- ✅ Draft written: `midtier-holds-value-draft.md` (which accessible bags hold value). Leather heritage
  (Bayswater $519, Rogue $645) >> logo/nylon (MK Jet Set $70, Le Pliage $90, Kate Spade $100-114, Tabby $198).
- ✅ Wired midtier-holds-value as LIVE draft post #19 (MidTierHoldsValueChart), now under /articles route (Content lane renamed /posts→/articles) (2026-06-26)

## Speedy data (2026-06-26)
- ✅ LV Speedy created/used (style 433: 25=v497, 30=v498, +Bandoulière v934); sold 146 rows, median $593
  (25 ~$565, 30 ~$566, Bandoulière ~$840). KEY: Speedy out-searches Neverfull (Trends set 3) but SELLS for
  LESS ($593 vs Neverfull MM $770) — backs the Content lane's Neverfull-vs-Speedy piece (post_id 10).

## Monetization + freshness execution (owner-directed 2026-06-26)
- ✅ Skimlinks pre-resubmit: privacy policy now discloses affiliate/third-party tracking cookies (eBay/Impact/CJ/Awin/Skimlinks) — `src/app/privacy/page.tsx`. (Other blocker = PUBLISH drafts; reviewer sees only published.)
- ✅ Monetization gap fix: tagged #14 (Marmont vs Neverfull vs Speedy) → Gucci/Marmont so the PostBagCTA renders. (#11 rent-or-buy + #12 red-flags left brand-neutral by design.)
- ✅ UX BUILT: ShopThisBag (inline card injected after first chart + dismissible floating bar, mobile bottom / desktop bottom-right) pulling REAL live listings via getStyleShopData() (src/lib/article-shop.ts), affiliate-attributed. Data-led copy ("43 listed, from $130"), dismissible, 375px-safe. Gates green. Preview for owner to commit.
- ✅ FRESHNESS: runbook written (docs/freshness-runbook.md) — Fashionphile auto-daily; eBay/Poshmark/TRR browser-gated → MONTHLY re-capture cadence; real fix = affiliate product feeds (hands-off).
- ✅ MONTHLY RE-CAPTURE: durable trigger = .github/workflows/monthly-recapture-reminder.yml (1st of month → opens `recapture` GitHub issue; survives ephemeral container, unlike a 7-day session cron). Paste-ready loop prompt + bag list in docs/monthly-recapture-task.md. Capture stays browser-gated (Claude-in-Chrome), not CI (2026-06-26).
- 🔄 AFFILIATE GATE (confirmed 2026-06-25): Skimlinks REJECTED ("site not suitable at this time", generic). Root cause across ALL networks = thin PUBLISHED content + low traffic; articles sat as drafts so reviewers saw a near-empty site.
  - ✅ PUBLISHED 6 data articles 2026-06-27 (owner said "publish"): #15 what-a-coach-tabby-actually-sells-for, #16 does-a-smaller-bag-cost-more, #17 asking-price-vs-sold-price, #18 dior-saddle-resale-price, #19 which-accessible-bags-hold-value, #20 most-searched-vs-most-expensive-bags. Via publish-articles.ts + publish-articles.yml (CI holds the service-role key; this env has none). Slug-scoped, idempotent, reversible (UI unpublish). Picked the fresh, drift-clean set (NOT #6/#8/#9/#14). Log: "published 6/6". The other 11 drafts stay owner-gated.
  - ✅ PUBLISHED the remaining 11 drafts 2026-06-27 (owner said "push all unpublished live"): #4–#14 (where-to-sell, authenticate-LV, birkin-vs-kelly, fake-marmont, neverfull-mm-or-pm, iconic-resale-costs, neverfull-vs-speedy, rent-or-buy, resale-red-flags, good-investment, marmont-vs-neverfull-vs-speedy). Via publish-articles.yml write=true. Log: "published 11/11". ALL 17 articles now live. Owner ruled prices are a dated snapshot (page already shows the publish date in the byline) — the #6/#8/#9/#14 drift figures stay as-published, no refresh required.
  - ⬜ OWNER: reapply to Skimlinks + nudge Impact now that all 17 articles are live.
- ✅ LISTING FRESHNESS (owner: "listings sell every hour, monthly too long"): split medians (aggregate, monthly OK) from live listings (churn hourly). DID: (1) Fashionphile retire job daily→every 3h (headless); (2) ShopThisBag "view" links now rank reliable-live sources (Fashionphile→TRR) first so affiliate clicks avoid stale eBay/Poshmark rows. REAL hourly fix = affiliate product feeds (owner-gated on approvals); browser-gated eBay/Poshmark status can't refresh headless (2026-06-26).
- ✅ SELF-UPDATING CHARTS: all 6 data-article charts refactored to async server components reading live via getMedians() with per-field baked fallback (n=0/DB down never renders empty): CoachResaleRealityChart, AskVsSoldGapChart (Dior Saddle row stays baked — id 574/575 unresolved), SizePriceCurveChart, MidTierHoldsValueChart, SearchVsPriceChart (asking-only; Birkin/Kelly stay baked as cross-size aggregates; Trends bars static). Dior Saddle post reuses ask-vs-sold-gap. Gates green, pushed (2026-06-26).
- ✅ Drift check done → docs/article-freshness-report.md: #8/#9/#14 (Neverfull $1245→$1500, Marmont $911→$1095) + #6 (Birkin $18k→$19,995) STALE; Flap/Kelly/Tabby match. #10 can add Speedy sold $566. Owner updates figures before publishing those.

## "It bags of all time" canon gaps (for the ranked-canon article + tier-4; added 2026-06-29)
*These bags are in the archivist's top-20 canon but NOT in the catalog, so they can't carry a post→bag CTA in the "Why are these the it bags of all time?" article. Capture asking + sold across sources per §0, create the style/variant, load, refresh-summary.*
- ✅ **Balenciaga City** — DONE 2026-06-29. Created style City (variant 991); loaded 191 rows (eBay sold 76 + Fashionphile 115). Resale median ~$1,495 ($137–$2,965).
- ✅ **Mulberry Bayswater** — DONE 2026-06-29. Brand/style/variant already existed (variant 932); loaded eBay sold 112 + Fashionphile 15 → 220 total rows. Resale median ~$560 ($118–$1,468).
- ✅ **Telfar Shopping Bag** — DONE 2026-06-29. Created brand Telfar (tier thrift) + style Shopping Bag (variant 992); loaded 82 rows (eBay sold 45 + Fashionphile 37). Resale median ~$120 ($50–$330); eBay floor ~$81 is the accessible-market read, Fashionphile premium pulls the blend up.
- Loader: `supabase/ingest/load-canon-gaps.ts` (dry-run default, `--write`, idempotent). Captures were browser-gated (Claude-in-Chrome, owner-present); raw landed in gitignored `data/ingest/_raw/`. **NOTE:** migration 0038 added a FUNCTION `variant_price_summary()` that shares a name with the pre-existing 0021 materialized view of the same name — reconcile in the deals/hero RPC rewire (use one or the other).
- (also flagged separately, chip task_646da12f) ⬜ Backfill `price_history.condition` from source listings so the rail's "great price" verdict can become condition-aware (only 15 of ~31.8k listed rows have condition today).

## Representative house pricing — broaden coverage (2026-06-30, owner-directed)

*Powers the /data "typical resale price by house" claim. Owner wants it to genuinely
mean "what a typical bag from this house costs," not "the icons we happen to track."
Today it skews HIGH for three reasons (verified 2026-06-30): (1) we track bags, not
accessories (only ~9 of 633 priced styles are SLGs); (2) thin houses are flagship-skewed
(The Row = 11 variants, 6 of them Margaux; any house under ~20 variants is not
representative); (3) our prices are 95% Fashionphile + The RealReal, which curate to
consignment-grade luxury. Fix = broaden coverage per house, NOT lower any threshold.*

**DIAGNOSIS (verified 2026-06-30): the data EXISTS on the resale market — we just never
captured it.** Fashionphile's per-brand Shopify collection endpoint returns it free:
`https://www.fashionphile.com/collections/<brand-slug>/products.json?limit=250&page=N`
(each product has `vendor`=brand, `product_type` "Bags" vs "Accessories", `title`, and
`variants[].price`). Live HANDBAG counts vs what we track: The Row **136** (we have ~11) ·
Goyard **302** (few) · Miu Miu **81** (4). Miu Miu handbags span $275–$2,760, so the full
set LOWERS + corrects the icon-skewed median — exactly the goal.

**Scope (owner, 2026-06-30): HANDBAGS ONLY — no accessories/SLGs/wallets this pass.**
Filter `product_type === "Bags"` and drop wallet/card/coin/charm/key/belt/pouch/cosmetic titles.

**Method (per §0 one-pass; run in the DATA lane worktree, dry-run first; Fashionphile is the
clean FREE source — do NOT bulk-load Vestiaire, it mis-sizes onto variant 1):**
- ⬜ Fetch each thin brand's `/collections/<slug>/products.json` (paged), keep `product_type
  "Bags"` only. Slugs verified working: `the-row`, `goyard`, `miu-miu`.
- ⬜ Route through `load:prices` → unresolved listings land in `discovered_listing`, then
  `normalize:discovered` + `promote:discovered` to roll recurring MODELS into clean styles.
  **REVIEW the promoted style names before write** (parsing FP titles blind creates junk
  styles like "Chanel Chanel Lilac Quilted…"; group Soft Margaux 10/12/15 → one "Soft
  Margaux" style, etc.). Then `summary:refresh`.
- ✅ **COVERAGE VERIFIED + refreshed 2026-07-10** (priced-handbag-variant counts):
  - **MEET the ≥20 bar now** (from the 2026-07-02 sweep + 2026-07-08 promotion): The Row **47**,
    Goyard **50**, Valentino **32**. These 3 are done.
  - ✅ **Jacquemus → 20 (DONE 2026-07-10)**: 6 existing-but-unpriced styles had no sweep-target, so
    their FP listings never loaded. Added targets + scaffolded Standard variants + loaded FP: Le
    Carinu ($485/n4), Le Turismo ($925/n12), Le Grand Panier ($370/n2), Le Bambidou ($625/n3), Le
    Sac Rond ($710/n5), Le Petit Filet ($655/n2). No new styles, no reshaping — ADD-only. Now MEETS
    the bar.
  - ✅ **Alexander McQueen DEDUP DONE 2026-07-10** (owner-approved, `merge-mcqueen-dups.ts`). Merged 5
    short-name duplicate style rows into their 4 real bags (name-guarded, 10 ph rows re-pointed, 0
    dropped): #666 "Knuckle" + #878 "Knuckle Clutch" → #597 "The Knuckle"; #670 "Peak" → #880 "The
    Peak"; #673 "The Bow" → #599 "The Bow Tote"; #669 "De Manta" → #601 "Manta". McQueen 17 → 12 real
    styles. NOTE this LOWERS the priced-variant count (integrity, not coverage) — McQueen is honestly
    small and stays under the /data ≥20 bar with the honest "bags we track" scoping.
    ✅ **Skull catch-all #600 RE-TRIAGED 2026-07-10** (owner-approved, `retriage-mcqueen-skull.ts`,
    row-level, dry-run first, name-guarded). Of its 42 rows: moved 25 to their real models (11 →
    #668 Padlock $585, 10 → #665 Skull Chain $755, 4 → #667 Skull Box Clutch $610), DELETED 4 non-bags
    mis-ingested onto a bag style (a jersey tank top, a phone cover, 2 velvet smoking slippers), and
    LEFT 13 genuinely-generic skull-motif bags on #600 (Skull Shoulder/Crossbody/Minaudière/Clutch/
    Evening/belt bags, median $455) — an honest bucket, not a fake single model. Also deleted the
    empty dup #879 "Skull Padlock Tote" (0 prices, same bag as #668). McQueen now 11 real styles.
    #598 "The Jewelled Satchel" is a real model with 0 data (leave).
  - ✅ **Miu Miu → 20 (DONE 2026-07-10, FP-adapter size bug FIXED)**. Root cause: `sources/fashionphile.ts`
    matched targets with `Array.find` (FIRST match). The inline size-less generics (`Wander` require
    `["wander"]`, `Aventure` require `["aventure"]`, no size-excludes) sit BEFORE the appended
    sweep-targets, so every sized handle (`small-wander`, `regular-aventure`, `medium-aventure`)
    collapsed onto the generic "Standard" bucket and the sized variants never priced. Fix = new
    exported `selectTarget()` picks the MOST SPECIFIC match (total require-token length) instead of the
    first, so `small-wander` (12-char anchor) beats `wander` (6). General across all brands; regression
    test `src/lib/__tests__/fashionphile-select-target.test.ts` (Miu Miu buckets + Hermès Birkin/Kelly,
    LV Neverfull/Montsouris spot-checks). Recaptured → mapped → loaded: Wander [Small] v1400 (n3),
    Aventure [Regular] v1402 (n3), Aventure [Medium] v1403 (n1) now priced. `audit-coverage` confirms
    Miu Miu **priced_variants=20**. Full suite green (753 tests).
    - ⬜ **FOLLOW-UP (data lane, NOT the adapter — audited 2026-07-10, left untouched by design):** two
      pre-existing Miu Miu variant-taxonomy issues the fix surfaced but must NOT be auto-swept.
      (1) *Stranded pre-fix rows*: the size-less Standard buckets still hold the OLD collapsed rows
      (Wander Std v1047 22/28 FP rows carry a size token; Aventure Std v1049 35/39; Arcadie Std v1048 13/22).
      They mildly contaminate those medians until re-pointed to the sized variants. (2) *Duplicate variants
      across scaffold generations*: ∅-vs-Standard-vs-size twins (Ivy v1117/v1401, Beau v1118/v1406, Coffer
      v1119/v1850, Wander/Aventure/Arcadie Standard-vs-sized). A `selectTarget`-driven auto re-point is
      UNSAFE: "matelasse" is a MATERIAL in Coffer/Bucket handles, so those rows mis-resolve to the
      **Matelassé** STYLE. ✅ **(a) DONE 2026-07-10**: tightened the Matelassé target excludes
      (added coffer/bucket/softy/beau/ivy/sandal/pouch) + regression tests — matelassé Coffer/Bucket/
      sandals/pouches now fall through instead of polluting; genuine matelassé bags (10) unchanged.
      This stops FUTURE contamination only. ⬜ **(b) STILL OPEN (data lane):** the existing DB rows
      already mislabeled onto Matelassé v1050 (+ the stranded Wander/Aventure/Arcadie Standard rows +
      the ∅/Standard/size duplicate variants) need a SAME-STYLE-ONLY re-point/dedup with review — never
      an auto-sweep. Thin non-representative brand, low urgency.
  - **Micro-catalog — bar NOT reachable, keep honest scoping**: Off-White **3**, Telfar **4** (the
    brands simply do not make ~20 distinct resale-traded handbag models). /data keeps "the bags we
    track" wording for these; do not pad to hit 20.
- ⬜ Acceptance (unchanged): every house on the /data board has >=20 priced HANDBAG variants spanning
  its real range, so the median is defensible; where a house's real catalog is smaller, /data keeps
  the honest "the bags we track" scoping (never claim market-wide typical price).

*NOTE: attributes (colour/hardware/material) are NOT part of this task — already dense on
price_history from Fashionphile and now power the /data "Gold or silver / colors / leathers"
sections. Only production_year (7%) + condition (13%) remain sparse.*

### Discovered-backlog PROMOTION pass — DONE 2026-07-08 (ops/catalog-promote-0708)
*Turned banked market listings into clean canonical catalog pages without polluting.*
- ✅ **Dictionary strengthened** (`src/lib/ingest/model-normalize.ts`): +~130 evidence-verified
  real bag models across 16 houses + 5 previously-empty brands (Chloé, Goyard, Givenchy, Miu
  Miu, The Row). Match rate on the 41.9k discovered backlog **4% → 11%** (+3.3k rows resolve to
  canonical). Materials/patterns/silhouettes deliberately excluded (never-invent); dropped
  Balenciaga "Arena" (a leather, not a model).
- ✅ **Promotion hardened**: `promote-safe --create-new` now resolves a cluster to its confident
  canonical model and CREATES the curated style when none exists (bag-gated via `canonicalModel`
  — never forks a raw title), landing the asking comps in `price_history` (closes the
  stranded-prices gap). `promote-discovered` `?? c.styleGuess` junk-fork fallback removed.
- ✅ **Ran** `normalize:discovered --write` (3,991 style_guess → canonical) → `promote-safe
  --create-new --write` min=10 then min=5 → `reconcile-promoted-dupes --write` → `summary:refresh`.
- ✅ **RESULT**: styles 800 → **851** (+51 clean new: LV Lockme/Musette/Pallas/Boîte Chapeau/
  Palm Springs/Batignolles/Luco/Grand Palais/Passy/Pont-Neuf/All-In/Belem/Berri/Estrela/
  Kensington/Manhattan, Chanel Souplissimo, Gucci Abbey/Sukey/Britt/Hysteria/Pelham, Fendi Kan
  I/Kan U/2Jours/Dotcom, Prada Diagramme/Promenade, The Row Banana, Hermès Plume/Double Sens,
  Balenciaga Bel Air/Monaco/Everyday, Celine Nino, SL Muse/Downtown/Cassandra/Puffer, Dior Miss
  Dior/Malice, Loewe Barcelona, Givenchy). price_history +2,169; **3,344 discovered rows promoted**
  (12,487 promoted total, 38,519 still banked). signals rows 607 → 660. Multi-source styles:
  225/660 ≥2 sources, 93 ≥3 (Palm Springs now 3: FP+TRR+TLC). **Zero new duplicate style-clusters**
  (canonical dup-clusters unchanged at 94); 10 true orphans (pre-existing).
- ⬜ **FOLLOW-UP (owner-gated / risk-laden, flagged separate)**: ~220 PRE-EXISTING redundant
  style rows from the older breadth-load (verbose one-off titles like "Hermes Black Togo …
  Birkin 35 Bag" alongside clean "Birkin"). NOT bulk-mergeable — mixed with INTENTIONAL
  hand-managed silhouette buckets (Gucci Ophidia Shoulder/Crossbody/Tote, Chanel CC Filigree
  Vanity Case, Celine Triomphe Oval) per the 2026-06-30 collision lesson. Needs a reviewed
  style-level merge (re-point variants+price_history, delete), not a token collapse.
- ⬜ **NEW-STYLE editorial**: the 51 new styles are bare style+variant+price (no hero image /
  description / spectrum placement yet) — layer content later per full-spectrum goal.
- ✅ **TheRealReal FRESH pull — DONE 2026-07-09 via cloud Apify actor** (the durable fix;
  browser capture kept getting kicked + the Chrome classifier was flaky). Actor
  `lulzasaur/therealreal-scraper` (residential proxy, bypasses PerimeterX). Adapter
  `supabase/ingest/sources/trr-apify.ts`. THREE passes 2026-07-09 (600 + 349 + 1,445 across
  women's + men's bag subcategories) → **819 distinct fresh curated price rows** (49 realized
  SOLD comps after dedup) + ~1.2k banked; TRR total 8,350 rows; multi-source styles ≥2:497
  ≥3:254. Owner upgraded Apify FREE→Starter ($29/mo, pay-as-you-go) to unblock; sweep cost
  ~$7 (within Starter prepaid). Method is the standing TRR capture (memory
  trr_capture_sessions). Each category caps ~120 (no pagination), so deeper coverage needs
  designer-scoped shop URLs — ⬜ NEXT: test designer-scoped paths for deeper coverage.
- ✅ **"Do it all" cleanup batch 2026-07-10**: (1) normalized split platform names
  (TheRealReal→The RealReal, ebay→eBay, poshmark→Poshmark); (2) re-ran promotion pass;
  (3) deep TRR via paginating actor `piotrv1001/the-realreal-listings-scraper` (+454 net-new
  bags; it paginates ~7 pages/URL vs lulzasaur's 120 hard cap); (4) added 4 brands + models
  (Tumi/Proenza Schouler/Mansur Gavriel/Furla) → promoted Metropolis/Bucket Bag/PS1; (5)
  applied migration 0038 via management API (region/condition_detail/enrichment now on
  discovered_listing — the CI push had a tracking mismatch; direct DDL fixed it). Result:
  styles 994, brands 49, price_history 95,447, ≥2-source styles 582 / ≥3 296.
- ✅ **eBay deeper pull — DONE 2026-07-10** (owner raised the Apify limit). Broad
  auction-only sold sweep via `automation-lab/ebay-sold-scraper` (13 tier-1-3 brands,
  minPrice=500) → **718 realized sold comps, 676 onto catalog pages** + 42 banked, dated by
  actual sold date. Auction finals can't be best-offer masked = zero masked-row risk.
  Restored `ebay-sold-apify.ts` as the BROAD catch-all adapter (routes every row via
  load:prices), distinct from the SCOPED `ebay-sold-sweep.ts` (drops non-target rows — kept
  only 9/718 here, wrong tool for breadth). ⬜ Optional: Firecrawl BIN-sold breadth on the
  owner's allowance. eBay stays MANUAL (no cron).
- ✅ **eBay coverage EXTENDED 2026-07-10** (autonomous continuation): 2nd auction pull for
  premium brands (Chloé/Valentino/Givenchy/Burberry/The Row/Miu Miu/McQueen/MJ/Jacquemus/
  Delvaux/Mulberry/Loewe) → 266 comps, 233 onto pages; 3rd pull for MID-TIER (Coach/Kate
  Spade/Longchamp/MK/Tory Burch, floor=$25, auction-only) → 257 comps, 145 onto pages.
  Hardened `ebay-sold-apify.ts` with a JUNK filter (replica/parts/strap-only/perfume). eBay
  total 2,876 → **3,918 rows** (+1,042 this session); multi-source styles ≥2:611 / ≥3:355.
  ⬜ Remaining eBay lever = the U-DEALS-MIDTIER item-specifics (colour+material) enrichment
  for the deals badge — that needs the metered Firecrawl item-page pass, not the search API.
- ✅ **TRR live-refresh SCHEDULED — DONE 2026-07-09 (owner greenlit "yes" at 2-day cadence).**
  `trr-refresh.yml` cron `31 4 */2 * *`: `apify-trr-refresh.ts` runs the Apify actor over 8
  handbag categories (residential proxy, headless) → writes raw + a `sku ?? url` reconcile
  snapshot (matches the loader's listing_ref exactly, verified against a live sample) →
  `trr-apify.ts` maps → `load:prices therealreal --write` → `reconcile:sold --platform=RealReal
  --write` → `summary:refresh`. ~$4-5/run, ~$60/mo. Retired the old daily 1-style Firecrawl
  pilot (`firecrawl-capture.yml` now manual-only). APIFY_TOKEN secret added + **job PROVEN in
  write mode 2026-07-09** (run 29065252223). **Retirement is AGE-based, not snapshot-diff:** the
  test run exposed that TRR's ~120/category cap means one sweep sees ~840 live while the DB
  showed 7,841 "live" (~7,050 unseen since Jun 23-24 = stale) — snapshot-diff would false-retire
  90% (50% guard aborted, correctly). New `reconcile:sold --age-days=14` retires listings not
  re-observed in 14d (existing `observed_on`, no migration; aborts if 0 seen in-window). First
  run **retired 7,693 stale TRR rows; available 8,584 → 1,332.** Fashionphile every-3h; TLC daily;
  eBay stays manual (permanent sold comps).
- ✅ **eBay SCOPED pull — DONE 2026-07-09 (owner greenlit "option A" + the trust-hub chat).**
  Target = the 49 one-source styles (n≥20, median present, 1 source; all single-variant so
  zero pickVariant risk). TWO engines in one pass: (1) Firecrawl MCP sold-search scrapes
  (46 unique queries, ~9 cr each on stealth ≈ ~415 cr — search pages now cost 9 cr, not the
  1-2 cr of the 7/02 run; NOTE one transient "insufficient credits" error mid-run, the free
  tier is near its monthly edge) with per-listing **best-offer masked flag**; (2) Apify
  `automation-lab/ebay-sold-scraper` **auction-only** runs (1,033 items ≈ ~$3.10, Bronze
  $0.003/listing) = bid-settled finals that CANNOT be masked. Builder
  `sources/ebay-sold-sweep.ts` (exact-price-only policy: masked rows counted, never loaded;
  AG floor $500 for tier 1-3, $25 mid-tier; junk/collab/fragrance excludes; mixed-pile
  auction rows attributed per-title, ambiguous → dropped 667, never guessed).
  **RESULT: 497 sold rows loaded, 0 unresolved → ranked styles 269 → 304** (≥2-source
  styles 497→555). **PROBE (the owner's masked-price question, measured): 18% of on-target
  eBay solds are best-offer masked overall (n=698, 2026-07-09)** — luxury skews far worse
  (Bottega Bang Bang 14/15 masked) and mid-tier is nearly clean (MK Bedford 0/23, Le Pliage
  1/32). Policy line now in preferences.md (exact-only, supersedes the 6/26 blanket skip).
  Big winners: Félicie Pochette 42 solds, Fleming 32, Mercer 29, Le Pliage 28, Pochette
  Accessoires 26, Soft Margaux 24. Zero-yield: the Chanel Blazy current-line names
  (Souplissimo/Coco Base — eBay doesn't have them; Coco Base query = perfume noise, filtered).
  ⬜ FOLLOW-UPS: (a) the 667 unattributed auction rows were dropped, not banked — a future
  pass could route them to `discovered_listing`; (b) Poshmark as third mid-tier source
  (proven browser path, owner not yet asked); (c) eBay item-specifics enrichment for
  U-DEALS-MIDTIER stays open (live listings only, metered).

### Handbag-breadth capture — IN PROGRESS (2026-06-30, data/handbag-breadth worktree)
- ✅ PROVEN: data exists + free. The Row = 134 live Fashionphile handbags (product_type "Bags").
  Full-set median **$2,273** vs our current icon-skewed **$4,045** — the representativeness fix is real.
- ✅ Method validated: canonical per-brand MODEL dictionary (not token-strip, which over-split Miu Miu
  into 68 fake styles). The Row dict → 106/134 matched → 21 clean styles (Soft Margaux, N/S Park Tote,
  Marlo, Slouchy Banana, 90's, Peggy, Margaux, Half Moon, Bindle, Allie, Polly, Mail Bag, Alger,
  Emilie, Hunting Bag, Astra, Everyday, Terrasse, Horizontal Belt, N/S Hook Tote, Park Tote).
- ⬜ BLOCKER (needs authoritative naming): the long tail (28 more The Row models; and 8 brands total)
  is archivist-grade per-house model curation. Options: (a) archivist produces clean complete model
  lists per house, then load; (b) load the confidently-matched styles now (median corrects) + route
  the tail to discovered_listing. Awaiting owner call + style-name review before any --write.

- ✅ DONE 2026-06-30 (--write + summary:refresh): captured EVERY current Fashionphile handbag for
  all 8 thin houses via load-handbag-breadth.ts (archivist-authoritative model clustering). Per-brand
  medians now representative: The Row $4,045→**$1,850** (33 styles), Goyard $2,785 (27), Miu Miu $2,000
  (9), Valentino $1,075 (15), McQueen $828 (13), Jacquemus $650 (11), Off-White $385 (3), Telfar $120.
  Handbags only (no SLGs). ~75-100% of each house's live listings clustered cleanly; residual tail
  (shape-only / deep-cut titles) dropped, not enough to skew. Attributes (colour/material/hardware)
  captured in the same pass. Loader idempotent for monthly re-run.

### ⚠️ COLLISION (2026-06-30) — two parallel Fashionphile captures clobbered iconic per-size variants
- My session ran `load-handbag-breadth.ts` (one base variant per style) on the SAME houses the
  unattended per-size pass (`fashionphile-collection.ts`, above) was doing, at the same time. Both
  wrote to the shared DB (the multi-chat clobber the session-start guard warns about).
- NET GOOD: load-handbag-breadth ADDED the long-tail styles the per-size pass skipped (The Row Marlo,
  Slouchy Banana, 90's, Peggy, India, Sofia, etc. — single-variant, fine).
- NET HARM: for OVERLAPPING iconic styles it dumped all-size listings onto the LOWEST variant_id,
  corrupting that one size. PROVEN: The Row Soft Margaux size 10 (v987) now has 32 mixed-size rows
  ($3,695–$7,795) instead of clean size-10 (~$4,495, n=25); sizes 12/15/17 are intact. Same pattern
  on Park Tote and every style the per-size pass had already created.
- ⬜ FIX (data lane, idempotent): re-run `fashionphile-collection.ts` per affected brand → restores
  the clobbered size variants. Keep the long-tail additions. **Retire load-handbag-breadth.ts** (or
  gate it to only styles with no existing variants) so it can't clobber per-size data again.
- Medians reported this session are slightly high on the clobbered variants; re-verify after the fix.

- ✅ RESOLVED 2026-06-30/07-01: reconciled the collision. For the 4 overlapping houses (The Row,
  Goyard, Valentino, Alexander McQueen): re-ran `fashionphile-collection.ts` per-size, DELETED the
  Fashionphile rows on size-labeled (pipeline-managed) variants to clear the mixed-size contamination,
  reloaded clean per-size, `summary:refresh`. Verified: Soft Margaux now ascends 10<12<15<17
  ($4,495/$5,325/$6,265/$6,495); Goyard Saint Louis PM $2,495 / GM $2,515. Long-tail single-variant
  styles (Marlo, Slouchy Banana, etc.) kept untouched. Per-brand medians steady (The Row $1,895).
  GUARD added to `load-handbag-breadth.ts`: it now SKIPS any style that already exists, so it can
  only ADD new long-tail styles and can never clobber per-size data again.

### ✅ DONE 2026-07-09/10 — collapsed type-1 verbose-junk style dupes (load-handbag-breadth residue)
- **What:** the older `load-handbag-breadth` pass left ~90 full-sentence one-off `style` rows
  (e.g. Hermès "Hermes Black Togo Leather Gold Hardware Birkin 35 Bag", LV "Louis Vuitton Monogram
  Canvas Looping GM Bag") sitting alongside the clean canonical style. Folded them in.
- **Script:** `supabase/ingest/merge-style-dupes.ts` (dry-run default, `--write`, idempotent).
  Clusters `style` on `(brand_id, canonicalModel())` past the 1000-row cap; merges ONLY verbose
  titles (≥4 words + a material/colour/year/brand/"Bag" token) into their SINGLE clean canonical
  sibling; re-points variants + `price_history` (dedup on `platform|listing_ref|price_type|observed_on`),
  find-or-creates the target size-variant, deletes the emptied junk style. Verified via
  `supabase/ingest/verify-merge-snapshot.ts`.
- **Result (--write):** 87 styles merged. style −87 · price_history −8 (only exact-key dups; **0
  unique observations lost**) · style_index_signals −26. tsc+lint green. Committed `bb9097c`, landed on main.
- **PROTECTED, never merged** (explicit denylist + short-name silhouette-qualifier guard — the
  2026-06-30 collision must not repeat): Gucci Ophidia/Soho silhouettes, Celine Triomphe
  Oval/Boston/Shoulder, Valentino Rockstud Spike/Tote, Coach Pillow Tabby, Chanel CC Filigree /
  Top Handle Vanity Case, GG Marmont Chain/Bucket, etc.
- **Ambiguous dup pairs resolved by OFFICIAL HOUSE NAME** (`supabase/ingest/merge-style-pairs.ts`,
  `--write` 2026-07-10): Hermès "In The Loop" → **"In-The-Loop"** (hermes.com styling); Burberry
  "Knight Bag" + "The Knight" → renamed **"The Knight Bag"** (Burberry FW23 launch PR). ph preserved.
- ⬜ **HELD for a future reviewed pass (~130 rows):** the shorter material+size names are a MIX and
  need the same style-name review as round 1 before any `--write` — (a) pure size/material rows that
  are really just variants of the clean model (e.g. "Togo Birkin 35", "Monogram Speedy 30") SHOULD
  fold in; (b) genuine sub-models MUST stay separate (Kelly Pochette, Speedy Soft, Musette Tango/Salsa,
  Boîte Chapeau Souple, Félicie Pochette). Retire/park `load-handbag-breadth.ts` as the junk source.
