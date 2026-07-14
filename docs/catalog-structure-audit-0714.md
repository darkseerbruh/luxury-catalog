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
- **Unknowns are stated, never blank (owner rule 2026-07-14):** DB keeps NULL as the
  machine truth (a sentinel string would poison ingest matching + fake coverage);
  the UI surfaces every gap as explicit, selectable state — an "Unknown" chip on the
  variant selector (incl. the "Standard" size bucket) and "Not yet documented ·
  know it? Tell us" spec rows linking to Suggest-an-edit. `UNKNOWN_VALUE` in
  `src/lib/variant-dims.ts`.
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

## Cleanup status (owner gave blanket go 2026-07-14, applied same day)
1. ✅ Class-1 merge APPLIED: 28 pseudo-styles folded into their real styles
   (rollback-all-28.json). 1 multi-variant judgment row remains (Bloomsbury).
2. ✅ Class-3 accent dups APPLIED: 5 groups merged, 6 twin rows deleted, accented
   spelling kept (merge-accent-dups.ts, rollback-accent-dups.json).
3. ✅ Class-2 partial: 2 auto-merges (Mini Square Flap, Neverfull) + 5 hand-verified
   LV renames (Thompson Street, Antigua Cabas, Boétie, Pégase, Le Majestueux) with
   title-parsed colour/material/size moved onto the variants. **14 Chanel rows
   remain** — no-model-name vintage/seasonal pieces; naming them needs the archivist
   (renaming by heuristic would be inventing). List: `map-title-junk.ts` dry-run.
4. ✅ Attribute roll-up APPLIED (enrich-variant-attributes.ts): 1,613 variants filled
   from listing evidence — votes are DISTINCT listings (re-scrape dedupe, the
   deals-rail lesson), colour needs ≥90% consensus, material/hardware ≥80%; mixed
   buckets stay NULL by design. Coverage: colour 45.2%→51%, material 24.8%→41%.
   Rollbacks: rollback-attr-enrich.json.
5. ✅ Name-embeds judgment pass DONE (second-wave, 2026-07-14 evening): the flagged
   set is KEEP by default — verdicts locked so nobody re-litigates:
   - KEEP (distinct models/lines, never merge): Kelly Pochette, Kelly/Constance To Go,
     Picotin Lock, Petit Sac Plat, Petite Boîte Chapeau, all Ophidia/GG Marmont/
     Gabrielle Backpack silhouettes, Saddle Pochette + Chain Pouch, Pillow Tabby,
     Willow Tote, Speedy Soft, Keepall Bandoulière, Icare/Loulou Puffer/Lou Camera,
     The Pouch Chain, Padded/Chain Cassette, Multi Pochette Accessoires, Félicie
     Pochette + Strap & Go, Pearl Crush line, Vanity Case lines, Musette Salsa/Tango,
     Loop Hobo, Marais/Petit Bucket, Bloomsbury (multi-variant), Birkin Touch.
   - 11 hand-verified merges applied (second-wave-merges.ts): Picotin 22, Double
     Sens 36, Garden Party 36, Herbag Zip 31, City Steamer MM, Travel Ligne ×3,
     Cerf (Executive), Business Affinity Large, Gabrielle Hobo Medium.
   - 1 un-merge: Neverfull Pochette Pouch back OUT of Neverfull (pouch = accessory,
     restored as style 1288; the accessory-surface lane owns its future).
