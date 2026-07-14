# Dior Book Tote + Fendi Peekaboo + YSL Loulou + Fendi Baguette + Chanel 22 + Gucci Diana — production matrices (selector seed)

*Archivist run 2026-07-13. Same shape and rigor as `kelly-woc-saddle-chanel19-dionysus-horsebit-production-matrix.md`,
`lv-alma-hermes-birkin-production-matrix.md`, and `cassette-jackie-artois-pochettemetis-production-matrix.md`:
one reviewed source-of-truth list per style, NOT a full combination matrix. Each axis value traces to a
cited, dated source; anything I could not source is hedged (MEDIUM) or omitted, never invented. Six
sections, each a ready `Row[]` to paste into `load-production-options.ts`.*

Reused ground truth (already sourced + banked, so not re-scraped this run):
`seasonal-archive/dior.md` + `dior.jsonl` (Book Tote = SS2018 Chiuri from a 1967 Bohan sketch; Dior
Oblique jacquard 1967-Bohan/SS1969, Toile de Jouy ~2019, and the Dior-names-its-colours regime);
`seasonal-archive/fendi.md` + `fendi.jsonl` (Baguette = 1997 Silvia Venturini Fendi, revived 2019,
25th-anniversary NYFW Sept 2022, 1,000+ variations; Peekaboo debut ~2008/2009, originally "Hide and
Seek," ISeeU accordion Fall 2020, Petite ~2024; the FF "Zucca" logo (Lagerfeld 1965/66), Selleria
hand-stitch line, Cuoio Romano; and the load-bearing fact that **Fendi does NOT name its colours** —
descriptor families only, like Gucci); `seasonal-archive/saint-laurent.md` + `saint-laurent.jsonl`
(Loulou = Vaccarello ~2017, named for Loulou de la Falaise, matelassé **chevron** "Y"-quilt, Grain de
Poudre / lambskin; the Cassandre monogram 1963 as the clasp; and the finding that **YSL does NOT
publish a seasonal colour lexicon** — plain descriptors Noir/Blanc/Rouge/Dark Beige, with the
**hardware tone** (gold vs silver Cassandre) as the axis that actually carries naming weight);
`seasonal-archive/chanel.md` + `chanel.jsonl` (Chanel's house-wide permanent palette
Black/Beige/White/Red/Navy, the no-official-seasonal-colour-name rule, Diamond/Chevron quilting
vocabulary); `seasonal-archive/gucci.md` + `gucci.jsonl` (Diana = 1991 bamboo-handle tote with removable
leather belts, a Princess Diana favourite, reissued by Michele 2021 in three sizes; the bamboo handle
motif born 1947; and **Gucci does NOT name its colours** — descriptors, per `chrome-com-colors-2026.md`).

New this run (2026-07-13, all free-tier Firecrawl): PurseBlog + Fashionphile + Rebag "Dior Book Tote
Size Guide" (Mini/Small/Medium/Large cm); luxbags.fr + PurseBop + fendi.com "Fendi Peekaboo Size Guide"
(Nano / Iconic Mini-Medium-Large / ISeeU Petite-Small-Medium cm); ysl.com Loulou Small PDP + Rebag +
luxbags.fr Loulou size guides (Toy/Small/Medium/Large cm); the-hosta + Sellier Knightsbridge + Rebag
"Fendi Baguette Size Guide" (Pico/Nano/Mini/Medium/Large cm + the Chain formats); luxbags.fr +
cocoapproved "Chanel 22 Size Guide" (Mini/Small/Medium/Large cm) + chanel.com CHANEL 22 PLP; and
gucci.com Diana Small/Medium tote PDPs + a Diana Mini spec (20 x 16 x 10 cm).

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. **Colour-naming
rule per the banked archive, applied below:** Dior **NAMES** its colours (seed permanent anchors,
rotate the rest per-listing); **YSL names permanents with plain DESCRIPTORS only** (Noir/Blanc/Rouge —
no seasonal lexicon, so it sits in the Dior/Gucci "descriptor" camp, and the real naming weight is the
Cassandre **hardware tone**); **Fendi does NOT name colours** (descriptor families only, explicitly not
house names — same as Gucci); **Gucci does NOT name colours** (descriptors); Chanel does **NOT** name
seasonal colours (seed only the permanent palette Black/Beige/White/Red/Navy, everything else
per-listing + season code). cm are approximate where converted from resellers' inch measurements.

---

## STYLE 1 — Dior Book Tote (style_id 454)

Dior, **print/embroidery-primary**. The Book Tote is a flat open unlined tote whose whole point is the
**embroidered surface**, so the primary spec axis is the **material (the embroidery/print)**, not the
leather — Dior Oblique embroidery is the reference. Faceted **size × material × colour**; **Dior NAMES
its colours**, so the Oblique neutral anchors (blue/grey/black/pink) are seeded and the season's shades
rotate per-listing. No hardware axis (the tote has no clasp hardware — it is an open embroidered tote).

