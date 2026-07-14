# Chanel Vanity Case + LV Coussin + Prada Galleria + LV Félicie + LV Dauphine + Chanel Trendy CC + Balenciaga Le Cagole — production matrices (selector seed)

*Archivist run 2026-07-13. Same shape and rigor as the earlier matrix runs
(`gabrielle-capucines-bumbag-twist-deauville-blondie-cocohandle-production-matrix.md`,
`loucamera-...-30montaigne-production-matrix.md`): one reviewed source-of-truth list per style, NOT a full
combination matrix. Each axis value traces to a cited, dated source; anything I could not source is hedged
(MEDIUM) or omitted, never invented. Seven sections, each a ready `Row[]` to paste into
`supabase/ingest/load-production-options.ts`.*

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. There is **no `line` field**,
so line/format info (the Vanity family formats, LV canvas vs leather lines, the Galleria construction) is folded
into `note`.

**Colour-naming camp per house, checked against the banked archive and stated up front (this is the moat):**
- **Chanel — does NOT name seasonal colours.** A seasonal colour has only a style code + a `[YY][letter]` season
  code, no official name (`seasonal-archive/chanel.md`, the season-code map; same regime already in the loader on
  the Classic Flap / Boy / Reissue rows). So on both Chanel bags here (**Vanity Case**, **Trendy CC**) I seed
  **only the house-permanent palette — Black / Beige / White / Red / Navy** — and every seasonal colour is captured
  per-listing as descriptor + season code, never as a fake named option.
- **Louis Vuitton — names its LEATHER-LINE colours officially; colour is a real choice only inside the leather
  line.** The primary axis is the LINE. On the **leather** LV bag here (**Coussin** = Monogram-embossed puffy
  lambskin) colour is the primary axis and **LV's colour names are official** — I seed the permanent named anchor
  (Noir) and rotate the named brights per-listing. On the **canvas-primary** LV bags (**Félicie**, **Dauphine**)
  the LINE is the model (Monogram / Empreinte / Vernis / Reverse / Taurillon) and colour only appears on the
  leather line (Empreinte / Taurillon), Black/Noir anchor. Source: `seasonal-archive/louis-vuitton.md` §46-57
  (models: Coussin 2021, Dauphine 2019, Félicie Pochette), §77-88 (Reverse / Empreinte / Vernis / Epi leathers),
  §143-146 (Empreinte named-colour list: Noir permanent + Ombre/Infini/Neige/Orage), and the
  Speedy/Alma/Neverfull/OnTheGo/Métis/Bumbag rows already in the loader.
- **Prada — does NOT name its colours.** House-confirmed descriptor families only, often flat Italian shade names
  (Nero, Talco, Cammeo, Rosa); Prada leans on the material (Saffiano) + the triangle plaque, not a poetic
  seasonal-colour lexicon. So the **Galleria** colour rows are DESCRIPTORS. Source:
  `seasonal-archive/prada.md` §3, §68 (Galleria 2007, Saffiano flagship), §151-152 (Rosa/Cammeo flat shade names).
- **Balenciaga — NAMES its colours richly.** Le Cagole ships in a named palette (Black, Optic White, Beige +
  rotating named seasonals). So the **Le Cagole** colour rows carry named anchors (Black + Optic White) with the
  seasonals captured per-listing, encoded like the Bottega named-colour rows already in the loader.

New this run (2026-07-13, all free-tier Firecrawl, every search fed back for the 1-credit refund): SACLÀB "The
Chanel Vanity Case Deep Dive" (updated 2025-02-18; Small/Medium/Large cm + the family formats) + dearluxe +
coutureusa; official us.louisvuitton.com Coussin PM (M21260) + MM PDPs + lvbagaholic Coussin BB + Fashionphile
"Anatomy of the LV Coussin"; official prada.com Galleria micro PDP (1BA907) + luxbags "The Assassin Bag Prada
Galleria" size guide + prettylittledetails; official us.louisvuitton.com Pochette Félicie Monogram Empreinte
(M82609/M82610); official eu.louisvuitton.com Mini Dauphine (M45959) + Dauphine MM (M45958) PDPs + Spotted Fashion
Dauphine reference guide; bagreligion + Fashionphile + PurseBop + luxbags Chanel Trendy CC size guides; official
balenciaga.com Le Cagole Shoulder Small PDP + Pinterest/Fashionphile/eBay for XS cm and named colours.

---

## STYLE 1 — Chanel Vanity Case (style_id 430)

Chanel, **colour-primary**. This is a **FAMILY**, not one bag. The distinct **sizes** are Small / Medium / Large
(SACLÀB's cm table, taken on the modern "Filigree" Vanity, the SS16 airport-runway design that became a regular
line). The other names in the brief are **formats, not sizes**, and are folded into notes: the **Classic / Filigree
Vanity** (long chain + curved top handle, the modern core), the **Vanity With Chain (VWC)** (box-like vintage
silhouette, zip around the top, mirror in the lid), the **Vertical Vanity** (upright with a top handle), the
**Round Vanity** and **Pearl Crush Vanity** (round/pearl-embellished capsules), and the **'90s originals + heart
Vanity** (collector rarities). Axes: size, material (Caviar/Lambskin quilted default + tweed/exotic), colour
(Chanel permanent anchors only), hardware (gold/silver).

