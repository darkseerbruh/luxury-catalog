# Gucci Ophidia + Celine Triomphe + Celine Luggage + Coach Tabby + Gucci Soho Disco + YSL Sac de Jour + Prada Re-Edition 2005 — production matrices (selector seed)

*Archivist run 2026-07-13. Same shape and rigor as `rockstud-kate-jodie-puzzle-bamboo-city-antigona-production-matrix.md`
and `kelly-woc-saddle-chanel19-dionysus-horsebit-production-matrix.md`: one reviewed source-of-truth list per
style, NOT a full combination matrix. Each axis value traces to a cited, dated source; anything I could not
source is hedged (MEDIUM) or omitted, never invented. Seven sections, each a ready `Row[]` to paste into
`load-production-options.ts`.*

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. There is no `line` field,
so sub-line/format info (Boston vs dome vs shoulder, Pillow Tabby, Re-Edition 2000/1995) is folded into `note`.

**Colour-naming camp per house — checked against the banked archive and stated up front (this is the moat):**
- **Gucci — does NOT name its colours (descriptors only).** Confirmed for both Ophidia and Soho Disco. The lone
  genuinely-named Gucci house colour is Rosso Ancora (De Sarno SS2024), not a staple of either bag. Source:
  `seasonal-archive/chrome-com-colors-2026.md` (Chrome capture of gucci.com, 2026-06-28) + `gucci.md`.
- **Celine — does NOT name its colours (descriptors only).** Confirmed for both the Triomphe and the Luggage.
  Celine's naming weight sits on the **model + the material/motif** (Triomphe clasp/canvas, grained "Drummed"
  calf), not a per-season colour lexicon; the one place a colour name carries any weight is the signature
  **Tan / Camel** neutral. Firmly in the Dior/Gucci/YSL camp. Source: `seasonal-archive/celine.md` §37 + `.jsonl`.
- **Coach — NOT in the banked archive; descriptor by product-page convention (stated, lightly hedged).** Coach
  labels colours as **plain descriptors** (Black, Chalk, Wine, Brass, etc.) + a numbered/named size, the way the
  Farfetch Coach guide and coach.com read. That descriptor convention is well-established and visible, so this is
  a **sourced-by-convention** call, not a blind default — but Coach is not yet a banked archive house, so re-camp
  if a Coach colour-lexicon source ever surfaces. Source: Farfetch "The Ultimate Guide to Coach Bags" (2021,
  captured 2026-07-13).
- **Saint Laurent (YSL) — names permanents as plain DESCRIPTORS only** (Noir/Blanc/Rouge/Dark Beige); the
  **hardware tone (gold vs silver) is the axis that carries the naming weight**. Established prior runs; the Sac
  de Jour is a metal-hardware bag (the padlock + hardware finish), so the tone axis applies. Source:
  `seasonal-archive/saint-laurent.md` §3 + §136 (hardware-tone axis).
- **Prada — does NOT name its colours (descriptors, confirmed).** Prada's naming weight sits on the **model +
  the material (nylon/Re-Nylon vs Saffiano) + the archive year** (Re-Edition 2005 vs 2000 vs 1995), not a
  per-season colour dictionary; colours read as plain descriptors, with the occasional Italian descriptor word
  (Rosa = pink, Cammeo = nude/beige). Source: `seasonal-archive/prada.md` §40 + `.jsonl`.

New this run (2026-07-13, all free-tier Firecrawl, every search fed back for the 1-credit refund): gucci.com
official Ophidia Small shoulder PDP + apartstyle "Ophidia Mini vs Small" for Ophidia cm; celine.com official
Teen Triomphe PDP + luxbags.fr "Celine Triomphe Size Guide" for Triomphe cm; Rebag "The Size Guide: Celine
Luggage and Phantom" + PurseBlog + luxbags.fr for Luggage Nano/Micro/Mini cm; Farfetch "The Ultimate Guide to
Coach Bags" for the Tabby cm; an eBay Soho Disco listing (W19cm) for the Disco; Fashionphile "A Saint Laurent
Sac de Jour Size Guide" (five sizes) + Farfetch + luxbags.fr for Sac de Jour cm; prada.com official Re-Edition
2005 Re-Nylon PDP (22 x 18 x 6 cm) + Farfetch for the Re-Edition.

---

## STYLE 1 — Gucci Ophidia (style_id 448)

Gucci, faceted **size × material × colour**, **DESCRIPTOR colours only** (Gucci does not name). The Ophidia is
Michele's **Cruise 2018** GG Supreme line defined by the **green-red-green Web stripe** and the **Tom Ford-era
oval Double-G** pin closure. Axes: **size** (Super Mini / Mini / Small / Medium, across the shoulder/dome/tote
formats), **material** (GG Supreme canvas default — the Web-stripe logo bag — + leather), and **colour**
(descriptor anchors). The **Double-G + Web stripe** are fixed, no hardware axis.

