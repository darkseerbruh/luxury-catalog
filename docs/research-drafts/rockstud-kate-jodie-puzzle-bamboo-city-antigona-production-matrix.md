# Valentino Rockstud + YSL Kate + Bottega Jodie + Loewe Puzzle + Gucci Bamboo 1947 + Balenciaga City + Givenchy Antigona — production matrices (selector seed)

*Archivist run 2026-07-13. Same shape and rigor as `booktote-peekaboo-loulou-baguette-chanel22-diana-production-matrix.md`
and `kelly-woc-saddle-chanel19-dionysus-horsebit-production-matrix.md`: one reviewed source-of-truth list
per style, NOT a full combination matrix. Each axis value traces to a cited, dated source; anything I could
not source is hedged (MEDIUM) or omitted, never invented. Seven sections, each a ready `Row[]` to paste into
`load-production-options.ts`.*

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. There is no `line` field,
so sub-line info (Iconic vs ISeeU, Teen-rename, etc.) is folded into `note`.

**Colour-naming camp per house — checked against the banked archive and stated up front (this is the moat):**
- **Bottega Veneta — NAMES its colours (deep proprietary lexicon).** Parakeet is house-confirmed official;
  Fondant / Barolo / Travertine / Porridge are house-confirmed or reseller-attributed (MEDIUM). Source:
  `seasonal-archive/bottega-veneta.md` §3 + `bottega-veneta.jsonl` (colour rows) + `chrome-com-colors-2026.md`.
- **Gucci — does NOT name its colours (descriptors only).** The lone genuinely-named house colour is Rosso
  Ancora (De Sarno SS2024), not a Bamboo staple. Source: `chrome-com-colors-2026.md` + `gucci.md`.
- **Saint Laurent (YSL) — names permanents as plain DESCRIPTORS only** (Noir/Blanc/Rouge/Dark Beige); the
  **hardware tone (gold vs silver Cassandre) is the axis that carries the naming weight**. Established last
  run; source: `saint-laurent.md` §3.
- **Loewe — the MIDDLE case.** It DOES publish per-season colour names (loewe.com SS24 Flamenco: Emerald
  Green, Dark Burgundy, Sahara, Black; chrome-capture Squirrel / Lemon / Dark Chestnut / Soft White,
  code-keyed in the SKU tail) but mostly **descriptively**, with the occasional evocative name (Sahara). More
  than Dior/Gucci, less than Hermès/Bottega. Source: `loewe.md` + `loewe.jsonl` + `chrome-com-colors-2026.md`.
- **Balenciaga — NAMES its colours richly (a Bottega-camp house).** A deep by-season, by-year named lexicon
  with a four-digit colour code on the interior tag; Black / White / Anthracite run every season (the
  permanents), the rest rotate with named seasonals (e.g. Sang 2010, Bleu Lavande 2011). Source: PurseForum
  "Balenciaga Color Information by Season and Code" + Yoogi's Balenciaga Information Guide, both captured
  2026-07-13. NOT previously in the banked archive — sourced fresh this run.
- **Valentino — mostly DESCRIPTORS, with a small signature house lexicon.** Product pages read as descriptor +
  material, but Valentino does keep a few genuine house colour names: **Rosso Valentino** (the house red) and
  **Poudre** (the signature powder-pink nude), plus **PP Pink** (Pierpaolo Piccioli Pink, FW22, worklist-
  sourced). Seeded descriptor anchors + the two signature names flagged MEDIUM (Rosso Valentino / Poudre not
  freshly re-sourced this run). NOT previously in the banked archive.
- **Givenchy — DEFAULTED to descriptor (unsourced this run, and I say so).** Givenchy is not in the banked
  archive and I found no fresh source establishing a proprietary colour lexicon; the product-page convention
  is descriptor + material, so the colour rows are **descriptor anchors, flagged as a default not a
  confirmation**. Revisit if a Givenchy naming source surfaces.

New this run (2026-07-13, all free-tier Firecrawl): Spotted Fashion "Valentino Rockstud Tote Bag Reference
Guide" (Small/Medium/Large shopper cm; Rockstud debut SS2011 Chiuri/Piccioli) + Carter's + PurseBlog for the
Rockstud dims; luxbags.fr "YSL Kate Size Guide" + eBay Kate listing dims + PurseForum Kate thread (gold-vs-
silver + tassel); saclab + luxbags.fr + bottegaveneta.com Jodie size guides (Mini/Small/Teen-rename cm);
luxbags.fr + Fashionphile + Rebag "Loewe Puzzle Size Guide" (Nano/Mini/Small/Medium cm); bragmybag +
luxbags.fr "Gucci Bamboo 1947 Size Guide" (Super Mini/Mini/Small cm); luxbags.fr + collectorscage + Reddit
r/handbags "Balenciaga City Size Guide" (Nano/Mini/City cm + gold/silver/rose-gold hardware) + Yoogi's +
PurseForum (the named-colour-by-year + four-digit-code system); handbagholic + PurseBlog + givenchy.com
"Givenchy Antigona Size Guide" (Mini/Small/Medium cm + grained-leather default).

---

## STYLE 1 — Valentino Rockstud (style_id 674)

Valentino, faceted **size × material × colour × hardware**. The Rockstud is the house's pyramid-studded line
(debuted **Spring/Summer 2011**, Maria Grazia Chiuri + Pierpaolo Piccioli). Axes: **size** (the tote/shoulder
run Small/Medium/Large), **material** (smooth calf default + grained + denim + exotic + embellished),
**colour** (descriptor anchors + the two signature house names), and **hardware** — the **stud tone** (pale
gold / ruthenium / rose gold / tonal) is a genuine shopper choice, so it earns an axis.