```ts
// Chanel Vanity Case (style 430), archivist-sourced 2026-07-13 (SACLÀB "The Chanel Vanity Case Deep Dive",
// updated 2025-02-18: three regular sizes on the modern Filigree Vanity — Small 17 x 13 x 7 cm, Medium 21 x 16 x
// 8 cm, Large 24 x 17 x 10 cm; dearluxe 22P Small Vanity With Chain 17 x 9.5 x 8 cm; coutureusa Small Vanity
// 6.25 x 3.75 x 3.1 in). This is a FAMILY: the distinct SIZES are Small/Medium/Large; the Vanity With Chain,
// Vertical, Round, Pearl Crush, and the '90s original/heart are FORMATS folded into notes, not seeded as sizes.
// Chanel does NOT name seasonal colours (chanel.md season-code map) — seed the permanent palette only, seasonals
// captured per-listing. Size x material x colour x hardware. cm from SACLÀB's own table.
const CHANEL_VANITY_CASE: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "17 x 13 x 7 cm (SACLÀB); the cross-body-scale Vanity, the most popular proportion and most produced. FORMAT note: the modern 'Filigree' Vanity (SS16, long chain + curved top handle) is the core; the box-like Vanity With Chain (VWC) micro/small runs ~17 x 9.5 x 8 cm (dearluxe)", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "21 x 16 x 8 cm (SACLÀB); the roomier everyday Vanity with card slots", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "permanent", note: "24 x 17 x 10 cm (SACLÀB); opens flat like a suitcase, fits an iPad mini; the scarcest regular size", sort_order: 3 },
  { axis: "material", value: "Caviar", permanence: "permanent", is_default: true, note: "grained caviar calfskin, diamond-quilted panels, holds shape; the classic Vanity surface", sort_order: 1 },
  { axis: "material", value: "Lambskin", permanence: "permanent", note: "smooth quilted lambskin, more delicate", sort_order: 2 },
  { axis: "material", value: "Patent", permanence: "seasonal", note: "the original '90s Vanity was diamond-quilted patent (SACLÀB); recurs as a seasonal finish", sort_order: 3 },
  { axis: "material", value: "Tweed", permanence: "seasonal", note: "seasonal tweed body", sort_order: 4 },
  { axis: "material", value: "Straw / Wicker", permanence: "seasonal", note: "the 2019 beach-collection rattan/straw 'lunchbox' Vanity + wicker VWC, per-listing", sort_order: 5 },
  { axis: "material", value: "PVC / Iridescent", permanence: "seasonal", note: "iridescent patent + transparent-PVC-front capsules, per-listing", sort_order: 6 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / lizard, historic limited runs", sort_order: 7 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone chain + CC; the classic pairing", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/ruthenium-tone chain + CC (e.g. the SS16 silver Vanity)", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black caviar + gold = the reference Vanity (beige-caviar-with-black-trim is the prized two-tone)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry→bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];
```

**Sourcing note (Chanel Vanity Case).** Model + formats from `chanel.md` + **SACLÀB's "The Chanel Vanity Case Deep
Dive"** (published 2022-08-22, updated 2025-02-18): the Vanity Case is a Lagerfeld-era family that began in the
early '90s (petite quilted-patent box, wraparound zip, fixed top handle), was reinvented as the **Filigree Vanity**
at the SS16 "Chanel Airlines" show and became a regular line, and also exists as the box-like **Vanity With Chain
(VWC)**, plus round/heart '90s rarities. Sizes/cm this run: SACLÀB's own table gives **Small 17 x 13 x 7 cm, Medium
21 x 16 x 8 cm, Large 24 x 17 x 10 cm**; dearluxe gives a **Small VWC at 17 x 9.5 x 8 cm** (the VWC is deeper/box-
ier, a format not a size). **The colour rule is Chanel's** (no official seasonal colour names): only the house-
permanent palette (Black/Beige/White/Red/Navy) is seeded, seasonals captured per-listing. **Defaults:** size
**Small** (the most popular/most produced proportion, SACLÀB); material **Caviar**; hardware **Gold**; colour
**Black**. **MEDIUM, hold these:** (1) the family's **formats** (Filigree, VWC, Vertical, Round, Pearl Crush,
'90s original, heart) are folded into notes rather than seeded as sizes or a phantom axis; if the catalog later
wants a format facet, it should come off the model/alias layer, not this size axis. (2) **VWC cm** (~17 x 9.5 x 8)
come from a single reseller listing, flagged. **Deliberately omitted, sourced:** the round **camellia beauty
vanity** (a No.5 cosmetics case, not a handbag); no invented seasonal colour names.

