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

## Recommended first slice

Pilot ONE iconic, high-comp style end-to-end (e.g. **Chanel Classic Flap** or **LV Neverfull**): rollup → create its color variants → verify the PDP color selector + per-color URLs + shop grouping, reviewed, before any catalog-wide run. Same "prove the pattern on one family, then scale" approach as the flap split.
