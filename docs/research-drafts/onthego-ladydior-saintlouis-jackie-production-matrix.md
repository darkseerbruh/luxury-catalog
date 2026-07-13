# LV OnTheGo + Dior Lady Dior + Goyard Saint Louis + Gucci GG Marmont — production matrices (selector seed)

*Archivist run 2026-07-12. Same shape and rigor as `lv-alma-hermes-birkin-production-matrix.md`,
`classic-flap-production-matrix.md`, and the matrices already in
`supabase/ingest/load-production-options.ts`: one reviewed source-of-truth list per style, NOT a
full combination matrix. Each axis value traces to a cited, dated source; anything I could not
source is hedged (MEDIUM) or omitted, never invented. Four sections, each a ready `Row[]` to paste
into `load-production-options.ts`.*

Reused ground truth (already sourced + banked, so not re-scraped this run):
`seasonal-archive/louis-vuitton.md` (OnTheGo model + LV line/canvas vocabulary),
`seasonal-archive/dior.md` (Lady Dior model + Cannage materials + creative-director timeline),
`seasonal-archive/gucci.md` and `seasonal-archive/chrome-com-colors-2026.md` (GG Marmont model,
matelassé motif, and the house-published fact that **Gucci does NOT name its colors** — descriptors
only). New this run: LV.com OnTheGo product dimensions, Spotted Fashion OnTheGo reference guide
(2020-06-26), Fashionphile Lady Dior + Marmont size guides, saclab Lady Dior guide, goyard.com
Saint Louis PM/GM pages, and the BagUSeek Saint Louis tote guide (mod. 2026-05-11) for the standing
Goyardine palette.

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic (the Boy "XL"
pattern). Two houses here are **colour-primary** (Dior, Goyard — one silhouette, colour is the
variant, like Chanel), one is **LV canvas-primary** (OnTheGo), one is **size × leather-colour ×
hardware** (Marmont). Per the banked archive: LV/Dior/Goyard name their colours (seed the permanent
anchors, rotate the rest per-listing); **Gucci does not** (its colour axis is plain descriptor
families, seeded as anchors but explicitly not house names).

cm are approximate, converted from the resellers' inch measurements (LV/Goyard also give native cm).

---

## STYLE 1 — LV OnTheGo (style_id 437)

LV canvas-primary model, exactly like Speedy (433) / Neverfull (218) / Alma (434): the
**material/line** is the primary axis, **colour applies only inside the leather line** (Empreinte),
canvas lines take no colour choice. The OnTheGo's signature is the **bicolour "Giant" two-tone**
look (the enlarged Monogram), which shows up both as Monogram Empreinte (black/beige leather) and
Reverse Monogram (caramel canvas). Two deliberate omissions, both explained in the sourcing note:
**no construction axis** (there is no "OnTheGo Bandoulière" line — the tote ships with fixed top
handles + shoulder straps, confirmed) and **no hardware axis** (fixed gold-tone per line).