---

## STYLE 2 — LV Coussin (style_id 442)

Louis Vuitton, **LEATHER, colour-primary**. The Coussin (2021, "cushion") is the puffy **Monogram-embossed
lambskin** bag with a chunky chain, the 2020s "it" launch. Axes: **size** (BB / PM / MM — the brief's "Mini" is
LV's **BB**), **material** (Monogram-embossed puffy lambskin default + smooth lambskin/calf), **colour** (LV NAMES
its Coussin colours — Noir anchor + the launch brights rotated per-listing). **No hardware axis** (fixed gold-tone
chain; finish tracks the colorway).

```ts
// LV Coussin (style 442), archivist-sourced 2026-07-13 (official us.louisvuitton.com Coussin PM M21260 = 10.2 x
// 7.9 x 4.7 in / ~26 x 20 x 12 cm, Coussin MM = 13.4 x 9.4 x 4.7 in / ~34 x 24 x 12 cm; lvbagaholic Coussin BB =
// 8.3 x 6.3 x 2.8 in / ~21 x 16 x 7 cm; Fashionphile "Anatomy of the LV Coussin" confirms MM ~13 x 9.25 in +
// three inner compartments; model from louis-vuitton.md §48, Coussin 2021). LV LEATHER bag: colour is the primary
// axis and LV names its Coussin colours OFFICIALLY — Noir is the permanent anchor, the launch brights rotate
// per-listing. The chain hardware is fixed gold-tone (no hardware axis). Size x material x colour. cm from the
// official PDPs (PM/MM) + reseller (BB). The brief's "Mini" = LV's BB.
const LV_COUSSIN: Row[] = [
  { axis: "size", value: "BB", permanence: "permanent", note: "~21 x 16 x 7 cm (lvbagaholic 8.3 x 6.3 x 2.8 in); the smallest Coussin (the brief's 'Mini')", sort_order: 1 },
  { axis: "size", value: "PM", permanence: "permanent", is_default: true, note: "~26 x 20 x 12 cm (louisvuitton.com M21260 10.2 x 7.9 x 4.7 in); the signature square puffy Coussin, the most photographed/most cross-shopped (default vs MM is soft)", sort_order: 2 },
  { axis: "size", value: "MM", permanence: "permanent", note: "~34 x 24 x 12 cm (louisvuitton.com 13.4 x 9.4 x 4.7 in); the larger everyday Coussin", sort_order: 3 },
  { axis: "material", value: "Monogram Lambskin", permanence: "permanent", is_default: true, note: "puffy quilted Monogram-embossed lambskin; the signature Coussin surface, the colour-bearing leather", sort_order: 1 },
  { axis: "material", value: "Smooth Lambskin / Calf", permanence: "seasonal", note: "the plain (non-embossed) smooth-leather Coussin runs", sort_order: 2 },
  { axis: "material", value: "Metallic / Embellished", permanence: "seasonal", note: "gold/silver metallic-Monogram + studded/printed seasonal editions, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "LV names it 'Noir'; the anchor; LV's Coussin colour names are official", sort_order: 1 },
  { axis: "color", value: "Named brights (per-listing)", permanence: "seasonal", note: "the Coussin launched in bold named LV brights (green, pink, blue, etc.) that rotate seasonally — captured per-listing as official LV names, not seeded as invented anchors", sort_order: 2 },
];
```

**Sourcing note (LV Coussin).** Model + leather from `louis-vuitton.md` §48 (Coussin 2021, puffy Monogram-embossed
lambskin, chunky chain, the 2020s "it" launch). Sizes/cm this run: the **official us.louisvuitton.com Coussin PM
PDP (M21260)** gives **10.2 x 7.9 x 4.7 in (~26 x 20 x 12 cm)** and the **Coussin MM** gives **13.4 x 9.4 x 4.7 in
(~34 x 24 x 12 cm)**; **lvbagaholic's Coussin guide** gives the **BB at 8.3 x 6.3 x 2.8 in (~21 x 16 x 7 cm)**;
**Fashionphile's "Anatomy of the LV Coussin"** cross-confirms the MM at ~13 x 9.25 in with three inner
compartments. **The colour rule is LV's** — the Coussin is a **leather** bag, so colour is the primary axis and
**LV names its Coussin colours officially**: I seed **Noir** as the permanent anchor and rotate the launch brights
per-listing. **Defaults:** size **PM** (the signature square, most photographed; **MM co-signature**, soft);
material **Monogram Lambskin**; colour **Black/Noir**. **MEDIUM, hold these:** (1) **PM-vs-MM default** soft.
(2) I did not seed standing named brights as anchors because I did not per-colorway-date them this run; they are
one per-listing row. **Deliberately omitted, sourced:** **no hardware axis** (fixed gold-tone chain); the Coussin
belt bag / backpack are separate builds, per-listing, not seeded as sizes.

