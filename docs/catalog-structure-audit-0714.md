# Catalog structure audit — full sweep (2026-07-14)

> **Now a standing check.** The daily data-health action scores all three defect
> classes plus variant size/colour/material coverage on every run
> (`structure-pseudo`, `structure-title-junk`, `structure-accent-dupes`,
> `coverage-variant-*` — logic in `src/lib/catalog-structure.ts`, scoring in
> `data-health-core.ts`). Stable-or-shrinking junk = yellow (known backlog);
> GROWTH = red + a GitHub issue, because it means the promotion pipeline is
> minting new junk. This document is the baseline + cleanup plan.

Owner asked: does the Birkin pseudo-style disease exist across the whole catalog?
Audit run 2026-07-14 against the live DB: **48 brands · 966 styles · 4,305 variants**.
Tooling: `scripts/ux-restructure/audit-catalog-structure.ts` (+ `list-title-junk.ts`,
`list-dups.ts`). Raw per-brand JSON: `scripts/ux-restructure/catalog-structure-audit.json`.

## Verdict in one line
The hierarchy is fundamentally sound; the junk is real but **bounded and enumerable**:
~60 style rows (~6% of 966) are structurally wrong, concentrated in Chanel + Louis
Vuitton + Hermès, plus one catalog-wide attribute-coverage gap that is a known,
separate workstream.

## What we learned, on the three axes

**Completeness** (live baseline 2026-07-14, n=4,305 variants)
- Variant size: **93.5%** filled · colour: **45.2%** · material: **24.8%**.
- Colour/material gaps starve the bag-page axis selector; production-record axes
  stand in meanwhile. This is the attribute-capture lane, now delta-scored daily
  (`coverage-variant-*`) so any DROP flags a loader regression same-day.

**Correctness**
- Style names are the weak field: ~60 of 966 rows carry a wrong IDENTITY
  (a variant spec or a seller title posing as a style). Prices/listings under
  them are real data on wrong shelves — merges move them, nothing is deleted.
- Correctness failures cluster at INGEST/PROMOTION time (breadth-seed 2022 export,
  title-promotion), not decay in place. So the daily check scores GROWTH as red:
  a rising count means the pipeline is minting new junk today.

**Organization**
- The style→variant hierarchy model itself is right; defects are rows filed at the
  wrong level, not a schema problem. No migration needed — merges suffice.
- Guardrail learned the hard way: "name embeds another style" is NOT junk on its
  own (173 hits, mostly real sub-models like "Puzzle Edge"). Only the
  material-vocabulary-validated residual class auto-merges; over-cleaning would
  destroy real catalog breadth.
- Accent handling needs one canonical spelling per style (keep the accented form);
  the dup detector folds accents to catch ASCII twins at promotion time.

## The four real defect classes

### 1. Material/size baked into the style name (the Birkin disease) — 28 rows, FIX STAGED
"Togo Birkin 35", "Monogram Speedy 30", "Toile Herbag MM"… A canonical base style exists;
the row is a leather+size variant wearing a style's name.
- Detector validates the residual against a leather/canvas vocabulary, so sub-models are
  never auto-merged.
- **Fix is built + dry-run verified** (`merge-pseudo-styles.ts`, reversible). Owner applies.
- Spread: LV 17 · Hermès 10 · Chanel 1.

### 2. Promoted seller titles as style names — 21 rows, needs per-row mapping
"Chanel Pink Tweed 19 Large Flap Bag", "Mini Square Flap Bag w/ Tags", "Louis Vuitton
Monogram Canvas Neverfull Pochette Pouch"… whole listing titles that became styles.
All are single-variant. Spread: **Chanel 14 · LV 7** (list: `list-title-junk.ts`).
- Each needs a human-judged action: merge into the real style ("…Tweed 19 Large Flap
  Bag" → 19) or rename to the true model name (e.g. "…Le Majestueux Bag" is a real,
  rare LV model with a junk title around it).

### 3. Accent-duplicate styles — 5 groups (11 rows → 5), near-mechanical merge
- Goyard: Belvédère ×3 spellings, Saïgon ×2, Bohème ×2
- Valentino: Locò ×2 · Hermès: Bride-à-Brac ×2
- Keep the accented spelling, re-parent variants, delete the ASCII twin. Same merge
  mechanics as class 1; trivial to add to the staged script.

### 4. Variant attribute gaps — the axis-selector fuel problem (known workstream)
Of 4,305 variants: missing size **281 (6.5%)** · missing colour **2,359 (55%)** · missing
material **3,237 (75%)**. Not "junk", but the size/leather/colour/hardware selector can
only be as good as these fields. This is the existing attribute-capture pass
(docs: /data page + capture); the production-record axes partially cover for it today.

## What is NOT a defect (don't over-clean)
- 173 styles whose name embeds another style's name — most are genuine sub-models
  ("Puzzle Edge", "Loulou Puffer", "Soft Margaux", "Saddle Pochette") and MUST stay
  separate styles. Only the material-vocabulary subset (class 1) merges. The rest get a
  judgment pass, expected outcome mostly "keep".
- Brand-prefixed real names ("Dior Toujours", "Fendigraphy") — heuristic false alarms.
- 522 one-variant styles — mostly fine (genuinely single-spec or thin-data bags); a
  smell only in combination with classes 1-2.

## Cleanup order (recommended)
1. Owner runs the staged class-1 merge (28 rows) — biggest UX win, zero judgment needed.
2. Add class-3 accent dups to the same script (5 mechanical merges) — small patch.
3. Class-2 title-junk mapping pass (21 rows) — research each, propose merge/rename table,
   owner approves once, apply.
4. The 143 flagged name-embeds — periodic judgment pass; most will be "keep".
5. Attribute-capture continues as its own lane (already on the data worklist).
