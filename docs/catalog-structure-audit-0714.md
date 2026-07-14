# Catalog structure audit — full sweep (2026-07-14)

Owner asked: does the Birkin pseudo-style disease exist across the whole catalog?
Audit run 2026-07-14 against the live DB: **48 brands · 966 styles · 4,305 variants**.
Tooling: `scripts/ux-restructure/audit-catalog-structure.ts` (+ `list-title-junk.ts`,
`list-dups.ts`). Raw per-brand JSON: `scripts/ux-restructure/catalog-structure-audit.json`.

## Verdict in one line
The hierarchy is fundamentally sound; the junk is real but **bounded and enumerable**:
~60 style rows (~6% of 966) are structurally wrong, concentrated in Chanel + Louis
Vuitton + Hermès, plus one catalog-wide attribute-coverage gap that is a known,
separate workstream.

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