```ts
// LV OnTheGo (style 437), archivist-sourced 2026-07-12 (us.louisvuitton.com product dimensions +
// Spotted Fashion OnTheGo reference guide 2020-06-26; LV line vocabulary from
// seasonal-archive/louis-vuitton.md, which dates the OnTheGo to SS2019). LV's PRIMARY axis is the
// CANVAS/material (Monogram Giant default); colour varies only inside the leather line (Empreinte)
// and LV names are OFFICIAL. The OnTheGo's signature is the bicolour "Giant" two-tone (Monogram
// Empreinte black/beige + Reverse Monogram). NO construction toggle (fixed handles+straps, no
// Bandoulière line). NO hardware axis (fixed gold-tone per line). cm approximate (from LV.com inches).
const LV_ONTHEGO: Row[] = [
  { axis: "size", value: "BB", permanence: "permanent", note: "~18 x 15 x 8 cm; the mini, added later, least common (MEDIUM: currency/priority)", sort_order: 1 },
  { axis: "size", value: "PM", permanence: "permanent", note: "~25 x 19 x 11.5 cm; the compact everyday size", sort_order: 2 },
  { axis: "size", value: "MM", permanence: "permanent", is_default: true, note: "~35 x 27 x 14 cm; the most-carried/most-liquid size (MEDIUM: default vs GM is a judgment call)", sort_order: 3 },
  { axis: "size", value: "GM", permanence: "permanent", note: "~41 x 34 x 19 cm; the original 2019 launch size, true large tote", sort_order: 4 },
  { axis: "material", value: "Monogram Giant", permanence: "permanent", is_default: true, note: "enlarged-Monogram coated canvas, natural vachetta trim; the SS2019 launch line", sort_order: 1 },
  { axis: "material", value: "Monogram Empreinte Giant", permanence: "permanent", note: "embossed calfskin, giant Monogram; the bicolour (black/beige) two-tone signature; the colour-bearing line", sort_order: 2 },
  { axis: "material", value: "Monogram Reverse Giant", permanence: "permanent", note: "caramel/brown reverse-Monogram canvas; the other two-tone signature look", sort_order: 3 },
  { axis: "material", value: "Epi", permanence: "seasonal", note: "textured leather, MM only; intermittent runs (Grenade/Noir/Blanc seen)", sort_order: 4 },
  { axis: "material", value: "Monogram Denim", permanence: "seasonal", note: "denim Giant Monogram, limited", sort_order: 5 },
  { axis: "material", value: "LV Escale", note: "SS2020 tie-dye print capsule (Rouge/Bleu/Pastel); discontinued/collectible", sort_order: 6 },
  // Colour applies only to the Empreinte leather line; LV names are official. Noir is the anchor;
  // canvas lines (Monogram Giant/Reverse) take no colour choice; other Empreinte colours rotate
  // seasonally and are captured per-listing.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Empreinte 'Noir' half of the bicolour; the anchor; canvas lines take no colour choice", sort_order: 1 },
  { axis: "color", value: "Cream", permanence: "permanent", note: "Empreinte 'Crème/Beige'; the pale bicolour, near-permanent (MEDIUM permanence)", sort_order: 2 },
];
```

**Sourcing note (LV OnTheGo).** Sizes and dimensions: us.louisvuitton.com OnTheGo product pages
(M44925 GM Empreinte; M45321 MM Monogram, captured 2026-07-12) give the official inch dimensions I
converted — GM 16.1 x 13.4 x 7.5 in, MM 13.8 x 10.6 x 5.5 in, PM 9.8 x 7.5 x 4.5 in, BB 7.1 x 5.9 x
3.3 in. The line/canvas roster comes from the Spotted Fashion "Louis Vuitton Onthego Tote Bag
Reference Guide" (spottedfashion.com, pub. 2020-06-26): it dates the OnTheGo to the SS2019
collection, first seen in **Monogram Giant**, then Monogram Reverse, Monogram Denim, and the SS2020
**LV Escale** print, with the smaller **MM** added later in Monogram Reverse and Monogram Empreinte.
The debut year and line vocabulary cross-check the banked `seasonal-archive/louis-vuitton.md`
(OnTheGo 2019; Monogram 1896, Monogram Reverse 2016, Monogram Empreinte 2010/2012). **MEDIUM, hold
these:** (1) **MM-vs-GM default** — I set MM default as the most-carried/most-liquid size and the
current sweet spot, but the GM was the launch size and is co-popular; treat the default as soft.
(2) **BB currency/priority** — the BB appears on LV.com but is the least common OnTheGo; seed it,
don't lead with it. (3) **Cream/Crème permanence** — the black/beige bicolour Empreinte is the
enduring OnTheGo, so I seeded Cream permanent, but LV rotates the exact pale shade, so watch it.
**Deliberately omitted, sourced:** **no construction axis** — unlike the Speedy there is no "OnTheGo
Bandoulière" line; the shoulder straps + Toron top handles are fixed on every OnTheGo (Spotted
Fashion describes both as standard), so a toggle would be false structure. **No hardware axis** —
hardware is fixed gold-tone per line, not a shopper choice, matching how Speedy/Neverfull/Alma were
encoded. Seasonal Monogram capsules beyond Escale/Denim (By The Pool, etc.) are captured per-listing,
not seeded.

---

## STYLE 2 — Dior Lady Dior (style_id 208)

Dior faceting is **colour-primary like Chanel** (the Cannage leather is fairly uniform across the
line; **size + colour** are the axes). Dior **does** name its colours (corrected finding in
`chrome-com-colors-2026.md`: Latte, Craie, Trench, Garance Red, Gris Flanelle are house names), so
the permanent anchors are seeded and the seasonal rotations captured per-listing. Hardware is a
**real, secondary axis** (the D.I.O.R. charms come in gold / silver / ruthenium finishes), but it
largely tracks the colorway, so it is flagged MEDIUM.