```ts
// Valentino Rockstud (style 674), archivist-sourced 2026-07-13 (Spotted Fashion "Valentino Rockstud Tote Bag
// Reference Guide" for Small/Medium/Large shopper cm + the SS2011 Chiuri/Piccioli debut; Carter's + PurseBlog
// for dims). Faceted size × material × colour × hardware. Valentino is MOSTLY a DESCRIPTOR house with a small
// signature lexicon (Rosso Valentino, Poudre, PP Pink FW22) — colour anchors are descriptors + those two named
// signatures (MEDIUM). The STUD TONE is a real axis (pale-gold "platino" is the signature). The Rockstud Spike
// (quilted chain) + Rockstud Lock/Glam Lock flap + Rockstud Loco top-handle are separate models, per-listing.
// cm approximate (converted from the reference guide's inches). Core tote/shoulder run only.
const VALENTINO_ROCKSTUD: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", note: "~26 x 21 x 10 cm (10.3 x 8.2 x 4 in); the Small Shopper Tote / small crossbody scale, the entry size", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~33 x 25 x 15 cm (13 x 10 x 6 in); the Medium Shopper Tote, the reference Rockstud", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "~51 x 28 x 15 cm (20 x 11 x 6 in); the Large Shopper Tote (often exotic), the roomiest, less common (MEDIUM: cm from an older reference guide)", sort_order: 3 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", is_default: true, note: "smooth calfskin; the everyday Rockstud, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Grained Calf", permanence: "permanent", note: "grained/pebbled calfskin, sturdier, holds shape", sort_order: 2 },
  { axis: "material", value: "Denim", permanence: "seasonal", note: "denim-body Rockstud shopper (a recurring seasonal run, sourced)", sort_order: 3 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / crocodile; the large shopper's signature exotic runs", sort_order: 4 },
  { axis: "material", value: "Embellished", permanence: "seasonal", note: "crystal-covered / 'Pop' printed / Memetic editions, per-listing", sort_order: 5 },
  { axis: "hardware", value: "Platino (pale gold)", permanence: "permanent", is_default: true, note: "the signature light/pale-gold pyramid studs; near-universal (MEDIUM: stud-tone list not pinned to one dated source this run)", sort_order: 1 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark gunmetal studs; the edgier finish (MEDIUM)", sort_order: 2 },
  { axis: "hardware", value: "Rose Gold", permanence: "seasonal", note: "rose-gold studs; intermittent (MEDIUM)", sort_order: 3 },
  { axis: "hardware", value: "Tonal", permanence: "seasonal", note: "matte tone-on-tone studs matching the leather (the 'Noir'/all-black look); recurring (MEDIUM)", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Nero; the anchor (descriptor)", sort_order: 1 },
  { axis: "color", value: "Poudre", permanence: "permanent", note: "Valentino's signature powder-pink nude; a genuine house name (MEDIUM: not re-sourced this run)", sort_order: 2 },
  { axis: "color", value: "Rosso Valentino", permanence: "permanent", note: "the house red; a genuine Valentino colour name (MEDIUM: not re-sourced this run)", sort_order: 3 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/greige neutral; descriptor", sort_order: 4 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. ivory; descriptor", sort_order: 5 },
];
```