---

## STYLE 3 — Prada Galleria (style_id 203)

Prada, **Saffiano, DESCRIPTOR colours**. The Galleria (2007) is THE Prada Saffiano flagship: the structured
rectangular twin-zip tote with two top handles, named after the Galleria Vittorio Emanuele II (site of Prada's
first 1913 store). Axes: **size** (Micro / Small / Medium / Large), **material** (Saffiano default + Saffiano Lux +
soft City calf), **colour** (DESCRIPTORS — Prada does not name its colours; Nero default + the Prada nudes/brights
as flat shade names).

```ts
// Prada Galleria (style 203), archivist-sourced 2026-07-13 (official prada.com Galleria Saffiano MICRO PDP
// 1BA907 = H12.5 x W18 x L8.5 cm / ~18 x 12.5 x 8.5 cm; luxbags "The Assassin Bag Prada Galleria" size guide =
// Small ~25 x 19 x 10 cm, Medium ~28 x 22 cm; prettylittledetails = Micro 20W x 15H x 9.5, Small 28W x 19.5H x
// 12 — reseller measuring-convention variance on which face is 'width', noted; model + Saffiano from prada.md
// §68 [Galleria 2007, Saffiano flagship, 83 hand-finished pieces], §107 [Saffiano patented by Mario Prada 1913]).
// PRADA DOES NOT NAME its colours (prada.md §3) — DESCRIPTOR families / flat Italian shade names only (Nero,
// Talco, Cammeo, Rosa). Size x material x colour. cm vary by source; Large not cleanly pinned this run (hedged).
const PRADA_GALLERIA: Row[] = [
  { axis: "size", value: "Micro", permanence: "permanent", note: "~18 x 12.5 x 8.5 cm (prada.com 1BA907); the SLG-scale mini Galleria", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~25 x 19 x 10 cm (luxbags; prettylittledetails ~28 x 19.5 x 12 — reseller variance); the reference 'assassin bag' Galleria, the most cross-shopped (default vs Medium is soft)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~28 x 22 cm (luxbags); the classic work tote, holds a small tablet", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the roomiest Galleria, holds a laptop (PurseBlog); cm not cleanly sourced this run (MEDIUM)", sort_order: 4 },
  { axis: "material", value: "Saffiano", permanence: "permanent", is_default: true, note: "the cross-hatch treated Saffiano calf, scratch-resistant + structured; the Galleria's defining leather (Mario Prada patent, 1913)", sort_order: 1 },
  { axis: "material", value: "Saffiano Lux", permanence: "permanent", note: "the glossier/softer Saffiano Lux finish variant, same tier", sort_order: 2 },
  { axis: "material", value: "City Calf / Soft", permanence: "seasonal", note: "softer smooth-calf Galleria runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "crocodile / printed / painted special editions (e.g. the pop-colour capsules), per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Prada 'Nero'; the anchor; descriptor, not a poetic house colour name", sort_order: 1 },
  { axis: "color", value: "White", permanence: "permanent", note: "Prada 'Talco'/Chalk White; descriptor", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the nude/beige family, Prada 'Cammeo' (a flat Italian shade name); descriptor", sort_order: 3 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "Prada 'Rosa'/Powder Pink; a recurring Galleria descriptor (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Prada red; descriptor (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Prada Galleria).** Model + material from `prada.md` §68, §107: the Galleria (2007) is the Saffiano
flagship, the structured twin-zip two-handle tote named for the 1913 Galleria Vittorio Emanuele II store, in the
cross-hatch Saffiano leather Mario Prada patented in 1913. Sizes/cm this run: the **official prada.com Galleria
Saffiano micro PDP (1BA907)** gives **H12.5 x W18 x L8.5 cm**; **luxbags's "The Assassin Bag Prada Galleria"** guide
gives **Small ~25 x 19 x 10 cm, Medium ~28 x 22 cm**; **prettylittledetails** gives **Micro ~20 x 15 x 9.5, Small
~28 x 19.5 x 12** (the sources disagree on which face is "width", so cm are approximate, noted). **The colour rule
is Prada's** (`prada.md` §3): **Prada does not name its colours** — descriptor families and flat Italian shade
names only (Nero, Talco, Cammeo, Rosa), confirmed on prada.com's own Galleria PLP (Black, Chalk White, Powder
Pink). **Defaults:** size **Small** (the most cross-shopped "assassin bag"; **Medium co-classic**, soft); material
**Saffiano**; colour **Black/Nero**. **MEDIUM, hold these:** (1) **Large cm** not cleanly sourced this run (seeded
seasonal). (2) **Small-vs-Medium default** soft. (3) **Pink/Red permanence** soft (recurring descriptor families).
**Deliberately omitted, sourced:** no invented Prada season-colour names; the Galleria pop-colour / artist
capsules are per-listing, not seeded as anchors.

---

## STYLE 4 — LV Félicie (style_id 523)

Louis Vuitton, **CANVAS-primary pochette / WOC** (the Félicie Pochette, a flat chain pochette with removable
insert pouches). Axes: **material = the LINES** (Monogram default / Empreinte / Vernis / Reverse), **colour**
(Empreinte only, Black anchor), **size** (one core; no distinct Mini confirmed this run). **No construction/hardware
axis** (fixed gold-tone chain + insert pouches ship standard).

```ts
// LV Félicie (style 523), archivist-sourced 2026-07-13 (official us.louisvuitton.com Pochette Félicie Monogram
// Empreinte M82609 + Bi-Colour M82610 = 8.3 x 4.7 x 1.2 in / ~21 x 12 x 3 cm, chain drop 20.9 in, fits a
// 6.7-inch phone; model from louis-vuitton.md §57, Félicie Pochette). LV CANVAS-primary WOC: the LINE is the model
// (Monogram default / Empreinte / Vernis / Reverse); colour ONLY on the Empreinte leather line, Black anchor;
// canvas lines take no colour choice. NO construction/hardware axis. One core size (the Félicie is a single-size
// pochette). cm from the official PDP.
const LV_FELICIE: Row[] = [
  { axis: "size", value: "Pochette", permanence: "permanent", is_default: true, note: "~21 x 12 x 3 cm (louisvuitton.com M82609, official); the one core Félicie Pochette size, worn WOC/crossbody via the chain; ships with removable insert pouches", sort_order: 1 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, the launch line; canvas takes no colour choice", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing leather line (incl. the black/beige bi-colour)", sort_order: 2 },
  { axis: "material", value: "Monogram Vernis", permanence: "seasonal", note: "patent Monogram-embossed; intermittent colour runs", sort_order: 3 },
  { axis: "material", value: "Monogram Reverse", permanence: "seasonal", note: "caramel/brown reverse-Monogram canvas; intermittent runs", sort_order: 4 },
  { axis: "material", value: "Seasonal Print", permanence: "seasonal", note: "seasonal Monogram-print / capsule editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir'; the anchor; canvas lines take no colour choice; other Empreinte colours rotate seasonally, captured per-listing", sort_order: 1 },
];
```

**Sourcing note (LV Félicie).** Model + line from `louis-vuitton.md` §57 (Félicie Pochette: flat chain pochette
with removable insert pouches, Monogram/Empreinte) and the LV canvas-primary pattern already in the loader
(Speedy/Neverfull/Bumbag): the LINE is the model, colour appears **only** on the Empreinte leather line (Black
anchor), the canvas lines take no colour choice. Size/cm this run: the **official us.louisvuitton.com Pochette
Félicie Monogram Empreinte PDP (M82609)** and the **Bi-Colour PDP (M82610)** both give **8.3 x 4.7 x 1.2 in
(~21 x 12 x 3 cm), chain drop 20.9 in**, confirming both the single core size and the Empreinte colour line
(the popular build is black/beige bi-colour Empreinte). **Defaults:** size **Pochette** (the one core size);
material **Monogram**; colour **Black**. **MEDIUM, hold these:** (1) the brief flagged "one core (+ any Mini)"; I
found **no distinct Mini Félicie** this run, so only the one core size is seeded (do not invent a Mini). **Deliber-
ately omitted, sourced:** **no construction/hardware axis** (fixed gold-tone chain, the insert pouches ship with
the bag); **no colour rows beyond the Empreinte Black anchor** (canvas lines take no colour, matching the loader's
Speedy/Neverfull/Bumbag pattern).

---

## STYLE 5 — LV Dauphine (style_id 441)

Louis Vuitton, **CANVAS-primary flap**. The Dauphine (2019) is the structured flap whose signature is the
two-tone **Monogram + Monogram Reverse** body and the interlocking **LV clasp** (fixed). Axes: **size** (Mini / MM
sourced this run + East-West), **material = the LINES** (Monogram/Reverse two-tone default / Empreinte / Taurillon
leather / Damier), **colour** (Empreinte/Taurillon only, Black anchor). **No hardware axis** (the LV clasp is
fixed; finish tracks the colorway).

```ts
// LV Dauphine (style 441), archivist-sourced 2026-07-13 (official eu.louisvuitton.com Mini Dauphine M45959 = 20 x
// 15 x 9 cm, Dauphine MM M45958 = 25 x 17 x 10.5 cm; Spotted Fashion Dauphine reference guide for the Taurillon
// leather Dauphine + line lineup; model from louis-vuitton.md §49, Dauphine 2019, Reverse 2016). LV CANVAS-primary
// flap: the LINE is the model (Monogram+Reverse two-tone default / Empreinte / Taurillon / Damier); colour ONLY on
// the leather lines (Empreinte/Taurillon), Black anchor; canvas takes no colour choice. NO hardware axis (LV clasp
// fixed). Size x material x colour. cm from official PDPs (Mini/MM); East-West cm not cleanly sourced (hedged);
// no distinct 'PM' confirmed this run.
const LV_DAUPHINE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "20 x 15 x 9 cm (louisvuitton.com M45959, official); the compact crossbody Dauphine, very popular on resale", sort_order: 1 },
  { axis: "size", value: "MM", permanence: "permanent", is_default: true, note: "25 x 17 x 10.5 cm (louisvuitton.com M45958, official); the original 2019 reference proportion, most cross-shopped (Mini is co-popular, soft)", sort_order: 2 },
  { axis: "size", value: "East West", permanence: "seasonal", note: "the flatter elongated baguette-style Dauphine (recent); cm not cleanly sourced this run (MEDIUM)", sort_order: 3 },
  { axis: "material", value: "Monogram / Reverse", permanence: "permanent", is_default: true, note: "the signature two-tone build: Monogram body + Monogram Reverse (caramel) trim; the classic Dauphine look; canvas takes no colour choice", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; a colour-bearing leather line", sort_order: 2 },
  { axis: "material", value: "Taurillon", permanence: "permanent", note: "smooth Taurillon calf leather Dauphine (Spotted Fashion); the other colour-bearing leather line", sort_order: 3 },
  { axis: "material", value: "Damier", permanence: "seasonal", note: "Damier Ebene/Azur check; intermittent runs", sort_order: 4 },
  { axis: "material", value: "Seasonal Print", permanence: "seasonal", note: "seasonal Monogram-print / By-the-Pool / capsule editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte/Taurillon 'Noir'; the anchor; the canvas Monogram/Reverse line takes no colour choice; other leather colours rotate seasonally, captured per-listing", sort_order: 1 },
];
```

**Sourcing note (LV Dauphine).** Model + line from `louis-vuitton.md` §49 (Dauphine 2019, structured flap with the
interlocking LV clasp + contrast trim, Monogram/Reverse) + §77 (Monogram Reverse debuted 2016). Sizes/cm this run:
the **official eu.louisvuitton.com Mini Dauphine PDP (M45959)** gives **20 x 15 x 9 cm** and the **Dauphine MM PDP
(M45958)** gives **25 x 17 x 10.5 cm**; **Spotted Fashion's Dauphine reference guide** confirms the **Taurillon
leather Dauphine** and the line lineup. **The colour rule is LV's** — the Dauphine's primary axis is the LINE, and
colour is a real choice only on the leather lines (Empreinte/Taurillon), Black anchor; the two-tone Monogram/Reverse
canvas takes no colour choice. **Defaults:** size **MM** (the 2019 reference; **Mini co-popular**, soft); material
**Monogram/Reverse** two-tone; colour **Black**. **MEDIUM, hold these:** (1) **East-West cm** not cleanly sourced
(seeded seasonal). (2) the brief listed a **"PM"**; I did not confirm a distinct Dauphine PM this run (LV's core run
is Mini + MM, plus a Micro SLG and the East-West), so PM is **not seeded** rather than invented, flagged for a
re-source pass. (3) **MM-vs-Mini default** soft. **Deliberately omitted, sourced:** **no hardware axis** (the LV
clasp is the fixed signature); the Dauphine Soft / backpack / Micro are separate builds, per-listing.

---

## STYLE 6 — Chanel Trendy CC (style_id 525)

Chanel, **colour-primary top-handle flap**. The Trendy CC is the diamond-quilted flap with a rigid **top handle**
and a **CC turn-lock** (both fixed). Axes: **size** (Small / Medium / Large + WOC + Clutch/Bowling formats),
**material** (Lambskin quilted default + Caviar/tweed/exotic), **colour** (Chanel permanent anchors only). **No
hardware axis** (turn-lock + top handle fixed; tone tracks the colorway).

```ts
// Chanel Trendy CC (style 525), archivist-sourced 2026-07-13 (bagreligion "Chanel Trendy CC Size Guide" = Small
// 9.75 x 7 x 3.5 in / ~24.8 x 17.8 x 8.9 cm, WOC 7.5 x 4.8 x 1.4 in / ~19.1 x 12.2 x 3.6 cm; Fashionphile = Small
// 9.75 x 6.75 x 3 in, Medium 11.25 x 7.5 x 4 in; PurseBop = Medium 11.7 x 7.4 x 4.7 in, Large 12.2 x 10.2 x 6.3
// in, Bowling Small 8.2 x 7.4 in; luxbags Small 20 x 15 x 8 cm — reseller variance on the Small, noted). Chanel
// does NOT name seasonal colours (chanel.md season-code map) — seed the permanent palette only, seasonals
// per-listing. Size x material x colour. NO hardware axis (turn-lock + top handle fixed). cm converted from inches.
const CHANEL_TRENDY_CC: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", note: "~24.8 x 17.8 x 8.9 cm (bagreligion 9.75 x 7 x 3.5 in; luxbags gives a smaller 20 x 15 x 8 cm — reseller variance); the compact top-handle flap", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~29.7 x 18.8 x 11.9 cm (PurseBop 11.7 x 7.4 x 4.7 in; Fashionphile 11.25 x 7.5 x 4 in); the reference Trendy CC, most cross-shopped", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~31 x 26 x 16 cm (PurseBop 12.2 x 10.2 x 6.3 in); the roomiest flap, scarcer", sort_order: 3 },
  { axis: "size", value: "WOC", permanence: "permanent", note: "~19.1 x 12.2 x 3.6 cm (bagreligion 7.5 x 4.8 x 1.4 in); the Trendy CC wallet-on-chain", sort_order: 4 },
  { axis: "size", value: "Clutch / Bowling", permanence: "seasonal", note: "the Trendy CC clutch-with-handle + the Bowling Bag format (PurseBop Bowling Small ~8.2 x 7.4 in); folded here as formats, per-listing", sort_order: 5 },
  { axis: "material", value: "Lambskin", permanence: "permanent", is_default: true, note: "smooth diamond-quilted lambskin; the classic Trendy CC surface", sort_order: 1 },
  { axis: "material", value: "Caviar", permanence: "permanent", note: "grained caviar calfskin, sturdier/holds shape", sort_order: 2 },
  { axis: "material", value: "Tweed", permanence: "seasonal", note: "seasonal tweed body", sort_order: 3 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / lizard / alligator, historic limited runs", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black lambskin + gold = the reference Trendy CC", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry→bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];
