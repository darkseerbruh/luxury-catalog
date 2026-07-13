# BV Cassette + Gucci Jackie 1961 + Goyard Artois + LV Pochette Métis — production matrices (selector seed)

*Archivist run 2026-07-13. Same shape and rigor as `lv-alma-hermes-birkin-production-matrix.md`,
`onthego-ladydior-saintlouis-jackie-production-matrix.md`, and the matrices already in
`supabase/ingest/load-production-options.ts`: one reviewed source-of-truth list per style, NOT a
full combination matrix. Each axis value traces to a cited, dated source; anything I could not
source is hedged (MEDIUM) or omitted, never invented. Four sections, each a ready `Row[]` to paste
into `load-production-options.ts`.*

Reused ground truth (already sourced + banked, so not re-scraped this run):
`seasonal-archive/bottega-veneta.md` (Cassette model, Daniel Lee pre-fall 2019 debut, Padded Cassette
FW2019, Maxi/Padded Intreccio, and the full BV named-colour lexicon — Parakeet is the one house-
confirmed official name, the rest reseller-attributed at medium confidence),
`seasonal-archive/gucci.md` + `gucci.jsonl` (Jackie 1961 model = 1961 "Fifties Constance" reissued as
"Jackie 1961" by Michele FW2020, piston closure, GG Supreme/Web/leather motifs, and the load-bearing
fact that **Gucci does NOT name its colours** — descriptor families only), `seasonal-archive/louis-vuitton.md`
(Pochette Métis 2012 Monogram / Empreinte added later; Monogram / Reverse / Empreinte line vocabulary),
and the Goyard notes (chevron Goyardine 1892, colour-primary standing palette) plus the just-shipped
`onthego-ladydior-saintlouis-jackie-production-matrix.md` §3 Goyard Saint Louis (the standing ~11-colour
Goyardine palette I reuse here for the Artois).

New this run (2026-07-13, all free-tier Firecrawl): net-a-porter + Mytheresa + Amazon Cassette PDPs
(cm), Rebag "The Size Guide: Gucci Jackie 1961" (Feb 2023) + luxbags.fr Jackie guide + gucci.com Jackie
capsule snippet, goyard.com Artois PM/GM product pages + leelinebags Goyard size chart + fashionphile
Goyard tote guide (Artois MM), and us.louisvuitton.com Pochette Métis + Pochette Métis East West PDPs +
bagreligion LV classics size table (Mini Pochette Métis).

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. Two houses here are
**colour-primary** (Bottega — one weave, colour is the variant; Goyard — one tote shape, colour is the
variant), one is **size × material-colour × (no)hardware descriptor** (Gucci), one is **LV canvas-primary**
(Pochette Métis). Per the banked archive colour-naming rule: **Bottega and Goyard NAME/standardize their
colours** (seed the anchors, rotate the rest per-listing); **Gucci does NOT** (its colour axis is plain
descriptor families, seeded as anchors but explicitly not house names); **LV** names its leather-line
colours (official), which apply only inside the Empreinte line.

cm are approximate where converted from resellers' inch measurements; goyard.com and LV.com give native cm.

---

## STYLE 1 — Bottega Veneta Cassette (style_id 211)

Bottega is **colour-primary**: the Intrecciato weave is the one construction language, and the **colour
of the leather is the variant** (BV genuinely names its colours — Parakeet, Fondant, Barolo, Travertine,
Porridge). Axes: **size** (Candy/Small/Medium), **material** (the weave/finish — standard Maxi Intrecciato
vs the Padded signature vs seasonal tech/suede), and **colour** (Black anchor + BV's recurring named
colours, seasonal/per-listing). **No hardware axis** — the Cassette's hardware is minimal/tonal, not a
shopper choice (the gold-chain "Chain Cassette" is a per-listing variant, noted below, not a hardware axis).