```ts
// Dior Lady Dior (style 208), archivist-sourced 2026-07-12 (Fashionphile "Lady Dior Size Guide" +
// saclab "Lady Dior First-Time Purchase Guide" for sizes/cm; dior.com product pages + the banked
// chrome-com-colors-2026.md for the permanent colour lexicon and pale-gold D.I.O.R. charms; model +
// Cannage materials from seasonal-archive/dior.md, which dates the Lady Dior to 1995). COLOUR-PRIMARY
// like Chanel: the Cannage leather is fairly uniform, size + colour are the axes. Dior names its
// colours, so permanent anchors are seeded and seasonal shades captured per-listing. Hardware is a
// real but colorway-tracking axis (gold default). cm approximate.
const LADY_DIOR: Row[] = [
  { axis: "size", value: "Micro", permanence: "permanent", note: "~12 x 10 x 5 cm; SLG-scale, worn as a charm/mini", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~17 x 15 x 7 cm; the popular crossbody-scale mini", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", note: "~20 x 17 x 8 cm; the My ABCDior size, co-most-popular on resale", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~24 x 20 x 11 cm; the classic reference Lady Dior (MEDIUM: Small is co-default on resale)", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~32 cm wide; the roomiest, less common now", sort_order: 5 },
  { axis: "material", value: "Cannage Lambskin", permanence: "permanent", is_default: true, note: "the classic softest Lady Dior leather, Cannage-quilted", sort_order: 1 },
  { axis: "material", value: "Cannage Calfskin", permanence: "permanent", note: "grained calfskin, sturdier/more scratch-resistant", sort_order: 2 },
  { axis: "material", value: "Patent", permanence: "permanent", note: "patent calfskin, glossy; recurring", sort_order: 3 },
  { axis: "material", value: "Ultramatte", permanence: "seasonal", note: "matte tonal calfskin with tonal hardware; recurring capsule", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "croc / python / ostrich / lizard, limited runs", sort_order: 5 },
  { axis: "material", value: "Embroidered", permanence: "seasonal", note: "beaded/sequined/canvas (Oblique, Toile de Jouy) editions; incl. Lady Art capsules, per-listing", sort_order: 6 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "pale/aged gold-finish D.I.O.R. charms; the classic (MEDIUM: hardware largely tracks the colorway)", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "silver/palladium-tone charms", sort_order: 2 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark aged/ruthenium charms; on darker colorways", sort_order: 3 },
  // Permanent / house-classic colour anchors ONLY (Dior names its colours). Seasonal shades per-listing.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black lambskin + gold = the reference Lady Dior", sort_order: 1 },
  { axis: "color", value: "Latte", permanence: "permanent", note: "Dior's signature warm beige/nude, a standing Lady Dior neutral", sort_order: 2 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "deep blue; recurring house neutral (MEDIUM permanence)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Dior's recurring red (Garance/Cherry shades rotate); near-permanent (MEDIUM permanence)", sort_order: 4 },
];
```

