# Style-bucket audit — new styles that may be category/motif, not single models

*Created 2026-07-10 from the page-depth batch-1 archivist pass. The 2026-07-09/10 promotion
created 232 new styles from ingest tokens. Some names are a category, motif, or logo family
rather than one bag. This is the REVIEW LIST — no merges are applied here. Per
`catalog_promotion_pipeline` memory: style dups are NOT bulk-mergeable (silhouette buckets can
be intentional), so each needs a human spot-check of its listings before any merge/rename.*

## Confirmed category/motif by the archivist (authoritative, sourced)

These were researched and confirmed as descriptors spanning many shapes, not single models:

- **Gucci Belt Bag** (1047) — waist-bag silhouette across GG Marmont / Ophidia / GG canvas.
- **Prada Triangle** (1051) — the enamel triangle logo family, several silhouettes.
- **Gucci Neo Vintage** (1050) — GG Supreme archival line, many shapes.
- **Gucci Emblem** (1075) — the GG Emblem capsule, many shapes.
- **Gucci Retro Interlocking G** (1088) — GG Supreme logo-buckle line, many shapes.
- **Celine Macadam** (1054) — the 1970s monogram print, spans vintage shapes.
- **Chanel Pearl Crush** (1059) — a pearl-ball chain-adjuster detail on mini flaps, not a model.

**The 3 Gucci GG-Supreme logo entries (Neo Vintage / Emblem / Retro Interlocking G) overlap**
and are the strongest merge candidate — they likely describe the same coated-canvas logo world.

> ✅ **REVIEWED 2026-07-10 → KEEP SEPARATE (do NOT merge).** Spot-checked the listing source_urls
> on each: they are three DISTINCT named Gucci lines, not one bag. Neo Vintage = the archival GG
> Supreme + Web shoulder/belt line; GG Emblem = a Double-G emblem tote/chain capsule; Retro
> Interlocking G = a buckle-hardware backpack/messenger family. Merging would erase real house
> distinctions (exactly the silhouette-bucket risk the pipeline rule warns about). All three already
> carry honest "this is a Gucci line, not one bag" descriptions. Flag closed.

## Seasonal (no permanent name)

- **Chanel Urban Essentials** (1052) — Blazy-era seasonal; per `brand-naming-research.md`
  Regime B, seasonal Chanel has no official permanent name (canonical id = style code + season).
  Keep as a display label; do not treat as a permanent model.

## Batch-2 finds (2026-07-10) — removal candidate + more descriptors

- **Chanel Uniform** (1056) — STRONGEST removal candidate. The archivist confirmed this is
  NOT a retail model: it's Chanel's boutique/staff uniform program, and those pieces leak onto
  resale. "Uniform" is a sourcing note, not a bag name. Review for removal or relabel; its
  comps may belong to real flap/tote styles.
- **Gucci Dome** (1078) — shape descriptor, not a named Gucci model.
- **Descriptor/line names (kept, described at line altitude):** Saint Laurent Rive Gauche (1061),
  Saint Laurent Shopping Tote (1058), Louis Vuitton Bucket (1068), Louis Vuitton Easy Pouch On
  Strap (1060), Louis Vuitton S Lock (1066), Louis Vuitton Marais (1074, name reused across eras).

## Token-flagged, NEEDS REVIEW (generic name, but may be legit)

Auto-flagged by exact generic-name match; NOT confirmed. Note the false positive that proves
the list is noisy: **LV Vanity (1063) is a REAL single model** (Ghesquière SS2020), so a generic
name alone is not proof. Review each against its listings:

- Celine Frame Bag (1184), Chanel Uniform (1056), Gucci Day Backpack (1087),
  Louis Vuitton Bucket (1068), Saint Laurent Shopping Tote (1058).

## Batch-3 descriptor flags (2026-07-10)

More names that are lines/multi-variant, not single models (kept + described at line altitude):
Prada Canapa (hemp-canvas line), Balenciaga Town (a size in the Motorcycle line),
Versace Virtus (Barocco-V hardware line), Saint Laurent Uptown (tote + pouch), and the LV names
reused across eras: Bosphore, Marelle, Monceau, Rivoli, Greenwich. Lower priority than the
Chanel Uniform removal candidate; review if consolidating.

## Recommended handling (owner call)

1. **Keep + describe** (done for the top 15): an honest "this is a category, check the shape"
   description is live and better than a blank page. Low risk, reversible.
2. **Merge the 3 Gucci GG-Supreme entries** into one (e.g. keep Neo Vintage, fold Emblem +
   Retro Interlocking G) — but only after spot-checking their listings share the look.
3. **Leave seasonal Chanel** as labels.

No merge is safe to automate. This doc is the queue for a review pass.

## DUPLICATE-STYLE flags (found during icon page-depth pass, 2026-07-10)

### ✅ RESOLVED — 3 pairs MERGED 2026-07-10 (owner-approved, `merge-icon-dups.ts`)
Verified same-bag by identical listing source_urls on each pair, name-guarded merge, 824 ph rows
re-pointed, 0 collisions, 3 loser styles deleted, summary refreshed:
- **537 "Reissue" → 423 "2.55 Reissue"** (Chanel; 423 now 10 vars / 1,295 comps).
- **992 "Palm Springs" → 709 "Palm Springs Backpack"** (LV; 709 now 4 vars / 246 comps).
- **518 "Multi Pochette" → 444 "Multi Pochette Accessoires"** (LV; 444 now 5 vars / 295 comps).

*(historical detail, now resolved:)*
- **Chanel "Reissue" (style 537, 597 comps / 5 variants) is almost certainly the same bag as
  "2.55 Reissue" (style 423, 698 comps / 5 variants).** The archivist sourced both to the 2005
  Lagerfeld 50th-anniversary re-edition of the 1955 2.55.
- **Two more CATEGORY names (kept + described honestly, low priority):** Chanel "Camera Bag"
  (style 522, 303 comps) and Chanel "Clutch with Chain" (style 749, 268 comps) are silhouettes/
  SLG-adjacent categories, not single dated models. Their descriptions now say so; leave as
  category-level pages unless consolidating.
- **Chanel TRADE-NAMES (community names, not official Chanel model names):** GST / Grand Shopping
  Tote (519) and Business Affinity (432). Kept + described (with the trade-name caveat in-text) since
  buyers search these terms; do not present as official house names. Per `brand-naming-research`
  Chanel identifies seasonal bags by style code, not model name.
- **Celine "Cabas" (489):** listings mix the plain minimalist Cabas tote (dominant) with some Cabas
  Phantom (winged Luggage variant). Described as the plain Cabas; a future split could separate the
  Phantom if it accrues its own comps.
- **LV Palm Springs + LV Multi Pochette dups: MERGED (see RESOLVED block above).**
