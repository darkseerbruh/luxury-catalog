# Chanel Gabrielle + LV Capucines + LV Bumbag + LV Twist + Chanel Deauville + Gucci Blondie + Chanel Coco Handle — production matrices (selector seed)

*Archivist run 2026-07-13. Same shape and rigor as
`loucamera-le5a7-pochetteacc-hourglass-niki-multipochette-30montaigne-production-matrix.md` and the earlier matrix
runs: one reviewed source-of-truth list per style, NOT a full combination matrix. Each axis value traces to a
cited, dated source; anything I could not source is hedged (MEDIUM) or omitted, never invented. Seven sections,
each a ready `Row[]` to paste into `supabase/ingest/load-production-options.ts`.*

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. There is **no `line` field**,
so line/format info (backpack vs hobo, Reverse, One Handle, Belt Chain, the tote formats) is folded into `note`.

**Colour-naming camp per house — checked against the banked archive and stated up front (this is the moat):**
- **Chanel — does NOT name seasonal colours.** A seasonal colour has only a style code + a `[YY][letter]` season
  code, no official name (`seasonal-archive/chanel.md` §16-21, §112-125). So on the three Chanel bags here
  (Gabrielle, Deauville, Coco Handle) I seed **only the house-permanent palette — Black / Beige / White / Red /
  Navy** — and every seasonal colour is captured per-listing as descriptor + season code, never as a fake named
  option. Source: `chanel.md` + the Classic Flap / Boy / Reissue rows already in the loader (same regime).
- **Louis Vuitton — names its LEATHER-LINE colours officially; colour is a real choice only inside the leather
  line.** The primary axis is the LINE (canvas: Monogram / Damier Ebene / Damier Azur / Reverse; leather: Epi /
  Taurillon / Empreinte / Vernis). On the two **leather** LV bags here (**Capucines** = Taurillon, **Twist** = Epi)
  colour is the primary axis and **LV's colour names are official** — I seed the permanent named anchor (Noir) plus
  the standing named families, marked soft, and rotate the rest per-listing. On the **canvas** LV bag (**Bumbag**)
  the LINE is the model and colour only appears on the Empreinte leather line, Black anchor. Source:
  `seasonal-archive/louis-vuitton.md` §44-51 (models), §88-91 (Epi/Taurillon leathers), §105-146 (Epi/Empreinte
  named-colour archive), and the Speedy/Alma/Neverfull/OnTheGo/Métis rows already in the loader.
- **Gucci — does NOT name its colours.** House-confirmed descriptor families only (Black, Beige, Dusty Pink, etc.);
  the one genuine named house colour is Rosso Ancora, not seeded as a Blondie anchor. So the **Blondie** colour rows
  are DESCRIPTORS. Source: `seasonal-archive/gucci.md` §31, §55, §114 + `chrome-com-colors-2026.md`, encoded exactly
  like the GG Marmont / Jackie 1961 rows already in the loader.

New this run (2026-07-13, all free-tier Firecrawl, every search fed back for the 1-credit refund): Fashionphile
"A Chanel Gabrielle Hobo Size Guide" (Small/Medium/Large/Maxi) + luxbags + PurseBlog; Fashionphile "A Louis Vuitton
Capucines Size Guide" (Mini/BB/MM) + luxbags Capucines metric; official eu.louisvuitton.com Twist PM (M21119) + MM
(M21113) PDPs + PurseBlog Twist (Belt Chain Wallet); Fashionphile "A Chanel Deauville Size Guide" + luxbags +
miloura metric; official us/eu.louisvuitton.com Mini Bumbag Monogram (M82335) + Mini Bumbag Empreinte (M46917/
M12753) PDPs; gucci.com Blondie capsule + Farfetch mini Blondie shoulder (20 x 11.5 x 1.5 cm); Rebag "Size Guide:
Chanel Coco Top Handle" (Extra Mini/Mini/Small/Medium) + luxbags Coco Handle metric.

---

## STYLE 1 — Chanel Gabrielle (style_id 426)

Chanel, **colour-primary**. The Gabrielle (2017, named for Gabrielle "Coco" Chanel) is the hybrid **hobo**: a body
that mixes **aged calfskin + goatskin** (a smooth lower half + a quilted upper half), a curved base, and — the
signature — a **two-tone gold-and-silver interwoven chain**. Axes: **size** (Small / Medium / Large / Maxi — the
"Hobo" is the shape, not a size), **material** (aged-calfskin/goatskin mixed quilt default + tweed/seasonal),
**construction** (the Gabrielle's distinctive quilt), **hardware** (the two-tone chain), **colour** (Chanel
permanent anchors only).