```ts
// Bottega Veneta Cassette (style 211), archivist-sourced 2026-07-13 (net-a-porter Cassette medium padded
// PDP + Mytheresa Padded Tech Cassette Small PDP + Amazon Candy Cassette PDP for sizes/cm; model, Daniel
// Lee pre-fall 2019 debut, Padded Cassette FW2019, and the Maxi/Padded Intreccio weave + the named-colour
// lexicon from seasonal-archive/bottega-veneta.md). COLOUR-PRIMARY: the Intrecciato weave is the one
// construction, colour is the variant, and BV NAMES its colours (Parakeet is house-confirmed official; the
// rest are reseller-attributed at medium confidence and rotate seasonally, captured per-listing). Material
// axis = the weave/finish. NO hardware axis (minimal/tonal; the gold-chain Chain Cassette is per-listing).
// cm approximate (converted from reseller inches).
const BV_CASSETTE: Row[] = [
  { axis: "size", value: "Candy", permanence: "permanent", note: "~9 x 12.5 x 5 cm; the cult mini (formerly 'Mini Cassette'), evening/crossbody scale (MEDIUM: cm from Amazon PDP)", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~14 x 23 x 7 cm; the everyday Padded Cassette, most liquid on resale (MEDIUM: default vs Candy is a judgment call)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~15 x 28 x 7 cm; the roomier shoulder size", sort_order: 3 },
  { axis: "material", value: "Intrecciato", permanence: "permanent", is_default: true, note: "Maxi Intrecciato woven nappa/lambskin; the base weave (Lee's oversized 'microscope' plait, 2019)", sort_order: 1 },
  { axis: "material", value: "Padded Intrecciato", permanence: "permanent", note: "the puffy padded weave; the FW2019 It-bag finish, the Cassette's signature look", sort_order: 2 },
  { axis: "material", value: "Tech / Nylon", permanence: "seasonal", note: "'Padded Tech Cassette' coated/tech-canvas seasonal runs", sort_order: 3 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede/other seasonal finishes", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "lizard / crocodile / metallic special editions, per-listing", sort_order: 5 },
  // BV NAMES its colours. Black is the permanent anchor; the named colours below recur across seasons but
  // BV rotates them, so they are seeded seasonal and the full rotation (Fennel, Travertine, Amaranto,
  // Wisteria, the 'Washed' pastels, etc.) is captured per-listing. Only Parakeet is house-confirmed
  // OFFICIAL; the rest are reseller-attributed (Fashionphile BV colour guide) at medium confidence.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; nero, the easiest Cassette to source", sort_order: 1 },
  { axis: "color", value: "Parakeet", permanence: "seasonal", note: "BV's signature acid-green house colour (OFFICIAL, reintroduced SS2021); recurs but rotates", sort_order: 2 },
  { axis: "color", value: "Fondant", permanence: "seasonal", note: "deep warm chocolate; reseller-attributed BV name (MEDIUM)", sort_order: 3 },
  { axis: "color", value: "Barolo", permanence: "seasonal", note: "deep burgundy; reseller-attributed BV name (MEDIUM)", sort_order: 4 },
  { axis: "color", value: "Travertine", permanence: "seasonal", note: "light olive; reseller-attributed BV name (MEDIUM)", sort_order: 5 },
  { axis: "color", value: "Porridge", permanence: "seasonal", note: "ivory beige neutral; reseller-attributed BV name (MEDIUM)", sort_order: 6 },
];
```

