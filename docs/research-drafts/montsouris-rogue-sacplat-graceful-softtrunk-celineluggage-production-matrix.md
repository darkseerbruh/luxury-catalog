# LV Montsouris + Coach Rogue + LV Sac Plat + LV Graceful + LV Soft Trunk + Celine Luggage (classic) — production matrices (selector seed)

*Archivist run 2026-07-14. Same shape and rigor as the earlier matrix runs
(`vanitycase-coussin-galleria-felicie-dauphine-trendycc-lecagole-production-matrix.md`,
`loucamera-...-30montaigne-production-matrix.md`): one reviewed source-of-truth list per style, NOT a full
combination matrix. Each axis value traces to a cited, dated source; anything I could not source is hedged
(MEDIUM) or omitted, never invented. Six sections, each a ready `Row[]` to paste into
`supabase/ingest/load-production-options.ts`.*

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. There is **no `line` field**,
so line/format info (the LV canvas-vs-leather lines, the Coach Rogue leathers, the Celine winged silhouette) is
folded into `note`.

**Colour-naming camp per house, checked against the banked archive and stated up front (this is the moat):**
- **Louis Vuitton — names its LEATHER-LINE colours officially; colour is a real choice only inside the leather
  line.** All four LV bags here (**Montsouris**, **Sac Plat**, **Graceful**, **Soft Trunk**) are **canvas-primary
  LINE models**: the primary axis is the LINE (Monogram / Damier / Empreinte / Reverse / Taurillon / Eclipse), and
  colour only appears on the **leather** line (Empreinte on Montsouris/Sac Plat; Taurillon on Soft Trunk), with a
  permanent **Black/Noir** anchor and the rest rotating per-listing as official LV names. **Graceful is the
  exception: it is canvas-ONLY** (Monogram / Damier Ebene / Damier Azur, no leather line), so it takes **no colour
  axis at all** — said plainly below, not invented. Source: `seasonal-archive/louis-vuitton.md` §77-91 (Reverse /
  Empreinte / Taurillon / Eclipse / Damier lines), §143-146 (Empreinte named-colour list: Noir permanent + Ombre /
  Infini / Neige / Orage), and the Speedy / Alma / Neverfull / OnTheGo / Métis / Dauphine rows already in the loader.
- **Coach — DESCRIPTOR colours by product-page convention.** Coach names its **leathers** (Glovetanned, Glovetanned
  Pebble, Natural) but its colours are plain descriptors / product names (Black, Chalk, Saddle, Oxblood), not a
  poetic seasonal-colour lexicon. So the **Rogue** colour rows are DESCRIPTORS, Black anchor. Source: official
  coach.com "Design Your Rogue" made-to-order page (three signature leathers) + reseller PDPs.
- **Celine — does NOT name colours.** House identifies by **model + material/canvas**; the one place a colour name
  carries weight is the signature **Tan / Camel** neutral. So the **Luggage** colour rows are DESCRIPTORS. Source:
  `seasonal-archive/celine.md` §41-46, §137-145 (Tan / Black / Camel as plain descriptors); the Luggage line was
  **discontinued March 2025** (§69).

New this run (2026-07-14, all free-tier Firecrawl, every search fed back for the 1-credit refund): official
us.louisvuitton.com New Montsouris Mini/PM/MM PDP (M11197) + PurseBlog + etoile-luxuryvintage for the vintage
naming; official coach.com "Design Your Rogue" MTO page + essexfashionhouse Rogue 31 PDP + a Rogue-collection
reference; official us.louisvuitton.com Sac Plat BB (M46265) + Petit Sac Plat (M81295) PDPs + 24s.com large Sac
Plat + ebay/poshmark BB cm; official eu.louisvuitton.com Graceful PM (N42249) + MM (N42233) PDPs + bragmybag;
official us.louisvuitton.com Mini Soft Trunk Taurillon (M55702/M25927) + Eclipse (M44735) PDPs; and the banked
`celine.md` for the Luggage (mirroring the already-loaded style-484 encoding, see the dedup flag in that section).

---

## STYLE 1 — LV Montsouris (style_id 686)