```ts
// Chanel Gabrielle (style 426), archivist-sourced 2026-07-13 (Fashionphile "A Chanel Gabrielle Hobo Size Guide" =
// Small 8 x 6.5 x 3.25 in / ~20 x 16.5 x 8 cm, Medium 11 x 9 x 4 in / ~28 x 23 x 10 cm, Large 12 x 10.5 x 4 in /
// ~30.5 x 26.5 x 10 cm, Maxi 13.25 x 12.75 x 4.25 in / ~33.5 x 32.5 x 11 cm; luxbags gives a smaller "Medium" at
// 25 x 19.5 x 8.5 cm — reseller measuring variance, noted; PurseBlog "Ultimate Bag Guide: Gabrielle" for the model).
// The Gabrielle body is a HYBRID: aged calfskin + goatskin, a smooth lower half + a quilted upper half; the
// signature is the TWO-TONE gold-AND-silver interwoven chain (a real noted feature). Chanel does NOT name seasonal
// colours (chanel.md §16-21) — seed the permanent palette only, seasonals captured per-listing. Size × material ×
// construction × hardware × colour. cm converted from inches. The "Hobo" is the shape (there is also a Gabrielle
// Backpack, a separate style) — NOT seeded as a size.
const CHANEL_GABRIELLE: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~20 x 16.5 x 8 cm (Fashionphile 8 x 6.5 x 3.25 in); the compact everyday Gabrielle Hobo, most produced/most cross-shopped", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~28 x 23 x 10 cm (Fashionphile 11 x 9 x 4 in; luxbags labels a smaller 25 x 19.5 x 8.5 cm 'Medium' — reseller variance); the roomier hobo", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~30.5 x 26.5 x 10 cm (Fashionphile 12 x 10.5 x 4 in); the large hobo, scarcer", sort_order: 3 },
  { axis: "size", value: "Maxi", permanence: "seasonal", note: "~33.5 x 32.5 x 11 cm (Fashionphile 13.25 x 12.75 x 4.25 in); the oversized hobo, least common (permanence soft)", sort_order: 4 },
  { axis: "material", value: "Aged Calfskin / Goatskin", permanence: "permanent", is_default: true, note: "the signature hybrid body: aged calfskin + goatskin, a smooth lower half + a quilted upper half; the classic Gabrielle surface", sort_order: 1 },
  { axis: "material", value: "Tweed", permanence: "seasonal", note: "seasonal tweed body", sort_order: 2 },
  { axis: "material", value: "Denim", permanence: "seasonal", note: "seasonal denim runs", sort_order: 3 },
  { axis: "material", value: "Sequin / Embellished", permanence: "seasonal", note: "sequined / embroidered / printed seasonal editions, per-listing", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / lizard, historic limited runs", sort_order: 5 },
  { axis: "construction", value: "Quilted", permanence: "permanent", is_default: true, note: "the Gabrielle's distinctive elongated/curved diamond quilt across the upper body (paired with the smooth lower half)", sort_order: 1 },
  { axis: "hardware", value: "Two-tone (gold + silver)", permanence: "permanent", is_default: true, note: "the signature interwoven gold-AND-silver chain — a genuine defining Gabrielle feature", sort_order: 1 },
  { axis: "hardware", value: "Aged Gold", permanence: "seasonal", note: "single-tone aged/antique-gold chain on some seasonal colorways", sort_order: 2 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark/ruthenium chain on some seasonal colorways", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black + two-tone chain = the reference Gabrielle", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry→bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];
```

**Sourcing note (Chanel Gabrielle).** Model from `chanel.md` + PurseBlog's "Ultimate Bag Guide: Gabrielle": the
Gabrielle (2017) is the hybrid **hobo** whose body mixes **aged calfskin and goatskin** (a smooth lower half + a
quilted upper half), with the **two-tone gold-and-silver interwoven chain** as its signature. Sizes/cm this run:
**Fashionphile's "A Chanel Gabrielle Hobo Size Guide"** (captured 2026-07-13) gives **Small 8 x 6.5 x 3.25 in
(~20 x 16.5 x 8 cm), Medium 11 x 9 x 4 in (~28 x 23 x 10 cm), Large 12 x 10.5 x 4 in (~30.5 x 26.5 x 10 cm), Maxi
13.25 x 12.75 x 4.25 in**; **luxbags** labels a smaller "Medium" at 25 x 19.5 x 8.5 cm (reseller measuring variance,
noted inline). **The colour rule is Chanel's** (`chanel.md` §16-21): no official seasonal colour names, so only the
house-permanent palette (Black/Beige/White/Red/Navy) is seeded and seasonals are captured per-listing. **Defaults:**
size **Small** (most produced/cross-shopped); material **Aged Calfskin/Goatskin**; construction **Quilted**;
hardware **Two-tone**; colour **Black**. **MEDIUM, hold these:** (1) **Maxi permanence** soft (seeded seasonal — the
scarcest size). (2) reseller **"Medium" cm variance** (Fashionphile vs luxbags) noted, not resolved into a phantom
size. **Deliberately omitted, sourced:** the brief's fourth size **"Hobo"** is the **shape of the whole line**, not a
size — folded into the header, not seeded; the **Gabrielle Backpack** is a separate style, not a size; **no invented
seasonal colour names**.

---

## STYLE 2 — LV Capucines (style_id 436)

