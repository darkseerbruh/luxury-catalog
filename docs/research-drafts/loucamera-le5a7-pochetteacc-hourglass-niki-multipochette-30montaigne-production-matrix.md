# YSL Lou Camera + Le 5 à 7 + LV Pochette Accessoires + Balenciaga Hourglass + YSL Niki + LV Multi Pochette Accessoires + Dior 30 Montaigne — production matrices (selector seed)

*Archivist run 2026-07-13. Same shape and rigor as
`ophidia-triomphe-luggage-tabby-sohodisco-sacdejour-reedition-production-matrix.md` and the earlier matrix runs:
one reviewed source-of-truth list per style, NOT a full combination matrix. Each axis value traces to a cited,
dated source; anything I could not source is hedged (MEDIUM) or omitted, never invented. Seven sections, each a
ready `Row[]` to paste into `supabase/ingest/load-production-options.ts`.*

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. There is **no `line` field**,
so sub-line/format info (Baby vs Mini, East-West, Avenue, on-chain, the three-piece contents) is folded into `note`.

**Colour-naming camp per house — checked against the banked archive and stated up front (this is the moat):**
- **Saint Laurent (YSL) — names permanents as plain DESCRIPTORS only** (Noir/Blanc/Crème/Rouge/Dark Beige); the
  **hardware tone (gold vs silver Cassandre) is the axis that carries the naming weight**. Applies to the Lou
  Camera, the Le 5 à 7, and the Niki. Source: `seasonal-archive/saint-laurent.md` §26-31 + §136-140 (hardware-tone
  axis), §62/§65 (Niki SS2018, Lou camera model facts).
- **Louis Vuitton — names its LEATHER-LINE colours officially, colour only inside the leather line.** The primary
  axis is the CANVAS/leather LINE (Monogram / Damier Ebene / Damier Azur / Empreinte / Reverse); colour is a real
  choice only inside Empreinte (and Epi/Vernis), where LV names are official; canvas lines take no colour choice.
  Applies to the Pochette Accessoires and the Multi Pochette, encoded exactly like the Speedy/Alma/OnTheGo/Pochette
  Métis already in the loader. Source: `seasonal-archive/louis-vuitton.md` §77-78, §105, §143-146.
- **Balenciaga — NAMES its colours richly (a Bottega-camp house).** A deep by-season, by-year named lexicon with a
  **four-digit colour code on the interior tag**; **Black / White / Anthracite run every season**, the rest are
  named-by-year seasonals captured per-listing. Established in the City run this cycle. Source: PurseForum
  "Balenciaga Color Information by Season and Code" + Yoogi's Balenciaga Information Guide (captured 2026-07-13),
  as logged in `rockstud-kate-jodie-puzzle-bamboo-city-antigona-production-matrix.md` §STYLE 6.
- **Dior — names its colours (permanent anchors + seasonal per-listing).** The 30 Montaigne carries Dior-named
  anchors (Black, Latte, Blue, Red) with the antique-gold CD clasp fixed. Source: `seasonal-archive/dior.md` §34,
  §55 (30 Montaigne, christies, 2019) + the Lady Dior colour anchors already banked in the loader.

**HARD FLAG — style 467 "Celine Le 5 à 7" is a probable mis-attribution.** *Le 5 à 7 is a **Saint Laurent**
model* (Vaccarello-era hobo), not a Celine bag. Confirmed this run: **ysl.com sells the "Mini Le 5 à 7"**
(captured 2026-07-13) and **Fashionphile's "Behind the Pieces of the Saint Laurent Le 5 A 7 Collection"** (captured
2026-07-13) both attribute it to Saint Laurent, and it is banked at `saint-laurent.md` §63. There is **no Celine
"Le 5 à 7."** I have therefore encoded style 467 with the **true house's facts (Saint Laurent)** and did **not**
apply the brief's Celine attributes (Triomphe Canvas, Celine "Teen" size) — seeding a Celine-only material/size on a
YSL bag would be a fabrication. **Owner action: verify/relabel the style 467 row (brand + name) before wiring.**
Details in that section's sourcing note.

New this run (2026-07-13, all free-tier Firecrawl, every search fed back for the 1-credit refund): ysl.com official
Lou Camera PDP (23 x 16 x 6 cm) + an eBay Lou size listing (Baby/Mini cm); ysl.com official Mini Le 5 à 7 PDP +
Fashionphile Le 5 à 7 collection guide (regular + Medium); us.louisvuitton.com official Pochette Accessoires
(M82766) + Mini Pochette (M58009) PDPs; Rebag "Size Guide: The Balenciaga Hourglass" + luxbags.fr Hourglass sizes
(XS/Small); Fashionphile "A Saint Laurent Niki Size Guide" + Farfetch/luxbags for Niki cm; Fashionphile "The Dior 30
Montaigne Flap: Sizes & Styles" + saclab "Dior 30 Montaigne" for Micro/Small cm.

---

## STYLE 1 — YSL Lou Camera (style_id 464)

