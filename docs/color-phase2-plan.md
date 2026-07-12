# Color Phase 2 — plan (color as its own variant + indexable URL)

*Generated 2026-07-11. Grounds the parked "color as its own variant/URL (Phase 2)" thread in real data. The mass variant insert + re-point + any migration are **owner-gated** (irreversible-scale). Everything up to the dry-run is autonomous.*

## Goal + metric

Make each **colorway its own indexable `/bag/[id]` page**, selectable on the bag PDP like size is today. **Metric: GEO breadth** (the #1 growth channel) — a "Chanel Classic Flap, black" page and a "…beige" page each become a distinct, citable source, and the on-page color selector lifts engagement (browse without leaving the style).

## Current state (measured 2026-07-11)

- `price_history.colorway` populated on **108,909 / 119,190** rows (**91%**), already collapsed to ~**38 clean color families** (black, burgundy, pink, grey, blue, beige, brown…), not freeform seasonal names.
- `variant.exterior_colorway` is null on **2,089 / 2,118** variants: color is NOT yet rolled up to the variant, so the PDP has no color axis and every color of a bag shares one `/bag` URL.
- The read side already understands color: `colorFamily()` normalizes it, the shop grid facets on it, and `VariantSelector` **auto-derives axes from whatever variant fields vary** (`variant-dims.ts`). So once color-bearing variants exist, the selector shows a color axis with **zero UI work**.

## Target model

Variant key moves from **(style, size)** to **(style, size, color)**. Each row keeps its own indexable `/bag/[id]` URL (the locked Amazon-PDP rule). Expect the 2,118 variants to expand to roughly **6k–10k** (most bags carry 3–6 color families).

## Steps

1. **Rollup (autonomous, read-only dry-run):** for each `(style, size)`, list the distinct `colorFamily(colorway)` values across its listings, with a comp count per color. Drop colors under a floor (e.g. < 2 comps) so we don't mint pages for noise.
2. **Canonical color per variant (autonomous):** pick the display color name per family using the existing `colorFamily` map; house-specific naming (Monogram/Damier canvas names, etc.) stays deferred to the archivist color archive where it matters, per [[seasonal_archive_archivist]]. Store the raw + the family.
3. **Create color variants + re-point (OWNER-GATED):** insert `(style, size, color)` variant rows and re-point each `price_history` row to its color variant. Dry-run-first + reversible, same discipline as `resize-variants.ts`. This is the mass write → she applies.
4. **Migration (OWNER-GATED, only if needed):** the `variant` table already has `exterior_colorway`; likely no schema change, just a uniqueness/index tweak on `(style_id, size_label, exterior_colorway)`. Written dry-run, she applies.
5. **Read side (autonomous, mostly free):** `VariantSelector` shows the color axis automatically; confirm the size×color grid dedupes cleanly in `variant-dims.ts` and that the `/shop` group key (currently `styleId::size`) still counts a bag once (it already counts colors separately).

## Risks / guards

- **GEO thin-content:** N near-identical color pages can read as duplicate content. Guard: each color page needs at least the color-specific facts (comps, images) it already has; add `rel=canonical` to the style where a color has thin data, and only mint a page above the comp floor (step 1).
- **Color multiplicity:** the same physical bag seen under slightly different labels ("rouge" vs "red") must map to ONE family — `colorFamily` handles the common cases; spot-check the tail.
- **Image coverage:** a color page wants a matching image; fall back to the style hero when a color has none.

## FOUNDATION SHIPPED 2026-07-12 → production-driven rebuild is next

Owner approved: full colour scope (colour + material + construction), stub pages for
produced-but-unlisted (own URL + "no photo yet" + UGC), archivist hard-confirm. Shipped:
- Size chips in physical order (Small→Maxi); grey-out corrected to production-only semantics.
- Colour pilot **reverted** (listing-derived was the wrong source).
- **Production matrix** banked (`classic-flap-production-matrix.md`) — Maxi CONFIRMED current.
- **Reseller decode + classifier** (`chanel-flap-reseller-decode.md`, `ingest/chanel-flap-classify.ts`)
  — sweep found only 1 mislabel in 10.7k listings, so bad attribution wasn't the image problem.
- **Face scorer** hardened: cross-model veto + stronger size penalty (a Coco Handle/Jumbo photo
  can no longer front a black Medium Classic Flap).

**Next build (the production-driven selector) — design + owner gates:**
1. **Data model** — a per-style PRODUCTION OPTIONS record (sizes × colour families × materials ×
   constructions the house made), sourced, SEPARATE from our listing variants. Likely a new table
   + migration (OWNER-GATED) or a curated file to start. Options drive the selector; grey-out =
   not in the record.
2. **Produced-but-unlisted = stub page** (owner chose): own `/bag` URL, "made in this, no photo/price
   yet, have one? add it" (GEO + UGC). Guard thin-content with canonical-to-the-size-base.
3. **Reconcile** our listings onto the options; layer photo/price where we have them.
4. **Material + construction axes** (caviar/lambskin/seasonal; diamond/chevron) from the record.
5. **Wire the classifier into the ingest guard** so future mislabels never attach.
6. Colour = permanent families first-class + seasonal as descriptor + season-code (no fake names).

## REVERTED 2026-07-12 — the model was backwards (options must be production-driven)

Owner testing of the pilot surfaced that deriving colour options from LISTINGS is wrong:
- "No listing" ≠ "never made" — a produced colour we lack a photo of must still be a
  selectable option (hedged "no photo yet"), never greyed out.
- The archivist matrix (`research-drafts/classic-flap-production-matrix.md`) shows the honest
  Classic Flap model: permanent colour families (Black/Beige/White/Red/Navy) + seasonal as
  descriptor + season-code (Chanel has NO official seasonal colour names), materials
  caviar/lambskin permanent, chevron is a legit construction, and the contaminants (Coco
  Handle / 2.55 Reissue / Boy) are told apart by the LOCK, not the quilt — and aren't
  title-detectable, so a listing-derived split surfaces wrong photos.

So the pilot was reverted (`pilot-color-variants-classic-flap.ts --reverse`): Classic Flap is
back to clean size-only (6 variants, v199 restored to 2,531 listings). The rebuild is
**production-driven**: options come from the archivist matrix; our listings/comps/photos layer
on top; grey-out traces to production evidence only. Superseded pilot notes below (kept for the
mechanism, which the rebuild reuses):

## Pilot (reverted) — Chanel Classic Flap (2026-07-11)

Ran the URL-preserving additive split on style #1 via `pilot-color-variants-classic-flap.ts`
(dry-run-first, reversible with `--reverse`). Result, verified live:
- **30 color variants** created across Small/Medium/Jumbo/Maxi (floor: >=15 comps/family), each
  with its own indexable `/bag` URL; 3,499 listings re-pointed.
- Each size variant kept its URL as the **null-color catch-all** (e.g. `/bag/199` = the Medium
  base, 207 color-unknown comps). Cleared one stale parent color to avoid a case-collision chip.
- The selector now shows a **Colour axis** (14 families); a color page (`/bag/2497` = Medium
  Green, 81 comps) renders with the color in the title/spec and the **"Any green"** want control
  live. The shop grid still groups by size (color collapses into one "Classic Flap Medium"), so
  no grid regression.
- **Gotcha fixed:** the split fetch must page ALL price_history rows ([[postgrest_row_cap]]); the
  first dry-run under-counted (saw 1,000 of 2,531 Medium rows) until paginated.

**To scale catalog-wide** (owner-gated): generalize the script to any style, add the uniqueness
index migration on `(style_id, size_label, exterior_colorway)`, and decide the thin-content guard
(canonical to the size base for color pages under the floor). Do it per-family, reviewed.

## Recommended first slice

Pilot ONE iconic, high-comp style end-to-end (e.g. **Chanel Classic Flap** or **LV Neverfull**): rollup → create its color variants → verify the PDP color selector + per-color URLs + shop grouping, reviewed, before any catalog-wide run. Same "prove the pattern on one family, then scale" approach as the flap split.