**Sourcing note (Lady Dior).** Sizes and cm: Fashionphile "A Christian Dior Lady Dior Size Guide"
(fashionphile.com/blogs/academy, captured 2026-07-12) and saclab "Lady Dior: Your First-Time
Purchase Guide" (saclab.com) both give the five-size run — Micro (~4.75 x 4 x 2.25 in ≈ 12 cm), Mini
(17 x 15 x 7 cm), Small/My ABCDior (20 x 16.5 x 8 cm), Medium (24 x 20 x 11 cm), Large (~32 cm);
libascollective's 2026 guide corroborates Mini 17 / Small 20 / Medium 24 / Large 32. Model, the 1995
debut, and the Cannage/lambskin/calfskin/patent/exotic material vocabulary carry over from the
banked `seasonal-archive/dior.md` (Cannage quilting codified on the Lady Dior 1995; lambskin is the
classic leather, grained calfskin the durable alternative). The **colour lexicon** is house-verified:
`chrome-com-colors-2026.md` (Chrome capture of dior.com, 2026-06-28) confirms Dior names its colours
(Craie, Trench, Gris Flanelle, Garance Red), and a 2026 reseller listing confirms **Latte** as a
current Lady Dior lambskin colour name; the pale-gold **D.I.O.R. charms** are confirmed on a
dior.com Medium Lady Dior product page. **MEDIUM, hold these:** (1) **Medium-vs-Small default** — I
set Medium default as the classic reference proportion, but the Small (My ABCDior size) is genuinely
co-most-popular on the resale floor; treat the default as soft and swap to Small if the data says so.
(2) **Navy + Red permanence** — Dior keeps a blue and a red in the line most seasons, but the exact
shade rotates (Bleu, Garance, Cherry), so I seeded them permanent as families and flagged the
permanence. (3) **Hardware axis** — real (gold/silver/ruthenium charms exist) but it mostly tracks
the colorway rather than being an independent shopper choice, so flag it; Ultramatte editions carry
tonal hardware, captured per-listing. **Deliberately handled:** the **Lady D-Lite / D-Joy / 95.22**
are separate model lines (own style_ids), not Lady Dior sizes, so not seeded here. Per-season plain
colour rotations beyond the four anchors (Sky Blue, Rose Poudre, Gris, Powder Beige, etc.) are
captured per-listing, not seeded as permanent.

---

## STYLE 3 — Goyard Saint Louis (style_id 559)

Goyard is **colour-primary**: the Saint Louis is one tote shape, and the **colour of the Goyardine**
is the variant. Goyard is one of the houses that **standardizes and keeps a named colour palette**
(a standing ~11-colour Goyardine range), so those permanent colours are seeded; the Pearly /
Claire-Voie / multicolour / special-order editions rotate and are captured per-listing. Axes: **size
(PM/GM)** and **colour**. No hardware axis (minimal palladium), no material axis worth faceting
(Goyardine + Chevroches calf trim is the one construction).