Louis Vuitton, **LEATHER, colour-primary**. The Capucines (2013, named for Rue Neuve des Capucines, LV's first
address) is the top-handle leather flap built in **Taurillon** calf, with the **LV-flower clasp** that flips to
reveal or hide the monogram (fixed). Axes: **size** (Mini / BB / MM / GM), **material** (Taurillon smooth default +
Taurillon grained + python/exotic), **colour** (LV NAMES its Capucines colours — Noir anchor + standing named
families). **No hardware axis** (the LV-flower clasp is fixed; finish tracks the colorway).

```ts
// LV Capucines (style 436), archivist-sourced 2026-07-13 (Fashionphile "A Louis Vuitton Capucines Size Guide" =
// Mini ~7.75 x 6.75 x 3 in / ~20 x 17 x 7.5 cm, BB ~10.25 x 7 x 3.5 in / ~26 x 18 x 9 cm, MM ~12.5 x 9.5 x 5 in /
// ~32 x 24 x 12.5 cm; luxbags Capucines guide gives Mini 21 x 14 x 8 cm — reseller variance on the Mini height,
// noted; model + Taurillon from louis-vuitton.com "The Capucines" + louis-vuitton.md §44, §90-91). LV LEATHER bag:
// colour is the primary axis and LV's colour names are OFFICIAL — Noir is the permanent anchor, the named families
// below are standing but marked soft (per-Capucines-colorway sourcing not done exhaustively this run), the rest
// rotate per-listing. The LV-flower clasp is FIXED (no hardware axis). Size × material × colour. cm converted from
// inches. GM is a real larger size but cm not cleanly pinned this run (hedged).
const LV_CAPUCINES: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 17 x 7.5 cm (Fashionphile 7.75 x 6.75 x 3 in; luxbags gives 21 x 14 x 8 cm — reseller variance); the compact crossbody Capucines", sort_order: 1 },
  { axis: "size", value: "BB", permanence: "permanent", note: "~26 x 18 x 9 cm (Fashionphile 10.25 x 7 x 3.5 in); the popular everyday size, co-most-loved (default vs MM is soft)", sort_order: 2 },
  { axis: "size", value: "MM", permanence: "permanent", is_default: true, note: "~32 x 24 x 12.5 cm (Fashionphile 12.5 x 9.5 x 5 in); the original 2013 reference proportion (BB is co-default on resale)", sort_order: 3 },
  { axis: "size", value: "GM", permanence: "seasonal", note: "the largest Capucines, less common; cm not cleanly sourced this run (MEDIUM)", sort_order: 4 },
  { axis: "material", value: "Taurillon Smooth", permanence: "permanent", is_default: true, note: "smooth Taurillon calfskin; the signature Capucines leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Taurillon Grained", permanence: "permanent", note: "the grained/pebbled Taurillon variant, same tier", sort_order: 2 },
  { axis: "material", value: "Python / Exotic", permanence: "seasonal", note: "python / crocodile / ostrich exotic editions, per-listing", sort_order: 3 },
  { axis: "material", value: "Seasonal / Embellished", permanence: "seasonal", note: "printed / studded / Artycapucines artist editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "LV names it 'Noir'; the anchor; LV's Capucines colour names are official", sort_order: 1 },
  { axis: "color", value: "Galet", permanence: "permanent", note: "LV's standing greige/taupe neutral (an official LV colour name); near-permanent (permanence soft)", sort_order: 2 },
  { axis: "color", value: "Scarlet", permanence: "permanent", note: "LV's recurring true-red (an official LV colour name); near-permanent (permanence soft)", sort_order: 3 },
  { axis: "color", value: "White", permanence: "permanent", note: "LV 'Neige'/off-white; a standing neutral (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Named seasonals (per-listing)", permanence: "seasonal", note: "LV's rotating named Capucines colours (official LV names) — captured per-listing, not seeded as invented anchors", sort_order: 5 },
];
```

**Sourcing note (LV Capucines).** Model + leather from `louis-vuitton.md` §44, §90-91 and louis-vuitton.com "The
Capucines": the Capucines (2013) is the Taurillon-calf top-handle flap with the flip **LV-flower clasp**. Sizes/cm
this run: **Fashionphile's "A Louis Vuitton Capucines Size Guide"** (captured 2026-07-13) gives **Mini ~7.75 x 6.75
x 3 in (~20 x 17 x 7.5 cm), BB ~10.25 x 7 x 3.5 in (~26 x 18 x 9 cm), MM ~12.5 x 9.5 x 5 in (~32 x 24 x 12.5 cm)**;
**luxbags** gives the **Mini at 21 x 14 x 8 cm** (reseller height variance, noted). **The colour rule is LV's** — the
Capucines is a **leather** bag, so colour is the primary axis and **LV names its Capucines colours officially**
(`louis-vuitton.md` §105): I seed **Noir** as the permanent anchor and **Galet / Scarlet / White (Neige)** as the
standing named families, with the rotating seasonals captured per-listing. **Defaults:** size **MM** (the original
2013 reference; **BB co-default** on resale, soft); material **Taurillon Smooth**; colour **Black/Noir**. **MEDIUM,
hold these:** (1) **GM cm** not cleanly sourced this run (seeded seasonal). (2) **MM-vs-BB default** is soft — BB is
arguably more cross-shopped now; MM chosen as the founding proportion. (3) **Galet/Scarlet/White permanence** soft —
these are LV's standing Capucines names but I did not per-colorway-date each this run, so they are marked soft. **No
hardware axis** — the LV-flower clasp is the fixed signature. **Deliberately omitted, sourced:** the rotating
seasonal Capucines colours are a single per-listing row, not invented anchors.