**Sourcing note (BV Cassette).** Model, debut, and weave: the banked `seasonal-archive/bottega-veneta.md`
(high confidence, Vogue + SACLÀB cross-checked) dates the Cassette to **pre-fall 2019** (Daniel Lee) as a
small crossbody in the oversized **Maxi Intrecciato** weave ("a microscope view of the classic weave"),
with the cult **Padded Cassette** arriving **FW2019** — so the material axis (standard Maxi vs Padded) is a
real, dated construction distinction, not invented. Sizes/cm this run: net-a-porter "Cassette medium padded
Intrecciato" PDP gives 15 x 28 x 7 cm; Mytheresa "Padded Tech Cassette Small" gives 14 x 23 x 7 cm; the
Amazon "Candy Cassette Mini" listing gives 3.5 x 5 x 2 in (~9 x 12.5 x 5 cm) and confirms the rename — the
old "Mini Cassette" is now cataloged as **"Candy"** (corroborated by a YouTube "Candy Cassette (ie formerly
Mini Cassette)" review). The colour lexicon is the reused banked archive: **Parakeet** is the one
house-confirmed OFFICIAL BV colour (reintroduced SS2021, now part of BV store branding); Fondant, Barolo,
Travertine, and Porridge are how Fashionphile's BV colour guide catalogs them (reseller-attributed, medium
confidence, very likely BV's own names but not confirmed against bottegaveneta.com this run — brand .com
Akamai-blocks Firecrawl). **MEDIUM, hold these:** (1) **Small-vs-Candy default** — I set Small (the everyday
Padded Cassette) default as the most liquid on resale, but the Candy mini is a genuine cult object and
co-popular; treat the default as soft. (2) **Candy cm** are from a marketplace PDP, not a BV spec sheet, so
approximate. (3) **All named colours are seeded seasonal** (except Black) because BV rotates its palette
every season — the standing palette is real but not a fixed year-round set like Goyard's. **Deliberately
omitted:** **no hardware axis** — the Cassette is minimal/tonal hardware; the **gold-chain "Chain Cassette"**
is a per-listing variant (a strap swap), not a hardware choice, so it is noted, not seeded. The full BV
named-colour rotation (Fennel, Amaranto, Wisteria, Ice, the "Washed" pastels, etc. — see
`bottega-veneta.md`) is captured per-listing, not seeded as permanent.

---

## STYLE 2 — Gucci Jackie 1961 (style_id 446)

Gucci crescent hobo with the signature **cylindrical piston closure**, faceted by **size × material ×
colour**. The one load-bearing Gucci caveat, house-verified in the banked `gucci.md`/`chrome-com-colors-2026.md`:
**Gucci does NOT name its colours** — descriptor families only ("black GG leather", "light pink"). So the
colour axis is seeded as **permanent descriptor anchors, explicitly not house names** (unlike Bottega/Goyard
below). Material is the primary surface (GG Supreme canvas default + smooth leather + suede + printed/exotic).
**No hardware axis** — the piston is fixed on every Jackie; its finish (gold-tone / palladium) tracks the
colorway, not an independent shopper choice.

```ts
// Gucci Jackie 1961 (style 446), archivist-sourced 2026-07-13 (Rebag "The Size Guide: Gucci Jackie 1961"
// Feb 2023 + luxbags.fr Jackie guide for sizes/cm; gucci.com Jackie capsule snippet confirms mini/small/
// medium + GG Supreme + leather; model = 1961 "Fifties Constance" reissued "Jackie 1961" by Michele FW2020,
// piston closure, from seasonal-archive/gucci.md; colour treatment from chrome-com-colors-2026.md, which
// house-confirms GUCCI DOES NOT NAME ITS COLOURS — descriptor families only). Faceted size × material ×
// colour. Colour anchors are DESCRIPTORS, not house names. NO hardware axis (piston fixed, finish tracks the
// colorway). cm approximate (Rebag gives W x H x D inches).
const GUCCI_JACKIE: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~19 x 13 x 3 cm; the tiny crossbody (Rebag: 7.5 x 5.1 x 1.2 in)", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~28 x 19 x 4.5 cm; the reference Jackie everyone pictures, most cross-shopped (MEDIUM: default vs Medium is soft)", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~36.5 x 24 x 4.5 cm; the largest, classic hobo proportion (Rebag: 14.4 x 9.6 x 1.8 in)", sort_order: 3 },
  { axis: "size", value: "Notte", permanence: "seasonal", note: "elongated mini evening/baguette Jackie variant; recent, scarcer (MEDIUM: currency/cm not sourced this run)", sort_order: 4 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", is_default: true, note: "beige/ebony coated GG Supreme canvas with leather trim; the everyday Jackie", sort_order: 1 },
  { axis: "material", value: "Smooth Leather", permanence: "permanent", note: "calfskin; the polished reissue leather (the celebrity 'red/white Jackie' version)", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Printed / Exotic", permanence: "seasonal", note: "leopard/snakeskin prints + exotics + Hacker Project (x Balenciaga) capsule, per-listing", sort_order: 4 },
  // Descriptor colour ANCHORS — Gucci does NOT name its colours (house-confirmed). Black is the anchor; all
  // other shades rotate seasonally and are captured per-listing. Canvas is fixed beige/ebony; colour choice
  // lives on the leather/suede versions.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory leather; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (MEDIUM permanence)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring light-pink Jackie (descriptor); near-permanent (MEDIUM permanence)", sort_order: 5 },
];
```