Louis Vuitton, **CANVAS-primary backpack**. The Montsouris is the classic LV backpack (named for the Parc
Montsouris), **relaunched 2021 as the "New Montsouris"** in a slimmer shape. Current run is **Mini / PM / MM**
(the brief's "BB" does not exist in this line — the smallest current size is **Mini**, said plainly, not invented).
Axes: **size** (Mini / PM / MM), **material = the LINES** (Monogram default / Empreinte / Reverse), **colour**
(Empreinte only, Black anchor). **No hardware axis** (fixed gold-tone, finish tracks the line).

```ts
// LV Montsouris (style 686), archivist-sourced 2026-07-14 (official us.louisvuitton.com New Montsouris MM PDP
// M11197 listing all three: Mini 9.4 x 9.8 x 4.7 in / ~24 x 25 x 12 cm, PM 11 x 11.8 x 7.1 in / ~28 x 30 x 18 cm,
// MM 13.8 x 15 x 8.3 in / ~35 x 38 x 21 cm; PurseBlog + etoile-luxuryvintage for the vintage PM/MM/GM naming;
// model/line from louis-vuitton.md §77-88, Reverse 2016 / Empreinte). LV CANVAS-primary backpack: the LINE is the
// model (Monogram default / Empreinte / Reverse); colour ONLY on the Empreinte leather line, Black anchor; canvas
// lines take no colour choice. Current run is Mini/PM/MM (the brief's 'BB' does not exist — smallest is Mini).
// NO hardware axis. Size x material x colour. cm from the official PDP (in→cm).
const LV_MONTSOURIS: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~24 x 25 x 12 cm (louisvuitton.com M11197 9.4 x 9.8 x 4.7 in); the smallest New Montsouris; the brief's 'BB' does not exist in this line — Mini is the smallest current size", sort_order: 1 },
  { axis: "size", value: "PM", permanence: "permanent", is_default: true, note: "~28 x 30 x 18 cm (louisvuitton.com 11 x 11.8 x 7.1 in); the compact everyday backpack, the most cross-shopped New Montsouris (default vs MM is soft)", sort_order: 2 },
  { axis: "size", value: "MM", permanence: "permanent", note: "~35 x 38 x 21 cm (louisvuitton.com 13.8 x 15 x 8.3 in); the roomy everyday/work backpack", sort_order: 3 },
  { axis: "size", value: "GM", note: "the large VINTAGE Montsouris backpack (~37 x 31 x 13.5 cm, etoile-luxuryvintage); pre-relaunch, resale-only now — vintage naming ran PM/MM/GM before the 2021 Mini/PM/MM relabel", sort_order: 4 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the launch/core line; canvas takes no colour choice", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing leather line", sort_order: 2 },
  { axis: "material", value: "Monogram Reverse", permanence: "seasonal", note: "caramel/brown reverse-Monogram canvas; intermittent runs", sort_order: 3 },
  { axis: "material", value: "Seasonal Print", permanence: "seasonal", note: "By-the-Pool / seasonal Monogram-print / capsule editions, per-listing", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir'; the anchor; canvas lines take no colour choice; other Empreinte colours rotate seasonally, captured per-listing", sort_order: 1 },
];
```

**Sourcing note (LV Montsouris).** Model + lines from `louis-vuitton.md` §77-88 (Monogram / Empreinte / Reverse
lines) and the LV canvas-primary pattern already in the loader (Speedy / Neverfull / Alma): the LINE is the model,
colour appears **only** on the Empreinte leather line (Black anchor), canvas lines take no colour choice. Sizes/cm
this run: the **official us.louisvuitton.com New Montsouris PDP (M11197)** lists all three current sizes — **Mini
9.4 x 9.8 x 4.7 in (~24 x 25 x 12 cm), PM 11 x 11.8 x 7.1 in (~28 x 30 x 18 cm), MM 13.8 x 15 x 8.3 in
(~35 x 38 x 21 cm)**; **etoile-luxuryvintage / PurseBlog** give the pre-relaunch vintage naming (PM/MM/GM, the GM
~37 x 31 x 13.5 cm). **Defaults:** size **PM** (the compact everyday, most cross-shopped; **MM co-popular**, soft);
material **Monogram**; colour **Black**. **MEDIUM, hold these:** (1) **PM-vs-MM default** soft. (2) the **GM** is
seeded as discontinued/historic (vintage, resale-only) — the current line does not include a GM. **Deliberately
omitted, sourced:** **no "BB" size** — the New Montsouris smallest is **Mini**; I did not invent a BB (the brief
listed it as a candidate). **No hardware axis** (fixed gold-tone, tracks the line).

---

## STYLE 2 — Coach Rogue (style_id 498)

Coach, **DESCRIPTOR colours**. The Rogue (2016, the Stuart Vevers "1941" flagship) is the structured wing-tote
satchel in Coach's signature **Glovetanned** leathers. Current made-to-order run is **four sizes** (the size number
≈ the bag's width in cm). Axes: **size** (Rogue 17 / 25 / 31 / 39), **material** (Glovetanned Pebble default +
Glovetanned smooth + Natural + Signature canvas + colorblock + exotic), **colour** (DESCRIPTORS — Black anchor +
browns/brights).