---

## STYLE 3 — LV Bumbag (style_id 445)

Louis Vuitton, **CANVAS-primary belt bag** — the LINE is the model, encoded like the Speedy/Neverfull/Alma canvas
pattern. The Bumbag (modern Monogram Bumbag, 2017) rode the late-2010s belt-bag revival; the current lineup centres
on the **Mini Bumbag**. Axes: **size** (Bumbag / Mini Bumbag), **material = the LINES** (Monogram default /
Empreinte / Reverse Monogram / Damier). **Colour = Empreinte only, Black anchor.** **No construction/hardware axis.**

```ts
// LV Bumbag (style 445), archivist-sourced 2026-07-13 (official Mini Bumbag PDPs: eu.louisvuitton.com Mini Bumbag
// Monogram M82335 = 17 x 12 x 9.5 cm; us.louisvuitton.com Mini Bumbag Monogram Empreinte M46917/M12753 = 6.7 x 4.7
// x 3.7 in / ~17 x 12 x 9.5 cm, in Black; model + line from louis-vuitton.md §51 [modern Monogram Bumbag, 2017]).
// LV canvas-primary belt bag: the LINE (Monogram default / Empreinte / Reverse / Damier) is the model; colour ONLY
// on the Empreinte leather line, Black anchor; canvas lines take no colour choice. NO construction/hardware axis
// (fixed gold-tone, fixed removable strap). Size = one core Bumbag + the Mini. cm from official PDPs (Mini); the
// original full-size Bumbag cm not cleanly sourced this run (hedged).
const LV_BUMBAG: Row[] = [
  { axis: "size", value: "Bumbag", permanence: "permanent", is_default: true, note: "the original full-size Monogram belt/waist bag (2017); the namesake reference; cm not cleanly sourced this run (MEDIUM)", sort_order: 1 },
  { axis: "size", value: "Mini Bumbag", permanence: "permanent", note: "17 x 12 x 9.5 cm (louisvuitton.com M82335, official); the compact current-core belt bag/crossbody", sort_order: 2 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the default line", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing leather line", sort_order: 2 },
  { axis: "material", value: "Monogram Reverse", permanence: "seasonal", note: "caramel/brown reverse-Monogram canvas; intermittent runs", sort_order: 3 },
  { axis: "material", value: "Damier", permanence: "seasonal", note: "Damier Ebene/Azur check; intermittent runs", sort_order: 4 },
  { axis: "material", value: "Seasonal Print", permanence: "seasonal", note: "seasonal Monogram-print / By-the-Pool / capsule editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir'; the anchor; canvas lines take no colour choice; other Empreinte colours rotate seasonally, captured per-listing", sort_order: 1 },
];
```