**Sourcing note (Gucci Jackie 1961).** Model and history: the banked `gucci.md`/`gucci.jsonl` (high
confidence, Christie's + Vogue) confirm the Jackie is a **1961** crescent hobo with a **cylindrical piston
closure**, originally the "Fifties Constance," renamed for Jackie Kennedy, and **reissued as "Jackie 1961"
by Alessandro Michele for FW2020** (a softer "Jackie" followed under Demna, 2025). Sizes/cm: Rebag "The Size
Guide: Gucci Jackie 1961" (rebag.com/thevault, pub. Feb 17 2023, captured 2026-07-13) gives the three-size
run in W x H x D inches — **Mini** 7.5 x 5.1 x 1.2 (~19 x 13 x 3 cm), **Small** 11 x 7.5 x 1.8 (~28 x 19 x
4.5 cm), **Medium** 14.4 x 9.6 x 1.8 (~36.5 x 24 x 4.5 cm) — with luxbags.fr corroborating the Mini at W19 x
H13 x D3 cm, and gucci.com's Jackie 1961 shoppable article confirming "resized in mini, small and medium
versions" plus "gg supreme canvas" and leather. The **colour treatment is the load-bearing Gucci fact**:
`chrome-com-colors-2026.md` (Chrome capture of gucci.com, 2026-06-28) house-confirms Gucci labels colours as
**plain descriptors + material**, with no poetic named-colour lexicon — so the five colour rows are
descriptor anchors, explicitly not house names (the lone genuinely-named Gucci house colour, **Rosso Ancora**,
is De Sarno-era SS2024 and not a Jackie staple, so it is not seeded). **MEDIUM, hold these:** (1)
**Small-vs-Medium default** — I set Small default as the reference silhouette every celebrity carries (the
"small red / small white Jackie" in the Rebag celeb roundup), but the Medium is the classic full-size hobo;
soft default. (2) **Notte** — the Jackie **Notte** is a real, more recent elongated mini evening/baguette
variant, but I did not source its current cm or confirm it is still in production this run, so it is seeded
**seasonal + MEDIUM**, not led with. (3) **Red + Pink permanence** — the Jackie keeps a red and a light pink
most seasons (both shown on Rebag/gucci.com), but the exact shade rotates, so seeded permanent as descriptor
families and flagged. **Deliberately omitted:** **"Jumbo"** — the brief listed a possible Jumbo size, but no
source this run shows a Jackie Jumbo (the largest cataloged Jackie is Medium), so it is **not seeded** (a null
beats an invented size). **No hardware axis** — the piston closure is fixed on every Jackie and its finish
tracks the colorway rather than being an independent choice, matching how Speedy/Alma/OnTheGo were encoded.
The **Jackie 1961 vs vintage "Jackie" / "Fifties Constance"** disambiguation is logged in `gucci.md` for the
categorizer; the Hacker Project (x Balenciaga, 2021) Jackie is a per-listing capsule, captured under
Printed/Exotic.

---

## STYLE 3 — Goyard Artois (style_id 561)

Goyard is **colour-primary** exactly like the Saint Louis (559): the Artois is one Goyardine tote shape
(the structured, zip-top, based sibling of the open Saint Louis), and the **colour of the Goyardine is the
variant**. Goyard **standardizes and keeps a named colour palette** (the same standing ~11-colour Goyardine
range I sourced for the Saint Louis), so those permanent colours are seeded and the Pearly / special
editions rotate per-listing. Axes: **size (PM/MM/GM)** and **colour**. No hardware axis (minimal palladium),
no material axis worth faceting (Goyardine + Chevroches calf trim is the one construction).

```ts
// Goyard Artois (style 561), archivist-sourced 2026-07-13 (goyard.com/us_en Artois PM + GM product pages
// for native cm; leelinebags Goyard size chart + fashionphile Goyard tote guide for the Artois MM; the
// standing Goyardine colour palette reused from onthego-ladydior-saintlouis-jackie-production-matrix.md §3
// Saint Louis, itself sourced from goyard.com's "11 available colors" PLP + BagUSeek tote guide). COLOUR-
// PRIMARY like the Saint Louis: one structured zip-top tote shape, the Goyardine colour is the variant.
// Goyard keeps a standing named palette, so permanent colours are seeded; Pearly/special editions rotate,
// captured per-listing. NO hardware axis (minimal palladium). cm are Goyard's own (LxWxH).
const GOYARD_ARTOIS: Row[] = [
  { axis: "size", value: "PM", permanence: "permanent", is_default: true, note: "40 x 14 x 25 cm, ~460 g; the everyday core size (Petit Modèle)", sort_order: 1 },
  { axis: "size", value: "MM", permanence: "permanent", note: "~50 x 17 x 30 cm; the mid carryall (MEDIUM: cm from reseller charts, not a goyard.com spec page this run)", sort_order: 2 },
  { axis: "size", value: "GM", permanence: "permanent", note: "68 x 24 x 37 cm, ~1.02 kg; the large travel tote (Grand Modèle)", sort_order: 3 },
  { axis: "material", value: "Goyardine", permanence: "permanent", is_default: true, note: "coated chevron canvas + Chevroches calfskin trim, structured with a zip top; the one construction", sort_order: 1 },
  { axis: "material", value: "Pearly Goyardine", permanence: "seasonal", note: "pearlescent-finish Goyardine, limited", sort_order: 2 },
  { axis: "material", value: "Claire-Voie", permanence: "seasonal", note: "edge-painted/openwork special edition, per-listing", sort_order: 3 },
  // Standing Goyardine palette (Goyard names + keeps these — same range as the Saint Louis). Black is the
  // anchor; special finishes (Pearly, multicolour, Special Colors / hand-painted) rotate, captured per-listing.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black (with natural-tan Chevroches trim) is the easiest to source", sort_order: 1 },
  { axis: "color", value: "Tan", permanence: "permanent", note: "natural/tan Goyardine", sort_order: 2 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "standing blue", sort_order: 3 },
  { axis: "color", value: "Grey", permanence: "permanent", sort_order: 4 },
  { axis: "color", value: "Green", permanence: "permanent", sort_order: 5 },
  { axis: "color", value: "Sky Blue", permanence: "permanent", note: "pale blue, a standing bright", sort_order: 6 },
  { axis: "color", value: "Burgundy", permanence: "permanent", sort_order: 7 },
  { axis: "color", value: "Red", permanence: "permanent", sort_order: 8 },
  { axis: "color", value: "Orange", permanence: "permanent", sort_order: 9 },
  { axis: "color", value: "Yellow", permanence: "permanent", sort_order: 10 },
  { axis: "color", value: "White", permanence: "permanent", sort_order: 11 },
];
```

**Sourcing note (Goyard Artois).** Dimensions and material: goyard.com/us_en **Artois PM** page
(`sac-artois-pm.html`) gives native **40 x 14 x 25 cm, ~460 g**, and the **Artois GM** page
(`sac-artois-gm.html`) gives **68 x 24 x 37 cm, ~1.02 kg** (both captured 2026-07-13), described as
**Goyardine** canvas with **Chevroches** calfskin trim — the Artois is the structured, zip-top, based
version of the tote family (vs the open, reversible Saint Louis). The **MM** sits between them: the
leelinebags "Goyard Bag Sizes" chart gives Artois MM **50 x 17 x 30 cm**, and the fashionphile "Guide to
Goyard Tote Bags" corroborates the PM/MM/GM run (PM ~12 x 9.75 x 5.5 in, MM ~14.25 x 11.5 x 6.5 in, GM
~17.75 in wide). The **colour palette is reused, not re-derived**: it is the same standing ~11-colour
Goyardine range I sourced for the Saint Louis in the prior run (goyard.com "11 available colors" PLP +
BagUSeek tote guide, mod. 2026-05-11) — Goyard sits with the houses that name/standardize their colours,
and the Artois carries the identical Goyardine palette. Default **PM** (the everyday core; GM is co-popular
for travel — soft default). **MEDIUM, hold these:** (1) **MM cm** come from reseller size charts, not a live
goyard.com Artois MM spec page this run, so approximate. (2) The **Pearly / Claire-Voie** material rows are
genuine but limited; seeded seasonal so the selector shows them without implying standing stock. **Deliberately
omitted:** **hardware axis** — the Artois has minimal palladium hardware, not a shopper choice; special-order
**Special Colors** and hand-painted personalisation (stripes/initials) are per-listing, not seeded. Goyard
publishes no universal price/colour list, so treat the standing palette as the well-attested reference, not a
house-published spec.