```ts
// Coach Rogue (style 498), archivist-sourced 2026-07-14 (official coach.com "Design Your Rogue" made-to-order page:
// three signature leathers — Glovetanned, Glovetanned Pebble, Natural — and 'four just-right sizes' incl. the
// 'extra-spacious Rogue 39'; essexfashionhouse Rogue 31 PDP = 31 x 25 x 14 cm; a Rogue-collection reference lists
// Rogue 17/25/31/36/39). The size NUMBER ≈ the bag's width in cm. COACH names its LEATHERS but its COLOURS are
// plain descriptors / product names (Black, Chalk, Saddle, Oxblood), not a seasonal-colour lexicon. Size x material
// x colour. cm sourced for the 31 (reseller); 17/25/39 approximated from the size-number convention (hedged).
const COACH_ROGUE: Row[] = [
  { axis: "size", value: "Rogue 17", permanence: "permanent", note: "~17 cm wide; the mini Rogue (crossbody/evening scale); cm approx from the size-number convention", sort_order: 1 },
  { axis: "size", value: "Rogue 25", permanence: "permanent", is_default: true, note: "~25 x 20 x 13 cm (size-number convention; cm approx); the reference everyday Rogue, the most cross-shopped (default vs 31 is soft)", sort_order: 2 },
  { axis: "size", value: "Rogue 31", permanence: "permanent", note: "31 x 25 x 14 cm (essexfashionhouse PDP); the original 2016 Rogue proportion, the roomy work satchel", sort_order: 3 },
  { axis: "size", value: "Rogue 39", permanence: "permanent", note: "~39 cm wide; the 'extra-spacious' large Rogue (coach.com); cm approx from the size-number convention", sort_order: 4 },
  { axis: "size", value: "Rogue 36", note: "~36 cm wide; an older large size (appears in the Rogue-collection reference), largely superseded by the 39 in the current MTO run", sort_order: 5 },
  { axis: "material", value: "Glovetanned Pebble", permanence: "permanent", is_default: true, note: "Coach's signature pebbled glovetanned leather, sturdy + structured; the default Rogue surface", sort_order: 1 },
  { axis: "material", value: "Glovetanned", permanence: "permanent", note: "the smooth glovetanned leather (a coach.com MTO signature leather)", sort_order: 2 },
  { axis: "material", value: "Natural Leather", permanence: "permanent", note: "the third coach.com MTO signature leather (natural/veg-tan finish)", sort_order: 3 },
  { axis: "material", value: "Signature Canvas", permanence: "seasonal", note: "coated Signature-C jacquard canvas Rogue runs", sort_order: 4 },
  { axis: "material", value: "Colorblock / Mixed", permanence: "seasonal", note: "the multi-panel colorblock + suede-trim Rogues, per-listing", sort_order: 5 },
  { axis: "material", value: "Exotic / Embellished", permanence: "seasonal", note: "snakeskin / whipstitch / rivets / tea-rose applique special editions, per-listing", sort_order: 6 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Chalk", permanence: "permanent", note: "off-white/ivory; Coach product-name descriptor", sort_order: 2 },
  { axis: "color", value: "Saddle / Tan", permanence: "permanent", note: "the classic Coach mid-brown/tan; descriptor", sort_order: 3 },
  { axis: "color", value: "Oxblood", permanence: "permanent", note: "the recurring deep wine-red/burgundy; descriptor (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Brights (per-listing)", permanence: "seasonal", note: "the rotating Rogue brights (red, teal, pink, etc.) — captured per-listing as descriptors, not seeded as invented anchors", sort_order: 5 },
];
```