**Sourcing note (LV Bumbag).** Model + line from `louis-vuitton.md` §51 (modern Monogram Bumbag, 2017) and the LV
canvas-primary pattern already in the loader (Speedy/Neverfull/Alma): the LINE is the model, colour appears **only**
on the Empreinte leather line (Black anchor), and the canvas lines take no colour choice. Sizes/cm this run: the
**official eu.louisvuitton.com Mini Bumbag Monogram PDP (M82335)** gives **17 x 12 x 9.5 cm**, and the **official
us.louisvuitton.com Mini Bumbag Monogram Empreinte PDP (M46917 / M12753)** gives **6.7 x 4.7 x 3.7 in (~17 x 12 x
9.5 cm), in Black** — confirming both the Mini size and the Empreinte-Black colour anchor. **Defaults:** size
**Bumbag** (the namesake reference); material **Monogram**; colour **Black**. **MEDIUM, hold these:** (1) the
**original full-size Bumbag cm** were not cleanly sourced this run — it is seeded as the default reference but its
dimension is held (the Mini is the sourced/current-core size). If the catalog prefers a sourced default, flip the
default to **Mini Bumbag**. **Deliberately omitted, sourced:** **no construction/hardware axis** (fixed gold-tone,
fixed removable strap); **no colour rows beyond the Empreinte Black anchor** (canvas lines take no colour, matching
the loader's Speedy/Neverfull pattern).

---

## STYLE 4 — LV Twist (style_id 439)

Louis Vuitton, **LEATHER (Epi), colour-primary**. The Twist (2015) is the leather shoulder bag whose **LV clasp
physically twists to lock** (fixed signature), built in **Epi** calf. Axes: **size** (PM / MM / One Handle / Belt
Chain), **material** (Epi smooth default + Epi grained + lambskin + exotic), **colour** (LV NAMES its Epi colours —
Noir anchor + standing named families). **No hardware axis** (the twist-lock is fixed; finish tracks the colorway).

```ts
// LV Twist (style 439), archivist-sourced 2026-07-13 (official eu.louisvuitton.com Twist PM Epi M21119 = 19 x 15 x
// 9 cm + Twist MM Epi M21113 = 23 x 17 x 9.5 cm; PurseBlog "Ultimate Bag Guide: LV Twist" for the Belt Chain Wallet
// = 5.31 x 7.48 x 1.65 in; model + Epi from louis-vuitton.md §47, §88 [Twist 2015, Epi]). LV LEATHER bag: colour is
// the primary axis and LV names its Epi colours OFFICIALLY — Noir is the permanent anchor, the named families below
// are standing but soft (per-colorway dating not exhaustive this run), the rest rotate per-listing. The LV twist-
// lock is FIXED (no hardware axis). Size × material × colour. One Handle and Belt Chain are distinct formats folded
// into the size run per resale cross-shopping; One Handle cm not cleanly sourced this run (hedged).
const LV_TWIST: Row[] = [
  { axis: "size", value: "PM", permanence: "permanent", note: "19 x 15 x 9 cm (louisvuitton.com M21119, official); the compact Twist", sort_order: 1 },
  { axis: "size", value: "MM", permanence: "permanent", is_default: true, note: "23 x 17 x 9.5 cm (louisvuitton.com M21113, official); the reference/most cross-shopped Twist", sort_order: 2 },
  { axis: "size", value: "One Handle", permanence: "seasonal", note: "the single-top-handle Twist format (a distinct build on the same twist-lock); cm not cleanly sourced this run (MEDIUM)", sort_order: 3 },
  { axis: "size", value: "Belt Chain Wallet", permanence: "seasonal", note: "~13.5 x 19 x 4 cm (PurseBlog 5.31 x 7.48 x 1.65 in); the Twist-lock WOC/wallet-on-chain format", sort_order: 4 },
  { axis: "material", value: "Epi Smooth", permanence: "permanent", is_default: true, note: "smooth Epi calfskin; the signature Twist leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Epi Grained", permanence: "permanent", note: "the grained/textured Epi variant, same tier", sort_order: 2 },
  { axis: "material", value: "Lambskin", permanence: "seasonal", note: "quilted/Malletage lambskin seasonal runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "python / crocodile / studded / printed seasonal editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "LV names it 'Noir'; the permanent Epi anchor; LV's Epi colour names are official", sort_order: 1 },
  { axis: "color", value: "Rose", permanence: "seasonal", note: "LV's recurring pink (e.g. 'Rose Ballerine', an official Epi name); a standing bright, rotates", sort_order: 2 },
  { axis: "color", value: "Red", permanence: "seasonal", note: "LV's recurring Epi red (e.g. 'Coquelicot'/'Castilian Red', official names); rotates", sort_order: 3 },
  { axis: "color", value: "Named seasonals (per-listing)", permanence: "seasonal", note: "LV's deep rotating Epi colour range (official LV names, e.g. Cassis, Quetsche, Indigo) — captured per-listing, not seeded as invented anchors", sort_order: 4 },
];
```

**Sourcing note (LV Twist).** Model + leather from `louis-vuitton.md` §47, §88: the Twist (2015) is the Epi-calf
shoulder bag whose **LV clasp physically twists to lock** (the fixed signature). Sizes/cm this run: the **official
eu.louisvuitton.com Twist PM Epi PDP (M21119)** gives **19 x 15 x 9 cm** and the **Twist MM Epi PDP (M21113)** gives
**23 x 17 x 9.5 cm**; **PurseBlog's "Ultimate Bag Guide: LV Twist"** gives the **Belt Chain Wallet at 5.31 x 7.48 x
1.65 in (~13.5 x 19 x 4 cm)**. **The colour rule is LV's** — the Twist is a **leather (Epi)** bag, so colour is the
primary axis and **LV names its Epi colours officially** (`louis-vuitton.md` §129-141, the dated Epi named-colour
archive: Noir permanent + Cassis, Coquelicot, Rose Ballerine, Quetsche, Indigo, etc.): I seed **Noir** as the
permanent anchor and **Rose / Red** as the standing named brights (soft), with the rotating Epi range captured
per-listing. **Defaults:** size **MM** (the reference); material **Epi Smooth**; colour **Black/Noir**. **MEDIUM,
hold these:** (1) **One Handle cm** not cleanly sourced this run (seeded seasonal). (2) **Rose/Red permanence** soft
— LV's Epi brights rotate; only Noir is the permanent Epi core (`louis-vuitton.md` §133). **No hardware axis** — the
twist-lock is the fixed signature. **Deliberately omitted, sourced:** the deep rotating Epi range is a single
per-listing row, not invented anchors; the **Twist One Handle** and **Belt Chain Wallet** are folded into the size
run as distinct formats (resellers cross-shop them under Twist), not seeded as separate models.

---

## STYLE 5 — Chanel Deauville (style_id 429)

Chanel, **colour-primary CANVAS tote**. The Deauville (2012, named for the French seaside town) is the sporty
open/zip tote in **mixed-fibre grosgrain canvas** with leather trim, the interlocking **CC** on the front, and
chain-and-leather handles. Axes: **size** (Mini / Small / Medium / Large), **material** (grosgrain/canvas body
default + velvet/mixed-fibre + denim/wool seasonal), **colour** (Chanel permanent anchors only). **No
construction/hardware axis** (canvas tote, fixed handles).

```ts
// Chanel Deauville (style 429), archivist-sourced 2026-07-13 (Fashionphile "A Chanel Deauville Size Guide" = Mini
// 10 x 10.25 x 4.5 in / ~25.5 x 26 x 11.5 cm, Medium 15.2 x 11.5 x 8 in / ~38.5 x 29 x 20.5 cm, Large 17.2 x 12.5
// x 8.5 in / ~44 x 32 x 21.5 cm; luxbags Small 34.3 x 26.7 x 16.5 cm; miloura metric Mini 26x26x12 / Small 41x26x17
// / Large 50x30x22 — reseller variance on the largest, noted; model = the 2012 mixed-fibre grosgrain CC-logo tote).
// Chanel does NOT name seasonal colours (chanel.md §16-21) — seed the permanent palette only (the Deauville's
// classic Black/Beige/Navy/Red canvas + the CC print), seasonals captured per-listing. Size × material × colour.
// NO construction/hardware axis. cm converted from inches; reseller size labels vary (a "XL" tag is the Large
// relabelled — folded in, not seeded as a separate size).
const CHANEL_DEAUVILLE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~25.5 x 26 x 11.5 cm (Fashionphile 10 x 10.25 x 4.5 in); the small vertical Deauville", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~34 x 27 x 16.5 cm (luxbags 34.3 x 26.7 x 16.5 cm); the compact everyday tote", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~38.5 x 29 x 20.5 cm (Fashionphile 15.2 x 11.5 x 8 in); the reference Deauville tote, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~44 x 32 x 21.5 cm (Fashionphile 17.2 x 12.5 x 8.5 in; miloura gives 50 x 30 x 22 cm); the beach carryall (resellers also label it 'XL')", sort_order: 4 },
  { axis: "material", value: "Grosgrain Canvas", permanence: "permanent", is_default: true, note: "the signature mixed-fibre grosgrain canvas body with leather trim + the CC print; the classic Deauville surface", sort_order: 1 },
  { axis: "material", value: "Velvet / Mixed-fibre", permanence: "seasonal", note: "velvet or other mixed-fibre seasonal bodies", sort_order: 2 },
  { axis: "material", value: "Denim / Wool", permanence: "seasonal", note: "seasonal denim / wool / printed canvas runs, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black canvas + CC + black leather trim = the reference Deauville", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "beige/ecru canvas, a standing Deauville neutral", sort_order: 2 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "navy canvas, near-permanent, returns most years", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "red canvas, a recurring statement Deauville", sort_order: 4 },
  { axis: "color", value: "White", permanence: "permanent", note: "white/ivory canvas, a standing summer neutral", sort_order: 5 },
];
```

**Sourcing note (Chanel Deauville).** Model from `chanel.md` + the reseller guides: the Deauville (2012) is Chanel's
sporty **mixed-fibre grosgrain canvas** tote with leather trim and the front **CC** logo. Sizes/cm this run:
**Fashionphile's "A Chanel Deauville Size Guide"** (captured 2026-07-13) gives **Mini 10 x 10.25 x 4.5 in (~25.5 x
26 x 11.5 cm), Medium 15.2 x 11.5 x 8 in (~38.5 x 29 x 20.5 cm), Large 17.2 x 12.5 x 8.5 in (~44 x 32 x 21.5 cm)**;
**luxbags** gives the **Small at 34.3 x 26.7 x 16.5 cm**; **miloura** gives metric Mini 26 x 26 x 12 / Small 41 x 26
x 17 / Large 50 x 30 x 22 (reseller variance on the largest, noted). **The colour rule is Chanel's** (`chanel.md`
§16-21): no official seasonal colour names, so only the house-permanent palette (Black/Beige/Navy/Red/White canvas)
is seeded and seasonals are captured per-listing. **Defaults:** size **Medium** (the reference tote); material
**Grosgrain Canvas**; colour **Black**. **MEDIUM, hold these:** (1) **largest-size cm variance** (Fashionphile ~44
cm vs miloura 50 cm) noted, not resolved. (2) a reseller **"XL"** label is the **Large relabelled** — folded into
the Large row, not seeded as a phantom fifth size. **Deliberately omitted, sourced:** **no construction/hardware
axis** (canvas tote, fixed chain-and-leather handles); **no invented seasonal colour names** — the Deauville's
seasonal canvas colours (and print variants) are captured per-listing.