```ts
// Dior Book Tote (style 454), archivist-sourced 2026-07-13 (PurseBlog "The Dior Book Tote Size Guide"
// + Fashionphile + Rebag for the Mini/Small/Medium/Large cm; model = SS2018 Maria Grazia Chiuri from a
// 1967 Marc Bohan sketch, Dior Oblique jacquard 1967-Bohan/SS1969, Toile de Jouy ~2019, from seasonal-
// archive/dior.md + dior.jsonl which map Book Tote -> Mini/Small/Medium/Large/Vertical). PRINT-PRIMARY:
// the embroidered canvas is the spec axis; Dior NAMES its colours (seed the Oblique neutral anchors,
// seasonal per-listing). NO hardware axis (open unlined tote). cm approximate (converted from inches).
const DIOR_BOOK_TOTE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~23 x 15 x 5 cm (9 x 6 x 2 in); the small/phone-scale mini, comes with a strap", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~26.5 x 21 x 14 cm (10.5 x 8.5 x 5.5 in); the compact everyday tote", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~36 x 27.5 x 16.5 cm (14 x 11 x 5.5 in); the Classic reference Book Tote everyone pictures", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~41.5 x 35 x 18 cm; the roomiest carryall (MEDIUM: cm approximate, less common than Medium)", sort_order: 4 },
  { axis: "size", value: "Vertical", permanence: "seasonal", note: "the North-South vertical Book Tote; a recurring format, not a core size", sort_order: 5 },
  { axis: "material", value: "Oblique Embroidery", permanence: "permanent", is_default: true, note: "the diagonal Dior monogram embroidered canvas; the signature Book Tote (blue is the reference, also grey/black/pink)", sort_order: 1 },
  { axis: "material", value: "Toile de Jouy", permanence: "permanent", note: "the pastoral toile embroidery (Pink/Navy/Grey/'Around the World'/'Sauvage' reverse), a Chiuri signature from ~2019", sort_order: 2 },
  { axis: "material", value: "Plain Canvas / Macrocannage", permanence: "permanent", note: "solid-colour embroidered canvas ('DIOR' or Macrocannage relief), the colour-forward Book Tote", sort_order: 3 },
  { axis: "material", value: "D-Royaume / Animal", permanence: "seasonal", note: "the 'Dior Royaume d'un Roi' / zodiac / animal-motif embroidered editions, per-listing", sort_order: 4 },
  { axis: "material", value: "Embroidered / Beaded", permanence: "seasonal", note: "other seasonal beaded/sequined/print embroideries + personalisation (ABCDior), per-listing", sort_order: 5 },
  { axis: "color", value: "Blue", permanence: "permanent", is_default: true, note: "Dior's signature Oblique blue; the reference Book Tote (MEDIUM: Black is co-anchor, default is soft)", sort_order: 1 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the grey Oblique neutral; a standing anchor", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", note: "black Oblique / plain-canvas; the minimalist anchor", sort_order: 3 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring Oblique/Toile pink; near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Latte/natural on plain canvas; a standing Dior neutral (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Dior Book Tote).** Model + history from the banked `seasonal-archive/dior.md`/`.jsonl`
(high confidence, Vogue + Christie's): the Book Tote is **Maria Grazia Chiuri's SS2018** flat open tote,
based on a **1967 Marc Bohan sketch**, conceived as a "canvas" for the **Dior Oblique** (Bohan's 1967
monogram, runway SS1969) and later **Toile de Jouy** (~2019) and personalisation; the jsonl explicitly
maps the model to **Mini / Small / Medium / Large / Vertical**. Sizes/cm this run: **PurseBlog "The Dior
Book Tote Size Guide"** (purseblog.com, captured 2026-07-13) gives **Medium 36 x 27.5 x 16.5 cm
(14 x 11 x 5.5 in)** and **Small 26.5 x 21 x 14 cm (10.5 x 8.5 x 5 in)**; **Fashionphile** and **Rebag**
add the **Mini ~9 x 6 x 2 in** and confirm the newer Small at **10.5 x 8.5 x 5.5 in**; the Large and the
North-South **Vertical** are the two larger/alternate formats. **PRINT-PRIMARY encoding:** the Book Tote
carries no leather/hardware choice — the buyer's real axis is the **embroidered surface**, so material =
the print (Oblique Embroidery default, Toile de Jouy, plain/Macrocannage canvas, D-Royaume/animal +
beaded seasonals). Colour is Dior-named: the **Oblique neutral anchors** (Blue/Grey/Black/Pink) + Beige.
**Defaults:** size **Medium** (the reference); material **Oblique Embroidery**; colour **Blue** (the
signature Oblique blue). **MEDIUM, hold these:** (1) **Colour default** — I set **Blue** because the blue
Oblique Book Tote is *the* recognizable reference and it pairs with the Oblique-Embroidery material
default; if resale volume skews to the black/plain-canvas totes, revisit (Black is the co-anchor).
(2) **Large cm** are a reseller composite, approximate. (3) **Blue/Pink/Beige permanence** — the Book
Tote keeps these most seasons but the exact shade rotates, so seeded permanent + flagged soft.
**Deliberately omitted, sourced:** the **Book Tote Pouch** (the small phone/mini pouch) is an SLG-scale
format captured per-listing, not a Book Tote size; **no separate hardware axis** (the tote is open and
unlined — there is no clasp to choose).

---

## STYLE 2 — Fendi Peekaboo (style_id 205)

Fendi, faceted **size × material × colour**, **DESCRIPTOR colours only** (Fendi does **not** name its
colours — same regime as Gucci). Axes: **size** (the Iconic line's Nano/Mini/Regular/Large + the ISeeU
line's Petite/Small), **material** (smooth calf default + Selleria hand-stitch + exotic + FF/Zucca
canvas + fur), and **colour** (descriptor anchors, explicitly not house names). The **twist-lock on each
side + the contrasting interior lining** (the "peek-a-boo" reveal) are the fixed signatures — noted, not
an axis.

```ts
// Fendi Peekaboo (style 205), archivist-sourced 2026-07-13 (luxbags.fr "Fendi Peekaboo Size Guide" +
// PurseBop "An Extensive Guide to the Fendi Peekaboo" + fendi.com PDPs for Nano/Iconic/ISeeU cm; model =
// Silvia Venturini Fendi's "anti-It-bag," debut ~2008/2009 (orig. "Hide and Seek"), ISeeU accordion
// Fall 2020, Petite ~2024, from seasonal-archive/fendi.md; FF Zucca logo + Selleria + Cuoio Romano from
// fendi.md; FENDI DOES NOT NAME ITS COLOURS — descriptors only, per fendi.md §3). Faceted size × material
// × colour. Colour anchors are DESCRIPTORS, not house names. NO hardware axis (the twin twist-locks +
// contrasting lining are the fixed signature). cm approximate (converted from inches).
const FENDI_PEEKABOO: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "~19 x 16 x 6 cm; the micro/charm Peekaboo (mini fragrance-scale), recent addition", sort_order: 1 },
  { axis: "size", value: "Petite", permanence: "permanent", note: "the ISeeU Petite (~SLG-scale accordion); the smaller ISeeU, a centenary-era addition (~2024)", sort_order: 2 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~23 x 18 x 11 cm (9.1 x 7.1 x 4.3 in); the Iconic Mini, a top-selling size", sort_order: 3 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~27 x 21 x 11 cm; the ISeeU Small (accordion, wide-opening); the popular structured crossbody", sort_order: 4 },
  { axis: "size", value: "Regular", permanence: "permanent", is_default: true, note: "~33 x 25 x 12 cm (13 x 10.2 x 4.7 in); the Iconic Medium/Regular, the reference Peekaboo (MEDIUM: Mini is co-popular, default is soft)", sort_order: 5 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~43 x 32 x 14 cm (16.9 x 12.6 x 5.5 in); the roomiest Iconic size, less common now", sort_order: 6 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", is_default: true, note: "smooth/soft calf leather; the everyday Peekaboo, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Selleria", permanence: "permanent", note: "hand-saddle-stitched Cuoio Romano leather (visible contrast stitch, silver 1925 tag); the artisanal Peekaboo", sort_order: 2 },
  { axis: "material", value: "FF / Zucca Canvas", permanence: "seasonal", note: "the interlocking-FF logo canvas / FF 1974 embossed body; recurring logo runs", sort_order: 3 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "crocodile / python / ostrich / lizard; Fendi is one of few houses still running exotics", sort_order: 4 },
  { axis: "material", value: "Fur / Embellished", permanence: "seasonal", note: "shearling/'teddy' fur, beaded, sequined or inlaid editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "tobacco/chocolate brown family; descriptor", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/greige neutral (incl. Selleria naturals); descriptor", sort_order: 3 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey family; descriptor (permanence soft)", sort_order: 5 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red family (descriptor); near-permanent (permanence soft)", sort_order: 6 },
];
```

**Sourcing note (Fendi Peekaboo).** Model + history from the banked `seasonal-archive/fendi.md` (high
confidence, Fashionphile Herstory + Luxury London + Harper's): the Peekaboo is **Silvia Venturini
Fendi's "anti-It-bag,"** a trapezium top-handle with a **twist lock on each side**, worn open to reveal
a **contrasting interior lining** (hence "peek-a-boo"), **originally called "Hide and Seek,"** debut
**~2008/2009**; the **Peekaboo ISeeU** is the more structured **accordion** variant (**Fall 2020**), and
the **Peekaboo ISeeU Petite** is a centenary-era smaller size (~2024). Sizes/cm this run: **luxbags.fr
"Fendi Peekaboo Size Guide"** (captured 2026-07-13) gives **Nano 18-19 x 13-16 x 6 cm**; **PurseBop "An
Extensive Guide to the Fendi Peekaboo"** gives the **Iconic** run — **Mini 9.1 x 7.1 x 4.3 in
(~23 x 18 x 11 cm), Medium 13 x 10.2 x 4.7 in (~33 x 25 x 12 cm), Large 16.9 x 12.6 x 5.5 in
(~43 x 32 x 14 cm)**; and **fendi.com PDPs** confirm the **ISeeU Small at 27 x 21 x 11 cm** and the Nano
at 19 x 16 x 6 cm. The **colour treatment is the load-bearing Fendi fact**: `fendi.md` §3 house-confirms
Fendi's DNA is split across the **logo** (FF Zucca) and the **leather craft** (Selleria), with **colours
as plain descriptors** (Black, Tobacco, "Spring Turquoise" — a shade descriptor, "not a poetic house
name"), so the colour rows are **descriptor anchors, explicitly not house names** — Fendi is in the
"does not name its colours" camp with Gucci. **Defaults:** size **Regular** (the Iconic Medium, the
reference); material **Smooth Calf**; colour **Black**. **MEDIUM, hold these:** (1) **Size default** — I
set **Regular** (the classic reference), but the **Mini** is co-popular on the current market; soft
default. (2) **The Iconic vs ISeeU distinction** — the run mixes two sub-lines (Iconic classic twist-lock
= Mini/Regular/Large; ISeeU accordion = Petite/Small); I seeded them as one size axis with the line noted
per row rather than a second axis, since resellers cross-shop by size. (3) **Nano permanence** — recent
and charm-scale, seeded seasonal. (4) **Grey/Red permanence** — recurring descriptor families, flagged
soft. **Deliberately omitted, sourced:** **no hardware axis** — the twin twist-locks and the contrasting
lining are the fixed signature (their finish tracks the edition, not a shopper's headline choice),
matching how the Dionysus spur clasp and Marmont Double-G were handled; the Peekaboo's **East-West /
rectangular ISeeU** orientation and the **Mon Tresor / First / By the Way** are separate models captured
per-listing, not Peekaboo sizes.

---

## STYLE 3 — YSL Loulou (style_id 460)

Saint Laurent, faceted **size × material × colour × hardware**. The Loulou is the house's **matelassé
chevron "Y"-quilt** shoulder bag with the curved **Cassandre** clasp. Axes: **size** (Toy/Small/Medium/
Large), **material** (matelassé lambskin default + matelassé calfskin + suede + croc-embossed + the
padded Puffer), **colour** (plain DESCRIPTOR anchors — YSL does not publish a seasonal colour lexicon),
and **hardware** (the **Cassandre tone**, gold vs silver — the axis that actually carries naming weight
on a YSL bag).

```ts
// YSL Loulou (style 460), archivist-sourced 2026-07-13 (ysl.com Loulou Small PDP 24 x 14 x 6 cm + Rebag
// "Size Guide: YSL Loulou" + luxbags.fr for Toy/Small/Medium/Large cm; model = Anthony Vaccarello's
// matelassé chevron shoulder bag ~2017, named for Loulou de la Falaise, Cassandre monogram clasp (A.M.
// Cassandre 1963), Grain de Poudre / matelassé lambskin, from seasonal-archive/saint-laurent.md). YSL
// does NOT publish a seasonal colour lexicon (Dior/Gucci camp) — plain DESCRIPTOR anchors (Noir/Blanc/
// Rouge), and the HARDWARE TONE (gold vs silver Cassandre) is the axis that carries the real naming
// weight (saint-laurent.md §3). cm approximate (converted from inches where noted).
const YSL_LOULOU: Row[] = [
  { axis: "size", value: "Toy", permanence: "permanent", note: "~20 x 14 x 7 cm (7.25 x 5.5 x 2.75 in); the mini Loulou on a chain, the entry/evening size", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~24 x 14 x 6 cm (ysl.com official; the compact everyday shoulder, co-most-popular on resale)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~32 x 21 x 10 cm; the reference 'Medium Loulou Matelassé' (MEDIUM: Small is co-popular, default is soft)", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "~37 x 27 cm; the roomiest Loulou, less common (MEDIUM: cm approximate)", sort_order: 4 },
  { axis: "material", value: "Matelasse Lambskin", permanence: "permanent", is_default: true, note: "quilted chevron 'Y' lambskin; the softest/most common Loulou leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Matelasse Calfskin", permanence: "permanent", note: "chevron-quilted grain-de-poudre embossed calfskin; sturdier, holds shape", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Puffer", permanence: "seasonal", note: "the padded/pillow Loulou Puffer (oversized quilted lambskin); a Vaccarello-era cult variant", sort_order: 4 },
  { axis: "material", value: "Croc-Embossed / Exotic", permanence: "seasonal", note: "croc-embossed or exotic editions, per-listing", sort_order: 5 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone Cassandre; the classic pairing (hardware tone is the axis that carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone Cassandre; equally standard", sort_order: 2 },
  { axis: "hardware", value: "Aged / Brushed", permanence: "seasonal", note: "aged or brushed-tone Cassandre on some seasonal Loulous", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the definitive Loulou colour, the anchor (plain descriptor, not a seasonal-lexicon name)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (YSL Loulou).** Model + history from the banked `seasonal-archive/saint-laurent.md`
(high confidence, Rebag + WhoWhatWear): the Loulou is **Anthony Vaccarello's** matelassé **chevron**
"Y"-quilt shoulder bag (~2017), named after **Loulou de la Falaise** (YSL's muse), closed by the curved
**Cassandre** monogram clasp (the emblem **A.M. Cassandre designed in 1963**), in **matelassé lambskin /
grain-de-poudre**; the **Puffer** and **Toy** are later Vaccarello variants. Sizes/cm this run:
**ysl.com's Loulou Small PDP** gives **24 x 14 x 6 cm**; **Rebag "Size Guide: YSL Loulou"** places the
**Small between the Toy and the Medium** (9.8 x 6.6 x 3.5 in); **luxbags.fr** gives the **Toy at
~18.5-20 x 14 x 7 cm**; and **Farfetch** confirms the run as **Toy / Small / Medium / Large**. **The
colour finding is load-bearing and honest:** `saint-laurent.md` §3 states plainly that **YSL does NOT
publish a per-season colour-name dictionary** — the bag is identified by **model + material + hardware
tone**, and the colours are **plain descriptors** (Noir, Blanc/Crème, Dark Beige, Rouge, Storm). So this
answers the brief's open question directly: **YSL names its permanents only as plain descriptors, not as
a poetic seasonal lexicon** — it sits in the Dior/Gucci "descriptor" camp, NOT the Hermès/Bottega
named-colour camp. The archive's stronger point is that the **hardware tone (gold vs silver Cassandre)
is the axis that actually carries naming weight**, which is why hardware is seeded as a real axis here.
**Defaults:** size **Medium** (the reference "Medium Loulou Matelassé"); material **Matelassé Lambskin**;
hardware **Gold**; colour **Black/Noir**. **MEDIUM, hold these:** (1) **Size default** — Medium is the
canonical reference but the **Small** is co-most-popular on resale; soft default. (2) **Large** — seeded
seasonal, cm approximate (a reseller composite). (3) **Red/Grey permanence** — recurring descriptor
families, flagged soft. **Deliberately omitted, sourced:** the **Loulou Toy** is kept as a size (it is a
Loulou), but the **Lou camera bag**, **Kate**, **Envelope**, and **College** are separate matelassé
models captured per-listing, not Loulou sizes; **no invented seasonal colour names** — the season's
Loulou shades (the greens, blues, burgundies on the resale floor) are captured **per-listing as
descriptor**, never seeded as fake house names.

---

## STYLE 4 — Fendi Baguette (style_id 204)

Fendi, **material/print-primary**, **DESCRIPTOR colours only** (Fendi does not name). The Baguette is
the house's "1,000+ variations" bag — the whole identity is the **surface treatment** (leather vs FF
Zucca canvas vs sequins vs embroidery vs exotic vs fur), so material is the primary axis. Faceted
**size × material × colour**. The **FF flap clasp** and the tucked-under-the-arm shoulder shape are the
fixed signatures — noted, not an axis. The **Baguette Chain** (chain-strap) formats are addressed in the
sourcing note, not seeded as sizes.

```ts
// Fendi Baguette (style 204), archivist-sourced 2026-07-13 (the-hosta + Sellier Knightsbridge + Rebag
// "Fendi Baguette Size Guide" for Nano/Mini/Medium/Large cm + the Chain formats; model = Silvia
// Venturini Fendi 1997, THE original "It bag" (SATC "it's a Baguette!"), discontinued 2000s, revived
// 2019, 25th-anniversary NYFW Sept 2022, 1,000+ variations, from seasonal-archive/fendi.md; FF Zucca
// logo + Selleria + exotics from fendi.md; FENDI DOES NOT NAME ITS COLOURS — descriptors only, per
// fendi.md §3). MATERIAL-PRIMARY (the 1,000+ variations live on the surface). Colour anchors are
// DESCRIPTORS, not house names. NO hardware axis (the FF flap clasp is the fixed signature). cm approximate.
const FENDI_BAGUETTE: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "~11 x 6.5 x 2.5 cm (4.3 x 2.5 x 1 in); the micro/charm Baguette, part of the modern revival", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~19 x 11.5 x 4 cm (7.5 x 4.5 x 1.6 in); the small crossbody Baguette, a revival-era staple", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~27 x 15 x 6 cm (10.6 x 5.9 in); the Iconic/Regular Baguette, the reference SATC size", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "~32 x 17 cm; the oversized 'Baguette Large'/'Grande', less common (MEDIUM: cm approximate)", sort_order: 4 },
  { axis: "material", value: "Leather", permanence: "permanent", is_default: true, note: "smooth/soft nappa or calf leather; the everyday Baguette, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "FF / Zucca Canvas", permanence: "permanent", note: "the interlocking-FF 'Zucca' logo canvas / FF 1974 embossed; the heritage logomania Baguette", sort_order: 2 },
  { axis: "material", value: "Selleria", permanence: "seasonal", note: "hand-saddle-stitched Cuoio Romano leather (silver 1925 tag); the artisanal Baguette", sort_order: 3 },
  { axis: "material", value: "Sequins / Embellished", permanence: "seasonal", note: "the famous sequined + beaded + crystal Baguettes (a signature of the 1,000+ variations)", sort_order: 4 },
  { axis: "material", value: "Embroidered", permanence: "seasonal", note: "embroidered / brocade / tapestry editions, per-listing", sort_order: 5 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "crocodile / python / ostrich / lizard, limited runs", sort_order: 6 },
  { axis: "material", value: "Fur", permanence: "seasonal", note: "shearling / fur-trimmed / 'teddy' editions (Fendi's founding fur craft), per-listing", sort_order: 7 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "tobacco/chocolate brown (incl. the Tobacco Zucca Baguette); descriptor", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/greige neutral; descriptor", sort_order: 3 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring pink Baguette (descriptor); near-permanent (permanence soft)", sort_order: 5 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red family (descriptor); near-permanent (permanence soft)", sort_order: 6 },
];
```

**Sourcing note (Fendi Baguette).** Model + history from the banked `seasonal-archive/fendi.md` (high
confidence, Fashionphile Herstory + Luxury London + Harper's): the Baguette is **Silvia Venturini
Fendi's 1997** short shoulder bag (tucked under the arm "like a loaf of bread," **FF flap clasp**),
**THE original "It bag"** made famous by *Sex and the City* ("It's not a bag, it's a Baguette!"),
**discontinued in the 2000s, revived 2019**, with its **25th anniversary opening NYFW in Sept 2022** and
**more than 1,000 variations** to date. Sizes/cm this run: **the-hosta "Fendi Baguette Size Guide"** and
**Sellier Knightsbridge** give **Nano 11 x 6.5 x 2.5 cm, Mini 19 x 11.5 x 4 cm, Medium 27 x 15 x ~6 cm**;
**Rebag** places the **Mini between the Nano and the Medium** (7.5 x 4.5 x 1.6 in) and notes a **Pico**
charm below the Nano; the oversized **Large/Grande** is the least common. **MATERIAL-PRIMARY encoding:**
the Baguette's identity is the **surface** (`fendi.md`: 1,000+ variations across Zucca canvas, sequins,
exotics, fur), so material carries the run — **Leather** default, **FF/Zucca Canvas** permanent, and the
sequined/embroidered/Selleria/exotic/fur treatments seasonal. **The colour rule is the load-bearing
Fendi fact:** `fendi.md` §3 confirms **Fendi does NOT name its colours** (Black, Tobacco, "Spring
Turquoise" are plain shade descriptors), so the colour rows are **descriptors, not house names**.
**Defaults:** size **Medium** (the reference SATC size); material **Leather**; colour **Black**.
**MEDIUM, hold these:** (1) **Nano/Large permanence** — the Nano is a recent charm size and the Large is
uncommon, both seeded seasonal; cm approximate. (2) **Pink/Red permanence** — recurring descriptor
families, flagged soft. **Deliberately omitted, sourced:** the **Baguette Chain** and **Baguette Chain
Midi/on-Leather** (chain-strap formats) are captured **per-listing as a strap/format variant**, not as
sizes — they are the same Baguette body on a chain; the **Mamma/Mama Baguette** (the SS2025 soft
drawstring reissue) and the **Roll bag** are separate models, not Baguette sizes, so neither is seeded
(a null beats false structure); **no hardware axis** — the FF flap clasp is the fixed signature.

---

## STYLE 5 — Chanel 22 (style_id 431)

Chanel **colour-primary**, encoded like the Classic Flap / Chanel 19: the 2022 **Virginie Viard**
drawstring shopping hobo. Axes: **size** (Mini / Small / Medium / Large — the label run is messy),
**material** (shiny calfskin default + grained calfskin + tweed + patent), **construction** (the 22's
signature **oversized diamond quilt**), **hardware** (gold-tone chain + the "22" metal plate/charm — a
real, noted signature), and **colour** (Chanel permanent anchors only — Chanel does **not** officially
name its seasonal colours).

```ts
// Chanel 22 (style 431), archivist-sourced 2026-07-13 (luxbags.fr "Chanel 22: A Guide to Sizes and
// Style" + cocoapproved "19 22 31 Chanel Handbag Size Guide" for Mini/Small/Medium/Large cm; chanel.com
// CHANEL 22 PLP confirms the shiny leather + the current Mini/Small/Medium run; material + quilting +
// permanent palette from seasonal-archive/chanel.md). Launched Spring/Summer 2022, Virginie Viard,
// named for the year 2022. COLOUR-PRIMARY: Chanel does NOT name seasonal colours — seed only the
// permanent palette, everything else per-listing + season code. The gold chain + "22" plate is the
// signature; the oversized diamond quilt is the defining construction. cm approximate (reseller inches).
const CHANEL_22: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~18 x 20 x 6.5 cm; the compact 22, added after launch; the crossbody format", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~29 x 32 x 7.5 cm (11.4 x 12.6 x 3 in); the everyday reference 22 (MEDIUM: reseller size labels overlap — 'Small' vs 'Medium' varies, verify per listing)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~35 x 37 x 7 cm; the mid drawstring hobo (labels overlap the Small; verify per listing)", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~42 x 39 x 8 cm; the oversized shopper, the launch statement size (MEDIUM: cm approximate)", sort_order: 4 },
  { axis: "material", value: "Shiny Calfskin", permanence: "permanent", is_default: true, note: "the soft shiny (glossy) calfskin; the launch leather + signature look of the 22", sort_order: 1 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "grained/caviar-like calfskin, sturdier, holds shape", sort_order: 2 },
  { axis: "material", value: "Tweed", permanence: "seasonal", note: "tweed body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Patent", permanence: "seasonal", note: "patent/shiny-crackled seasonal editions", sort_order: 4 },
  { axis: "construction", value: "Diamond (oversized)", permanence: "permanent", is_default: true, note: "the 22's signature large diamond quilt; the defining look (not the tight Classic-Flap diamond)", sort_order: 1 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone chain + the '22' metal plate/charm; the signature, near-universal", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone chain + '22' plate; the co-standard finish", sort_order: 2 },
  { axis: "hardware", value: "Aged gold", permanence: "seasonal", note: "antiqued gold on some seasonal 22s", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry to bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];
```

**Sourcing note (Chanel 22).** Model: the **CHANEL 22** launched **Spring/Summer 2022** — **Virginie
Viard's** drawstring shopping-hobo, **named for the year 2022** — a soft, slouchy bucket-tote with a
large diamond quilt, a chain-and-leather shoulder strap, and a gold **"22" metal plate/charm**. Sizes:
the **luxbags.fr "Chanel 22: A Guide to Sizes and Style"** (captured 2026-07-13) gives **Mini
18 x 20 x 6.5 cm** and **Small 29 x 32 x 7.5 cm**; **cocoapproved's "19 22 31" size guide** lists **Mini
18 x 19 x 6.3 cm**, a **Small at 35 x 37 x 7 cm**, and a larger third size — and the **chanel.com CHANEL
22 PLP** confirms the current run in **shiny leather** with a **Mini handbag** among the live options.
Construction, hardware, and the permanent palette are reused from `seasonal-archive/chanel.md`. **MEDIUM,
hold these:** (1) **The size labels are genuinely messy** — resellers disagree on where "Small" ends and
"Medium" begins (luxbags' Small is 29 x 32 cm, cocoapproved's Small is 35 x 37 cm), and the launch
statement size is the **Large**; I seeded **Mini / Small (default) / Medium / Large** and flagged the
label overlap — verify the exact size per listing rather than trusting the word. (2) **Small-vs-Medium
default** — I set **Small** as default (the everyday reference on the current market); if resale volume
skews larger, revisit. (3) **Large cm** are a reseller composite, approximate. **The colour rule holds:**
Chanel does **not** officially name its seasonal colours, so only the five permanent anchors are seeded —
the 22's seasonal brights (the pinks, greens, blues, metallics on the resale floor) are captured
**per-listing as descriptor + season code** (e.g. "22S coral"), never seeded as fake named options.
**Deliberately omitted, sourced:** the brief floated a **"22 WOC"** — I could not source a dedicated
Chanel 22 Wallet on Chain this run; the compact 22 format is the **Mini** (seeded), so no separate WOC
size is invented (a null beats false structure). The 22's **coin purse / SLG** formats are captured
per-listing, not as bag sizes; there is **no Chevron 22** — the 22 carries one honest oversized-diamond
construction value.

---

## STYLE 6 — Gucci Diana (style_id 451)

Gucci, faceted **size × material × colour**, **DESCRIPTOR colours only** (Gucci does **not** name its
colours — house-confirmed). Axes: **size** (Mini / Small / Medium / Large), **material** (leather
default — the bamboo-handle tote — + GG Supreme canvas + exotic), and **colour** (descriptor anchors,
explicitly not house names). The **heat-bent bamboo handles + the removable coloured leather belts** are
the fixed Diana signatures — noted, not an axis.

```ts
// Gucci Diana (style 451), archivist-sourced 2026-07-13 (gucci.com Diana Small + Medium tote PDPs
// confirm the current run; a Diana Mini spec gives 20 x 16 x 10 cm; model = 1991 bamboo-handle tote with
// removable leather belts, a Princess Diana favourite, reissued by Michele 2021 in three sizes, from
// seasonal-archive/gucci.md + gucci.jsonl; bamboo handle motif born 1947; colour treatment from chrome-
// com-colors-2026.md — GUCCI DOES NOT NAME ITS COLOURS, descriptors only). Faceted size × material ×
// colour. Colour anchors are DESCRIPTORS, not house names. NO hardware axis (the bamboo handles + the
// removable coloured belts are the fixed signature). cm approximate (small/medium/large a reseller composite).
const GUCCI_DIANA: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 16 x 10 cm; the compact bamboo-handle tote, a popular current size", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~27 x 24 x 11 cm; the reference Diana tote, most cross-shopped (MEDIUM: cm approximate; default vs Medium is soft)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~35 x 30 x 15 cm; the classic tote proportion (the size closest to Princess Diana's) (MEDIUM: cm approximate)", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "~40 cm; the roomiest carryall, less common (MEDIUM: cm approximate)", sort_order: 4 },
  { axis: "material", value: "Leather", permanence: "permanent", is_default: true, note: "smooth calfskin; the everyday bamboo-handle Diana, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", note: "beige/ebony coated GG Supreme canvas with leather trim; the logo Diana", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body (the 1991 original debuted in beige suede); recurring runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Print", permanence: "seasonal", note: "lizard / python / print + special editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory leather; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring light-pink Diana (descriptor); near-permanent (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Gucci Diana).** Model + history from the banked `seasonal-archive/gucci.md`/`.jsonl`
(high confidence, LuisaViaRoma + Marie Claire + Christie's): the Diana is a **bamboo-handle tote with
removable coloured leather belts** on the handles, **debuted 1991** (in beige suede), a **Princess Diana
favourite**, **reissued by Alessandro Michele in 2021 in three sizes**; the **heat-bent bamboo handle**
motif was born of a **1947** post-war leather shortage. Sizes/cm this run: **gucci.com's Diana Small tote
and Medium tote PDPs** confirm both are current tote sizes (the PDPs give strap drops; body cm are a
reseller composite), and a **Diana Mini spec gives 20 x 16 x 10 cm**. The **colour treatment is the
load-bearing Gucci fact**: `chrome-com-colors-2026.md` (Chrome capture of gucci.com, 2026-06-28)
house-confirms Gucci labels colours as **plain descriptors + material**, so the five colour rows are
**descriptor anchors, explicitly not house names** (the lone genuinely-named Gucci house colour, **Rosso
Ancora**, is De Sarno-era SS2024 and not a Diana staple, so it is not seeded). **Defaults:** size
**Small** (the reference reissue tote, most cross-shopped); material **Leather** (the bamboo-handle
tote); colour **Black**. **MEDIUM, hold these:** (1) **Small/Medium/Large cm** — I did not pin an
official body-cm table for these three this run (gucci.com PDPs give strap drops, not body dims), so the
cm are a reseller composite, flagged approximate; only the **Mini (20 x 16 x 10 cm)** is directly
sourced. (2) **Small-vs-Medium default** — Small is set default as the reference, but the Medium is the
proportion closest to the 1991 original; soft default. (3) **Large** — seeded seasonal (less common in
the current lineup). (4) **Red/Pink permanence** — recurring descriptor families, flagged soft.
**Deliberately omitted, sourced:** **no hardware axis** — the **bamboo handles** and the **removable
coloured leather belts** are the fixed Diana signatures (the belts add the colour pops, but they are part
of the bag, not a separate shopper axis), matching how the Bamboo 1947 handle and Dionysus spur clasp
were handled; the Diana's **coin-purse / mini-bag on a belt** SLG formats are captured per-listing, not
seeded as sizes.

---

## Two things to wire when you paste

1. Register all six in the `STYLES` array:
   `{ styleId: 454, name: "Book Tote", rows: DIOR_BOOK_TOTE }`,
   `{ styleId: 205, name: "Peekaboo", rows: FENDI_PEEKABOO }`,
   `{ styleId: 460, name: "Loulou", rows: YSL_LOULOU }`,
   `{ styleId: 204, name: "Baguette", rows: FENDI_BAGUETTE }`,
   `{ styleId: 431, name: "Chanel 22", rows: CHANEL_22 }`,
   `{ styleId: 451, name: "Diana", rows: GUCCI_DIANA }`.
   (The style_ids are confirmed from the DB per the brief; re-confirm against the `style` table before writing.)
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; booktote-peekaboo-loulou-baguette-chanel22-diana-production-matrix.md"` so the provenance string
   stays honest.
</content>
</invoke>