---

## STYLE 4 — LV Pochette Métis (style_id 438)

LV **canvas-primary** exactly like the Speedy (433) / Alma (434) / OnTheGo (437): the **material/line** is
the primary axis (Monogram default), and **colour applies only inside the Empreinte leather line** (LV names
are official); the canvas lines take no colour choice. Axes: **size** (regular / East-West / Mini),
**material** (the lines), **colour** (Empreinte only). **No construction toggle** — the Pochette Métis ships
with both a leather strap and a chain strap standard on every version, so there is no separate "Bandoulière"
line. **No hardware axis** (fixed gold-tone per line).

```ts
// LV Pochette Métis (style 438), archivist-sourced 2026-07-13 (us.louisvuitton.com Pochette Métis M44875 +
// Pochette Métis East West M46595/M46279 PDPs for cm; bagreligion LV classics size table for the Mini
// Pochette Métis; line vocabulary from seasonal-archive/louis-vuitton.md, which dates the Pochette Métis to
// 2012 Monogram with Empreinte added later, and Monogram Reverse to 2016). LV's PRIMARY axis is the CANVAS/
// material (Monogram default); colour varies only inside the Empreinte leather line and LV names are
// OFFICIAL. NO construction toggle (leather + chain straps ship standard on every version, no Bandoulière
// line). NO hardware axis (fixed gold-tone per line). cm approximate (from LV.com L x H x W inches).
const LV_POCHETTE_METIS: Row[] = [
  { axis: "size", value: "Regular", permanence: "permanent", is_default: true, note: "~25 x 19 x 7 cm; the original 2012 satchel, the resale workhorse (LV.com: 9.8 x 7.5 x 2.8 in)", sort_order: 1 },
  { axis: "size", value: "East West", permanence: "permanent", note: "~21.5 x 13.5 x 6 cm; the flatter horizontal reissue (LV.com: 8.5 x 5.3 x 2.4 in)", sort_order: 2 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 14 x 6 cm; the compact version (bagreligion: 7.9 x 5.5 x 2.4 in) (MEDIUM: cm from a reference table, not an LV.com PDP this run)", sort_order: 3 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated Monogram canvas, natural vachetta trim; the 2012 launch line", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte", permanence: "permanent", note: "embossed calfskin; the colour-bearing line (added after the 2012 Monogram launch)", sort_order: 2 },
  { axis: "material", value: "Monogram Reverse", permanence: "permanent", note: "caramel/brown reverse-Monogram canvas (line debuted 2016); the two-tone look", sort_order: 3 },
  { axis: "material", value: "Damier Ebene", permanence: "seasonal", note: "brown check, dark leather trim; intermittent runs (MEDIUM: less common on the Pochette Métis)", sort_order: 4 },
  // Colour applies ONLY to the Empreinte leather line; LV names are official. Noir is the anchor; canvas
  // lines (Monogram/Reverse/Damier) take no colour choice; other Empreinte colours (Dune, Terre, Marine,
  // etc.) rotate seasonally and are captured per-listing.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir'; the anchor; canvas lines take no colour choice", sort_order: 1 },
];
```