```ts
// Gucci Ophidia (style 448), archivist-sourced 2026-07-13 (gucci.com official "Ophidia Small Rounded Top
// Shoulder Bag" PDP for the Small shoulder cm + apartstyle "Gucci Ophidia Mini vs. Small" for Mini/Small dims;
// model = Michele's Cruise 2018 GG Supreme Web-stripe line with the Tom Ford-era oval Double-G pin closure,
// from seasonal-archive/gucci.md + gucci.jsonl; colour from chrome-com-colors-2026.md — GUCCI DOES NOT NAME
// ITS COLOURS, descriptors only). Faceted size × material × colour. The GG Supreme canvas + Web stripe is the
// signature (the Web-stripe logo bag); leather is the alternate. The Boston (barrel/dome), boston-mini, and
// open-tote formats are folded into notes, seeded on the shoulder/tote size run. Colour anchors are DESCRIPTORS.
// NO hardware axis (the Double-G pin + Web stripe are fixed). cm approximate (converted from inches).
const GUCCI_OPHIDIA: Row[] = [
  { axis: "size", value: "Super Mini", permanence: "seasonal", note: "~17 x 12 x 6 cm; the micro GG shoulder/belt-bag scale, recent addition (cm approximate)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 15 x 8 cm (apartstyle ~7-8 x 5-6 x 3-4 in); the popular dome GG mini shoulder/chain bag", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~23.5 x 19 x 8 cm (gucci.com Small Rounded Top Shoulder 9.3 x 7.5 x 3.1 in); the reference Ophidia, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~30 cm; the larger shoulder/tote proportion; the GG Supreme tote + Boston barrel run here (MEDIUM: cm not cleanly pinned this run)", sort_order: 4 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", is_default: true, note: "beige/ebony coated GG Supreme canvas with the green-red-green Web stripe; the signature Web-stripe logo Ophidia", sort_order: 1 },
  { axis: "material", value: "Leather", permanence: "permanent", note: "smooth/pebbled calfskin; the polished all-leather Ophidia, the colour-bearing surface", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Print", permanence: "seasonal", note: "python / GG print / Rosso Ancora + collab (adidas, Disney) editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory leather; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
];
```

**Sourcing note (Gucci Ophidia).** Model + history from the banked `seasonal-archive/gucci.md`/`.jsonl` (high
confidence, Vogue): the Ophidia is Alessandro Michele's **Cruise 2018** GG Supreme line, defined by the
**green-red-green Web stripe** (a reinterpretation of the equestrian girth strap, first seen early 1950s) and
the vintage **Tom Ford-era oval Double-G** pin closure; it runs as boxy totes, a **mini shoulder** (dome), and
the **Boston** barrel. Sizes/cm this run: **gucci.com's official "Ophidia Small Rounded Top Shoulder Bag" PDP**
(captured 2026-07-13) gives the **Small shoulder at 9.3 x 7.5 x 3.1 in (~23.5 x 19 x 8 cm)**; **apartstyle's
"Gucci Ophidia Mini vs. Small"** gives the **Mini at ~7-8 x 5-6 x 3-4 in** and the **Small at ~10-11 x 7-8 x
4-5 in**; a **Super Mini** shoulder shows up on reseller/YouTube references. **The colour rule is the
load-bearing Gucci fact:** `chrome-com-colors-2026.md` house-confirms Gucci labels colours as **plain
descriptors + material**, so the four colour rows are **descriptor anchors, explicitly not house names**.
**Defaults:** size **Small** (the reference shoulder); material **GG Supreme Canvas** (the Web-stripe signature);
colour **Black**. **MEDIUM, hold these:** (1) **Medium cm** are not cleanly pinned this run (the GG Supreme tote
and the Boston barrel both sit in the larger tier); flagged. (2) **Super Mini** is a recent micro size, seeded
seasonal, cm approximate. (3) **Red permanence** — a recurring descriptor family, flagged soft. **Deliberately
omitted, sourced:** **no hardware axis** — the **Double-G pin closure** and the **Web stripe** are the fixed
signatures (finish tracks the colorway); the **dome/Boston/tote formats** are folded into the size run's notes
(resellers cross-shop Ophidia by size, not by format) rather than seeded as a phantom axis.

---

## STYLE 2 — Celine Triomphe (style_id 206)

Celine, **model + material-primary**, **DESCRIPTOR colours** (Celine does not name). The Triomphe is the
Slimane-era box bag closed by the enlarged **Triomphe clasp** (the double-C from the chains around the Arc de
Triomphe, a **1970s** Celine archive motif Slimane enlarged and de-linked, debuted on the **Spring 2019**
runway). Axes: **size** (Mini / Teen / Small / Medium + the Triomphe Shoulder), **material** (smooth "shiny"
calf default + Triomphe Canvas + textile + croc-embossed), and **colour** (descriptor anchors — Tan/Black/White).
The **Triomphe clasp** is fixed.