6. ✅ Archivist naming pass DONE (2026-07-14 evening): all 14 Chanel rows identified
   (research table + sources in the archivist run; apply-archivist-chanel.ts).
   - 2 merges: Pink Tweed 19 → Chanel 19 (#425); Mini Top Handle → Top Handle
     Rectangular Flap (#906).
   - 8 sourced renames: Brooklyn Cabas (F/W 2007 — genuinely Chanel, NOT the LV
     Brooklyn), Golden Class Double CC Flap (Cruise 2014), Fashion Therapy Bowling
     Bag (2020), Mademoiselle Lock Flap, Denim Graffiti Flap (22P), Terrycloth
     Flap (2021), Button On Top Flap (~2020), Quilted CC Belt Bag. These are
     reseller/collector-consensus labels, not official Chanel names (Chanel
     seasonal has only style codes) — keep that hedge in any page copy.
   - 3 interim renames pending an image pass: Vintage Chevron Flap (#167),
     Quilted Flap Shoulder Bag (#178), Caviar CC Tote (#189 — likely one of
     GST/Medallion/PST/Cerf; the image decides).
   - 1 untouched: #191 (tentative merge → Vintage Quilted Shoulder Bag #79, image
     first). It is the single remaining seller-title row in the daily check.
7. ✅ Comps-remap DONE (2026-07-14, follow-up the archivist found): the price_history
   comps on those 14 variants were CONTAMINATED (unrelated eBay/TRR bags mapped onto
   the old seller-title names, e.g. the "Novelty Drawstring" comp on the Chanel 19
   row). Swept with the TRR-mismap discipline (`remap-chanel-comps.ts`): 62 rows
   judged (notes-title first, slug fallback, accent-blind vs the dictionary), every
   flagged row hand-reviewed (`chanel-comps-decisions.json`) — 20 kept (incl. the
   Fashionphile "Mini Top Handle Rectangular Flap" rows the dictionary misreads as
   Classic Flap: a dictionary gap, not a mismap), 42 moved preserve-then-delete to
   discovered_listing with style_guess for re-promotion. Rollback:
   rollback-chanel-comps.json. Three of the 14 (#69 Brooklyn Cabas, #76 Terrycloth,
   #138 Button On Top) had zero comps; five (#158, #189, #50, #153, #1288) now hold
   zero comps until fresh capture re-places clean ones.
   - Root fix shipped with it: "Top Handle Rectangular Flap" is now its own
     dictionary model (it was rolling into Classic Flap via "rectangular flap",
     which is how #906's FP comps mis-resolved; handle-LESS square/rectangular
     minis keep the 0709 Classic Flap roll-up). Regression-tested.
   - Re-placement (replace-remapped-comps.ts, scoped promote-safe discipline —
     never creates styles/variants): 6 of the 42 placed onto their real styles
     (Classic Flap Jumbo + Maxi, Vanity Case ×2, Diana Flap Bag, LV Eva Clutch);
     3 HELD on purpose (2 seasonal-on-icon tweed single flaps — the Hollywood
     Boulevard precedent — + a Vanity phone holder for the accessory lane);
     33 stay banked (21 unresolved by design, rest lack a clean size variant,
     e.g. "Maxi 2.55" with no Maxi on 2.55 Reissue).
8. ✅ Model-name year contamination FIXED (2026-07-14 night): the spec extractor
   read model names as production years — Jackie 1961 (511 rows), FF/Jacquard 1974
   (444), Re-Edition 2005 (357) / 2000 (90), Lauren 1980 (27) = 1,429 price rows
   fed wrong decades into the bag-page era lens. Cleaned (rollback-model-years.json
   + rollback-fendi-1974.json) and guarded at the extractor (stripModelNameYear in
   spec-extract.ts, tested) so new captures can't re-pollute.
9. ✅ Variant year fill (tight gate): year_start set on 35 variants where every
   distinct listing states the SAME year (seasonal-piece signature, mostly 2021/22).
   Spread evidence (179 variants) stays null by design — listings can't bound a
   production range; the era lens renders it honestly. year_end never filled.
10. ✅ Image pass DONE (2026-07-14 night, apply-image-pass-chanel.ts + rollback):
   seed photos recovered from the 2022 TLC export (data/raw, Photos column) and
   verified by eye. **Seller-title check now 0 🟢** (was 21 at baseline).
   - #167 Vintage Chevron Flap → MERGED into Classic Flap (#1): the photo is a
     chevron-quilted classic double flap (CC turnlock, woven chain) — chevron is
     a quilting option, a variant trait wearing a style name.
   - #178 kept (no merge into #185 — photo shows a Mademoiselle TURNLOCK + flat
     leather strap vs #185's push-lock + chain: different bags). Variant material
     corrected lambskin → caviar per the photo; its one kept eBay comp
     ("…Lambskin…Chain Shoulder Bag") contradicted the sharpened identity and was
     evicted to discovered_listing. Archivist web pass (same night) closed the
     name: NO consensus model name exists (HIGH confidence — FP/Yoogi's/TRR all
     use descriptive "Mademoiselle Flap" labels; FP 552502 is the sister piece,
     dated 2005 but that anchors the sister, not this bag → year stays null).
     Renamed → "Mademoiselle Turnlock Flap" (the rotating turnlock objectively
     distinguishes it from #185's push-lock; rollback-178-rename.json). The flat
     leather strap may be aftermarket — never identify this piece by its strap.
   - #189 → "Vintage Front Pocket Tote": NONE of the four guesses (GST/Medallion/
     PST/Cerf) — it's the 90s caviar open-top shopper with the CC-turnlock front
     pocket. New name also stops baking material into the style name.
   - #191 → "Vintage Full Flap" (black lambskin, flap covers the whole front, CC
     turnlock at the bottom edge). Tentative merge → #79 REFUSED: #79's own
     description is a RED ZIP-TOP chain bag — a different bag, and #79 itself is
     now flagged (junk listing-dump description, unverified identity, 0 comps).
11. ✅ #79 identity fix DONE (2026-07-14): seed photos pulled from data/raw
   (therealreal_data-1.csv ref CHA674812, Photos column) and looked at, then an
   archivist web pass pinned the reseller-consensus family — RENAMED "Vintage
   Quilted Shoulder Bag" → **"Vintage CC Charm Tote"** (Rebag carries it as
   taxonomy family HB.CH.VCCCT.QULA.*; myGemma/eBay/1stDibs concur; no official
   Chanel name, Regime B). Junk seller-dump description replaced via the
   review-gated apply-style-depth flow (style-depth-79.json); v361 attributes
   set from the photos (Red, Lambskin, gold, "chain with leather weave" — the
   old strap_type "16" was the CSV strap-DROP mis-mapped); old title kept
   searchable in bag_alias. Era reads late-1980s–90s on markers + seller
   attribution only → year_introduced stays null. Scripts:
   fix-style-79.ts (+rollback-style-79.json, holds the old seller-dump text).
   The §10 merge refusal stands confirmed: #191 (full-front-flap) ≠ #79
   (zip-top chain tote). #79 still has 0 comps → it rides the fresh-capture lane.
12. Remaining lanes: fresh capture for the 433 too-thin variants + the
   zero-comp ex-junk styles (#79 now included) · the 1,466 multi-colour buckets
   = the variant-levers colour-splitter lane (active elsewhere; do not duplicate).
