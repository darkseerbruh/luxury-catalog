# Listings / "Shop the market" — shopping experience design

*Created 2026-06-23. Design exploration for showing real for-sale listings and linking
out to the seller. No code yet — this is the agreed model + open decisions so a future
session can build from it. Companion to `docs/value-module-handoff.md` (the bag-page
"what it's worth" module, which this extends) and `docs/data-collection-handoff.md`
(the listing data this consumes).*

## What this is

A catalog-wide **shopping experience** over the live resale listings we've already
captured (~19k `price_history` 'listed' rows + ~11k `discovered_listing` rows, each
with a `source_url`). We do **not** host or sell anything — it's the Google Shopping
pattern: **compare prices across the whole market, then hand off to the seller.**

**Voice (locked 2026-06-23):** shopping language is now OK ("shop the market," "for
sale," "compare prices," "best deal"). The authority position is kept by comparing the
whole market and handing off — **never a cart, never a checkout.** See
`docs/preferences.md` and `docs/voice-and-tone.md`.

## Lineage / competitors

- **Google Shopping** — the spine: browse products, each shows "from $X" + an offer
  count across sellers; open one to compare offers; every offer links out. No cart.
- **Kelley Blue Book** — the *rating* idea: every listing gets a verdict ("Great /
  Good / Fair / Above market") against a fair value. KBB only rates by year/trim/
  mileage/condition because for cars **color is a minor adjustment**. For bags, color ×
  leather × hardware **is** the trim and can swing price ~2x, so we cannot copy KBB's
  axes (see Fair value below).
- **Resale sites (Fashionphile / TRR / Vestiaire)** — faceted search we aggregate
  *across*, with our rating + cross-marketplace comparison as the edge.

## The model (agreed)

**One engine, three surfaces:**
1. **Grid** (`Shop the market`) — tiles are *bags* (a variant/style), not individual
   listings, so we browse ~hundreds of products instead of scrolling ~30k rows. Each
   tile: branded placeholder image, brand + style, size + color count, **"from $X"**
   (lowest current listing), listing/seller count, and a **deal pulse** badge when at
   least one offer inside is Great/Good rated. Filter + sort. Default scope = **all
   listings, rated** (not deals-only).
2. **Offers** (open a tile) — every live listing for that bag, each rated against the
   fair value **for its own spec** (the per-bag rail). Links out per offer.
3. **`/deals`** — becomes the **"Deals only" + "Best deal first"** preset of the grid,
   not a separate page/codebase.

The bag page's existing value-module "listed" dots and this offers view are the **same
listings** — build one component; the bag page embeds the pre-filtered offers view
rather than a second, duplicate rail.

## Fair value + deal rating (the honest core)

A listing's rating compares its price to the **fair value for its exact spec**, because
spec drives price more than condition does.

- **Gradeable axes we actually have today:** material/leather + hardware + color +
  condition. (Brand/style/size are identity, not grading axes.)
- **Year is data-gated, NOT used yet.** No resale feed carries a reliable per-listing
  year (same reason the era×condition matrix is deferred). Year becomes a grading axis
  only after the spec-extract pass (`src/lib/ingest/spec-extract.ts`) populates it.
- **Thin-comp fallback (locked principle — "broaden but label"):** rate against the
  tightest spec bucket with enough comps; when too few, broaden one step at a time
  (drop year → drop hardware → drop color → style+condition) and **say so visibly**
  (amber "only 3 burgundy Lambskin comps, so rated against Lambskin mediums of any
  color"). Never a silent guess. Always show the comp basis ("rated against 14 black
  Caviar mediums") and an "estimate, not an appraisal" line.
- **Bands (draft, open):** Great / Good / Fair / Above market, by % vs fair value.
  Thresholds TBD (e.g. Great ≥10% under, Good 0–10% under, Fair 0–8% over, Above >8%
  over) — needs a pass over real spread once data is loaded.

## Filters & sort

- **Filters:** Deal rating, Price range, Brand, Style, Size, Color, Leather/Material,
  Hardware, Condition, Marketplace. **Year = "coming soon"** (shown disabled until the
  data exists). Facet counts shown per option.
- **Honest-facet rule:** color/leather/hardware/condition filters only apply where the
  per-listing spec was parsed. Mass-market model-less listings (locked finding) often
  carry no spec and won't appear under those facets — noted in the UI, never faked.
- **Sort:** Best deal first (default), Price low→high, Price high→low, Newest listed,
  Condition.
- **Mobile (375px):** filters + sort collapse to a two-button sticky bar opening a
  bottom sheet; grid is 2 tiles across. (Mobile-first; nothing overflows the viewport.)

## Affiliate independence

None of this needs the affiliate code. Links are built today (search or per-listing
`source_url`); the affiliate param is appended by `src/lib/affiliate.ts` when
`NEXT_PUBLIC_AFFILIATE_*` is set, and is a no-op otherwise. The experience ships and is
fully usable before any program is approved; monetization flips on when codes land.

## Image constraint

Per the locked never-AI/never-ingest-reseller-photos rule, listing tiles/rows show our
**branded placeholder** (or our own licensed `variant.image_url`), not the reseller's
photo. Facts (price, spec, condition) are ours to display; imagery stays ours.

## Naming (locked 2026-06-23)

- **Nav label = "Shop"** (short, scannable). The cross-marketplace / "the market"
  framing lives in the **in-page copy**, not the nav word: page heading
  "Shop the market" + subhead "Compare live prices across every marketplace we track.
  We don't sell these, we find the best offer and send you to the seller." So the nav
  stays one clean word and the page makes the compare-and-hand-off promise obvious.

## Open decisions (need owner input)

1. **Deal-rating band thresholds** — set after a pass over real loaded spread.
2. **Default sort** confirmed as "Best deal first" — verify vs "Newest."
3. **Grid tile deal pulse** — show the single best in-stock rating, or a count
   ("3 great deals")?

## Status

**v1 BUILT (2026-06-23, branch `claude/shop-listings-experience`).** No migration, no env
vars — uses existing tables/columns; fully resilient (degrades to empty when the DB or the
0021/0022 columns are absent). `tsc` / `eslint` / `next build` / `npm test` (410, +14 new)
all green. Not runtime-tested against prod (no DB creds in the build env, per the usual
pattern) — verified by compile/build + unit tests on the pure core.

Shipped:
- `src/lib/listings-core.ts` — the pure rating engine (hierarchical spec fair value +
  labeled broaden fallback + deal bands), 14 unit tests (`listings-core.test.ts`).
- `src/lib/listings.ts` — `getShopProducts()` (grid) + `getListingsForVariant()` (rail).
- `src/app/shop/page.tsx` + `ShopControls.tsx` — the grid page (nav label "Shop"), with
  brand / max-price / sort / deals-only filters via URL search params.
- `src/app/bag/[variantId]/ListingsForSale.tsx` — the "For sale right now" rail embedded
  on the bag page above `WhereToBuy` (renders nothing when no live listings; the search
  links stay as fallback).
- `src/components/DealBadge.tsx` — the band pill, shared.
- `src/lib/affiliate.ts` — `affiliateListingUrl()` adds attribution to a direct listing
  URL when codes are set (no-op otherwise).
- `HeaderNav` — "Shop" added as the lead nav entry.

**v2 (2026-06-23, same branch) — three follow-ups landed:**
- **`/deals` folded in.** `/deals` now redirects to `/shop?deals=1&sort=best-deal` (the
  "deals only" preset); the homepage "Best deals" tile points straight at it. One
  listings surface, not two. `getDeals` stays only as the tile's "is there a deal?" gate.
- **Richer facets.** `getShopProducts` now returns brand + **color / leather / hardware /
  condition** facets (product counts) and filters listings by them (spec filters apply at
  the listing level, then aggregate). `ShopControls` shows a select per facet, hidden when
  a facet has no options — so the model-less mass-market gap simply shows fewer filters,
  never fakes them. Year stays out (data-gated).
- **Realized prices preferred.** The rating engine now prefers **sold/auction comps**
  (the truth) over asking listings for fair value when it has enough, falling back to
  asking and flagging which (`FairValue.realized`); the bag rail says "vs N … sold prices"
  vs "… listings". 16 unit tests total in `listings-core.test.ts`.

**Band-threshold tuning — tool shipped (run against prod).** `npm run analyze:deals`
(`supabase/ingest/analyze-deal-spread.ts`, read-only, needs `.env.local`) rates every
live listing with the shared core and prints the real distribution of "% under fair
value" + what each candidate threshold would label, with a suggested setting. Run it, then
edit the constants at the top of `listings-core.ts` (`GREAT/GOOD_UNDER_PCT`,
`FAIR_OVER_PCT`, `MIN_SPEC_COMPS`). Until then the defaults are sensible, defensible. Also: the grid "deal pulse" as a count vs single
badge; a per-listing condition grading axis (today condition is a filter, not a comp
constraint — the value-module condition ladder still owns within-condition grading).