**Sourcing note (Coach Rogue).** Model = the 2016 Stuart Vevers "Coach 1941" Rogue, the structured wing-tote in
Coach's glovetanned leathers (established beat; no Coach file in the banked archive yet, so this run is
house/reseller-sourced and queued for a Coach archive pass). Sizes/cm this run: the **official coach.com "Design
Your Rogue" MTO page** confirms **three signature leathers (Glovetanned, Glovetanned Pebble, Natural)** and **"four
just-right sizes"** including the **"extra-spacious Rogue 39"**; **essexfashionhouse's Rogue 31 PDP** gives
**31 x 25 x 14 cm**; a **Rogue-collection reference** lists **17 / 25 / 31 / 36 / 39**. The size **number ≈ the
bag's width in cm**, so 17/25/39 cm are approximated from that convention (only the 31 is reseller-measured this
run). **The colour rule is Coach's** — Coach names its **leathers** but its **colours are plain descriptors** (Black,
Chalk, Saddle, Oxblood), so the colour rows are descriptors, Black anchor. **Defaults:** size **Rogue 25** (the
reference everyday; **31 co-classic**, soft); material **Glovetanned Pebble** (per the brief); colour **Black**.
**MEDIUM, hold these:** (1) **17/25/39 cm** approximated from the size-number convention, not each measured this
run. (2) **25-vs-31 default** soft. (3) **Rogue 36** seeded as an older/superseded size (discontinued in the current
MTO run). (4) **Oxblood permanence** soft. **Deliberately omitted, sourced:** no invented Coach season-colour names;
the Rogue Shoulder Bag / Rogue Tote are separate builds, per-listing, not seeded as sizes.

---

## STYLE 3 — LV Sac Plat (style_id 714)

Louis Vuitton, **CANVAS-primary flat tote**. The Sac Plat is LV's classic tall, thin, flat vertical tote. The line
now spans a wide size range: the **large classic Sac Plat**, plus modern **Sac Plat 24**, **Sac Plat BB**, and the
micro **Petit Sac Plat**. Axes: **size**, **material = the LINES** (Monogram default / Empreinte / Reverse /
Damier), **colour** (Empreinte only, Black anchor). **No hardware axis**.

```ts
// LV Sac Plat (style 714), archivist-sourced 2026-07-14 (official us.louisvuitton.com Sac Plat BB PDP M46265 =
// 8.5 x 8.7 x 3.5 in / ~21.5 x 22 x 9 cm [ebay/poshmark confirm ~21 x 21.5 x 8], Petit Sac Plat PDP M81295 =
// 5.5 x 6.7 x 2 in / ~14 x 17 x 5 cm; 24s.com large classic Sac Plat = 36.5 x 38 x 9 cm; model/lines from
// louis-vuitton.md §77-88). LV CANVAS-primary flat tote: the LINE is the model (Monogram default / Empreinte /
// Reverse / Damier); colour ONLY on the Empreinte leather line, Black anchor; canvas lines take no colour choice.
// NO hardware axis. Size x material x colour. cm sourced for BB / Petit / large classic; PM and 24 not cleanly
// pinned this run (hedged).
const LV_SAC_PLAT: Row[] = [
  { axis: "size", value: "Petit Sac Plat", permanence: "permanent", note: "~14 x 17 x 5 cm (louisvuitton.com M81295, official); the micro SLG-scale flat tote, worn crossbody via a strap", sort_order: 1 },
  { axis: "size", value: "BB", permanence: "permanent", is_default: true, note: "~21.5 x 22 x 9 cm (louisvuitton.com M46265 8.5 x 8.7 x 3.5 in; ebay/poshmark ~21 x 21.5 x 8); the compact modern Sac Plat, the most liquid on resale", sort_order: 2 },
  { axis: "size", value: "24", permanence: "permanent", note: "the Sac Plat 24 (~24 cm wide, men's-line proportion); exact cm not cleanly sourced this run (MEDIUM)", sort_order: 3 },
  { axis: "size", value: "Sac Plat", permanence: "permanent", note: "36.5 x 38 x 9 cm (24s.com); the large classic flat vertical tote, the original iconic proportion", sort_order: 4 },
  { axis: "size", value: "PM", note: "the smaller VINTAGE Sac Plat PM; not confirmed as a distinct current size this run, seeded as historic/resale-only — do not treat as current until re-sourced (MEDIUM)", sort_order: 5 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the launch/core line; canvas takes no colour choice", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim (no vachetta)", sort_order: 2 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing leather line (esp. on the BB)", sort_order: 3 },
  { axis: "material", value: "Monogram Reverse", permanence: "seasonal", note: "caramel/brown reverse-Monogram canvas; intermittent runs", sort_order: 4 },
  { axis: "material", value: "Seasonal / Print", permanence: "seasonal", note: "Epi + seasonal Monogram-print / capsule editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir'; the anchor; canvas lines take no colour choice; other Empreinte colours rotate seasonally, captured per-listing", sort_order: 1 },
];
```