```ts
// Celine Triomphe (style 206), archivist-sourced 2026-07-13 (celine.com official "Teen Triomphe Bag in shiny
// calfskin" PDP for the Teen cm + luxbags.fr "Celine Triomphe Size Guide: Mini, Small, and Medium" for Mini/
// Medium cm + celine.com Triomphe PLP for the size run; model = the box bag with the enlarged Triomphe clasp,
// Spring 2019 runway, Slimane; clasp = a 1970s archive motif, Triomphe Canvas monogram "first revealed 1972,"
// from seasonal-archive/celine.md + celine.jsonl). COLOUR = DESCRIPTOR (Celine does NOT name its colours, same
// camp as Dior/Gucci/YSL; the one weighty colour is the signature Tan/Camel). Size × material × colour. The
// Triomphe clasp is fixed (no hardware axis). Besace is a SEPARATE model, not a Triomphe size (noted). cm from
// the official PDP + reseller guide.
const CELINE_TRIOMPHE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~8 x 11 cm face (luxbags H8 x W11 cm); the tiny chain/crossbody Triomphe, the evening/entry size", sort_order: 1 },
  { axis: "size", value: "Teen", permanence: "permanent", is_default: true, note: "18.5 x 13.5 x 7 cm (celine.com official, shiny calfskin); the smallest box size, the most popular of the series, most liquid on resale", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", note: "the mid box Triomphe (celine.com PLP size), between Teen and Medium (MEDIUM: cm not cleanly pinned this run)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~16.5 x 22.5 cm face (luxbags H16.5 x W22.5 cm); the roomier box Triomphe", sort_order: 4 },
  { axis: "size", value: "Triomphe Shoulder", permanence: "permanent", note: "the elongated soft Shoulder Triomphe (a distinct format on the same clasp); celine.com PLP lists it alongside the box sizes", sort_order: 5 },
  { axis: "material", value: "Shiny Calfskin", permanence: "permanent", is_default: true, note: "smooth 'shiny'/polished calfskin; the classic box Triomphe leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Triomphe Canvas", permanence: "permanent", note: "the coated-canvas Triomphe-link monogram (revived 1972 motif), trimmed in calfskin (e.g. Tan); a co-signature surface", sort_order: 2 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "pebbled/grained 'Drummed' calfskin; sturdier", sort_order: 3 },
  { axis: "material", value: "Textile / Denim", permanence: "seasonal", note: "textile, denim, or seasonal fabric bodies, per-listing", sort_order: 4 },
  { axis: "material", value: "Croc-Embossed / Exotic", permanence: "seasonal", note: "croc-embossed calfskin or exotic editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; plain descriptor (Celine does not name its colours)", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "Celine's signature Tan/Camel neutral (the one weighty Celine colour); descriptor, esp. on Triomphe Canvas trim", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. Natural/off-white; descriptor", sort_order: 3 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "the recurring tan-brown/tobacco family; descriptor (permanence soft)", sort_order: 4 },
];
```

**Sourcing note (Celine Triomphe).** Model from the banked `seasonal-archive/celine.md`/`.jsonl` (high
confidence, PurseBlog + a+ Singapore + celine.com copy): the Triomphe is the **Slimane-era** box bag finished
with the enlarged **Triomphe clasp** (the double-C inspired by and named after the **chains around the Arc de
Triomphe**, a **1970s** Celine archive motif Slimane enlarged and de-linked); the line **debuted on the Spring
2019 runway** (Classique first) and expanded to **Teen / Mini / Shoulder / Chain Shoulder / WOC**; the Triomphe
Canvas is the coated-canvas monogram "**first revealed in 1972**." Sizes/cm this run: **celine.com's official
Teen Triomphe PDP** (captured 2026-07-13) gives the **Teen at 18.5 x 13.5 x 7 cm** in shiny calfskin;
**luxbags.fr's "Celine Triomphe Size Guide"** gives the **Mini at H8 x W11 cm** and the **Medium at H16.5 x
W22.5 cm**; and **celine.com's Triomphe PLP** lists the current run as **Small / Medium / Teen** (+ a new "26")
alongside the **Shoulder Triomphe**. **The colour rule:** `celine.md` §37 — Celine does **not** publish a
per-season colour dictionary (the Dior/Gucci/YSL pattern), colours are plain neutrals (Tan, Black, Camel,
Natural, White), and the only colour that carries weight is the signature **Tan/Camel**; so the colour rows are
**descriptor anchors**. **Defaults:** size **Teen** (the most popular / most liquid); material **Shiny
Calfskin**; colour **Black**. **MEDIUM, hold these:** (1) **Small cm** not cleanly pinned this run (the PLP
names it but luxbags leads with Mini/Medium); flagged. (2) **Brown permanence** — recurring descriptor family,
soft. **Deliberately omitted, sourced:** the **Besace** (the soft messenger), **Ava**, **16**, and **Cuir
Triomphe** are **separate models**, not Triomphe sizes (the brief floated "Besace" as a size — it is its own
bag, so a null beats false structure), captured per-listing; **no hardware axis** (the Triomphe clasp is the
fixed signature); **no invented seasonal colour names**.

---

## STYLE 3 — Celine Luggage Tote (style_id 484)

Celine, **model + material-primary**, **DESCRIPTOR colours** (Celine does not name). The Luggage is **Phoebe
Philo's** first It-bag (**Spring 2010**): the structured **winged** tote whose front zip reads as a face ("the
smile"), with rigid dual handles. **The whole Luggage line was discontinued March 2025** — it remains a heavily
resold heritage icon, so it is seeded for the selector with that fact flagged. Axes: **size** (Nano / Micro /
Mini / Medium + the open-top **Phantom** sister), **material** (smooth calf default — the colour-bearing — +
grained "Drummed" + suede + felt), and **colour** (descriptor anchors; the signature is Tan/Camel).