```ts
// Goyard Saint Louis (style 559), archivist-sourced 2026-07-12 (goyard.com/us_en Saint Louis PM +
// GM product pages for dimensions/material; BagUSeek "Goyard St. Louis Tote Guide" mod. 2026-05-11
// for the standing Goyardine palette + size run, cross-checked to goyard.com's "11 available colors"
// on the tote-bags PLP). COLOUR-PRIMARY: one tote shape, the Goyardine colour is the variant. Goyard
// keeps a standing named palette, so permanent colours are seeded; Pearly/Claire-Voie/multicolour/
// special-order editions rotate, captured per-listing. NO hardware axis (minimal palladium). cm are
// Goyard's own (LxWxH).
const GOYARD_SAINT_LOUIS: Row[] = [
  { axis: "size", value: "PM", permanence: "permanent", is_default: true, note: "34 x 15 x 28 cm, ~300 g; the everyday core size (Petit Modèle)", sort_order: 1 },
  { axis: "size", value: "GM", permanence: "permanent", note: "40 x 20 x 32 cm, ~390 g; the true carryall (Grand Modèle)", sort_order: 2 },
  { axis: "size", value: "XXL", permanence: "seasonal", note: "~50 x 23 x 40 cm; oversized travel/beach size, rarer (MEDIUM: dims from resale, not an official spec sheet)", sort_order: 3 },
  { axis: "size", value: "Junior", note: "smaller size, discontinued; resale-only now", sort_order: 4 },
  { axis: "material", value: "Goyardine", permanence: "permanent", is_default: true, note: "coated chevron canvas + Chevroches calfskin trim, unlined/reversible; the one construction", sort_order: 1 },
  { axis: "material", value: "Pearly Goyardine", permanence: "seasonal", note: "pearlescent-finish Goyardine, limited", sort_order: 2 },
  { axis: "material", value: "Claire-Voie", permanence: "seasonal", note: "edge-painted/openwork special edition, per-listing", sort_order: 3 },
  // Standing Goyardine palette (Goyard names + keeps these). Black is the anchor; special finishes
  // (Pearly, multicolour, Special Colors / hand-painted) rotate and are captured per-listing.
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

**Sourcing note (Goyard Saint Louis).** Dimensions and material: goyard.com/us_en Saint Louis PM
(`stlouipml.html`) and GM pages (captured 2026-07-12) give the native cm — PM 34 x 15 x 28 cm
(~300 g), GM 40 x 20 x 32 cm (~390 g) — and describe the bag as unlined, reversible **Goyardine**
canvas with **Chevroches calfskin** trim. The BagUSeek "Goyard St. Louis Tote Guide"
(baguseek.com, mod. 2026-05-11) confirms PM/GM as the core sizes, the oversized **XXL** and the
discontinued **Junior**, and — crucially — the **standing colour palette**: "black, black with tan
trim, grey, navy, green, sky blue, burgundy, red, orange, yellow, and white," with Pearly and
multicolored editions as harder-to-find specials. That 11-name list matches goyard.com's tote-bags
PLP, which shows the Saint Louis with **"11 available colors."** Confirmed live on the Fashionphile
resale floor this run: Saint Louis in Black, Black/Gold(tan), Navy, Yellow, Orange, Sky Blue, White,
and Opaline (Claire-Voie) — evidence the palette is real, not aspirational. Goyard sits with the
houses that name/standardize their colours (per the banked archive). Default **PM** (the everyday
core; GM is co-popular for carryall duty — soft default). **MEDIUM, hold these:** (1) **XXL
dimensions** are from resale listings, not an official Goyard spec sheet, so approximate; seeded
seasonal. (2) The **Pearly / Claire-Voie** material rows are genuine but limited; seeded seasonal so
the selector shows them without implying standing stock. **Deliberately omitted:** hardware axis —
the Saint Louis has minimal palladium hardware, not a shopper choice; special-order **Special Colors**
and hand-painted personalisation (stripes/initials) are per-listing, not seeded. Goyard publishes no
universal price/colour list, so treat the standing palette as the well-attested reference, not a
house-published spec.

---

## STYLE 4 — Gucci GG Marmont (style_id 200)

Gucci matelassé flap, faceted by **size × leather-colour × hardware-finish**. The one load-bearing
Gucci caveat, house-verified in `chrome-com-colors-2026.md` and `gucci.md`: **Gucci does NOT name
its colours** — it labels them with plain descriptor families ("black GG leather", "sand"). So the
colour axis below is seeded as **permanent descriptor anchors, explicitly not house names** (unlike
Dior/Goyard). Hardware is the signature **antique-gold Double-G**, effectively fixed; a silver-tone
variant exists but is uncommon (flagged seasonal/MEDIUM).

```ts
// Gucci GG Marmont (style 200), archivist-sourced 2026-07-12 (Fashionphile "A Guide to the Gucci
// Marmont Collection" + Rebag "The Size Guide: Gucci Marmont" for sizes/materials; model + matelassé
// chevron motif from seasonal-archive/gucci.md, which dates the GG Marmont to 2016 (Alessandro
// Michele); colour treatment from chrome-com-colors-2026.md, which house-confirms GUCCI DOES NOT NAME
// ITS COLOURS — descriptor families only). Faceted size × leather-colour × hardware. Default surface
// is matelassé chevron leather; colour anchors are DESCRIPTORS, not house names. Antique-gold GG is
// the signature hardware. cm approximate (from reseller inches; shoulder-flap sizing).
const GG_MARMONT: Row[] = [
  { axis: "size", value: "Super Mini", permanence: "permanent", note: "~16.5 x 9.5 x 4 cm; the smallest, evening-scale", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~21 x 14 x 5.5 cm; the popular chain mini", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~26 x 15 x 7.5 cm; the reference GG Marmont flap, most cross-shopped (MEDIUM: Mini is co-popular)", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~29 x 18 x 7 cm", sort_order: 4 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~31 x 24 x 9.5 cm; scarcer", sort_order: 5 },
  { axis: "material", value: "Matelasse Chevron", permanence: "permanent", is_default: true, note: "the signature chevron-quilted calfskin with antique-gold Double-G", sort_order: 1 },
  { axis: "material", value: "Matelasse Diagonal", permanence: "permanent", note: "'Torchon' diagonal quilting variant, same leather tier", sort_order: 2 },
  { axis: "material", value: "Velvet", permanence: "seasonal", note: "matelassé velvet, often embellished; very Gucci", sort_order: 3 },
  { axis: "material", value: "Monogram Canvas", permanence: "seasonal", note: "GG Supreme / multicolor matelassé canvas", sort_order: 4 },
  { axis: "material", value: "Raffia", permanence: "seasonal", note: "straw/raffia-effect, summer capsules", sort_order: 5 },
  { axis: "material", value: "Embellished", permanence: "seasonal", note: "embroidered/beaded/pearl-studded editions, per-listing", sort_order: 6 },
  { axis: "hardware", value: "Antique Gold", permanence: "permanent", is_default: true, note: "the signature aged-gold Double-G; on virtually every Marmont", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "seasonal", note: "silver/palladium-tone Double-G; exists but uncommon (MEDIUM)", sort_order: 2 },
  // Permanent colour ANCHORS as DESCRIPTORS — Gucci does NOT name its colours (house-confirmed).
  // Black is the anchor; all other shades rotate seasonally and are captured per-listing.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "nude/beige family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white ('Mystic White' is Gucci's descriptor); not a poetic name", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the Gucci red (Hibiscus Red descriptor); recurring (MEDIUM permanence)", sort_order: 4 },
  { axis: "color", value: "Dusty Pink", permanence: "permanent", note: "the signature Marmont blush/rose; recurring (MEDIUM permanence)", sort_order: 5 },
];
```

**Sourcing note (GG Marmont).** Sizes and materials: Fashionphile "A Guide to the Gucci Marmont
Collection: Styles, Sizes & Materials" (fashionphile.com/blogs/academy, captured 2026-07-12) gives
the shoulder-flap size run — Super Mini 6.5 x 3.75 x 1.5 in, Mini 8.25 x 5.5 x 2.25 in, Small 10 x 6
x 3 in, Medium 11.5 x 7 x 2.75 in, Large 13.25 x 9.25 x 3.75 in (I converted to cm) — and the
material roster: plain/matelassé chevron **calfskin**, the diagonal **'Torchon'** matelassé, **velvet**
(often embellished), and **monogram multicolor canvas**, plus embellished/embroidered editions; Rebag
"The Size Guide: Gucci Marmont" corroborates the same sizes. Model, the **2016** debut (Alessandro
Michele), the matelassé chevron motif, and the antique-gold Double-G (from a 1970s belt buckle) come
from the banked `seasonal-archive/gucci.md`. The **colour treatment is the load-bearing Gucci fact**:
`chrome-com-colors-2026.md` (Chrome capture of gucci.com, 2026-06-28) house-confirms Gucci labels
colours as **plain descriptors + material** ("black GG leather", filter families only), with **no
poetic named-colour lexicon** — so the five colour rows above are descriptor anchors, explicitly not
house names (the one genuinely-named Gucci house colour, Rosso Ancora, is De Sarno-era and not a
Marmont staple, so it is not seeded here). **MEDIUM, hold these:** (1) **Small-vs-Mini default** — I
set Small default as the reference flap everyone pictures, but the chain Mini is co-most-popular on
resale; soft default. (2) **Red + Dusty Pink permanence** — the Marmont keeps a red and a blush most
seasons (Hibiscus Red, Porcelain Rose / Dusty Pink recur across Fashionphile listings), but the exact
shade rotates, so seeded permanent as families and flagged. (3) **Silver hardware** — real but
uncommon; the Marmont is overwhelmingly antique-gold, so silver is seeded seasonal/MEDIUM.
**Deliberately handled:** the Marmont *line* spans many silhouettes (bucket, tote, top-handle,
backpack, belt bag) — this seed is the **matelassé shoulder/chain flap**, the canonical GG Marmont;
other silhouettes are their own style_ids. Naming note: Gucci's own size labels blur between the
"shoulder bag" and "chain shoulder bag" runs (the Mini flap is ~21-26 cm depending on which line);
the cm above are the shoulder-flap set, flagged approximate.

---

## Two things to wire when you paste

1. Register all four in the `STYLES` array:
   `{ styleId: 437, name: "OnTheGo", rows: LV_ONTHEGO }`,
   `{ styleId: 208, name: "Lady Dior", rows: LADY_DIOR }`,
   `{ styleId: 559, name: "Saint Louis", rows: GOYARD_SAINT_LOUIS }`,
   `{ styleId: 200, name: "GG Marmont", rows: GG_MARMONT }`.
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; onthego-ladydior-saintlouis-jackie-production-matrix.md"` so the provenance string stays
   honest. (Filename keeps the working "jackie" slug from the batch brief; the fourth style shipped
   is the GG Marmont, not the Jackie — noted here so the mismatch is intentional, not a paste error.)