**Sourcing note (Valentino Rockstud).** Model + history from **Spotted Fashion's "Valentino Rockstud Tote Bag
Reference Guide"** (spottedfashion.com, published 2013-02-12, captured 2026-07-13): the Rockstud Collection
**debuted at Valentino's Spring/Summer 2011 runway**, the first statement of **Maria Grazia Chiuri + Pierpaolo
Piccioli's** new-look Valentino, defined by the **pyramid studs**. Sizes/cm this run: the same guide gives the
**Small Shopper Tote 10.3 x 8.2 x 4 in (~26 x 21 x 10 cm)**, the **Medium Shopper Tote 13 x 10 x 6 in
(~33 x 25 x 15 cm)**, and the **Large (Python) Shopper Tote 20 x 11 x 6 in (~51 x 28 x 15 cm)**, plus a
Double-Handle Tote (10.2 x 11.4 x 5.5 in) and a North/South Tote (13 x 13.8 x 7 in); **Carter's** confirms a
small Rockstud tote at **21 x 26 x 10 cm** and **PurseBlog** confirms the flap/shoulder at 10.2 x 5.5 in.
**The colour finding, stated honestly:** Valentino reads mostly as a **descriptor** house on product pages
(colour + material), but it keeps a **small genuine house lexicon** — **Rosso Valentino** (the house red) and
**Poudre** (the signature powder-pink nude), plus **PP Pink** (Pierpaolo Piccioli Pink, FW22, sourced in the
worklist's Vogue De Sarno cross-house note). So Valentino sits in the descriptor camp *with* a couple of named
signatures — seeded as such, the two names flagged **MEDIUM** (not re-sourced this run). **Defaults:** size
**Medium** (the reference shopper); material **Smooth Calf**; hardware **Platino/pale gold** (the signature);
colour **Black**. **MEDIUM, hold these:** (1) **Stud-tone axis** — the pale-gold "platino" stud is the
verifiable signature; the ruthenium / rose-gold / tonal alternatives are real on the resale floor but I did
not pin a single dated source enumerating all tones this run, so the axis is seeded with the non-default tones
flagged soft. (2) **Large cm** come from a 2013 reference guide, approximate. (3) **Rosso Valentino / Poudre**
as house names are from general house knowledge, not a fresh 2026 capture — flagged MEDIUM. **Deliberately
omitted, sourced:** the **Rockstud Spike** (the quilted-lambskin chain bag with spike studs), the **Rockstud
Lock / Glam Lock** flap-shoulder, and the **Rockstud Loco** top-handle are **separate models**, not sizes of
the tote — captured per-listing, not seeded here (the brief floated Spike/Loco; they are their own bags, so a
null beats false structure); **no construction axis** (the studded trim + flat-tote body are the fixed
signature).

---

## STYLE 2 — YSL Kate (style_id 462)

Saint Laurent, faceted **size × material × colour × hardware** — encoded exactly like the Loulou last run. The
Kate is the house's clean rectangular shoulder/chain bag with the metal **Cassandre** monogram as the front
plaque (often with a **tassel**). Axes: **size** (Nano/Small/Medium), **material** (grain-de-poudre default +
smooth + matelassé + suede + exotic), **colour** (plain DESCRIPTOR anchors), and **hardware** (the **Cassandre
tone**, gold vs silver — the axis that carries YSL's naming weight).

```ts
// YSL Kate (style 462), archivist-sourced 2026-07-13 (luxbags.fr "YSL Kate Size Guide" for Mini/Small cm +
// eBay Kate listing dims + PurseForum "Kate small vs medium, silver vs gold, tassel or no tassel" thread; model
// = the clean Cassandre-plaque shoulder/chain bag, Cassandre monogram A.M. Cassandre 1963, from seasonal-
// archive/saint-laurent.md). YSL does NOT publish a seasonal colour lexicon (established last run, saint-
// laurent.md §3) — plain DESCRIPTOR anchors (Noir/Blanc/Rouge), and the HARDWARE TONE (gold vs silver
// Cassandre) is the axis that carries the real naming weight. The Tassel is a trim variant, not a size (noted).
// cm approximate (converted from inches where noted).
const YSL_KATE: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~17 x 11.5 cm; the Kate Mini/Nano on a chain, the evening/entry size", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~20 x 12.5 x 5 cm (7.8 x 4.9 x 1.9 in, current style); the everyday reference Kate, most liquid on resale", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~24 x 14.5 x 5 cm; the roomier shoulder Kate (MEDIUM: cm approximate)", sort_order: 3 },
  { axis: "material", value: "Grain de Poudre", permanence: "permanent", is_default: true, note: "the pebbled/embossed grain-de-poudre calfskin; the classic Kate leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", note: "smooth calfskin; the polished Kate", sort_order: 2 },
  { axis: "material", value: "Matelasse", permanence: "permanent", note: "chevron/quilted matelassé lambskin (the Kate Chain quilted version)", sort_order: 3 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body (incl. the fringe/tassel suede Kates), recurring runs", sort_order: 4 },
  { axis: "material", value: "Croc-Embossed / Exotic", permanence: "seasonal", note: "croc-embossed or exotic editions, per-listing", sort_order: 5 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone Cassandre; the classic pairing (hardware tone is the axis that carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone Cassandre; equally standard", sort_order: 2 },
  { axis: "hardware", value: "Aged / Brushed", permanence: "seasonal", note: "aged or brushed-tone Cassandre on some seasonal Kates", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the definitive Kate colour, the anchor (plain descriptor, not a seasonal-lexicon name)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (YSL Kate).** Model from `seasonal-archive/saint-laurent.md` (the Cassandre monogram is the
emblem **A.M. Cassandre designed in 1963**, the front plaque on the Kate/Loulou line). Sizes/cm this run:
**luxbags.fr "YSL Kate Size Guide"** (captured 2026-07-13) gives the **Kate Mini at 17 x 11.5 cm** and places
the **Small** above it; an **eBay Kate listing** gives the **current-style Small at 7.8 x 4.9 x 1.9 in
(~20 x 12.5 x 5 cm)** (and the older style at 6.7 x 4.5 x 2 in); the **PurseForum "Kate small vs medium,
silver vs gold, tassel or no tassel" thread** confirms the live shopper axes — **Small vs Medium size**,
**gold vs silver Cassandre**, and **tassel vs no tassel**. **The colour rule holds from last run:**
`saint-laurent.md` §3 — YSL does **not** publish a per-season colour dictionary; the bag is identified by
**model + material + hardware tone**, colours are **plain descriptors** (Noir, Blanc/Crème, Dark Beige, Rouge,
Storm). **Defaults:** size **Small** (the reference, most liquid); material **Grain de Poudre**; hardware
**Gold**; colour **Black/Noir**. **MEDIUM, hold these:** (1) **Medium cm** are approximate (a reseller
composite; luxbags pins the Mini and Small cleanly, the Medium less so). (2) **Red/Grey permanence** —
recurring descriptor families, flagged soft. **Deliberately omitted, sourced:** the brief listed **"Tassel"**
as a size — it is **not a size**, it is a **trim variant** (the Kate with the hanging Cassandre tassel, which
itself comes in Small/Medium), so it is captured per-listing rather than seeded as a phantom size (a null
beats false structure); the **Kate Supple**, **Sunset**, **Envelope**, and **Le Monogramme** are separate
models, not Kate sizes; **no invented seasonal colour names** — the season's Kate shades are captured
per-listing as descriptor.

---

## STYLE 3 — Bottega Jodie (style_id 210)

Bottega Veneta, **colour-primary** (BV NAMES its colours) with a real size and weave axis. The Jodie is Daniel
Lee's knotted **Intrecciato** hobo (2020), defined by the top knot. Axes: **size** (Mini/Small/Medium/Large —
BV renamed the run, noted), **material** (Intrecciato weave default + Padded + Nappa + suede + exotic), and
**colour** (BV named anchors — Nero + Parakeet + the reseller/house-confirmed named neutrals).

```ts
// Bottega Veneta Jodie (style 210), archivist-sourced 2026-07-13 (saclab "Bottega Veneta Jodie" + luxbags.fr
// Jodie size guide + bottegaveneta.com Mini/Small Jodie PDPs for cm; model = Daniel Lee's knotted Intrecciato
// hobo, 2020, from seasonal-archive/bottega-veneta.md; named-colour lexicon from bottega-veneta.jsonl +
// chrome-com-colors-2026.md). COLOUR-PRIMARY: BV NAMES its colours (Parakeet house-confirmed official; the
// named neutrals house-confirmed or reseller-attributed, MEDIUM). Size × weave × named colour. NO hardware
// axis (the Chain Jodie is per-listing). cm from the reseller guides (BV renamed Teen->Small, noted).
const BV_JODIE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", is_default: true, note: "~28 x 23 x 8 cm; the cult knotted Intrecciato hobo, the most liquid Jodie (default vs Small is soft)", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~36 x 21 x 13 cm; formerly 'Teen Jodie' (BV renamed the run), the mid shoulder size", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger everyday hobo (cm not cleanly pinned this run, MEDIUM)", sort_order: 3 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the original oversized knotted hobo (Lee's 2020 launch proportion), less common now (MEDIUM: cm not sourced)", sort_order: 4 },
  { axis: "material", value: "Intrecciato", permanence: "permanent", is_default: true, note: "the signature woven nappa/lambskin Intrecciato; the base Jodie weave", sort_order: 1 },
  { axis: "material", value: "Padded Intrecciato", permanence: "permanent", note: "the puffy padded weave; a signature Jodie finish", sort_order: 2 },
  { axis: "material", value: "Nappa", permanence: "permanent", note: "smooth nappa (non-woven) Jodie", sort_order: 3 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede / other seasonal finishes", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "lizard / crocodile / metallic special editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; Nero, the easiest Jodie to source", sort_order: 1 },
  { axis: "color", value: "Parakeet", permanence: "seasonal", note: "BV's signature acid-green house colour (OFFICIAL, Daniel Lee 2021); recurs but rotates", sort_order: 2 },
  { axis: "color", value: "Fondant", permanence: "seasonal", note: "deep warm chocolate; house-confirmed/reseller-attributed BV name (MEDIUM)", sort_order: 3 },
  { axis: "color", value: "Barolo", permanence: "seasonal", note: "deep burgundy; reseller-attributed BV name (MEDIUM)", sort_order: 4 },
  { axis: "color", value: "Travertine", permanence: "seasonal", note: "light olive-beige; house-confirmed BV name (Chrome 2026-06-28) (MEDIUM)", sort_order: 5 },
  { axis: "color", value: "Porridge", permanence: "seasonal", note: "ivory-beige neutral; reseller-attributed BV name (MEDIUM)", sort_order: 6 },
];
```

**Sourcing note (Bottega Jodie).** Model from `seasonal-archive/bottega-veneta.md`: the Jodie is **Daniel
Lee's** knotted-handle **Intrecciato** hobo (**2020**), named informally for Jodie Foster (who carried a
1990s BV hobo), the top **knot** its signature. Sizes/cm this run: **saclab's "Bottega Veneta Jodie"** guide
(captured 2026-07-13) gives **Mini 28 x 23 x 8 cm** and **Small (formerly "Teen Jodie") 36 x 21 x 13 cm**, and
notes BV **renamed the run** (Teen->Small, etc.); **luxbags.fr** cross-confirms the Mini/Small; and
**bottegaveneta.com** carries live **Mini Jodie** and **Small Jodie** PDPs. **The colour treatment is the
load-bearing BV fact:** `bottega-veneta.jsonl` marks **Parakeet** as house-confirmed **official** (Daniel Lee's
signature acid green), and a deep list of named neutrals/reds/greens (Fondant, Barolo, Travertine, Porridge,
Bordeaux, Sauge, etc.) as house-confirmed (Chrome 2026-06-28) or reseller-attributed — so BV is the **deep-
lexicon "names its colours" camp**, and the colour rows are **real BV colour names** (the reseller-attributed
ones flagged MEDIUM). This reuses the exact anchors seeded for the Cassette last run, so no credits re-spent.
**Defaults:** size **Mini** (the cult size, most liquid); material **Intrecciato**; colour **Black/Nero**.
**MEDIUM, hold these:** (1) **Size run** — BV's rename (Teen->Small) muddies the labels; I seeded
**Mini / Small (formerly Teen) / Medium / Large** with cm only where saclab pins them cleanly (Mini, Small);
Medium/Large cm are not cleanly sourced this run, flagged. (2) **Mini-vs-Small default** — Mini is the cult
resale size; soft default. (3) **Named colours other than Parakeet** are house-confirmed or reseller-attributed
(MEDIUM), never promoted above their evidence. **Deliberately omitted, sourced:** **no hardware axis** — the
Jodie's knot is leather, not metal; the **Chain Jodie** (added chain strap) is a per-listing format, not a size.

---

## STYLE 4 — Loewe Puzzle (style_id 504)

Loewe, faceted **size × material × colour**. The Puzzle is **Jonathan Anderson's** first bag (2015), the
origami box **patchworked from leather panels** that folds flat. Axes: **size** (Nano/Mini/Small/Medium/Large),
**material** (classic calfskin default + grained + soft-grain + suede + satin/embossed Anagram + exotic), and
**colour** (Loewe is the **MIDDLE case** — it names seasonal colours but mostly descriptively; seed descriptor
anchors + note the regime).

```ts
// Loewe Puzzle (style 504), archivist-sourced 2026-07-13 (luxbags.fr "Loewe Puzzle Size Guide" for
// Nano/Mini/Small/Medium cm + Fashionphile + Rebag for Nano/Small/Medium/Large; model = Jonathan Anderson's
// FIRST bag, 2015, the origami leather-patchwork box that folds flat, from seasonal-archive/loewe.md +
// loewe.jsonl). COLOUR = the MIDDLE CASE: Loewe DOES publish seasonal colour names (SS24 Flamenco: Emerald
// Green/Dark Burgundy/Sahara/Black; chrome-capture Squirrel/Lemon/Dark Chestnut/Soft White, code-keyed) but
// mostly DESCRIPTIVELY — more than Dior/Gucci, less than Hermès/Bottega. Seed descriptor anchors + note.
// NO hardware axis (the Puzzle's hardware is fixed/minimal). cm from the reseller guides.
const LOEWE_PUZZLE: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~12.5 x 8.5 x 5.4 cm; the micro Puzzle, evening/charm scale", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~19 x 13 x 8 cm; the compact crossbody Puzzle", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~24 x 16 x 10.5 cm; the reference everyday Puzzle, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~28-29 x 19 x 14 cm; the roomier Puzzle (a longer shoulder-carry medium was added recently)", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the largest Puzzle, less common (MEDIUM: cm not cleanly pinned this run)", sort_order: 5 },
  { axis: "material", value: "Classic Calfskin", permanence: "permanent", is_default: true, note: "smooth classic calfskin; the original folds-flat Puzzle, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "pebbled/grained calfskin, sturdier", sort_order: 2 },
  { axis: "material", value: "Soft Grained", permanence: "permanent", note: "soft-grain calfskin (the lighter, slouchier Puzzle)", sort_order: 3 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede / satin-calf / metallic seasonal runs", sort_order: 4 },
  { axis: "material", value: "Anagram / Jacquard", permanence: "seasonal", note: "embossed-Anagram or repeat-Anagram jacquard-canvas Puzzles", sort_order: 5 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "lizard / python / croc-embossed editions, per-listing", sort_order: 6 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor (Loewe names it descriptively 'Black')", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "the natural/tan Puzzle, a standing neutral (descriptor; e.g. 'Dark Chestnut')", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. 'Soft White' (Loewe's house-named soft off-white); descriptor-leaning", sort_order: 3 },
  { axis: "color", value: "Green", permanence: "permanent", note: "the recurring Loewe green (e.g. 'Emerald Green' SS24 Flamenco); descriptive house name (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Burgundy", permanence: "permanent", note: "the recurring oxblood/burgundy (e.g. 'Dark Burgundy' SS24); descriptive house name (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Loewe Puzzle).** Model + history from the banked `seasonal-archive/loewe.md`/`.jsonl` (high
confidence, Vogue + Fashionphile + Christie's): the Puzzle is **Jonathan Anderson's first bag** (**men's spring
2015**), an **origami box precisely patchworked from leather panels** that **folds flat** — Loewe's first new
shape since the 1980s, handcrafted in Madrid. Sizes/cm this run: **luxbags.fr "Loewe Puzzle Size Guide"**
(captured 2026-07-13) gives **Nano 12.5 x 8.5 x 5.4 cm, Mini 19 x 13 x 8 cm, Small 24 x 16 x 10.5 cm, Medium
28-29 x 19 x 14 cm**; **Fashionphile** and **Rebag** confirm the **Nano / Small / Medium** run and add a
**Large**; and **loewe.com** notes the recently-added **Medium with a longer shoulder-carry handle**. **The
colour finding is the honest one:** `loewe.md` establishes Loewe as the **MIDDLE case** — it **does** publish
per-season colour names (loewe.com SS24 Flamenco: **Emerald Green, Dark Burgundy, Sahara, Black**; the
chrome-capture Tier-2 list **Squirrel / Lemon / Dark Chestnut / Soft White**, code-keyed in the SKU tail) but
mostly **descriptively**, with the odd evocative name (Sahara). So the colour rows are **descriptor-leaning
house names** — more named than Gucci/Dior, less proprietary than Hermès/Bottega — seeded as anchors with the
regime noted, never invented. **Defaults:** size **Small** (the reference); material **Classic Calfskin**;
colour **Black**. **MEDIUM, hold these:** (1) **Large** — seeded seasonal, cm not cleanly pinned this run.
(2) **Green/Burgundy permanence** — recurring but the exact seasonal shade rotates (Emerald Green, Dark
Burgundy are SS24-specific), so seeded permanent + flagged soft. (3) **Colour example-names** (Squirrel, Emerald
Green, etc.) are illustrations of Loewe's descriptive naming, not seeded as fixed options — the season's exact
Puzzle colour is captured per-listing. **Deliberately omitted, sourced:** **no hardware axis** (the Puzzle's
zip + minimal hardware are fixed); the **Puzzle Fold** (the flat origami tote) and the **Puzzle Edge** are
Puzzle-family *models*, not sizes, captured per-listing.

---

## STYLE 5 — Gucci Bamboo 1947 (style_id 449)

Gucci, faceted **size × material × colour**, **DESCRIPTOR colours only** (Gucci does not name). The Bamboo 1947
is the house's original bamboo-handle top-handle (the **heat-bent bamboo handle** born of a 1947 post-war
leather shortage). Axes: **size** (Super Mini/Mini/Small/Medium), **material** (leather default + suede +
exotic), and **colour** (descriptor anchors). The **bamboo handle + the piston push-lock** are fixed — no
hardware axis.

```ts
// Gucci Bamboo 1947 (style 449), archivist-sourced 2026-07-13 (bragmybag "Gucci Bamboo 1947 Bag" for
// Mini/Small cm + luxbags.fr "Size Guide of Gucci Bamboo 1947" for Super Mini cm; model = Gucci's original
// bamboo-handle top-handle, heat-bent bamboo handle born 1947, orig. product no. 0633, from seasonal-archive/
// gucci.md + gucci.jsonl + the Christie's Bamboo/Horsebit/Jackie collecting guide; colour from chrome-com-
// colors-2026.md — GUCCI DOES NOT NAME ITS COLOURS, descriptors only). Faceted size × material × colour.
// Colour anchors are DESCRIPTORS, not house names. NO hardware axis (the bamboo handle + piston lock are fixed).
// cm approximate (converted from the reseller guides' inches).
const GUCCI_BAMBOO_1947: Row[] = [
  { axis: "size", value: "Super Mini", permanence: "seasonal", note: "~12 x 10 x 5.5 cm; the micro evening bamboo-handle, recent addition", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~17 x 12 x 7.6 cm (6.7 x 4.7 x 3 in); the popular compact top-handle", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~21 x 15 x 7 cm (8.3 x 6 x 2.8 in); the reference Bamboo 1947, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger top-handle/tote proportion, less common (MEDIUM: cm not cleanly pinned this run)", sort_order: 4 },
  { axis: "material", value: "Leather", permanence: "permanent", is_default: true, note: "smooth calfskin; the everyday bamboo-handle 1947, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body; recurring seasonal runs", sort_order: 2 },
  { axis: "material", value: "Exotic / Print", permanence: "seasonal", note: "lizard / python / ostrich + print special editions, per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/beige neutral family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Brown", permanence: "permanent", note: "the tobacco/chocolate brown family; descriptor (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Gucci Bamboo 1947).** Model + history from the banked `seasonal-archive/gucci.md`/`.jsonl`
(auction-grade, Christie's "Gucci's Bamboo, Horsebit and Jackie" collecting guide + Sotheby's): the Bamboo 1947
is **Gucci's inaugural bamboo design** (original product no. **"0633"**), its **heat-bent bamboo handle** born
of a **1947** post-war leather shortage and now a house signature; it has "appeared on medium, small and mini"
bags (Christie's). Sizes/cm this run: **bragmybag "Gucci Bamboo 1947 Bag"** (captured 2026-07-13) gives the
**Mini at 17.02 x 11.94 x 7.62 cm (6.7 x 4.7 x 3 in)** and the **Small at 21.08 x 15.24 x 6.99 cm (8.3 x 6 x
2.8 in)**; **luxbags.fr "Size Guide of Gucci Bamboo 1947"** adds the **Super Mini (~12 cm)**; **Fashionphile**
confirms the bag runs in "many sizes, colors, and materials." **The colour rule is the load-bearing Gucci
fact:** `chrome-com-colors-2026.md` (Chrome capture of gucci.com, 2026-06-28) house-confirms Gucci labels
colours as **plain descriptors + material**, so the five colour rows are **descriptor anchors, explicitly not
house names** (the lone genuinely-named Gucci house colour, **Rosso Ancora**, is De Sarno-era SS2024 and not a
Bamboo staple, so it is not seeded). **Defaults:** size **Small** (the reference); material **Leather**;
colour **Black**. **MEDIUM, hold these:** (1) **Medium cm** are not cleanly pinned this run (the reseller
guides lead with Super Mini/Mini/Small); flagged. (2) **Super Mini permanence** — a recent micro size, seeded
seasonal. (3) **Red/Brown permanence** — recurring descriptor families, flagged soft. **Deliberately omitted,
sourced:** **no hardware axis** — the **bamboo handle** and the **piston-style push-lock** are the fixed
signatures (their finish tracks the colorway), matching how the Diana bamboo handle and Marmont Double-G were
handled; the **Bamboo 1947 Mini Top Handle vs the Bamboo tote/shoulder** stay one size axis (resellers
cross-shop by size), and the vintage **Bamboo Bag (1955-era)** is a separate heritage model, not a Bamboo 1947
size.

---

## STYLE 6 — Balenciaga City (style_id 568)

Balenciaga, faceted **size × material × colour × hardware**, and — the finding — **Balenciaga NAMES its
colours** (a Bottega-camp house). The City is the moto/"motorcycle" bag (Nicolas Ghesquière era, the Le City
reissue live now), defined by the studded-and-buckled **moto hardware** and the tassel zips. Axes: **size**
(Nano/Mini/Small/City/Work), **material** (lambskin default + goatskin/grained), **hardware** (the moto
hardware tone — silver default, gold, rose gold; Regular vs Giant stud size noted), and **colour** (the
permanents Black/White/Anthracite + the deep named-seasonal-by-year lexicon, captured per-listing with codes).

```ts
// Balenciaga City (style 568), archivist-sourced 2026-07-13 (luxbags.fr "Balenciaga City Bag Sizes" +
// collectorscage + Reddit r/handbags for Nano/Mini/City cm; balenciaga.com Le City campaign for the 2001
// launch + reissue; model = the moto bag, Nicolas Ghesquière era, reissued as "Le City"). COLOUR FINDING:
// BALENCIAGA NAMES ITS COLOURS richly (a Bottega-camp house) — a by-season, by-year named lexicon with a
// four-digit colour code on the interior tag (Sang 2010, Bleu Lavande 2011; Black/White/Anthracite every
// season). Source: PurseForum "Balenciaga Color Information by Season and Code" + Yoogi's guide, 2026-07-13.
// Hardware (moto stud/buckle tone: silver/gold/rose gold) is a real axis. cm from the reseller guides.
const BALENCIAGA_CITY: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~18.5 x 12 x 7 cm (7.3 x 4.7 x 2.7 in); the smallest City, worn as a mini crossbody", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~24 x 16 x 9 cm (9.4 x 6.3 x 3.5 in); the popular compact City", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", note: "the Small/'Classic City S'; the mid everyday size", sort_order: 3 },
  { axis: "size", value: "City", permanence: "permanent", is_default: true, note: "~38 x 25 x 13 cm; the original/Classic City, the reference moto bag", sort_order: 4 },
  { axis: "size", value: "Work", permanence: "seasonal", note: "the oversized 'Work' City (XL tote), less common", sort_order: 5 },
  { axis: "material", value: "Lambskin", permanence: "permanent", is_default: true, note: "the signature 'Arena' distressed lambskin; the classic soft moto leather, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Goatskin / Chevre", permanence: "permanent", note: "grained goatskin; the sturdier, more-textured City leather", sort_order: 2 },
  { axis: "material", value: "Grained Calf", permanence: "seasonal", note: "grained calfskin seasonal runs", sort_order: 3 },
  { axis: "hardware", value: "Silver", permanence: "permanent", is_default: true, note: "the aged silver-tone moto studs + buckles (Regular Hardware); the signature", sort_order: 1 },
  { axis: "hardware", value: "Gold", permanence: "permanent", note: "gold-tone moto hardware; a co-standard finish", sort_order: 2 },
  { axis: "hardware", value: "Rose Gold", permanence: "seasonal", note: "rose-gold moto hardware; seasonal (sourced: gold/silver/rose-gold finishes)", sort_order: 3 },
  { axis: "hardware", value: "Giant", permanence: "seasonal", note: "the oversized 'Giant' studs/buckles (vs 'Regular'/'Classic' hardware); a real stud-size choice, in any tone", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor, produced every season", sort_order: 1 },
  { axis: "color", value: "White", permanence: "permanent", note: "produced every season (Balenciaga names it)", sort_order: 2 },
  { axis: "color", value: "Anthracite", permanence: "permanent", note: "the near-black charcoal grey; a Balenciaga house name, produced every season", sort_order: 3 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey family (e.g. 'Gris'); named seasonally (permanence soft)", sort_order: 4 },
];
```

**Sourcing note (Balenciaga City).** Model: the **City** is Balenciaga's moto/"motorcycle" bag from the
**Nicolas Ghesquière** era (the lineage of the 2001 "Lariat"/First), now reissued as **"Le City"** —
**balenciaga.com's Le City campaign** (captured 2026-07-13) dates the first launch to **2001** and lists the
reissue's launch colours (black, yellow, green, light purple, metallic steel grey, metallic silver, white,
blue, beige). Sizes/cm this run: **luxbags.fr "Balenciaga City Bag Sizes"** gives the **Mini at 24 x 16 x 9 cm
(9.4 x 6.3 x 3.5 in)**; **collectorscage** gives the **City at 25 x 38 x 13 cm** and the **Mini at
16 x 25 x 10 cm**; **Reddit r/handbags** pins the **Nano at 7.3 x 4.7 x 2.7 in (~18.5 x 12 x 7 cm)**. **The
colour finding is the headline (and new to the archive):** Balenciaga **names its colours richly** — the
**PurseForum "Balenciaga Color Information by Season and Code"** thread documents a **by-season, by-year named
lexicon** (Sang/Blood 2010, Bleu Lavande 2011, Orange Brûlé 2011, and on back), and **Yoogi's Balenciaga
Information Guide** confirms a **four-digit colour code on the interior tag** with **Black, White and Anthracite
produced every season**. So Balenciaga is a **"names its colours" house in the Bottega camp**, not a descriptor
house — I seeded the **three every-season permanents (Black default, White, Anthracite)** plus a recurring
Grey, and the deep **named seasonals (Bleu Lavande, Sang, etc.) are captured per-listing with their
year + four-digit code**, never seeded as fixed options (they are single-season). **Hardware is a real axis:**
**collectorscage** confirms the moto hardware is "produced in **silver, gold, and rose gold** finishes," and
the **Regular vs Giant** stud size is the other well-known hardware choice — seeded with Silver default.
**Defaults:** size **City** (the reference/Classic); material **Lambskin (Arena)**; hardware **Silver**;
colour **Black**. **MEDIUM, hold these:** (1) **Size labels** — the City run's names shifted over the years
(Classic City / City / Le City; Small vs Mini overlap on resale); I seeded **Nano / Mini / Small / City
(default) / Work** with cm where the guides pin them (Nano, Mini, City) and flagged the Small/Work cm as
unpinned. (2) **"Arena" lambskin** is the classic City leather name; the goatskin/Chevre and grained calf are
the alternates. (3) **Rose Gold / Giant** hardware seeded seasonal. **Deliberately omitted, sourced:** the
**First**, **Part-Time**, **Velo**, **Town**, and **Hourglass** are separate Balenciaga models, not City
sizes; the season's named colours are per-listing (a Bal bag's colour + year + code is the exact answer, so it
belongs on the listing, not as a phantom seeded option).

---

## STYLE 7 — Givenchy Antigona (style_id 585)

Givenchy, faceted **size × material × colour**, **DESCRIPTOR colours (defaulted, unsourced — see note)**. The
Antigona is the house's structured winged-tote/satchel (Riccardo Tisci era), defined by the trapezoid shape and
the split-triangle Givenchy logo panel. Axes: **size** (Nano/Mini/Small/Medium/Large), **material** (grained
calf default + smooth + croc-embossed + exotic), and **colour** (descriptor anchors, flagged default).

```ts
// Givenchy Antigona (style 585), archivist-sourced 2026-07-13 (handbagholic "Complete Guide to the Givenchy
// Antigona" + PurseBlog "The Ultimate Bag Guide: Givenchy Antigona" for Mini/Small/Medium cm + givenchy.com
// Mini Antigona PDP confirming the grained-leather default; model = the structured winged trapezoid satchel,
// Riccardo Tisci era). Faceted size × material × colour. COLOUR: Givenchy is NOT in the banked archive and no
// fresh naming source surfaced this run, so colour rows are DESCRIPTOR anchors DEFAULTED (not confirmed) —
// revisit if a Givenchy colour-lexicon source appears. NO hardware axis (the zip + logo panel are fixed).
// cm approximate (converted from inches; Mini/Small labels overlap across sources, noted).
const GIVENCHY_ANTIGONA: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "the micro Antigona (mini crossbody/charm scale), recent addition (MEDIUM: cm not cleanly pinned)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~22-26 x 19-20 x 13 cm (givenchy.com Mini 10.2 x 7.9 x 5.1 in); the compact crossbody Antigona", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~28 x 24 x 14 cm (11 x 9.5 x 5.5 in); the reference Antigona, most cross-shopped (MEDIUM: default vs Medium is soft; Small/Mini labels overlap)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~33 x 28 x 19 cm (13 x 11 x 7.5 in); the classic roomy satchel proportion", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "seasonal", note: "the oversized/'Shopper' Antigona, less common now (MEDIUM: cm not cleanly pinned)", sort_order: 5 },
  { axis: "material", value: "Grained Calf", permanence: "permanent", is_default: true, note: "grained/pebbled calfskin; the classic structured Antigona (givenchy.com default), the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", note: "smooth calfskin; the polished Antigona", sort_order: 2 },
  { axis: "material", value: "Croc-Embossed", permanence: "seasonal", note: "croc-embossed calfskin; a recurring textured run", sort_order: 3 },
  { axis: "material", value: "Soft", permanence: "seasonal", note: "the 'Antigona Soft' (the slouchier unstructured version); a distinct recurring line", sort_order: 4 },
  { axis: "material", value: "Exotic / Print", permanence: "seasonal", note: "python / print / embellished special editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor (Givenchy naming defaulted, not sourced this run)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/greige neutral; descriptor (defaulted)", sort_order: 2 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey family; descriptor (defaulted)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red family; descriptor (defaulted); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor (defaulted)", sort_order: 5 },
];
```

**Sourcing note (Givenchy Antigona).** Model: the Antigona is Givenchy's structured **winged trapezoid
satchel/tote** from the **Riccardo Tisci** era, named for the Greek tragic heroine Antigone, its face marked by
the split-triangle logo panel. Sizes/cm this run: **handbagholic "The Complete Guide to the Givenchy Antigona"**
(captured 2026-07-13) gives the **Mini at 22 x 19 x 13 cm** and the Small above it; **PurseBlog "The Ultimate
Bag Guide: The Givenchy Antigona"** gives the **Small at 11 x 9.5 x 5.5 in (~28 x 24 x 14 cm)** and the
**Medium at 13 x 11 x 7.5 in (~33 x 28 x 19 cm)**, plus a **Shopper**; and **givenchy.com's Mini Antigona PDP**
lists the **Mini at 10.2 x 7.9 x 5.1 in in grained leather** (confirming grained as the default material).
**The colour treatment is DEFAULTED, and I say so:** Givenchy is **not** in the banked seasonal archive, and I
found **no fresh source** this run establishing a proprietary Givenchy colour lexicon; the product-page
convention reads as **descriptor + material**, so the five colour rows are **descriptor anchors flagged as a
default, not a confirmation** — if a Givenchy naming source surfaces, revisit and re-camp. **Defaults:** size
**Small** (the reference); material **Grained Calf** (the givenchy.com default); colour **Black**. **MEDIUM,
hold these:** (1) **Size labels overlap** — the **Mini** and **Small** cm run close across sources
(handbagholic's Mini 22 cm vs givenchy.com's Mini 26 cm; PurseBlog's Small 28 cm), so verify the exact size
per listing rather than the word. (2) **Small-vs-Medium default** — Small is the most cross-shopped, but the
Medium is the classic proportion; soft default. (3) **Nano / Large permanence** — the Nano is recent and the
Large/Shopper is uncommon, both seeded seasonal, cm not cleanly pinned. (4) **Colour camp** — descriptor is a
**default assumption**, not sourced. **Deliberately omitted, sourced:** **no hardware axis** — the zip closure
and the logo panel are the fixed signature (finish tracks the colorway); the **Antigona Soft** is seeded as a
**material/line** value rather than a separate style (resellers cross-shop it as an Antigona), while the
**Pandora**, **GV3**, and **Nightingale** are separate Givenchy models, not Antigona sizes.

---

## Two things to wire when you paste

1. Register all seven in the `STYLES` array:
   `{ styleId: 674, name: "Rockstud", rows: VALENTINO_ROCKSTUD }`,
   `{ styleId: 462, name: "Kate", rows: YSL_KATE }`,
   `{ styleId: 210, name: "Jodie", rows: BV_JODIE }`,
   `{ styleId: 504, name: "Puzzle", rows: LOEWE_PUZZLE }`,
   `{ styleId: 449, name: "Bamboo 1947", rows: GUCCI_BAMBOO_1947 }`,
   `{ styleId: 568, name: "City", rows: BALENCIAGA_CITY }`,
   `{ styleId: 585, name: "Antigona", rows: GIVENCHY_ANTIGONA }`.
   (The style_ids are confirmed from the DB per the brief; re-confirm against the `style` table before writing.)
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; rockstud-kate-jodie-puzzle-bamboo-city-antigona-production-matrix.md"` so the provenance string stays honest.
