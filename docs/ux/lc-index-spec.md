# The LC Index — where a bag stands in the market

*Build spec. Created 2026-07-08. Owner brief: help a layperson understand, at a glance, where
a bag ranks (Marc Jacobs vs Louis Vuitton, Coach vs Dunhill) without knowing brand tiers.
Design converged over 5 rounds in chat; owner locked the "why-meter" 2026-07-08. Reference
mockup: session artifact "Bag ranking concepts, round 5". Not yet built.*

## The idea, in one line

One objective number, **the LC Index**, for where a bag stands in the whole market, computed
from data we already hold, framed as **our index, not a verdict**.

Separate from **Most Wanted** (the community's ranking, by reviews). This is the *market's*.

## The formula (v3, de-tiered 2026-07-10)

Rank blends three measured signals into one score, then sorts all styles by it.

| Signal | Source (today) | Weight | Direction |
|---|---|---|---|
| **Price standing** | `variant_price_summary` resale median, rolled to style | 47% | higher price → higher |
| **Trade volume** | count of `price_history` observations for the style | 29% | more traded → higher |
| **Scarcity** | count of *live* listings (`price_history` where `listing_status != 'sold'`) | 24% | fewer live → higher |

**Dropped the house-tier input (was 15%).** Brand tier is now House Standing, itself
resale-derived (median + ceiling + volume, `docs/ux/tier-formula-spec.md`), so feeding it
back in double-counted price/trade the index already holds, and it only moved already-ranked
(well-sampled) styles since thin styles are unranked by the n-gate anyway. The two indices
stay independent: **the LC Index ranks the bag, House Standing ranks the house**, shown side
by side. The old 15% was renormalised proportionally over the surviving three. A future
non-price house signal (real demand: searches / saves / views) can reintroduce a house input
as genuinely new information once that data exists post-launch.

Rules that keep it honest:
- Each signal becomes a **percentile across all styles** first, so they combine on one 0–100 scale.
- **n-gate (the demand-first floor):** a style needs at least **20 recorded prices** (distinct listings, after the v2 RPC dedupes re-observations) to be ranked. Below that it shows "not enough data to rank yet," never a fake rank. Set from the real distribution 2026-07-08 (see "v2 accuracy fix" below). Scarcity is then measured ONLY among the styles that clear the floor, so "hard to find" reads as genuine exclusivity among proven bags, not obscurity.
- **Price is weighted heaviest,** so the Price bar is the one to read first in the why-meter. This is what makes the order legible (Birkin over Kelly on price; Hermès pair over Classic Flap on price despite the Flap's higher trade volume).
- **v1 popularity = trade volume,** a market fact. True demand signals (searches, saves, views) are thin pre-launch; fold them in later, do not fake them now.
- **Recompute monthly.** Store the prior rank so the **movement pill** ("▲ 2 this month", "Held #1 all year") is real. Until two cycles exist, the pill does not render, never invent motion.

## The components (build once, reuse everywhere)

Two pieces sharing the same four-signal engine:

- **StandingCard** — the full module: big rank + explainer panel on the left, the three
  measures as side-by-side mini-leaderboards on the right, receipts line (n + date) at the
  bottom. House standing lives in the header line ("Chanel · Ultra-luxury house"), so the
  three boards stay parallel (all "of 761").
- **StandingGlyph** — the compact **why-meter**: three tiny bars (Price / Trade / Scarcity)
  showing this bag's profile, leading bar brightened. This is the piece that makes a list row
  self-explain.

### Reuse map

| Surface | Piece | Notes |
|---|---|---|
| Bag detail page | StandingCard | Home. By the value module, at the decision point. |
| The LC Index page | StandingGlyph per row; StandingCard on expand | The destination list. |
| Compare page | StandingCard ×N | Where the dot-on-a-spectrum finally earns its place (multiple bags, one axis). |
| Identify result | StandingGlyph | "Ranks #X" the moment a scan matches a catalog bag. |
| Search & closet | inline rank link | Lightest reuse: "Jackie 1961 · #27 in the Index". |
| It bags, homepage | StandingGlyph | Canon module gains a real rank vs a curated order. |

## The Index page row (locked: the why-meter)

Each row = rank · affiliate photo · name + house + movement pill · **why-meter** · resale median (fixed right column, labeled once).

The why-meter is the answer to "why is it here": three bars, same three measures as the card,
so scanning down the column shows the profile rise and fall. A one-line plain-words note sits
under the name as the meter's caption ("Lower price than the Hermès pair, but changes hands far
more"). Photo comes free from the existing `getVariantImages` resolver. Hover a bar → exact percentile.

Bags / Houses toggle: same layout at brand level (a house's rank blends its styles).

## Copy (locked)
- Module label over the boards: **"The three measures behind #N"**.
- Hedge line: **"Our index, not a verdict."** + a **"How we rank"** methodology-page link.
- Never a verdict word ("best", "worth it"). Frame = standing/estimate, per the calibrated-hedge rules.

## Built 2026-07-08 (branch `claude/bag-ranking-context-6lr7k0`)
- **Engine:** `src/lib/lc-index.ts` (`computeLcIndex`, percentiles, weighted composite, n-gate,
  why-meter bars, lead signal, neighbor boards, `whyNote`), 13 unit tests. Pure core, no I/O.
- **Data:** `style_index_signals()` RPC (migration `0048`) returns per-style median / trade count /
  live count / tier / rep variant. `getLcIndex` caches hourly; degrades to empty when unapplied.
- **UI:** `StandingGlyph` (why-meter) + `StandingCard`; `/rankings` (the Index list) +
  `/rankings/how-we-rank` (weights published live from the constant, so it never drifts);
  StandingCard wired onto the bag page at the value moment.
- Gate green: tsc, eslint, 655 tests, next build. `/rankings` prerenders static.

### v1 simplifications (honest, revisit later)
- Style price = **pooled** resale median across the style's variants (mixes colours/sizes). Fine
  for a market-standing read; revisit if a per-variant index is ever wanted.
- **StandingCard neighbor rows are not links yet** (needs styleId → rep-variant resolution per
  neighbor). The Index-page rows DO link to bags.
- ~~Movement pill deferred~~ **BUILT 2026-07-08:** `lc_index_snapshot` table (migration `0049`) +
  `/api/cron/lc-index-snapshot` (monthly, 1st @ 07:00) + `movementLabel` (pure, tested) + a
  `MovementPill` shown on the card and Index rows. Compares the live rank to the most recent
  PRIOR-month snapshot, so it renders nothing until a prior month exists (never invents motion).

## Open, before / around ship
- ✅ **Migration `0048` APPLIED to prod 2026-07-08** (db-migrate run 27 on the branch; log:
  "Applying migration 0048_style_index_signals.sql"). The RPC is live; live REST verification
  is pending (this container is proxy-blocked from Supabase). Feature code still needs to land
  to `main` to deploy (owner deploy gate).
- **Validate the formula against real data:** compute the true top ~20 and eyeball the order vs
  gut. Needs DB access this build container lacks (no anon key + proxy-blocked).
- **Nav placement for `/rankings`** (owner call, nav is protected): its own top-level door vs
  under an existing one. The page exists and is linked from the bag-page card, not yet from nav.
- ✅ **Concept C, the inline rank link:** BUILT on the **shop grid** (`IndexRankLink`, stretched-link
  card so it stays a real sibling link). Still to wire on search results, recs, and closet cards.
- **Apply migration `0049`** (owner-gated) + run `/api/cron/lc-index-snapshot` once to capture the
  first month, so movement pills start next month. Needs `CRON_SECRET` + service role (already set
  for the other crons).
- **GEO:** `/rankings` + `/rankings/how-we-rank` are in the sitemap; `/rankings` emits ItemList JSON-LD.

## v2 accuracy fix (2026-07-08, migration `0050`)

The v1 Index shipped with a wrong top: a Kelly Pochette ranked #1 (a pochette out-pricing the
Birkin is impossible) and thin styles ranked too high. Diagnosed against prod (throwaway
`scripts/diagnose-lc-index.ts`) and fixed at the source.

- **Root cause (not what we guessed).** The brief suspected mixed currencies pooled unconverted.
  Verified: prod is **100% USD** today, so currency was not the active bug. The real fault:
  `price_history` records the **same live listing many times** (re-scraped over days, keyed by
  `listing_ref`). v1 took the median / counts over every raw row, so a style's median was
  weighted by how often each listing was re-observed, and its trade + live counts were inflated.
  Kelly Pochette showed 53 "prices" from only **15 unique listings** (3.5×); its exotic listings
  were re-observed most, dragging the median to $20,995. Birkin/Kelly were ~1.9× inflated.
- **Fix — dedupe at the source (`0050_style_index_signals_v2.sql`).** One row per
  `(style, listing_ref)`, keeping the **latest** observation, before the median and counts. Null
  `listing_ref` rows each count as their own listing, so genuine distinct comps are never merged.
  A **dominant-currency filter** is also applied before the median as a guard against future
  EUR/GBP ingest (a no-op on today's all-USD data). Never edit `0048`.
- **Floor 8 → 20.** From the deduped distribution (per-style median count ≈ 14). 20 clears the
  contaminated thin styles (Kelly Pochette at 15) with margin while keeping ~220 legitimate
  styles ranked.
- **Source gate: ≥ 2 distinct platforms to rank (migration `0051`, `LC_INDEX_MIN_SOURCES`).**
  The floor fixed quantity, not independence: 31% of ranked styles sat on a single reseller
  (Coco Base Shopping Bag + Souplissimo Maxi Flap: ~33-42 listings, all Fashionphile). A market
  standing built on one merchant is that merchant's asking price, not the market's. The v3 RPC
  returns `source_count` (distinct normalised platforms among the deduped, dominant-currency
  listings); the engine ranks a style only if it clears the price floor AND has been seen on ≥ 2
  platforms. Effect: 229 → 151 ranked, the grail top is unchanged, and the Chanel 19 rises. The
  engine degrades safely on the pre-0051 RPC (missing `source_count` → treated as passing, so the
  gate is a no-op until the migration lands).
- **Scarcity stays inverted-live-count.** We tried **sell-through pressure** (sold ÷ (sold+live))
  and rejected it on the data: it ranks the Birkin **#11**, behind cheap-but-fast movers like a
  Wallet on Chain, because grails sell slowly precisely because they cost the most. Inverted live
  count keeps the grails on top. Weights unchanged (price 40 / trade 25 / scarcity 20 / tier 15).
- **Why-note generator (replaces the 3 canned strings).** `whyNote` now composes one short line
  per bag from its band profile (price / trade / scarcity percentiles) + comparative position +
  house. Deterministic (rank-parity variants keep adjacent identical profiles distinct), no em
  dashes, no verdicts, "grail pricing" reserved for top-of-index price only, scarcity claimed only
  when a bag is genuinely seldom-listed. Validated: **0 adjacent duplicates and 0 em-dash/verdict
  violations across all 222 ranked rows.**
- **Corrected real top 5:** Birkin, Kelly, Constance, Chanel 25, Classic Flap. Kelly Pochette
  now unranked (below floor). "Coco Base Shopping Bag" (#6) is a **real** Chanel tote (33 distinct
  Fashionphile listings, $5–12k), kept per the factuality bar despite the unfamiliar name.

## Metrics it moves
- StandingCard + glyph cross-links → **pages per session**, taps into bag pages (buy/sell moment).
- The Index page (dated, n-carrying, cited) → **GEO** entry pages + AI-search citations.