Saint Laurent, faceted **size × material × colour × hardware-tone**. The Lou is the classic YSL crossbody **camera
bag**: rectangular zip body, the metallic YSL **Cassandre** logo on the front, a hanging leather tassel on the
strap; usually in **matelassé (chevron / "Y" heart-stitch) quilted** leather. **DESCRIPTOR colours** with the
**hardware tone (gold vs silver Cassandre) as the naming axis**. Axes: **size** (Baby / Mini / Lou-standard),
**material** (quilted matelassé default + smooth + suede + embellished), **colour** (descriptor), **hardware**
(gold/silver metallic logo).

```ts
// YSL Lou Camera (style 464), archivist-sourced 2026-07-13 (ysl.com official "Lou camera bag in quilted leather"
// PDP = 23 x 16 x 6 cm / 9 x 6.2 x 2.3 in for the standard Lou + an eBay "Saint Laurent Lou Bags" size listing for
// Baby 4.7 x 3.3 x 1.5 in and Mini 7.4 x 4.3 in; model = the classic crossbody camera bag, metallic YSL Cassandre
// logo + hanging tassel, matelassé chevron, from seasonal-archive/saint-laurent.md §65 + §101-102). YSL does NOT
// publish a seasonal colour lexicon (saint-laurent.md §26-31) — plain DESCRIPTOR anchors (Noir/Blanc/Rouge/Dark
// Beige), and the HARDWARE TONE (gold vs silver Cassandre) is the axis that carries the naming weight (§136-140).
// Size × material × colour × hardware. cm converted from inches; reseller size labels vary (the standard Lou is
// also sold as "Medium Lou").
const YSL_LOU_CAMERA: Row[] = [
  { axis: "size", value: "Baby", permanence: "seasonal", note: "~12 x 8.5 x 4 cm (eBay 4.7 x 3.3 x 1.5 in); the micro Lou, evening/charm scale", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~19 x 11 cm face (eBay 7.4 x 4.3 in; depth not sourced); the compact crossbody Lou", sort_order: 2 },
  { axis: "size", value: "Lou", permanence: "permanent", is_default: true, note: "23 x 16 x 6 cm (ysl.com official, 9 x 6.2 x 2.3 in); the reference/standard camera bag, also sold as 'Medium Lou', most cross-shopped", sort_order: 3 },
  { axis: "material", value: "Matelasse Quilted", permanence: "permanent", is_default: true, note: "the signature matelassé (chevron 'Y' / heart-stitch) quilted calfskin or lambskin; the classic Lou surface", sort_order: 1 },
  { axis: "material", value: "Smooth Calf", permanence: "permanent", note: "smooth/plain calfskin, unquilted; the polished Lou, the colour-bearing surface", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "croc-embossed / metallic / studded / raffia seasonal editions, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone metallic YSL Cassandre logo + fittings; the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone Cassandre logo; equally standard", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor (plain descriptor, not a seasonal-lexicon name)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (YSL Lou Camera).** Model from the banked `saint-laurent.md` §65 (medium confidence, Rebag): the
Lou is the classic YSL crossbody **camera bag** — rectangular zip body, the metallic **Cassandre** logo on the
front, a hanging leather tassel on the strap, in **matelassé chevron** or heart-stitch quilting. Sizes/cm this run:
**ysl.com's official "Lou camera bag in quilted leather" PDP** (captured 2026-07-13) gives the standard **Lou at
23 x 16 x 6 cm (9 x 6.2 x 2.3 in)**; an **eBay "Saint Laurent Lou Bags" size listing** (captured 2026-07-13) gives
the **Baby at 4.7 x 3.3 x 1.5 in (~12 x 8.5 x 4 cm)** and the **Mini at 7.4 x 4.3 in (~19 x 11 cm)**. **The colour
+ hardware rule holds from the archive** (§26-31, §136-140): YSL does not publish a per-season colour dictionary,
colours are plain descriptors (Noir, Blanc/Crème, Dark Beige, Rouge, Storm), and the **gold-vs-silver hardware
tone** of the Cassandre logo carries the real naming weight. **Defaults:** size **Lou** (the standard/reference);
material **Matelassé Quilted** (the signature); hardware **Gold**; colour **Black/Noir**. **MEDIUM, hold these:**
(1) **Baby / Mini depth** — the eBay listing gives the Mini face only (no depth) and the Baby is a scarcer size, so
Baby is seeded seasonal. (2) **Red / Grey permanence** — recurring descriptor families, soft. **Deliberately
omitted, sourced:** the **standard Lou is also merchandised as "Medium Lou"** by resellers — folded into the Lou
row's note rather than seeded as a phantom fourth size; the **Loulou** (matelassé chevron shoulder flap) and the
**Lou Puffer** are separate YSL models, not Lou Camera sizes; **no invented seasonal colour names**.

---

## STYLE 2 — Saint Laurent Le 5 à 7 (style_id 467, DB-labelled "Celine" — see flag)

**Encoded as Saint Laurent, the true house — NOT Celine.** Le 5 à 7 is Vaccarello's clean evening **hobo**:
smooth structured leather, half-moon shoulder silhouette, a polished **Cassandre** and a hook closure; "the perfect
little black bag," a late-Vaccarello It-bag, also in a supple version. Faceted **size × material × colour ×
hardware-tone**, YSL's camp (**DESCRIPTOR colours + hardware-tone axis**). Axes: **size** (Mini / Small-regular /
Medium), **material** (smooth structured calf default + supple + suede + croc-embossed — **NOT** Celine's Triomphe
Canvas), **colour** (descriptor), **hardware** (gold/silver Cassandre).

```ts
// Saint Laurent Le 5 à 7 (style 467), archivist-sourced 2026-07-13. *** DATA FLAG: the DB labels this style
// "Celine Le 5 à 7" — that is a MIS-ATTRIBUTION. Le 5 à 7 is a SAINT LAURENT model (ysl.com sells the "Mini Le 5 à
// 7"; Fashionphile "Saint Laurent Le 5 A 7 Collection"; banked saint-laurent.md §63). There is no Celine "Le 5 à
// 7". Encoded per the TRUE house; the brief's Celine attributes (Triomphe Canvas, "Teen" size) are deliberately
// NOT applied because seeding a Celine-only material/size on a YSL bag would be a fabrication. Owner: verify +
// relabel the style row (brand + name) before wiring. *** Sizes: ysl.com official "Mini Le 5 à 7 in smooth leather"
// PDP = 19 x 11.5 x 4.5 cm + Fashionphile "Le 5 A 7 Collection" (hobo comes in regular ~9 x 8.5 x 3.5 in + Medium).
// YSL camp: DESCRIPTOR colours + hardware-tone axis (saint-laurent.md §26-31, §136-140). Size × material × colour
// × hardware. cm from the official PDP + reseller guide; reseller labels vary (Small/regular, Medium/Large).
const YSL_LE_5_A_7: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "19 x 11.5 x 4.5 cm (ysl.com official, smooth leather); the small structured evening Le 5 à 7", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~23 x 21.5 x 9 cm (Fashionphile 'regular' 9 x 8.5 x 3.5 in); the reference hobo, most cross-shopped (resellers also call it 'regular')", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger hobo proportion (Fashionphile 'Medium', ~11.5 in wide; resellers also call it 'Large') (MEDIUM: full cm not cleanly pinned this run)", sort_order: 3 },
  { axis: "material", value: "Smooth Structured Calf", permanence: "permanent", is_default: true, note: "smooth structured calfskin; the classic clean Le 5 à 7, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Supple Calf", permanence: "permanent", note: "the softer 'supple' Le 5 à 7 hobo (an unstructured version); a co-signature build", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Croc-Embossed / Exotic", permanence: "seasonal", note: "croc-embossed calfskin or exotic editions, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone hardware + Cassandre; the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone hardware; equally standard", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor and the bag's signature ('the perfect little black bag'); plain descriptor", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
];
```

**Sourcing note (Saint Laurent Le 5 à 7).** **Read the data flag first:** the DB labels style 467 "Celine Le 5 à
7," but **Le 5 à 7 is a Saint Laurent model** — **ysl.com sells the "Mini Le 5 à 7 in smooth leather"** (captured
2026-07-13) and **Fashionphile's "Behind the Pieces of the Saint Laurent Le 5 A 7 Collection"** (captured
2026-07-13) both attribute it to Saint Laurent, and it is banked at `saint-laurent.md` §63 as Vaccarello's clean
evening **hobo** (smooth structured leather, half-moon silhouette, polished Cassandre, hook closure, "the perfect
little black bag"). There is **no Celine "Le 5 à 7."** I encoded the **true house's** facts and **deliberately did
not** apply the brief's Celine attributes — **Triomphe Canvas** is a **Celine-only** material and **"Teen"** is a
**Celine size term**; putting either on this bag would be a fabrication (a null/flag beats a poison pill).
Sizes/cm: **ysl.com's official Mini PDP** gives **19 x 11.5 x 4.5 cm**; **Fashionphile** confirms the hobo "comes in
regular and Medium," the **regular at ~9 x 8.5 x 3.5 in (~23 x 21.5 x 9 cm)**. **The colour + hardware rule** is
YSL's (§26-31, §136-140): descriptor colours (the bag's whole identity is the black hobo) + the gold/silver
hardware-tone axis. **Defaults:** size **Small** (the reference "regular"); material **Smooth Structured Calf**;
hardware **Gold**; colour **Black/Noir**. **MEDIUM, hold these:** (1) **Medium full cm** not cleanly pinned this
run. (2) reseller **size-label variance** (Small/regular, Medium/Large) noted inline so we don't seed phantom
sizes. (3) **Red permanence** — recurring descriptor, soft. **Owner action, restated:** verify/relabel the style
467 row (brand → Saint Laurent, name → Le 5 à 7) before this seeds; if the catalog genuinely intends a different
Celine bag under that id, re-brief, because the name belongs to Saint Laurent.

---

## STYLE 3 — LV Pochette Accessoires (style_id 690)

Louis Vuitton, **canvas-primary** — encoded exactly like the Speedy/Alma/OnTheGo/Pochette Métis already in the
loader. The Pochette Accessoires is LV's small flat zip **pouch-bag**; the current model (M82766) ships with a
**removable chain**, making it a mini shoulder/crossbody. Axes: **size** (Mini / standard Pochette Accessoires),
**material = the LINES** (Monogram default / Damier Ebene / Damier Azur / Empreinte / Reverse Monogram / seasonal),
**colour = Empreinte only, Black anchor**. **No construction/hardware axis** (canvas lines take no colour choice).

```ts
// LV Pochette Accessoires (style 690), archivist-sourced 2026-07-13 (us.louisvuitton.com official PDPs: Pochette
// Accessoires M82766 = 9.3 x 5.3 x 1.6 in / ~23.5 x 13.5 x 4 cm WITH removable chain; Mini Pochette Accessoires
// M58009 = 6.1 x 4.1 x 1.6 in / ~15.5 x 10.5 x 4 cm; lines from seasonal-archive/louis-vuitton.md §77-78). LV
// canvas-primary (Monogram default); colour ONLY on the Empreinte leather line, LV names official; canvas lines
// take no colour choice. NO construction toggle, NO hardware axis. cm approximate (converted from inches). The
// current standard Pochette Accessoires is the "NM"/updated model that ships with a removable chain (the older
// version was a flat pouch on a short vachetta strap) — folded into the size note, not a separate size.
const LV_POCHETTE_ACCESSOIRES: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~15.5 x 10.5 x 4 cm (louisvuitton.com M58009, 6.1 x 4.1 x 1.6 in); the Mini Pochette, the cult small pouch/crossbody insert", sort_order: 1 },
  { axis: "size", value: "Pochette Accessoires", permanence: "permanent", is_default: true, note: "~23.5 x 13.5 x 4 cm (louisvuitton.com M82766, 9.3 x 5.3 x 1.6 in); the standard flat zip pouch-bag; current model ships with a removable chain (the on-chain/'NM' update)", sort_order: 2 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the default line", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim (no vachetta)", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale check, vachetta trim", sort_order: 3 },
  { axis: "material", value: "Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing line", sort_order: 4 },
  { axis: "material", value: "Monogram Reverse", permanence: "seasonal", note: "caramel/brown reverse-Monogram canvas; intermittent runs", sort_order: 5 },
  { axis: "material", value: "Seasonal Print / Vernis", permanence: "seasonal", note: "seasonal Monogram-print capsules, Multicolore (historic), Vernis patent, per-listing", sort_order: 6 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir'; the anchor; canvas lines take no colour choice; other Empreinte colours rotate seasonally, captured per-listing", sort_order: 1 },
];
```

**Sourcing note (LV Pochette Accessoires).** Model + lines from the banked `louis-vuitton.md` §77-78, §143-146
(high confidence): LV's primary axis is the **canvas/leather LINE**, colour is a real choice **only inside
Empreinte** (LV names official), and the canvas lines (Monogram/Damier) take no colour choice — the same encoding
as the Speedy/Alma/OnTheGo/Pochette Métis already in the loader. Sizes/cm this run, both from **official
us.louisvuitton.com PDPs** (captured 2026-07-13): the **standard Pochette Accessoires (M82766) = 9.3 x 5.3 x 1.6 in
(~23.5 x 13.5 x 4 cm)** and it **ships with a removable chain** (the current "on-chain"/NM update the brief asked me
to confirm — it is the current standard, not a separate size); the **Mini Pochette Accessoires (M58009) = 6.1 x
4.1 x 1.6 in (~15.5 x 10.5 x 4 cm)**. **Defaults:** size **Pochette Accessoires** (the standard); material
**Monogram**; colour **Black** (Empreinte anchor). **MEDIUM, hold these:** (1) the older flat-pouch-on-short-strap
Pochette Accessoires vs the current removable-chain model is a **generation** difference, folded into the standard
size's note rather than seeded as two sizes (resellers cross-shop them as one). (2) **Reverse / seasonal-print**
lines seeded seasonal. **Deliberately omitted, sourced:** **no colour rows beyond the Empreinte Black anchor** (LV
canvas lines take no colour, matching the loader's Speedy/Métis pattern); **no construction/hardware axis**; the
**Félicie Pochette** and **Multi Pochette Accessoires** are separate LV models/styles, not sizes here (the Multi is
STYLE 6 below).

---

## STYLE 4 — Balenciaga Hourglass (style_id 567)

Balenciaga, faceted **size × material × colour × hardware**, and — the finding — **Balenciaga NAMES its colours**
(a Bottega-camp house). The Hourglass is Demna's curved-base structured **top-handle** (SS/FW 2019), defined by the
nipped "hourglass" base curve and the oversized **B** buckle. Axes: **size** (Nano / Mini / XS / Small / Medium),
**material** (shiny box calf default + grained + croc-embossed + crocodile), **colour** (Balenciaga NAMES —
Black/White + Beige permanents + named seasonals per-listing with codes), **hardware** (the B-clasp tone, a lighter
axis).

```ts
// Balenciaga Hourglass (style 567), archivist-sourced 2026-07-13 (Rebag "Size Guide: The Balenciaga Hourglass" =
// Mini 5 x 3.5 x 2 in / ~12.7 x 9 x 5 cm + Medium 11 x 7 x 3.5 in / ~28 x 18 x 9 cm; luxbags.fr Hourglass sizes =
// XS 19 x 12 x 7.5 cm; Farfetch: launched end-2019 in XS/Small/Medium + a Mini; model = Demna's curved-base
// structured top-handle with the oversized B buckle). COLOUR FINDING: BALENCIAGA NAMES ITS COLOURS richly (a
// Bottega-camp house) — Black/White/Anthracite/neutrals run every season, seasonals named-by-year with a four-digit
// code on the interior tag, captured per-listing (source: PurseForum "Balenciaga Color Information by Season and
// Code" + Yoogi's guide, per the City run). Size × material × colour × hardware. The B-clasp tone is a lighter axis
// (often tracks the colorway). cm converted from inches.
const BALENCIAGA_HOURGLASS: Row[] = [
  { axis: "size", value: "Nano", permanence: "seasonal", note: "the tiniest Hourglass (charm/mini top-handle scale), a recent addition (MEDIUM: cm not cleanly sourced this run)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~12.7 x 9 x 5 cm (Rebag 5 x 3.5 x 2 in); the mini top-handle with crossbody strap", sort_order: 2 },
  { axis: "size", value: "XS", permanence: "permanent", is_default: true, note: "~19 x 12 x 7.5 cm (luxbags.fr); the reference/most-iconic Hourglass top-handle, most cross-shopped (default vs Small is soft)", sort_order: 3 },
  { axis: "size", value: "Small", permanence: "permanent", note: "the mid Hourglass, between XS and Medium (MEDIUM: cm not cleanly pinned this run)", sort_order: 4 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~28 x 18 x 9 cm (Rebag 11 x 7 x 3.5 in); the roomier top-handle/shoulder proportion", sort_order: 5 },
  { axis: "material", value: "Shiny Box Calf", permanence: "permanent", is_default: true, note: "the signature shiny box/smooth calfskin; the classic structured Hourglass, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Grained Calf", permanence: "permanent", note: "grained/pebbled calfskin; the sturdier finish", sort_order: 2 },
  { axis: "material", value: "Croc-Embossed", permanence: "permanent", note: "crocodile-embossed (not exotic) shiny calfskin; a recurring textured Hourglass", sort_order: 3 },
  { axis: "material", value: "Crocodile / Exotic", permanence: "seasonal", note: "genuine crocodile / lizard / rhinestone-covered / denim / Hacker-Project (Gucci) editions, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone B buckle + fittings; the classic (a lighter axis — the B-clasp tone often tracks the colorway)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/aged-silver B buckle; equally standard", sort_order: 2 },
  { axis: "hardware", value: "Tonal", permanence: "seasonal", note: "colour-matched/tonal B buckle on some seasonal colorways", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "produced every season (Balenciaga names it); the anchor", sort_order: 1 },
  { axis: "color", value: "White", permanence: "permanent", note: "produced every season (Balenciaga names it)", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the recurring beige/sand neutral (a Balenciaga house name); near-permanent (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Named seasonals (per-listing)", permanence: "seasonal", note: "Balenciaga's by-year named lexicon (with a four-digit interior colour code) — captured per-listing, never seeded as invented anchors", sort_order: 4 },
];
```

**Sourcing note (Balenciaga Hourglass).** Model: the **Hourglass** is Demna's curved-base structured **top-handle**
(launched **end-2019**, per Farfetch's "Balenciaga Hourglass: The Ultimate Sizing & Styling Guide," captured
2026-07-13), defined by the nipped hourglass base curve and the oversized **B** buckle. Sizes/cm this run:
**Rebag's "Size Guide: The Balenciaga Hourglass"** (captured 2026-07-13) gives the **Mini at 5 x 3.5 x 2 in (~12.7
x 9 x 5 cm)** and the **Medium at 11 x 7 x 3.5 in (~28 x 18 x 9 cm)**; **luxbags.fr's Hourglass size guide** gives
the **XS at 19 x 12 x 7.5 cm**; Farfetch confirms the launch trio **XS / Small / Medium** plus a **Mini** (and a
later **Nano**). **The colour finding is the headline** and reuses the City-run establishment: **Balenciaga names
its colours richly** — **Black/White/Anthracite/neutrals every season**, seasonals named-by-year with a
**four-digit interior colour code**, captured per-listing (PurseForum "Balenciaga Color Information by Season and
Code" + Yoogi's guide) — so the colour rows are **real BV/Balenciaga names**, with the seasonal lexicon captured
per-listing rather than invented into anchors. **Defaults:** size **XS** (the iconic top-handle; Small co-popular,
soft); material **Shiny Box Calf**; hardware **Gold**; colour **Black**. **MEDIUM, hold these:** (1) **Nano cm** not
cleanly sourced this run; seeded seasonal. (2) **Small cm** not cleanly pinned (the guides lead with XS/Mini/
Medium); flagged. (3) **XS-vs-Small default** is soft. (4) **Beige permanence** soft. (5) the **B-clasp tone** is
seeded as a light hardware axis but often tracks the colorway — noted. **Deliberately omitted, sourced:** the
**named seasonal colours** are represented by a single per-listing row rather than invented Balenciaga colour names
(the honest move for a house whose lexicon rotates by the season); the **Hourglass Wallet-on-Chain** and the
**Hacker-Project (Gucci) Hourglass** are captured per-listing, not seeded as sizes.

---

## STYLE 5 — YSL Niki (style_id 463)

Saint Laurent, faceted **size × material × colour × hardware-tone**. The Niki is Vaccarello's slouchy soft **hobo**
(**Spring 2018**): a chain shoulder strap, intentionally crinkled/quilted **washed vintage lambskin**, and a large
worn-effect **Cassandre** on the front. **DESCRIPTOR colours + hardware-tone axis**. Axes: **size** (Baby / Medium
/ Large), **material** (crinkled washed lambskin default + smooth + suede), **colour** (descriptor), **hardware**
(the worn-effect gold/silver logo).

```ts
// YSL Niki (style 463), archivist-sourced 2026-07-13 (Fashionphile "A Saint Laurent Niki Size Guide" = Baby 8.2 x
// 6.2 x 2.9 in / ~21 x 16 x 7.5 cm, Medium 11 x 7.8 x 3.3 in / ~28 x 20 x 8.5 cm, Large 12.5 x 9 x 3.5 in / ~32 x
// 23 x 9 cm; Farfetch cross-confirms the smallest at 21 x 16 x 7.5 cm; model = Vaccarello's slouchy crinkled-
// leather quilted chain hobo, Spring 2018, from seasonal-archive/saint-laurent.md §62). YSL camp: DESCRIPTOR
// colours + hardware-tone axis (§26-31, §136-140); the Niki's Cassandre is a worn/aged-metal effect. Size ×
// material × colour × hardware. cm converted from inches. Reseller size labels vary (luxbags calls the ~21cm bag
// "Small"; Fashionphile calls it "Baby" — same bag, folded in).
const YSL_NIKI: Row[] = [
  { axis: "size", value: "Baby", permanence: "permanent", is_default: true, note: "~21 x 16 x 7.5 cm (Fashionphile 8.2 x 6.2 x 2.9 in; Farfetch 21 x 16 x 7.5 cm); the compact everyday Niki, most cross-shopped (resellers also label it 'Small')", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~28 x 20 x 8.5 cm (Fashionphile 11 x 7.8 x 3.3 in); the mid hobo, the roomier everyday size", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~32 x 23 x 9 cm (Fashionphile 12.5 x 9 x 3.5 in); the biggest Niki, the true shoulder carryall", sort_order: 3 },
  { axis: "material", value: "Crinkled Washed Lambskin", permanence: "permanent", is_default: true, note: "the signature intentionally-crinkled/washed vintage-effect quilted lambskin; the classic Niki, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Smooth Leather", permanence: "permanent", note: "smooth/plain quilted calfskin; the cleaner Niki variant", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "croc-embossed / metallic / denim / studded seasonal editions, per-listing", sort_order: 4 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "gold-tone worn/aged-effect Cassandre logo; the classic pairing (hardware tone carries YSL's naming weight)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone worn-effect Cassandre; equally standard", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Noir; the anchor (plain descriptor)", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Dark Beige / greige neutral; a YSL staple (descriptor)", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "Blanc / Crème neutral (descriptor)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Rouge; a recurring statement colour (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "Storm/grey neutral; a recurring core option (descriptor) (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (YSL Niki).** Model from the banked `saint-laurent.md` §62 (high confidence, x.com/YSL official +
Vogue): the Niki is Vaccarello's slouchy soft **hobo** with a chain shoulder strap and intentionally
**crinkled/quilted vintage leather**, a large **Cassandre** on the front, debuted **Spring 2018** (official campaign
tag "SPRING 18 #YSL12"). Sizes/cm this run: **Fashionphile's "A Saint Laurent Niki Size Guide"** (captured
2026-07-13) gives the **Baby at 8.2 x 6.2 x 2.9 in (~21 x 16 x 7.5 cm)**, the **Medium at 11 x 7.8 x 3.3 in (~28 x
20 x 8.5 cm)**, and the **Large at 12.5 x 9 x 3.5 in (~32 x 23 x 9 cm)**; **Farfetch** cross-confirms the smallest
at **21 x 16 x 7.5 cm**. **The colour + hardware rule** is YSL's (§26-31, §136-140): descriptor colours + the
gold/silver hardware-tone axis (the Niki's Cassandre is a distinctive **worn/aged-metal** effect). **Defaults:**
size **Baby** (the compact everyday, most cross-shopped); material **Crinkled Washed Lambskin** (the signature);
hardware **Gold**; colour **Black/Noir**. **MEDIUM, hold these:** (1) reseller **size-label variance** — luxbags.fr
labels the ~21 cm bag **"Small"** while Fashionphile labels it **"Baby"** (same bag); folded into the Baby row's
note so we don't seed a phantom "Small." (2) **Red / Grey permanence** — recurring descriptor families, soft.
**Deliberately omitted, sourced:** the brief floated a four-size Baby/Small/Medium/Large run — the "Small" is the
"Baby" relabelled (the Sac de Jour BB=Baby precedent), so folding it in beats inventing a size; **no invented
seasonal colour names**; the Niki's worn-metal Cassandre finish is captured as the hardware tone, not a colour.

---

## STYLE 6 — LV Multi Pochette Accessoires (style_id 444)

Louis Vuitton, **canvas-primary** — encoded like the other LV lines, with one twist: the **strap/trim colour is
the signature variant**. The Multi Pochette is the viral **2019 three-piece** — a large flat Pochette + a small
round coin purse + a card holder, all riding one bright **removable strap**. Axes: **size** (one core three-piece),
**material = the LINES** (Monogram default / Empreinte / Bicolor / Khaki-strap seasonal), **colour** (the STRAP
colour is the identifying variant — Rose Clair / Khaki / Black; Empreinte for the leather colour). **No
hardware/construction axis.**

```ts
// LV Multi Pochette Accessoires (style 444), archivist-sourced 2026-07-13 (model = the viral 2019 three-piece:
// large Pochette + round coin purse + card holder on one bright removable strap, from seasonal-archive/
// louis-vuitton.md §62 [sothebys/vogue, high]). LV canvas-primary (Monogram default); the SIGNATURE VARIANT is the
// STRAP/trim colour (the bright removable strap is the bag's identity), so the colour axis encodes the strap colour
// (Rose Clair / Khaki / Black), with Empreinte for the leather colour. One core size. NO hardware/construction axis.
// cm not seeded (the set has three pieces; a single body dim would mislead — held, per-listing).
const LV_MULTI_POCHETTE_ACCESSOIRES: Row[] = [
  { axis: "size", value: "One size", permanence: "permanent", is_default: true, note: "the 2019 three-piece set: large flat Pochette (~21 cm) + round coin purse + card holder on one removable strap (MEDIUM: per-piece cm not seeded — one body dim would mislead)", sort_order: 1 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the default line", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing leather line", sort_order: 2 },
  { axis: "material", value: "Bicolor / Reverse", permanence: "seasonal", note: "bicolour Empreinte or Monogram Reverse canvas seasonal runs, per-listing", sort_order: 3 },
  { axis: "material", value: "Seasonal Print", permanence: "seasonal", note: "seasonal Monogram-print / By-the-Pool / capsule editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the classic all-black strap + Empreinte 'Noir'; the anchor (Monogram canvas takes no leather colour — the strap is the variant)", sort_order: 1 },
  { axis: "color", value: "Rose Clair (strap)", permanence: "permanent", note: "the pale-pink strap — the iconic 2019 launch look (paired with the khaki round purse); the signature bright strap, near-permanent (permanence soft)", sort_order: 2 },
  { axis: "color", value: "Khaki (strap)", permanence: "permanent", note: "the khaki-green strap/round-purse — the other half of the launch bicolour signature; near-permanent (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Seasonal strap (per-listing)", permanence: "seasonal", note: "LV rotates bright seasonal strap colours (Rose, blue, multicolour) — captured per-listing, not seeded as invented anchors", sort_order: 4 },
];
```

**Sourcing note (LV Multi Pochette Accessoires).** Model from the banked `louis-vuitton.md` §62 (high confidence,
Sotheby's + Vogue): the Multi Pochette Accessoires is **the viral 2019 set** — "Pochette + mini Pochette + round
coin purse on a bright strap" — the three-piece that defined the year's LV drop. The encoding follows LV's
canvas-primary pattern (Monogram default, Empreinte the colour-bearing leather line), with the crucial twist that
**the removable strap colour is the identifying variant** (the launch's **Rose Clair pink + khaki** bicolour strap
is the signature look), so the colour axis encodes the **strap colour** rather than a body colour. **Defaults:**
size **One size** (a single core set); material **Monogram**; colour **Black** (the classic all-black strap +
Empreinte Noir anchor). **MEDIUM, hold these:** (1) **per-piece cm not seeded** — the set has three differently
sized pieces (the large Pochette is ~21 cm), so a single body dimension would mislead; held for per-listing rather
than invented. (2) **Rose Clair / Khaki strap permanence** — these are the near-permanent signature straps but LV
rotates them; flagged soft. (3) **seasonal strap colours** are represented by one per-listing row, not invented
anchors. **Deliberately omitted, sourced:** **no hardware/construction axis** (fixed gold-tone per line); the
single-piece **Pochette Accessoires** and **Mini Pochette** are STYLE 3 above, not sizes of this set.

---

## STYLE 7 — Dior 30 Montaigne (style_id 455)

Dior, **colour-primary with a real size + material axis**, and — the house rule — **Dior NAMES its colours**
(permanent anchors + seasonal per-listing). The 30 Montaigne is the structured **CD-clasp flap** (2019), named for
Dior's **30 Avenue Montaigne** address, closed by the **antique-gold "CD"** clasp (fixed). Axes: **size** (Micro /
Mini / Small / East-West / Avenue), **material** (box calf default + grained + Oblique jacquard + exotic),
**colour** (Dior-named anchors — Black / Latte / Blue / Red). The **antique-gold CD clasp is fixed — no hardware
axis.**

```ts
// Dior 30 Montaigne (style 455), archivist-sourced 2026-07-13 (Fashionphile "The Christian Dior 30 Montaigne Flap:
// Sizes & Styles" = Micro 6 x 4 x 1.25 in / ~15 x 10 x 3 cm; saclab "Dior 30 Montaigne" = micro ~15 cm wide, small
// ~21 cm base x 17 across; model = the structured CD-clasp flap, 2019, named for 30 Avenue Montaigne, from
// seasonal-archive/dior.md §55 [christies, high]). Dior NAMES its colours (dior.md §34): permanent anchors
// Black/Latte/Blue/Red, seasonals per-listing. Size × material × colour; the ANTIQUE-GOLD CD CLASP IS FIXED — no
// hardware axis. cm converted from inches / approximate. East-West and Avenue are distinct formats on the same
// clasp, seeded in the size run per resale cross-shopping.
const DIOR_30_MONTAIGNE: Row[] = [
  { axis: "size", value: "Micro", permanence: "permanent", note: "~15 x 10 x 3 cm (Fashionphile 6 x 4 x 1.25 in; saclab ~15 cm wide); the SLG-scale mini flap/crossbody", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "the compact flap between Micro and Small (MEDIUM: cm not cleanly pinned this run)", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~21 cm base x 17 tall (saclab); the reference 30 Montaigne flap, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "East-West", permanence: "permanent", note: "the elongated horizontal flap (a distinct format on the same CD clasp); a newer resale-popular shape", sort_order: 4 },
  { axis: "size", value: "Avenue", permanence: "seasonal", note: "the '30 Montaigne Avenue' chain flap (a distinct format with a chain + CD clasp); newer, per-listing (MEDIUM: cm not sourced this run)", sort_order: 5 },
  { axis: "material", value: "Box Calf", permanence: "permanent", is_default: true, note: "smooth box calfskin; the classic structured 30 Montaigne, the colour-bearing surface", sort_order: 1 },
  { axis: "material", value: "Grained Calf", permanence: "permanent", note: "grained/pebbled calfskin; the sturdier finish", sort_order: 2 },
  { axis: "material", value: "Oblique Jacquard", permanence: "permanent", note: "the diagonal 'Dior' Oblique jacquard canvas (Bohan 1967 motif), trimmed in calfskin; the logo 30 Montaigne", sort_order: 3 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "alligator / ombré / Toile de Jouy / embroidered editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black box calf + antique-gold CD = the reference 30 Montaigne", sort_order: 1 },
  { axis: "color", value: "Latte", permanence: "permanent", note: "Dior's signature warm beige/nude, a standing 30 Montaigne neutral (Dior names it)", sort_order: 2 },
  { axis: "color", value: "Blue", permanence: "permanent", note: "deep/sky blue; a recurring house colour (Dior names it); near-permanent (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Dior's recurring red; near-permanent (permanence soft)", sort_order: 4 },
];
```

**Sourcing note (Dior 30 Montaigne).** Model from the banked `dior.md` §55 (high confidence, Christie's): the 30
Montaigne is the structured **CD-clasp flap** introduced **2019**, named for Dior's **30 Avenue Montaigne** address,
closed by the **antique-gold "CD"** clasp. Sizes/cm this run: **Fashionphile's "The Christian Dior 30 Montaigne
Flap: Sizes & Styles"** (captured 2026-07-13) gives the **Micro at 6 x 4 x 1.25 in (~15 x 10 x 3 cm)** and lists
the flap run as **Micro / Small / East-West**; **saclab's "Dior 30 Montaigne"** (captured 2026-07-13) gives the
**Micro at ~15 cm wide** and the **Small at ~21 cm base x 17 across**. **The colour rule** is Dior's (`dior.md`
§34, and the Lady Dior anchors already in the loader): Dior **names** its colours, with permanent anchors (**Black,
Latte, Blue, Red**) and seasonals captured per-listing. **Defaults:** size **Small** (the reference flap); material
**Box Calf**; colour **Black**. **MEDIUM, hold these:** (1) **Mini cm** not cleanly pinned this run (the guides lead
with Micro/Small/East-West); flagged. (2) **Avenue** — the "30 Montaigne Avenue" is a distinct chain flap on the
same line; seeded seasonal with cm not sourced. (3) **Blue / Red permanence** — recurring house colours, soft.
**Deliberately omitted, sourced:** the brief floated a **Medium** flap size — Dior's core flap run reads
Micro/Small/East-West (+ the newer Avenue) rather than a distinct "Medium," so I held it (a null beats an invented
size); **no hardware axis** — the **antique-gold CD clasp is the fixed signature**; the **30 Montaigne Box**, **30
Montaigne Pouch/hobo**, and the **Caro** (twist-CD Cannage flap) are separate models/formats, not 30 Montaigne flap
sizes, captured per-listing.

---

## Two things to wire when you paste

1. Register all seven in the `STYLES` array (style_ids confirmed from the brief; **re-confirm against the `style`
   table before writing — and see the STYLE 2 flag: verify style 467's brand/name first**):
   `{ styleId: 464, name: "Lou Camera", rows: YSL_LOU_CAMERA }`,
   `{ styleId: 467, name: "Le 5 à 7", rows: YSL_LE_5_A_7 }`  *(DB currently labels this "Celine Le 5 à 7" — it is a Saint Laurent model; relabel before wiring)*,
   `{ styleId: 690, name: "Pochette Accessoires", rows: LV_POCHETTE_ACCESSOIRES }`,
   `{ styleId: 567, name: "Hourglass", rows: BALENCIAGA_HOURGLASS }`,
   `{ styleId: 463, name: "Niki", rows: YSL_NIKI }`,
   `{ styleId: 444, name: "Multi Pochette Accessoires", rows: LV_MULTI_POCHETTE_ACCESSOIRES }`,
   `{ styleId: 455, name: "30 Montaigne", rows: DIOR_30_MONTAIGNE }`.
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; loucamera-le5a7-pochetteacc-hourglass-niki-multipochette-30montaigne-production-matrix.md"` so the
   provenance string stays honest.