```ts
// Celine Luggage Tote (style 484), archivist-sourced 2026-07-13 (Rebag "The Size Guide: Celine Luggage and
// Phantom" + PurseBlog "The Ultimate Bag Guide: The Celine Luggage Tote" + luxbags.fr for Nano/Micro/Mini cm;
// model = Phoebe Philo's first It-bag, Spring 2010, the structured winged tote with the face-like front zip,
// from seasonal-archive/celine.md + celine.jsonl). WHOLE LINE DISCONTINUED MARCH 2025 (heritage resale icon,
// still seeded). COLOUR = DESCRIPTOR (Celine does NOT name its colours; the signature is Tan/Camel). Size ×
// material × colour. NB the size names are counter-intuitive: Nano < Micro < Mini (the "Mini" is the biggest of
// the three). Phantom is the open-top sister silhouette. NO hardware axis. cm converted from the reseller inch
// guides.
const CELINE_LUGGAGE: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~20 x 20 x 10 cm (8 x 8 x 4 in); the smallest winged Luggage, the crossbody-scale mini; whole line discontinued March 2025", sort_order: 1 },
  { axis: "size", value: "Micro", permanence: "permanent", is_default: true, note: "~26 x 26 x 15 cm (10 x 10 x 6 in); the most cross-shopped/most liquid Luggage size on resale (default vs Nano is soft)", sort_order: 2 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~30 x 30 x 17 cm (12 x 12 x 7 in); counter-intuitively the BIGGEST of the three core sizes (the 'Mini' is not the smallest)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger/original Luggage proportion, less common (MEDIUM: cm not cleanly pinned this run)", sort_order: 4 },
  { axis: "size", value: "Phantom", permanence: "permanent", note: "the open-top winged sister (no zip 'face', braided tassel zip); a distinct format on the winged silhouette, revived by Rider as the 'New Luggage' Printemps 2026", sort_order: 5 },
  { axis: "material", value: "Smooth Calfskin", permanence: "permanent", is_default: true, note: "smooth/polished calfskin; the classic colour-bearing Luggage surface", sort_order: 1 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "pebbled/grained 'Drummed' calfskin; the sturdier finish", sort_order: 2 },
  { axis: "material", value: "Suede / Nubuck", permanence: "seasonal", note: "suede or nubuck bodies + suede-wing contrast runs, per-listing", sort_order: 3 },
  { axis: "material", value: "Felt / Textile", permanence: "seasonal", note: "felt, wool, or textile-body seasonal editions, per-listing", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / croc / lizard limited runs, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; plain descriptor (Celine does not name its colours)", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "Celine's signature Tan/Camel neutral (the one weighty Celine colour); descriptor", sort_order: 2 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey/anthracite neutral; descriptor", sort_order: 3 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "incl. Natural/Dune/off-white; descriptor", sort_order: 4 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red/bright family (bi-colour 'smile' wings common); descriptor (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Celine Luggage).** Model from the banked `seasonal-archive/celine.md`/`.jsonl` (high
confidence, Spotted Fashion + Weekly Lux Drop): the Luggage is **Phoebe Philo's** first It-bag (**Spring 2010**),
the structured **winged** tote with a front zip pocket that reads as a face ("the smile") and rigid dual
handles; **the whole line was discontinued in March 2025** (Weekly Lux Drop), which is why it is seeded as a
heritage resale icon rather than a live line. Sizes/cm this run: **Rebag's "The Size Guide: Celine Luggage and
Phantom"** gives the **Nano at 8 x 8 x 4 in**; **PurseBlog** and **luxbags.fr** give the **Micro at 10 x 10 x 6
in (~26 x 26 x 15 cm)** and the **Mini at 12 x 12 x 7 in (~30 x 30 x 17 cm)** — and both flag the notorious
naming quirk that **the "Mini" is actually the biggest** of the three (Nano < Micro < Mini). **The colour rule**
is the same Celine finding: plain descriptors, the signature being **Tan/Camel**; the Luggage's famous
**bi-colour "smile"** (contrast wings) is captured per-listing, not seeded as a colour. **Defaults:** size
**Micro** (the most cross-shopped resale size; Nano is co-popular, so soft); material **Smooth Calfskin**;
colour **Black**. **MEDIUM, hold these:** (1) **Medium cm** not cleanly pinned this run. (2) **Micro-vs-Nano
default** is soft. (3) **Red permanence** — recurring descriptor family, soft. (4) The whole line's discontinued
status (March 2025) is the honest headline; I kept the sizes marked permanent to represent their standing within
the historic production run, with the discontinuation stated on the default and here. **Deliberately omitted,
sourced:** **no hardware axis** (the zip 'face' + handles are the fixed signature); the **Nano/Micro/Mini**
counter-intuitive ordering is preserved exactly as the guides give it (never "corrected" into size order); the
**Phantom** is seeded as a format on the winged silhouette (resellers cross-shop it with the Luggage) rather
than split into its own style here.

---

## STYLE 4 — Coach Tabby (style_id 946)

Coach, faceted **size × material × colour**, **DESCRIPTOR colours** (Coach's product-page convention; not yet a
banked archive house — see the camp note). The Tabby reimagines an **archival 1970s Coach** design with wrapped
**Signature C** hardware; Coach was founded in Manhattan in **1941** on glovetanned leather, revived under CD
**Stuart Vevers** (since 2013). Axes: **size** (Tabby 12 / 20 / 26 + the Shoulder Bag 26), **material** (leather
default + Signature C canvas + the soft **Pillow** finish/quilted + exotic), and **colour** (descriptor anchors).

```ts
// Coach Tabby (style 946), archivist-sourced 2026-07-13 (Farfetch "The Ultimate Guide to Coach Bags," pub.
// 2021, captured 2026-07-13, for the Tabby cm + the model history; Coach founded 1941, CD Stuart Vevers since
// 2013). Faceted size × material × colour. COACH IS NOT IN THE BANKED ARCHIVE: colours are seeded as DESCRIPTOR
// anchors by Coach's product-page convention (Black/Chalk/Wine/etc.) — a sourced-by-convention call, re-camp if
// a Coach colour-lexicon source surfaces. The Tabby reimagines a 1970s archival Coach design with wrapped
// Signature C hardware; the "Pillow Tabby" is the soft-leather finish variant (folded into material). NO
// hardware axis (the Signature C turnlock is the fixed signature). cm from the Farfetch guide.
const COACH_TABBY: Row[] = [
  { axis: "size", value: "Tabby 12", permanence: "permanent", note: "the micro Tabby (SLG/charm scale), a recent addition (MEDIUM: cm not sourced this run; brief-named)", sort_order: 1 },
  { axis: "size", value: "Tabby 20", permanence: "permanent", note: "18 x 14 x 8.5 cm (Farfetch, 'Tabby Top Handle 20'); the compact top-handle/crossbody, with a removable strap", sort_order: 2 },
  { axis: "size", value: "Tabby 26", permanence: "permanent", is_default: true, note: "26 x 15 x 7.5 cm (Farfetch, 'Tabby Shoulder Bag 26'); the reference Tabby, most cross-shopped, two detachable straps", sort_order: 3 },
  { axis: "size", value: "Tabby Crossbody", permanence: "seasonal", note: "19 x 10 x 5 cm (Farfetch); the small chain crossbody/clutch format", sort_order: 4 },
  { axis: "material", value: "Polished Pebble Leather", permanence: "permanent", is_default: true, note: "the standard refined/polished pebble leather (Coach's glovetanned-leather heritage); the colour-bearing Tabby surface", sort_order: 1 },
  { axis: "material", value: "Pillow (soft leather)", permanence: "permanent", note: "the 'Pillow Tabby' plush ultra-soft leather with wrapped Signature C hardware (Pillow Tabby 18: 18 x 10 x 6 cm; 26: 26 x 15 x 7.5 cm); the TikTok-cult finish", sort_order: 2 },
  { axis: "material", value: "Signature C Canvas", permanence: "permanent", note: "the coated Signature/monogram-print canvas with leather trim; the logo Tabby", sort_order: 3 },
  { axis: "material", value: "Quilted", permanence: "seasonal", note: "quilted (incl. quilted Pillow Tabby) seasonal runs", sort_order: 4 },
  { axis: "material", value: "Exotic / Denim / Embellished", permanence: "seasonal", note: "snakeskin-embossed / denim / sequined / print editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor (Coach product-page convention, not a banked house lexicon)", sort_order: 1 },
  { axis: "color", value: "Chalk", permanence: "permanent", note: "Coach's off-white/cream neutral (a standing Coach descriptor name)", sort_order: 2 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "tan/saddle/brown family (incl. Signature canvas browns); descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Coach red/wine family; descriptor (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring blush/pink Tabby (a TikTok-driven staple); descriptor (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Coach Tabby).** Coach is **not** in the banked seasonal archive, so this is sourced fresh from
**Farfetch's "The Ultimate Guide to Coach Bags"** (published 2021, captured 2026-07-13): Coach was founded in a
**Manhattan loft in 1941** on supple glovetanned leather + brass turn-key hardware, revived under CD **Stuart
Vevers since 2013**, and the **Tabby** "reimagines the structured silhouette of an archival '70s Coach design"
with **wrapped Signature C hardware**. Sizes/cm this run, all from the Farfetch guide: **Tabby Top Handle 20 =
18 x 14 x 8.5 cm**, **Tabby Shoulder Bag 26 = 26 x 15 x 7.5 cm**, **Tabby Crossbody = 19 x 10 x 5 cm**, plus the
**Pillow Tabby 18 = 18 x 10 x 6 cm** and **Pillow Tabby 26 = 26 x 15 x 7.5 cm**. **The colour call, stated
honestly:** Coach labels colours as **plain descriptors** (Black, Chalk, Wine/Red, browns) — visible on the same
guide and on coach.com — so the colour rows are **descriptor anchors by product-page convention**; because Coach
is not yet a banked archive house this is a **sourced-by-convention** call rather than the fully-verified camp
we have for Gucci/Celine, and it should be re-camped if a Coach colour source ever surfaces. **Defaults:** size
**Tabby 26** (the reference/most cross-shopped); material **Polished Pebble Leather**; colour **Black**.
**MEDIUM, hold these:** (1) **Tabby 12** — the brief named it and Coach does make a micro Tabby, but I did **not**
source its cm this run, so it is seeded with cm null and flagged (a null beats an invented measurement).
(2) **Pillow vs standard Tabby** — the "Pillow Tabby" is folded in as a **material/finish** (soft leather),
because resellers cross-shop it as a Tabby, rather than split into its own style; its two sizes (18/26) are noted
inline. (3) **Red/Pink permanence** — recurring descriptor families, soft. **Deliberately omitted, sourced:**
**no hardware axis** — the **Signature C turnlock** is the fixed signature (finish tracks the colorway); the
**Cassie**, **Willow**, **Beat**, **Field Tote**, and the reissued **Dinky/Swinger/Willis/Lunchbox** are
separate Coach models (all on the same Farfetch guide), not Tabby sizes.

---

## STYLE 5 — Gucci Soho Disco (style_id 450)

Gucci, **essentially one core size × material × colour**, **DESCRIPTOR colours** (Gucci does not name). The Soho
Disco is Frida Giannini's **2012** round-cornered crossbody with the embossed **interlocking-G** medallion and
the signature **zip tassel** — the "reasonably-priced luxury crossbody" cult bag, now **discontinued/heritage**.
Axes: **material** (pebbled leather default + GG Supreme canvas) and **colour** (descriptor anchors); the
**size** axis is near-degenerate (one Disco size + a Mini), and the **interlocking-G tassel** is fixed.

```ts
// Gucci Soho Disco (style 450), archivist-sourced 2026-07-13 (an eBay "Gucci Soho Tassel Disco Shoulder Bag"
// listing giving W19cm + reseller/Fashionphile references for the standard ~21 x 15 x 7 cm; model = Frida
// Giannini's 2012 round crossbody with the embossed interlocking-G medallion + zip tassel, from seasonal-
// archive/gucci.md + gucci.jsonl; colour from chrome-com-colors-2026.md — GUCCI DOES NOT NAME ITS COLOURS,
// descriptors only). DISCONTINUED/HERITAGE (a heavily-resold cult crossbody). Mostly ONE core Disco size (a Mini
// exists); material (pebbled leather default / GG Supreme canvas) + descriptor colour are the real axes. The
// interlocking-G tassel is fixed (no hardware axis). cm approximate (listings vary 19-21 cm).
const GUCCI_SOHO_DISCO: Row[] = [
  { axis: "size", value: "Disco", permanence: "permanent", is_default: true, note: "~21 x 15 x 7 cm (eBay listing W19cm; reseller standard ~8.25 x 6 x 2.75 in); the one core round crossbody size; DISCONTINUED/heritage (MEDIUM: cm vary 19-21 cm by listing)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "seasonal", note: "the smaller Mini Disco / chain version, less common (MEDIUM: cm not sourced this run)", sort_order: 2 },
  { axis: "material", value: "Pebbled Leather", permanence: "permanent", is_default: true, note: "the signature soft grained/pebbled calfskin with the embossed interlocking-G; the colour-bearing Disco surface", sort_order: 1 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "seasonal", note: "beige/ebony coated GG Supreme canvas Disco; the logo version, less common than the leather", sort_order: 2 },
  { axis: "material", value: "Guccissima / Metallic", permanence: "seasonal", note: "embossed Guccissima leather or metallic/patent seasonal runs, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/rose-beige family; descriptor", sort_order: 2 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the Gucci red (descriptor); a recurring Disco staple (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring soft-pink/fuchsia Disco; descriptor (permanence soft)", sort_order: 4 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 5 },
];
```

**Sourcing note (Gucci Soho Disco).** Model from the banked `seasonal-archive/gucci.md`/`.jsonl` (medium
confidence, Bustle + Instagram): the Soho Disco is **Frida Giannini's 2012** round-cornered crossbody with the
embossed **interlocking-G** medallion and the signature **zip tassel** — "the reasonably-priced luxury
crossbody" cult bag, now **discontinued/heritage**. Size this run: an **eBay "Gucci Soho Tassel Disco Shoulder
Bag" listing** (captured 2026-07-13) gives the width at **19 cm (7.5 in)**; the long-standing reseller/
Fashionphile standard for the Disco is **~21 x 15 x 7 cm (8.25 x 6 x 2.75 in)** — so I seeded **one core Disco
size** (the bag has essentially a single silhouette) plus a **Mini/chain** variant, with the cm flagged MEDIUM
because listings vary 19-21 cm. **The colour rule** is the same Gucci descriptor finding
(`chrome-com-colors-2026.md`): colours are **plain descriptors**, so the rows are descriptor anchors.
**Defaults:** size **Disco** (the one core size); material **Pebbled Leather**; colour **Black**. **MEDIUM, hold
these:** (1) **Disco cm** vary by listing (19-21 cm); flagged. (2) **Mini** cm not sourced this run. (3)
**Red/Pink permanence** — recurring descriptor families, soft. **Deliberately omitted, sourced:** **no hardware
axis** — the **interlocking-G tassel + medallion** are the fixed signatures; the **Soho tote**, **Soho chain
shoulder**, and **Soho hobo** are separate Soho-line formats, not Disco sizes, captured per-listing; the size
axis is honestly near-degenerate (the Disco is a one-size bag) and I say so rather than inventing a size run.

---

## STYLE 6 — YSL Sac de Jour (style_id 461)

Saint Laurent, faceted **size × material × colour × hardware-tone** — encoded like the Kate/Loulou. The Sac de
Jour is **Slimane's 2013** structured top-handle tote: clean trapeze body, twin rolled handles, a **padlock**,
and the new "Saint Laurent" logo. Axes: **size** (Nano / Baby / Small / Medium / Large), **material**
(grain-de-poudre/grained default + smooth calf + croc-embossed), **colour** (plain DESCRIPTOR anchors), and
**hardware** (the metal tone — gold vs silver — the axis that carries YSL's naming weight).

```ts
// YSL Sac de Jour (style 461), archivist-sourced 2026-07-13 (Fashionphile "A Saint Laurent Sac de Jour Size
// Guide" for the five-size run + Farfetch "Sac de Jour Size Guide" for Nano/Baby cm + luxbags.fr for Small cm;
// model = Slimane's 2013 structured top-handle tote with twin rolled handles + a padlock + the new Saint Laurent
// logo, from seasonal-archive/saint-laurent.md). YSL does NOT publish a seasonal colour lexicon (saint-laurent.md
// §3) — plain DESCRIPTOR anchors (Noir/Blanc/Rouge/Dark Beige), and the HARDWARE TONE (gold vs silver) is the
// axis that carries the real naming weight. Size × material × colour × hardware. cm converted from inches; the
// reseller "BB" label = the Baby size (noted). Default size Small vs Baby is soft.
const YSL_SAC_DE_JOUR: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~22 x 18 x 10.5 cm (Farfetch; Fashionphile ~8.5 x 6.75 x 4 in); the mini top-handle, worn crossbody, the evening/entry size", sort_order: 1 },
  { axis: "size", value: "Baby", permanence: "permanent", note: "~26 x 20.5 cm face (Farfetch); the compact everyday size (resellers also label it 'BB'), co-most-popular", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~32 x 26 x 14 cm (luxbags.fr); the reference Sac de Jour, most liquid on resale (default vs Baby is soft)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the roomier work tote proportion (MEDIUM: cm not cleanly pinned this run)", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the largest travel/work Sac de Jour, less common now (MEDIUM: cm not sourced this run)", sort_order: 5 },
  { axis: "material", value: "Grained Leather", permanence: "permanent", is_default: true, note: "the grained/grain-de-poudre embossed calfskin; the classic structured Sac de Jour, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", note: "smooth polished calfskin; the softer, more delicate Sac de Jour", sort_order: 2 },
  { axis: "material", value: "Croc-Embossed", permanence: "permanent", note: "crocodile-embossed (not exotic) calfskin; a recurring textured Sac de Jour finish", sort_order: 3 },
  { axis: "material", value: "Suede / Canvas", permanence: "seasonal", note: "suede or canvas/monogram-panel seasonal runs, per-listing", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "crocodile / python / lizard limited runs, per-listing", sort_order: 5 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone hardware (padlock + fittings); the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone hardware; equally standard", sort_order: 2 },
  { axis: "hardware", value: "Aged / Brushed", permanence: "seasonal", note: "aged or brushed-tone hardware on some seasonal Sac de Jours", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor (plain descriptor, not a seasonal-lexicon name)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge (incl. the 'Rouge Merlot' colorway); a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (YSL Sac de Jour).** Model from the banked `seasonal-archive/saint-laurent.md` (high
confidence, Rebag + myGemma): the Sac de Jour is **Hedi Slimane's 2013** structured top-handle tote — clean
trapeze body, twin rolled handles, a **padlock**, the new "Saint Laurent" logo — an immediate hit, and the
official spelling is **"Sac de Jour"** (not "Sac du Jour"). Sizes/cm this run: **Fashionphile's "A Saint Laurent
Sac de Jour Size Guide"** (captured 2026-07-13) confirms the **five sizes — Nano, Baby, Small, Medium, Large**
— and pins the **Nano at ~8.5 x 6.75 x 4 in**; **Farfetch** gives the **Nano at 22 x 18 x 10.5 cm** and the
**Baby at 26 x 20.5 cm**; **luxbags.fr** gives the **Small at 32 x 26 x 14 cm**. **The colour + hardware rule
holds from the archive:** `saint-laurent.md` §3 — YSL does **not** publish a per-season colour dictionary; the
bag is identified by **model + material + hardware tone**, colours are **plain descriptors** (Noir, Blanc/Crème,
Dark Beige, Rouge/"Rouge Merlot", Storm), and §136 confirms the **gold-vs-silver hardware tone** is the axis
that carries the naming weight (the Sac de Jour's padlock hardware makes it a real choice here). **Defaults:**
size **Small** (the reference / most liquid; Baby is co-popular, so soft); material **Grained Leather**;
hardware **Gold**; colour **Black/Noir**. **MEDIUM, hold these:** (1) **Medium / Large cm** not cleanly pinned
this run (the guides lead with Nano/Baby/Small); flagged. (2) **"BB" = Baby** — resellers use both labels for
the same size, noted inline so we don't seed a phantom sixth size. (3) **Red/Grey permanence** — recurring
descriptor families, soft. **Deliberately omitted, sourced:** the brief floated **"BB"** as its own size — it is
the **Baby** relabelled, so folding it in beats inventing structure; the **Le 5 à 7**, **Sunset**, and
**Cassandra** are separate YSL models, not Sac de Jour sizes; **no invented seasonal colour names**.

---

## STYLE 7 — Prada Re-Edition 2005 (style_id 202)

Prada, **material + archive-year-primary**, **DESCRIPTOR colours** (Prada does not name). The Re-Edition 2005 is
the breakout Y2K-revival **nylon shoulder bag**: the enamel inverted-**triangle** logo, a woven shoulder strap,
a removable chain strap, and a removable Re-Nylon zip pouch; reissued **late 2019/2020** in recycled **Re-Nylon**
(Econyl), with a **Saffiano-leather** strap (this is what distinguishes it from the fabric-strap Re-Edition
2000). Axes: **material** (Re-Nylon default — the recycled-nylon signature — + leather-trim + raffia + satin +
sequin) and **colour** (descriptor anchors — Black + the recurring brights); the **size** is essentially one
core (the 2000 and 1995 are sibling archive-year models, per-listing).

```ts
// Prada Re-Edition 2005 (style 202), archivist-sourced 2026-07-13 (prada.com official "Re-Edition 2005 Re-Nylon
// bag" PDP giving 22 x 18 x 6 cm + Farfetch Re-Edition 2005 listing 17.5 x 22 x 6 cm; model = the breakout Y2K
// nylon shoulder bag, triangle logo + woven strap + removable chain strap + removable zip pouch, Saffiano-
// leather strap, reissued late 2019/2020 in recycled Re-Nylon/Econyl, archive c.2005, from seasonal-archive/
// prada.md + prada.jsonl). COLOUR = DESCRIPTOR (Prada does NOT name its colours; occasional Italian descriptors
// Rosa=pink, Cammeo=nude). Material (Re-Nylon default) + descriptor colour are the real axes; the size is
// essentially ONE core (the Re-Edition 2000 = fabric strap and Re-Edition 1995 = brushed-leather top-handle are
// SIBLING archive-year MODELS, not sizes of the 2005 — noted, per-listing). NO hardware axis. cm from prada.com.
const PRADA_RE_EDITION_2005: Row[] = [
  { axis: "size", value: "Re-Edition 2005", permanence: "permanent", is_default: true, note: "22 x 18 x 6 cm (prada.com official; Farfetch 17.5 x 22 x 6 cm); the one core Y2K nylon shoulder bag, woven strap + removable chain + removable zip pouch", sort_order: 1 },
  { axis: "size", value: "Re-Edition 2005 Mini", permanence: "seasonal", note: "the smaller mini/'micro' Re-Edition when produced, less common (MEDIUM: cm not sourced this run)", sort_order: 2 },
  { axis: "material", value: "Re-Nylon", permanence: "permanent", is_default: true, note: "recycled regenerated ECONYL nylon; Prada's signature Re-Nylon (2019 relaunch), the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Re-Nylon + Leather Trim", permanence: "permanent", note: "Re-Nylon with Saffiano-leather trim/strap (the leather strap is what distinguishes the 2005 from the fabric-strap 2000)", sort_order: 2 },
  { axis: "material", value: "Leather", permanence: "seasonal", note: "all-leather (Saffiano/nappa) Re-Edition runs, per-listing", sort_order: 3 },
  { axis: "material", value: "Raffia / Crochet", permanence: "seasonal", note: "woven raffia or crochet summer editions, per-listing", sort_order: 4 },
  { axis: "material", value: "Satin / Sequin / Embellished", permanence: "seasonal", note: "satin, sequined, crystal, or rhinestone-embellished evening editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor (Nero); descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the nude/'Cammeo' beige neutral; descriptor (Cammeo is Prada's Italian descriptor for the cameo nude)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. 'Talco'/chalk white; descriptor", sort_order: 3 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring pink ('Rosa'); a Re-Edition signature bright (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Blue", permanence: "permanent", note: "the recurring cornflower/cerulean blue; a Re-Edition signature bright (descriptor); near-permanent (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Prada Re-Edition 2005).** Model from the banked `seasonal-archive/prada.md`/`.jsonl` (high
confidence, Vogue + Fashionphile + Luxe Digital): the Re-Edition 2005 is the breakout **Y2K-revival nylon
shoulder bag** — enamel inverted-**triangle** logo, woven shoulder strap, removable chain strap, removable
Re-Nylon zip pouch — reprised **late 2019/2020** in recycled **Re-Nylon (Econyl)**, and the **2005 carries a
Saffiano-leather strap** (that leather strap is exactly what distinguishes it from the **Re-Edition 2000**,
which has a **fabric strap**). Size this run: **prada.com's official "Re-Edition 2005 Re-Nylon bag" PDP**
(captured 2026-07-13) gives **Height 18 x Width 22 x Length 6 cm**; **Farfetch** cross-confirms **17.5 x 22 x 6
cm** — so the bag is essentially **one core size**. **The colour rule** is the same Prada descriptor finding
(`prada.md` §40): Prada does **not** publish a per-season colour dictionary; colours read as plain descriptors,
with the occasional Italian descriptor word (**Rosa** = pink, **Cammeo** = a cameo nude/beige) — so the rows are
descriptor anchors, the Italian words noted as descriptors, never promoted to a "named lexicon." **Defaults:**
size **Re-Edition 2005** (the one core size); material **Re-Nylon** (the recycled-nylon signature); colour
**Black**. **MEDIUM, hold these:** (1) **Re-Edition 2005 Mini** cm not sourced this run; seeded seasonal.
(2) **Pink/Blue permanence** — the Re-Edition rotates a deep bright palette; these two are recurring signatures,
flagged soft. (3) **Cammeo/Rosa** are Prada's Italian **descriptor** words (pink, cameo-nude), not a proprietary
seasonal-colour name — noted as such. **Deliberately omitted, sourced:** the **Re-Edition 2000** (fabric strap,
the smaller Y2K mini) and the **Re-Edition 1995** (a brushed-leather structured top-handle, a different bag) are
**sibling archive-year MODELS**, not sizes of the 2005 (the brief floated seeding them here — they are their own
styles, so a null beats false structure); they are captured per-listing / as their own style_ids, and the
**archive-year is Prada's GEO-valuable decoder** (2005 vs 2000 vs 1995), so it belongs on the model, not as a
phantom size of this one. **No hardware axis** (the triangle plaque + strap set are the fixed signature).

---

## Two things to wire when you paste

1. Register all seven in the `STYLES` array (style_ids confirmed from the DB per the brief; re-confirm against
   the `style` table before writing):
   `{ styleId: 448, name: "Ophidia", rows: GUCCI_OPHIDIA }`,
   `{ styleId: 206, name: "Triomphe", rows: CELINE_TRIOMPHE }`,
   `{ styleId: 484, name: "Luggage Tote", rows: CELINE_LUGGAGE }`,
   `{ styleId: 946, name: "Tabby", rows: COACH_TABBY }`,
   `{ styleId: 450, name: "Soho Disco", rows: GUCCI_SOHO_DISCO }`,
   `{ styleId: 461, name: "Sac de Jour", rows: YSL_SAC_DE_JOUR }`,
   `{ styleId: 202, name: "Re-Edition 2005", rows: PRADA_RE_EDITION_2005 }`.
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; ophidia-triomphe-luggage-tabby-sohodisco-sacdejour-reedition-production-matrix.md"` so the provenance
   string stays honest.