**Sourcing note (LV Pochette Métis).** Model and lines: the banked `seasonal-archive/louis-vuitton.md`
dates the Pochette Métis to **2012** in **Monogram** (a compact structured satchel with a chain + leather
strap and an S-lock, "the resale workhorse"), with **Empreinte** added later and **Monogram Reverse**
debuting **2016** (medium/high confidence there). Sizes/cm this run: us.louisvuitton.com gives the
**regular** Pochette Métis at 9.8 x 7.5 x 2.8 in (~25 x 19 x 7 cm) and the **Pochette Métis East West**
(M46595 Empreinte / M46279 Monogram) at 8.5 x 5.3 x 2.4 in (~21.5 x 13.5 x 6 cm) — the two shown side by
side on the LV.com PDP size comparison; the **Mini Pochette Métis** is confirmed by the bagreligion LV
classics size table at 7.9 x 5.5 x 2.4 in (~20 x 14 x 6 cm). Colour is encoded LV-style: **only the
Empreinte line carries a colour choice** (LV names — Noir the anchor; Dune, Terre, Marine, Bordeaux etc.
rotate seasonally, captured per-listing), while the Monogram/Reverse/Damier canvas lines take no colour
choice. **MEDIUM, hold these:** (1) **Mini cm** are from a reference table, not a live LV.com PDP this run
(an IG reseller listing gave a slightly different 13.5 x 17 x 5 cm, so treat as approximate). (2) **Damier
Ebene** on the Pochette Métis is genuine but uncommon — seeded seasonal/MEDIUM; if the resale data shows no
Damier Pochette Métis volume, drop it. (3) **East West + Mini permanence** — both are current LV.com /
active-resale sizes, seeded permanent, but LV rotates which sizes are in the live lineup, so watch them.
**Deliberately omitted:** **no construction axis** — unlike the Speedy there is no "Pochette Métis
Bandoulière" line; every Pochette Métis ships with both the adjustable leather strap and the chain strap
standard, so a toggle would be false structure. **No hardware axis** — hardware is fixed gold-tone per line,
matching how Speedy/Alma/OnTheGo were encoded. The default **Regular** is the original 2012 proportion and
the dominant resale size.

---

## Two things to wire when you paste

1. Register all four in the `STYLES` array:
   `{ styleId: 211, name: "Cassette", rows: BV_CASSETTE }`,
   `{ styleId: 446, name: "Jackie 1961", rows: GUCCI_JACKIE }`,
   `{ styleId: 561, name: "Artois", rows: GOYARD_ARTOIS }`,
   `{ styleId: 438, name: "Pochette Métis", rows: LV_POCHETTE_METIS }`.
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; cassette-jackie-artois-pochettemetis-production-matrix.md"` so the provenance string stays honest.
   (Filename lists all four styles shipped this run; no working-slug mismatch this time.)