---

## STYLE 6 — Gucci Blondie (style_id 453)

Gucci, **descriptor colours**. The Blondie (2022, Michele) is the round **Interlocking-G-medallion** line — the G
emblem patented 1971, relaunched across a family of formats. Axes: **size/format** (Mini / Small / Medium / Camera /
Top Handle / Tote), **material** (leather default + GG Supreme canvas + suede/seasonal), **colour** (DESCRIPTORS —
Gucci does not name its colours). **No hardware axis** (the round GG emblem is the fixed gold-tone signature).

```ts
// Gucci Blondie (style 453), archivist-sourced 2026-07-13 (gucci.com "GUCCI Blondie Handbag Collection" capsule =
// Shoulder Bags / Tote Bags / Backpacks & Belt Bags / Top Handle Bags in diverse leathers; Farfetch "Gucci mini
// Blondie shoulder bag" = 20 x 11.5 x 1.5 cm; eBay Blondie Small Shoulder ~20 cm; model = round Interlocking-G
// medallion, G emblem patented 1971, relaunched as the Blondie line 2022, from gucci.md §55 [high]). GUCCI DOES NOT
// NAME its colours (gucci.md §31, §114; chrome-com-colors-2026.md) — DESCRIPTOR families only. The round GG emblem
// is the fixed gold-tone signature (no hardware axis; finish tracks the colorway). Size/format × material × colour.
// The Blondie is a FAMILY of formats (shoulder, camera, top handle, tote) — folded into the size run per resale
// cross-shopping; cm sourced only for the mini/small shoulder this run, the rest hedged.
const GUCCI_BLONDIE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 11.5 x 1.5 cm (Farfetch mini Blondie shoulder); the small flat shoulder/crossbody Blondie", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~20 cm wide (eBay Blondie Small Shoulder); the reference shoulder Blondie, most cross-shopped (cm approx.)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "seasonal", note: "the larger shoulder Blondie; cm not cleanly sourced this run (MEDIUM)", sort_order: 3 },
  { axis: "size", value: "Camera", permanence: "permanent", note: "the Blondie camera-bag format (round GG on a boxy zip body); cm not cleanly sourced this run (MEDIUM)", sort_order: 4 },
  { axis: "size", value: "Top Handle", permanence: "permanent", note: "the Blondie top-handle format; cm not cleanly sourced this run (MEDIUM)", sort_order: 5 },
  { axis: "size", value: "Tote", permanence: "seasonal", note: "the Blondie tote format; cm not cleanly sourced this run (MEDIUM)", sort_order: 6 },
  { axis: "material", value: "Leather", permanence: "permanent", is_default: true, note: "supple/smooth calfskin with the round Interlocking-G medallion; the signature Blondie surface", sort_order: 1 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", note: "beige/ebony GG Supreme coated canvas with leather trim; the logo Blondie", sort_order: 2 },
  { axis: "material", value: "Suede / Seasonal", permanence: "seasonal", note: "suede / printed / embellished seasonal editions, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude-leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring light-pink Blondie (descriptor); near-permanent (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Gucci Blondie).** Model from `gucci.md` §55 (high confidence): the Blondie (2022, Michele) is the
round **Interlocking-G medallion** line — the G emblem patented **1971**, relaunched across a family of formats.
Scope + sizes this run: **gucci.com's "GUCCI Blondie Handbag Collection"** capsule (captured 2026-07-13) confirms the
family — **Shoulder Bags, Tote Bags, Backpacks & Belt Bags, Top Handle Bags** in "diverse leathers"; **Farfetch's
"Gucci mini Blondie shoulder bag"** gives **20 x 11.5 x 1.5 cm**; **eBay's "Gucci Blondie Small Shoulder"** listings
put the small shoulder at **~20 cm** wide. **The colour rule is Gucci's** (`gucci.md` §31, §114 +
`chrome-com-colors-2026.md`): **Gucci does not name its colours** — descriptor families only (the one genuine named
house colour, Rosso Ancora, is not seeded as a Blondie anchor). **Defaults:** size **Small** (the reference
shoulder); material **Leather**; colour **Black**. **MEDIUM, hold these:** (1) the Blondie is a **family of formats**
(shoulder / camera / top handle / tote / bucket-cylinder) that I fold into the size run per resale cross-shopping —
only the mini/small **shoulder** cm are sourced this run; **Medium / Camera / Top Handle / Tote cm are held**
(hedged), not invented. (2) **Red/Pink permanence** soft — recurring descriptor families. **Deliberately omitted,
sourced:** **no hardware axis** (the round gold-tone GG emblem is the fixed signature; finish tracks the colorway);
**no house colour names** (Gucci descriptor rule); the Blondie **bucket/cylinder** and **card-case-on-chain** are
captured per-listing, not seeded as core sizes.

---

## STYLE 7 — Chanel Coco Handle (style_id 428)

Chanel, **colour-primary**. The Coco Handle (2015) is the diamond-quilted flap with a **top handle** — and the
signature detail is that the **top handle is often python** (dyed to match the body). Axes: **size** (Mini / Small /
Medium), **material** (Caviar default / Lambskin quilted + tweed/exotic; the python top-handle is a signature),
**colour** (Chanel permanent anchors only).

```ts
// Chanel Coco Handle (style 428), archivist-sourced 2026-07-13 (Rebag "Size Guide: Chanel Coco Top Handle" = the
// run Extra Mini / Mini / Small / Medium, Mini 9 x 6 x 3.5 in / ~23 x 15 x 9 cm; luxbags "Complete Size Guide to
// Chanel Coco Handle" = Medium ~29 x 18 x 12 cm / 11.4 x 7.1 x 4.7 in; model = the 2015 diamond-quilted top-handle
// flap). SIGNATURE: the top handle is often PYTHON, dyed to match the body (a real noted feature). Chanel does NOT
// name seasonal colours (chanel.md §16-21) — seed the permanent palette only, seasonals captured per-listing.
// Size × material × colour. cm converted from inches / approximate. Rebag also lists an Extra Mini below the Mini;
// the core resale run is Mini/Small/Medium (Small is the classic), so Extra Mini is folded into the Mini note.
const CHANEL_COCO_HANDLE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~23 x 15 x 9 cm (Rebag 9 x 6 x 3.5 in); the small top-handle flap (Rebag also lists a rarer 'Extra Mini' below it)", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~24 x 15 x 10 cm (the classic Coco Handle, '7 diamonds across'); the reference/most cross-shopped size (cm approx.)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~29 x 18 x 12 cm (luxbags 11.4 x 7.1 x 4.7 in); the roomier top-handle flap", sort_order: 3 },
  { axis: "material", value: "Caviar", permanence: "permanent", is_default: true, note: "grained caviar calfskin, diamond-quilted, holds shape; the classic Coco Handle surface", sort_order: 1 },
  { axis: "material", value: "Lambskin", permanence: "permanent", note: "smooth quilted lambskin, more delicate", sort_order: 2 },
  { axis: "material", value: "Python Handle / Exotic", permanence: "seasonal", note: "the signature python top handle (often dyed to match) + full-exotic python/lizard editions, per-listing", sort_order: 3 },
  { axis: "material", value: "Tweed", permanence: "seasonal", note: "seasonal tweed body", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black caviar + the (often python) top handle = the reference Coco Handle", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry→bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];
```

**Sourcing note (Chanel Coco Handle).** Model from `chanel.md` + the reseller guides: the Coco Handle (2015) is the
diamond-quilted flap with a **top handle**, and its signature detail is the **python top handle** (frequently dyed
to match the body). Sizes/cm this run: **Rebag's "Size Guide: Chanel Coco Top Handle"** (captured 2026-07-13) gives
the run **Extra Mini / Mini / Small / Medium**, with the **Mini at 9 x 6 x 3.5 in (~23 x 15 x 9 cm)**; **luxbags's
"Complete Size Guide to Chanel Coco Handle"** gives the **Medium at ~29 x 18 x 12 cm (11.4 x 7.1 x 4.7 in)**. **The
colour rule is Chanel's** (`chanel.md` §16-21): no official seasonal colour names, so only the house-permanent
palette (Black/Beige/White/Red/Navy) is seeded and seasonals are captured per-listing. **Defaults:** size **Small**
(the classic Coco Handle, most cross-shopped); material **Caviar**; colour **Black**. **MEDIUM, hold these:** (1)
**Small cm** are approximate (the guides lead with Mini/Medium metric); flagged. (2) Rebag's **"Extra Mini"** is a
rarer size below the Mini — folded into the Mini note rather than seeded as a phantom fourth core size. (3) the
**python top handle** is seeded within the material axis (it is a leather/handle feature, not a hardware tone) with
the note that it is a signature detail. **Deliberately omitted, sourced:** **no separate hardware axis** (the brief
scopes Coco Handle to size/material/colour; the chain-and-leather strap hardware tone tracks the colorway,
per-listing); **no invented seasonal colour names**.

---

## Two things to wire when you paste

1. Register all seven in the `STYLES` array (style_ids confirmed from the brief; **re-confirm against the `style`
   table before writing**):
   `{ styleId: 426, name: "Gabrielle", rows: CHANEL_GABRIELLE }`,
   `{ styleId: 436, name: "Capucines", rows: LV_CAPUCINES }`,
   `{ styleId: 445, name: "Bumbag", rows: LV_BUMBAG }`,
   `{ styleId: 439, name: "Twist", rows: LV_TWIST }`,
   `{ styleId: 429, name: "Deauville", rows: CHANEL_DEAUVILLE }`,
   `{ styleId: 453, name: "Blondie", rows: GUCCI_BLONDIE }`,
   `{ styleId: 428, name: "Coco Handle", rows: CHANEL_COCO_HANDLE }`.
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; gabrielle-capucines-bumbag-twist-deauville-blondie-cocohandle-production-matrix.md"` so the provenance string
   stays honest.