```

**Sourcing note (Chanel Trendy CC).** Model from `chanel.md` + the reseller guides: the Trendy CC is the diamond-
quilted flap with a rigid **top handle** and the **CC turn-lock**. Sizes/cm this run: **bagreligion's "Chanel
Trendy CC Size Guide"** gives **Small ~24.8 x 17.8 x 8.9 cm and WOC ~19.1 x 12.2 x 3.6 cm**; **Fashionphile** gives
**Small 9.75 x 6.75 x 3 in, Medium 11.25 x 7.5 x 4 in**; **PurseBop** gives **Medium 11.7 x 7.4 x 4.7 in, Large
12.2 x 10.2 x 6.3 in, and a Bowling Bag format**; **luxbags** gives a smaller Small at 20 x 15 x 8 cm (reseller
variance on the Small, noted). **The colour rule is Chanel's** (no official seasonal colour names): only the
house-permanent palette (Black/Beige/White/Red/Navy) is seeded, seasonals captured per-listing. **Defaults:** size
**Medium** (the reference, most cross-shopped); material **Lambskin**; colour **Black**. **MEDIUM, hold these:**
(1) **Small cm variance** (bagreligion ~25 cm vs luxbags 20 cm) noted, not resolved. (2) the **Clutch / Bowling**
formats are folded into one seasonal row, per-listing, not seeded as core sizes. **Deliberately omitted, sourced:**
**no hardware axis** (the turn-lock + top handle are the fixed signature; tone tracks the colorway); no invented
seasonal colour names.

---

## STYLE 7 — Balenciaga Le Cagole (style_id 566)

Balenciaga, **NAMES its colours**. The Le Cagole (2022, Gvasalia) is the slouchy moto crescent in the signature
**Arena distressed/aged lambskin**, studded moto hardware, and a little mirror charm. Axes: **size** (Nano / Mini /
XS / Small / Medium), **material** (Arena distressed lambskin default + croc-embossed + crystal/suede), **colour**
(Balenciaga NAMES: Black + Optic White anchors + rotating named seasonals per-listing), **hardware** (the studded
moto + mirror-charm hardware, aged-gold default + silver + crystal, a real Bal axis).

```ts
// Balenciaga Le Cagole (style 566), archivist-sourced 2026-07-13 (official balenciaga.com "Le Cagole Shoulder Bag
// Small" 6713071VG9Y = L33 x H16 x W8.5 cm, strap drop 49 cm; Pinterest/reseller XS = ~25.9 x 16 x 6.8 cm, named
// colour 'Optic White'; Fashionphile/eBay confirm the XS + Black/Beige/White colour breadth; model = the 2022
// Gvasalia moto crescent in Arena distressed lambskin, studded hardware + mirror charm). BALENCIAGA NAMES its
// colours (encoded like the Bottega named-colour rows): Black + Optic White anchors, the rest rotate as official
// Bal names per-listing. Size x material x colour x hardware. cm sourced for Small (official) + XS (reseller);
// Nano/Mini/Medium cm not cleanly pinned this run (hedged).
const BALENCIAGA_LE_CAGOLE: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "the tiny keychain/charm-scale Cagole; cm not cleanly sourced this run (MEDIUM)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "seasonal", note: "the mini Cagole (incl. the bucket format); cm not cleanly sourced this run (MEDIUM)", sort_order: 2 },
  { axis: "size", value: "XS", permanence: "permanent", is_default: true, note: "~25.9 x 16 x 6.8 cm (reseller/Pinterest); the viral It-bag Cagole, the most cross-shopped (default vs Small is soft)", sort_order: 3 },
  { axis: "size", value: "Small", permanence: "permanent", note: "33 x 16 x 8.5 cm (balenciaga.com, official), strap drop 49 cm; the shoulder Cagole", sort_order: 4 },
  { axis: "size", value: "Medium", permanence: "seasonal", note: "the largest shoulder Cagole; cm not cleanly sourced this run (MEDIUM)", sort_order: 5 },
  { axis: "material", value: "Arena Lambskin", permanence: "permanent", is_default: true, note: "the signature Arena distressed/aged lambskin, slouchy; the defining Cagole surface", sort_order: 1 },
  { axis: "material", value: "Croc-Embossed", permanence: "seasonal", note: "shiny crocodile-embossed calf; a recurring Cagole finish", sort_order: 2 },
  { axis: "material", value: "Crystal / Rhinestone", permanence: "seasonal", note: "all-over crystal/rhinestone-covered evening editions, per-listing", sort_order: 3 },
  { axis: "material", value: "Suede / Fabric", permanence: "seasonal", note: "suede / denim / other seasonal bodies, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Aged Gold", permanence: "permanent", is_default: true, note: "the signature aged/brass studded moto hardware + mirror charm; the classic Cagole finish", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "shiny silver-tone studs + hardware", sort_order: 2 },
  { axis: "hardware", value: "Crystal-Studded", permanence: "seasonal", note: "rhinestone/crystal-set studs on the evening editions, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; Balenciaga names its colours (Black is the reference Cagole)", sort_order: 1 },
  { axis: "color", value: "Optic White", permanence: "permanent", note: "Balenciaga's official white colour name (a standing Cagole neutral); permanence soft", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "a standing neutral Cagole (Bal names it; e.g. 'Beige'); permanence soft", sort_order: 3 },
  { axis: "color", value: "Named seasonals (per-listing)", permanence: "seasonal", note: "Balenciaga's rotating named Cagole colours (pink, red, silver, etc., official Bal names) — captured per-listing, not seeded as invented anchors", sort_order: 4 },
];
```

**Sourcing note (Balenciaga Le Cagole).** Model = the 2022 Gvasalia moto crescent in the signature Arena distressed
lambskin with studded hardware and a mirror charm (established beat; no Balenciaga file in the banked archive yet,
so this run is reseller/house-sourced and queued for a Balenciaga archive pass). Sizes/cm this run: the **official
balenciaga.com "Le Cagole Shoulder Bag Small" PDP** gives **33 x 16 x 8.5 cm, strap drop 49 cm**; **reseller/
Pinterest** put the **XS at ~25.9 x 16 x 6.8 cm** (with the designer colour name **Optic White**); **Fashionphile
and eBay** confirm the XS plus Black/Beige/White colour breadth. **The colour rule is Balenciaga's** — Bal **names**
its colours, so I seed **Black + Optic White** as named anchors (+ Beige, soft) and rotate the seasonals per-listing
as official Bal names. **Defaults:** size **XS** (the viral It-bag size; **Small co-popular**, soft); material
**Arena Lambskin**; hardware **Aged Gold**; colour **Black**. **MEDIUM, hold these:** (1) **Nano / Mini / Medium
cm** not cleanly sourced this run (seeded seasonal, hedged). (2) **XS-vs-Small default** soft. (3) **Optic White /
Beige permanence** soft (I did not per-season-date each this run). (4) the whole colour layer is reseller/house-
sourced pending a proper Balenciaga archive file. **Deliberately omitted, sourced:** the Le Cagole tote / bucket /
belt-bag are separate builds folded per-listing, not seeded as sizes; no invented Bal colour names.

---

## Two things to wire when you paste

1. Register all seven in the `STYLES` array (style_ids from the brief; **re-confirm against the `style` table
   before writing** — I did not have DB access this run):
   `{ styleId: 430, name: "Vanity Case", rows: CHANEL_VANITY_CASE }`,
   `{ styleId: 442, name: "Coussin", rows: LV_COUSSIN }`,
   `{ styleId: 203, name: "Galleria", rows: PRADA_GALLERIA }`,
   `{ styleId: 523, name: "Félicie", rows: LV_FELICIE }`,
   `{ styleId: 441, name: "Dauphine", rows: LV_DAUPHINE }`,
   `{ styleId: 525, name: "Trendy CC", rows: CHANEL_TRENDY_CC }`,
   `{ styleId: 566, name: "Le Cagole", rows: BALENCIAGA_LE_CAGOLE }`.
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; vanitycase-coussin-galleria-felicie-dauphine-trendycc-lecagole-production-matrix.md"` so the provenance
   string stays honest.