**Sourcing note (LV Sac Plat).** Model + lines from `louis-vuitton.md` §77-88 and the LV canvas-primary pattern in
the loader: the LINE is the model, colour appears **only** on the Empreinte leather line (Black anchor). Sizes/cm
this run: the **official us.louisvuitton.com Sac Plat BB PDP (M46265)** gives **8.5 x 8.7 x 3.5 in (~21.5 x 22 x 9
cm)** (ebay/poshmark cross-confirm ~21 x 21.5 x 8), the **Petit Sac Plat PDP (M81295)** gives **5.5 x 6.7 x 2 in
(~14 x 17 x 5 cm)**, and **24s.com** puts the **large classic Sac Plat at 36.5 x 38 x 9 cm**. **Defaults:** size
**BB** (the most liquid modern size); material **Monogram**; colour **Black**. **MEDIUM, hold these:** (1) the
**Sac Plat 24** exact cm not cleanly sourced this run (seeded permanent, cm hedged). (2) the **Sac Plat PM** is not
confirmed as a distinct **current** size — it reads as the smaller vintage Sac Plat, so it is seeded as
historic/resale-only and flagged for a re-source pass rather than invented as a current size. **Deliberately
omitted, sourced:** **no hardware axis** (fixed gold-tone); **no colour rows beyond the Empreinte Black anchor**
(canvas lines take no colour, matching the loader's Speedy/Neverfull pattern).

---

## STYLE 4 — LV Graceful (style_id 524)

Louis Vuitton, **CANVAS-ONLY hobo tote**. The Graceful is the lightweight open hobo, the successor look to the
Delightful. It is made **only in coated canvas** (Monogram / Damier Ebene / Damier Azur) — **there is no leather
(Empreinte) Graceful line**, so **this style takes NO colour axis** (said plainly, not invented). Axes reduce to
**size** (PM / MM) and **material = the CANVAS LINES**. **No hardware axis, no colour axis.**

```ts
// LV Graceful (style 524), archivist-sourced 2026-07-14 (official eu.louisvuitton.com Graceful PM PDP N42249 =
// 35 x 30 x 11 cm, Graceful MM PDP N42233 = 41 x 35 x 14 cm; bragmybag cross-confirms both; model/lines from
// louis-vuitton.md §58 [Graceful, lightweight open hobo, Monogram/Damier, PM/MM]). LV CANVAS-ONLY hobo: the LINE is
// the model (Monogram / Damier Ebene / Damier Azur) — there is NO leather (Empreinte) Graceful, so this style takes
// NO colour axis (the lining/trim is fixed; canvas takes no colour choice). NO hardware axis. Size x material only.
// cm from the official PDPs.
const LV_GRACEFUL: Row[] = [
  { axis: "size", value: "PM", permanence: "permanent", note: "35 x 30 x 11 cm (louisvuitton.com N42249, official); the lighter everyday hobo", sort_order: 1 },
  { axis: "size", value: "MM", permanence: "permanent", is_default: true, note: "41 x 35 x 14 cm (louisvuitton.com N42233, official); the extra-roomy hobo, the more iconic/most cross-shopped proportion (default vs PM is soft)", sort_order: 2 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; canvas-only model, takes no colour choice", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim (no vachetta)", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale ivory/blue check, vachetta trim", sort_order: 3 },
];
```

**Sourcing note (LV Graceful).** Model + lines from `louis-vuitton.md` §58 (Graceful: lightweight open hobo,
Monogram/Damier, PM/MM). Sizes/cm this run: the **official eu.louisvuitton.com Graceful PM PDP (N42249)** gives
**35 x 30 x 11 cm** and the **Graceful MM PDP (N42233)** gives **41 x 35 x 14 cm**; **bragmybag** cross-confirms
both (13.8 x 11.8 x 4.3 in / 16.1 x 13.8 x 5.5 in). **The colour rule is the key call:** the Graceful is
**canvas-only** (Monogram / Damier Ebene / Damier Azur) — **there is no Empreinte/leather Graceful line**, so per
the brief's instruction I seed **no colour axis at all** (the trim/lining is fixed; canvas takes no colour choice).
This is the one style in this run where the colour axis is genuinely **absent**, not just anchored — said plainly
rather than seeded with a phantom Black. **Defaults:** size **MM** (the extra-roomy signature; **PM co-popular**,
soft); material **Monogram**. **MEDIUM, hold these:** (1) **MM-vs-PM default** soft. **Deliberately omitted,
sourced:** **no colour axis** (canvas-only, no leather line); **no hardware axis** (fixed gold-tone); the Graceful
is a two-size, canvas-only model — no BB/GM/Nano invented.

---

## STYLE 5 — LV Soft Trunk (style_id 1055)

Louis Vuitton, **CANVAS-primary (men's-origin) trunk bag**. The Soft Trunk (2018, Virgil Abloh) is the soft
reinterpretation of LV's hard trunk, signature in **Monogram Eclipse**. The most liquid version is the **Mini Soft
Trunk**. Axes: **size** (Mini / Soft Trunk / PM / MM), **material = the LINES** (Monogram default / Eclipse /
Taurillon leather / Empreinte / Reverse), **colour** (Taurillon leather line only, Black anchor). **No hardware axis.**

```ts
// LV Soft Trunk (style 1055), archivist-sourced 2026-07-14 (official us.louisvuitton.com Mini Soft Trunk Taurillon
// PDPs M55702 / M25927 = 7.3 x 5.1 x 3.1 in / ~18.5 x 13 x 8 cm, strap drop 22.8 in; Monogram Eclipse PDP M44735;
// poshmark Mini Taurillon ~20 x 12 x 8 cm; model/lines from louis-vuitton.md §83 [Monogram Eclipse → Soft Trunk],
// §90 [Taurillon]). LV CANVAS-primary trunk: the LINE is the model (Monogram / Monogram Eclipse signature /
// Taurillon leather / Empreinte / Reverse); colour ONLY on the Taurillon leather line, Black anchor; canvas lines
// take no colour choice. NO hardware axis. Size x material x colour. cm sourced for the Mini (official); the full
// Soft Trunk / PM / MM cm not cleanly sourced this run (hedged).
const LV_SOFT_TRUNK: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", is_default: true, note: "~18.5 x 13 x 8 cm (louisvuitton.com M55702/M25927 7.3 x 5.1 x 3.1 in; poshmark ~20 x 12 x 8); the crossbody Mini Soft Trunk, the most liquid version (default vs the full Soft Trunk is soft)", sort_order: 1 },
  { axis: "size", value: "Soft Trunk", permanence: "permanent", note: "the original 2018 full Soft Trunk (~25 x 18 x 10 cm, beat estimate); exact cm not cleanly sourced this run (MEDIUM)", sort_order: 2 },
  { axis: "size", value: "PM", permanence: "seasonal", note: "the PM Soft Trunk proportion; cm not cleanly sourced this run (MEDIUM)", sort_order: 3 },
  { axis: "size", value: "MM", permanence: "seasonal", note: "the larger MM Soft Trunk; cm not cleanly sourced this run (MEDIUM)", sort_order: 4 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas; canvas takes no colour choice", sort_order: 1 },
  { axis: "material", value: "Monogram Eclipse", permanence: "permanent", note: "greyscale black/grey Monogram coated canvas; the Soft Trunk's men's-line signature (archive §83)", sort_order: 2 },
  { axis: "material", value: "Taurillon", permanence: "permanent", note: "soft grained Taurillon calf; the colour-bearing leather line (incl. Taurillon Monogram)", sort_order: 3 },
  { axis: "material", value: "Monogram Empreinte", permanence: "seasonal", note: "embossed calfskin; intermittent colour-bearing runs", sort_order: 4 },
  { axis: "material", value: "Monogram Reverse", permanence: "seasonal", note: "caramel/brown reverse-Monogram canvas; intermittent runs", sort_order: 5 },
  { axis: "material", value: "Seasonal / Print", permanence: "seasonal", note: "seasonal print / metallic / capsule editions (e.g. Taurillon Illusion), per-listing", sort_order: 6 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Taurillon 'Noir'; the anchor; canvas lines take no colour choice; other Taurillon colours rotate seasonally, captured per-listing", sort_order: 1 },
];
```

**Sourcing note (LV Soft Trunk).** Model + lines from `louis-vuitton.md` §83 (Monogram Eclipse → Soft Trunk) + §90
(Taurillon): the Soft Trunk is Abloh's 2018 soft trunk, signature in **Monogram Eclipse**, with a colour-bearing
**Taurillon** leather line. Sizes/cm this run: the **official us.louisvuitton.com Mini Soft Trunk PDPs (M55702,
M25927)** give **7.3 x 5.1 x 3.1 in (~18.5 x 13 x 8 cm)**, strap drop 22.8 in, and the **Monogram Eclipse PDP
(M44735)** confirms the Eclipse line; **poshmark** cross-confirms the Mini Taurillon at ~20 x 12 x 8 cm. **The
colour rule is LV's** — colour is a real choice only on the **Taurillon** leather line (Black anchor); the canvas
lines (Monogram / Eclipse) take no colour choice. **Defaults:** size **Mini** (the most liquid; **full Soft Trunk
co-signature**, soft); material **Monogram**; colour **Black**. **MEDIUM, hold these:** (1) the **full Soft Trunk /
PM / MM cm** are not cleanly sourced this run (the search kept returning the *Side* Trunk, a different bag) — seeded
with hedged notes, the full Soft Trunk cm is a beat estimate flagged MEDIUM. (2) **Mini-vs-full default** soft.
**Deliberately omitted, sourced:** **no hardware axis** (fixed tone per line); the Soft Trunk Wearable Wallet /
belt-bag / Nano are separate builds, per-listing, not seeded as sizes.

---

## STYLE 6 — Celine Luggage classic (style_id 207)

Celine, **DESCRIPTOR colours, signature Tan/Camel**. The Luggage is Phoebe Philo's Spring 2010 winged It-tote (rigid
dual handles, a front zip that reads as a "face," winged sides), **discontinued March 2025** (heritage resale icon).
Same **counter-intuitive size order as style 484** — **Nano < Micro < Mini**. Axes: **size** (Nano / Micro / Mini /
Medium + the open-top Phantom sister format), **material** (smooth calf default / grained "Drummed" / suede / felt /
exotic), **colour** (DESCRIPTORS, Black anchor + the signature Tan/Camel). **This is encoded identically to the
already-loaded style 484** — see the dedup flag in the sourcing note.

```ts
// Celine Luggage (style 207), archivist-sourced 2026-07-14 — ENCODED IDENTICALLY to the already-loaded style 484
// "Luggage Tote" (celine.md §69: Philo Spring 2010 winged tote, discontinued March 2025; DESCRIPTOR colours,
// signature Tan/Camel; counter-intuitive Nano < Micro < Mini size order). Style 207 "Luggage" (578 listings) is a
// SEPARATE DB row for the SAME model as style 484 "Luggage Tote" — see the dedup flag in the sourcing note (owner
// decision). Size x material x colour. No hardware axis (fixed).
const CELINE_LUGGAGE_207: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~20 x 20 x 10 cm; the smallest winged Luggage, crossbody-scale; line discontinued March 2025", sort_order: 1 },
  { axis: "size", value: "Micro", permanence: "permanent", is_default: true, note: "~26 x 26 x 15 cm; the most cross-shopped/most liquid Luggage size (default vs Nano is soft)", sort_order: 2 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~30 x 30 x 17 cm; counter-intuitively the BIGGEST of the three core sizes", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "the larger/original Luggage proportion, less common (cm not cleanly pinned)", sort_order: 4 },
  { axis: "size", value: "Phantom", permanence: "permanent", note: "the open-top winged sister (no zip 'face'); a distinct format on the winged silhouette", sort_order: 5 },
  { axis: "material", value: "Smooth Calfskin", permanence: "permanent", is_default: true, note: "smooth/polished calfskin; the classic colour-bearing Luggage surface", sort_order: 1 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "pebbled/grained 'Drummed' calfskin; the sturdier finish", sort_order: 2 },
  { axis: "material", value: "Suede / Nubuck", permanence: "seasonal", note: "suede or nubuck bodies + suede-wing contrast runs, per-listing", sort_order: 3 },
  { axis: "material", value: "Felt / Textile", permanence: "seasonal", note: "felt, wool, or textile-body seasonal editions, per-listing", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / croc / lizard limited runs, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; plain descriptor (Celine does not name its colours)", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "Celine's signature Tan/Camel neutral; descriptor", sort_order: 2 },
  { axis: "color", value: "Grey", permanence: "permanent", note: "the recurring grey/anthracite neutral; descriptor", sort_order: 3 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "incl. Natural/Dune/off-white; descriptor", sort_order: 4 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring red/bright family (bi-colour 'smile' wings common); descriptor (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Celine Luggage, style 207).** Model + material + colour from `celine.md` §41-46, §69, §113-145: the
Luggage is Philo's **Spring 2010** winged It-tote (rigid dual handles, front zip "face," winged sides), **whole line
discontinued March 2025** (heritage resale icon); **Celine does not name its colours** — plain descriptors, with the
signature **Tan / Camel** neutral the one colour that carries weight. Sizes follow the **counter-intuitive Nano <
Micro < Mini** order (the "Mini" is the biggest of the three core sizes); cm reused from the sourced style-484
encoding (Nano ~20 x 20 x 10, Micro ~26 x 26 x 15, Mini ~30 x 30 x 17). **Defaults:** size **Micro** (the most
liquid; **Nano co-popular**, soft); material **Smooth Calfskin**; colour **Black**. **DEDUP FLAG (owner decision
needed):** **style 207 "Luggage" (578 listings) and style 484 "Luggage Tote" (faceted last week) look like duplicate
`style` rows for the SAME model** (Philo's winged Luggage). I have encoded 207 with the identical Luggage facts as
instructed and did **not** invent any distinction between them. These two rows likely want a **dedup/merge** decision
by the owner (pick one canonical style_id, fold the other's listings + aliases into it) — flagged, not actioned.
**MEDIUM, hold these:** (1) **Medium cm** not cleanly pinned. (2) **Micro-vs-Nano default** soft. **Deliberately
omitted, sourced:** no hardware axis (fixed); no invented Celine season-colour names.

---

## Two things to wire when you paste

1. Register all six in the `STYLES` array (style_ids from the brief, all confirmed by the owner; the Celine const is
   named `CELINE_LUGGAGE_207` to avoid colliding with the existing `CELINE_LUGGAGE` const already loaded for style
   484):
   `{ styleId: 686, name: "Montsouris", rows: LV_MONTSOURIS }`,
   `{ styleId: 498, name: "Rogue", rows: COACH_ROGUE }`,
   `{ styleId: 714, name: "Sac Plat", rows: LV_SAC_PLAT }`,
   `{ styleId: 524, name: "Graceful", rows: LV_GRACEFUL }`,
   `{ styleId: 1055, name: "Soft Trunk", rows: LV_SOFT_TRUNK }`,
   `{ styleId: 207, name: "Luggage", rows: CELINE_LUGGAGE_207 }`.
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; montsouris-rogue-sacplat-graceful-softtrunk-celineluggage-production-matrix.md"` so the provenance string
   stays honest.
