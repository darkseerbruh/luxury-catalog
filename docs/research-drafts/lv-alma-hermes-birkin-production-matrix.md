# LV Alma + Hermès Birkin — production matrices (selector seed)

*Archivist run 2026-07-12. Same shape and rigor as `classic-flap-production-matrix.md` and the
matrices already in `supabase/ingest/load-production-options.ts`: one reviewed source-of-truth
list per style, NOT a full combination matrix. Each axis value traces to a cited, dated source;
anything I could not source is hedged or omitted, never invented. Two sections, each a ready
`Row[]` to paste into `load-production-options.ts`.*

Reused ground truth (already sourced + banked, so not re-scraped this run):
`seasonal-archive/hermes.md` (leathers, permanent color core, codes) and
`seasonal-archive/louis-vuitton.md` (Alma model + LV line/canvas vocabulary). New this run:
Rebag Alma size guide (2022-08-13) and the Christie's "Retourné vs Sellier Birkin" collecting
guide (2026-05-14, auction-grade).

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic (the Boy "XL"
pattern). Follow the file convention: LV colour applies only to the leather lines and Black is the
anchor; Hermès seeds only the permanent anchor colours, the rotating hundreds are captured
per-listing.

---

## STYLE 1 — LV Alma (style_id 434)

LV canvas-primary model, exactly like Speedy (433) / Neverfull (218): the **material/line** is the
primary axis (Monogram default), **colour applies only inside the leather lines** (Epi / Vernis /
Empreinte), canvas lines take no colour choice. Two deliberate omissions, both explained in the
sourcing note: **no construction axis** (the Alma has no separate "Bandoulière" line — strap
inclusion is decided by *size*, not a variant) and **no hardware axis** (fixed per line).

```ts
// LV Alma (style 434), archivist-sourced 2026-07-12 (Rebag size guide / Fashionphile / PurseBlog
// / louisvuitton.com snippet; LV line vocabulary from seasonal-archive/louis-vuitton.md). LV's
// PRIMARY axis is the CANVAS/material (Monogram default); colour varies only inside the leather
// lines (Epi/Vernis/Empreinte) and LV names are OFFICIAL. Strap is decided by SIZE (Nano/BB/PM
// include one, MM/GM do not), so there is NO Bandoulière construction toggle. Hardware is fixed
// per line, not an axis. cm are approximate (converted from reseller inch measurements).
const LV_ALMA: Row[] = [
  { axis: "size", value: "Nano", permanence: "permanent", note: "~16.5 cm, crossbody w/ strap; current but rare", sort_order: 1 },
  { axis: "size", value: "BB", permanence: "permanent", is_default: true, note: "~23.5 cm, the most common on resale; includes removable strap", sort_order: 2 },
  { axis: "size", value: "PM", permanence: "permanent", note: "~32 cm, the original 1934 proportion; includes strap", sort_order: 3 },
  { axis: "size", value: "MM", permanence: "permanent", note: "~34 cm, no strap included", sort_order: 4 },
  { axis: "size", value: "GM", permanence: "permanent", note: "~38 cm, travel size; reduced availability (MEDIUM: may be retired from current canvas lineup)", sort_order: 5 },
  { axis: "material", value: "Monogram", permanence: "permanent", is_default: true, note: "coated canvas, natural vachetta trim", sort_order: 1 },
  { axis: "material", value: "Damier Ebene", permanence: "permanent", note: "brown check, dark leather trim (no vachetta)", sort_order: 2 },
  { axis: "material", value: "Damier Azur", permanence: "permanent", note: "pale check, vachetta trim", sort_order: 3 },
  { axis: "material", value: "Epi", permanence: "permanent", note: "textured leather; the Alma is a signature Epi shape, the colour-bearing line", sort_order: 4 },
  { axis: "material", value: "Vernis", permanence: "permanent", note: "Monogram Vernis patent; the Alma Vernis is the signature, colour-bearing (MEDIUM: LV has been phasing Vernis down)", sort_order: 5 },
  { axis: "material", value: "Empreinte", permanence: "permanent", note: "embossed calfskin, colour-bearing", sort_order: 6 },
  { axis: "material", value: "Multicolore", note: "Murakami screen-print Monogram; discontinued 2015, historic/collectible", sort_order: 7 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "crocodile / ostrich / Malletage-quilted, limited runs", sort_order: 8 },
  // Colour applies only to the leather lines (Epi/Vernis/Empreinte); LV names are official. Noir is the anchor.
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "Epi/Vernis/Empreinte 'Noir'; canvas lines take no colour choice; all other colours rotate seasonally, captured per-listing", sort_order: 1 },
];
```

**Sourcing note (LV Alma).** Sizes and the Nano→GM run: Rebag "The Size Guide: Louis Vuitton Alma"
(rebag.com, 2022-08-13) confirms Nano/BB/PM/MM/GM with dimensions and the strap rule (Nano/BB/PM
come with a strap, MM/GM do not), plus the 1934 Gaston-Louis Vuitton design and the 1925 Coco
Chanel special-order lore; Fashionphile "Everything You Need to Know About the Louis Vuitton Alma"
(fashionphile.com/blogs/academy) and PurseBlog "The Ultimate Bag Guide: The Louis Vuitton Alma"
(purseblog.com) corroborate the same size run and price-by-material. The louisvuitton.com Alma PM
product snippet (2026, us.louisvuitton.com/…/M53151) lists live Nano/BB/PM/MM dimensions. Lines/
materials come from the already-banked `seasonal-archive/louis-vuitton.md` (Monogram 1896, Damier
Ebene 1888/re-released 1998, Damier Azur 2006, Epi 1985, Monogram Vernis 1997/first colour 1998,
Empreinte 2010/handbag line 2012, Monogram Multicolore 2003–2015). BB marked default because it is
the runaway most-common Alma on the resale floor (Fashionphile/Rebag/PurseBlog all lead with it);
the PM is the older/original proportion. **MEDIUM, hold these:** (1) **GM currency** — the LV.com
snippet lists Nano/BB/PM/MM but not GM, so the GM may be retired from the current canvas lineup;
seed it but flag it, don't grey anything on it. (2) **Vernis permanence** — Vernis has been an Alma
signature since ~1998 but LV has quietly reduced Vernis output, so "permanent" is the honest call
today but watch it. (3) **Nano** is current but genuinely scarce. **Deliberately omitted, sourced:**
no construction axis — unlike the Speedy there is no "Alma Bandoulière" line; the removable strap is
a function of size, so a toggle would be false structure. No hardware axis — hardware is fixed per
line (gold-tone on Monogram/Vernis/Empreinte), not a shopper choice, matching how Speedy/Neverfull
were encoded.

---

## STYLE 2 — Hermès Birkin (style_id 4)

Hermès faceting differs from LV: the **leather is the primary spec axis** (Togo default), **hardware
is a real axis** (Gold/Palladium permanent), **construction is a real toggle** (Retourné default vs
Sellier), and the **colour palette rotates by the hundreds each season**, so only the house-permanent
anchors are seeded — everything else is captured per-listing (same discipline as the Chanel/LV colour
rule). Colour codes below are Hermès's official codes, carried over from the banked `hermes.md`.

```ts
// Hermès Birkin (style 4), archivist-sourced 2026-07-12. Leathers + permanent colour core + codes
// reused from seasonal-archive/hermes.md (auction + reference-cross-checked); size/construction/
// hardware confirmed against Christie's "Retourné vs Sellier Birkin" collecting guide (2026-05-14,
// auction-grade) + Sotheby's Gold Birkin guide. Birkin invented 1983 (Jane Birkin x Jean-Louis
// Dumas), first prototype 1984. LEATHER is the primary spec axis (Togo default); the palette
// rotates by the hundreds seasonally so only house-permanent anchor colours are seeded, the rest
// captured per-listing. Retourné (default) vs Sellier is a genuine construction toggle.
const BIRKIN: Row[] = [
  // Sizes (cm = the name). Retourné spans the range; Sellier is 25/30/35, and the 20 is Sellier-only.
  { axis: "size", value: "25", permanence: "permanent", note: "~25 cm; the current desire-object, scarcer at retail", sort_order: 1 },
  { axis: "size", value: "30", permanence: "permanent", is_default: true, note: "~30 cm; the practical everyday size, most liquid on resale", sort_order: 2 },
  { axis: "size", value: "35", permanence: "permanent", note: "~35 cm; an original 1984 size, abundant in vintage", sort_order: 3 },
  { axis: "size", value: "40", permanence: "permanent", note: "~40 cm; original 1984 travel size, less common now (MEDIUM: produced but scarce)", sort_order: 4 },
  { axis: "size", value: "20", permanence: "seasonal", note: "20 cm; Sellier-only, Faubourg + limited editions since 2019", sort_order: 5 },
  // Leathers — the primary spec axis. Togo is the most common Birkin leather (default).
  { axis: "material", value: "Togo", permanence: "permanent", is_default: true, note: "Veau Togo; fine pebbled calf, the most common Birkin leather; Retourné", sort_order: 1 },
  { axis: "material", value: "Clemence", permanence: "permanent", note: "Veau Taurillon Clemence; soft flat-grained bull calf, relaxed slouch; Retourné", sort_order: 2 },
  { axis: "material", value: "Epsom", permanence: "permanent", note: "Veau Epsom; embossed rigid calf, holds shape; the primary Sellier leather", sort_order: 3 },
  { axis: "material", value: "Swift", permanence: "permanent", note: "Veau Swift; soft near-smooth calf, takes colour brightly; smaller sizes", sort_order: 4 },
  { axis: "material", value: "Box Calf", permanence: "permanent", note: "Veau Box; smooth glossy heritage calf that patinates; vintage + Sellier", sort_order: 5 },
  { axis: "material", value: "Barenia", permanence: "permanent", note: "smooth saddle calf, patinas/darkens; heritage, highly sought", sort_order: 6 },
  { axis: "material", value: "Chevre Mysore", permanence: "seasonal", note: "bright-grained goat; occasional on the Birkin, more common on Kelly/small (MEDIUM as a Birkin leather)", sort_order: 7 },
  { axis: "material", value: "Ostrich", permanence: "seasonal", note: "Autruche; quill-bump exotic, cyclical", sort_order: 8 },
  { axis: "material", value: "Niloticus Crocodile", permanence: "seasonal", note: "Nile croc exotic; two-dot blind stamp", sort_order: 9 },
  { axis: "material", value: "Porosus Crocodile", permanence: "seasonal", note: "saltwater croc, smallest/most-prized scales; caret blind stamp", sort_order: 10 },
  { axis: "material", value: "Alligator", permanence: "seasonal", note: "Alligator Mississippiensis exotic; square blind stamp", sort_order: 11 },
  // Hardware — a real axis. Gold + Palladium are co-equal house-permanent standards.
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "GHW; warm-tone, the classic pairing (MEDIUM: Palladium is co-equal, default is a judgment call)", sort_order: 1 },
  { axis: "hardware", value: "Palladium", permanence: "permanent", note: "PHW; bright silver-tone, equally standard", sort_order: 2 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark gunmetal tone; intermittent (MEDIUM permanence)", sort_order: 3 },
  { axis: "hardware", value: "Brushed", permanence: "seasonal", note: "matte brushed finish of gold/palladium, seasonal", sort_order: 4 },
  { axis: "hardware", value: "So Black", permanence: "seasonal", note: "all-black hardware, limited editions", sort_order: 5 },
  { axis: "hardware", value: "Rose Gold", permanence: "seasonal", note: "limited", sort_order: 6 },
  // Construction — a genuine Birkin toggle. Retourné is the original/dominant form.
  { axis: "construction", value: "Retourne", permanence: "permanent", is_default: true, note: "stitched inward, soft rounded silhouette; the original/dominant form; Togo/Clemence/Swift; broader size range", sort_order: 1 },
  { axis: "construction", value: "Sellier", permanence: "permanent", note: "stitched outward, crisp architectural silhouette; since 2014; Epsom/Box; 25/30/35 (+20-only). Special builds (Touch/Cargo/Shadow/Faubourg/3-in-1) are per-listing, not seeded", sort_order: 2 },
  // Permanent / house-classic colour anchors ONLY (codes = official Hermès). The seasonal hundreds are per-listing.
  { axis: "color", value: "Noir", permanence: "permanent", is_default: true, note: "code 89; true black, the anchor", sort_order: 1 },
  { axis: "color", value: "Etoupe", permanence: "permanent", note: "code 18; grey-brown taupe, the bestselling everyday neutral", sort_order: 2 },
  { axis: "color", value: "Gold", permanence: "permanent", note: "code 06; warm camel-brown, the iconic Birkin tan (Or)", sort_order: 3 },
  { axis: "color", value: "Etain", permanence: "permanent", note: "code 8F; mid-dark cool pewter grey", sort_order: 4 },
  { axis: "color", value: "Craie", permanence: "permanent", note: "code 10; soft chalk off-white", sort_order: 5 },
  { axis: "color", value: "Gris Tourterelle", permanence: "permanent", note: "code 81; soft taupe-grey, a perennial collector neutral", sort_order: 6 },
  { axis: "color", value: "Rouge H", permanence: "permanent", note: "code 46; deep brown-red near-burgundy, since 1925", sort_order: 7 },
  { axis: "color", value: "Orange H", permanence: "permanent", note: "code 93; the signature box orange (Feu); harder to find lately", sort_order: 8 },
];
```

**Sourcing note (Hermès Birkin).** The leather table and the permanent colour core (with official
codes: Noir 89, Étoupe 18, Gold 06, Étain 8F, Craie 10, Gris Tourterelle 81, Rouge H 46, Orange H
93) are carried over intact from the already-banked `seasonal-archive/hermes.md`, which cross-checked
PurseBlog's leather guide (2024), the Lilac Blue code chart, Bag Religion, and the Christie's colour
collecting guide. Construction, size expansion and hardware were confirmed fresh against Christie's
"The aesthetics hidden in the stitching: Hermès Retourné vs Sellier Birkin" (christies.com,
2026-05-14, auction-grade): Birkin invented 1983 (Jane Birkin x Jean-Louis Dumas), first prototype
1984; **Retourné** is the original/dominant construction (stitched inward, soft; Togo/Clemence/
Swift, broader size range); **Sellier** emerged **2014** (stitched outward, structured; Epsom/Box/
Veau Madame, sizes 25/30/35); the **20 cm** Birkin is **Sellier-only** and debuted as the 2019
Faubourg limited edition. Sotheby's "Why the Gold Birkin Bag is a Collector Must-Have" corroborates
that collectors gravitate to the 25 and 30. **Defaults:** size **30** (the practical everyday size
and the most liquid on resale; 25 is the current desire-object but scarcer, per the Christie's/
Sotheby's read and the banked 2026-06-28 TikTok size discourse); leather **Togo** (the most common
Birkin leather); construction **Retourné** (the original/dominant form, per Christie's); colour
**Noir**. **MEDIUM, hold or watch:** (1) **Hardware default** — Gold and Palladium are co-equal
house-permanent standards; I set Gold default as the classic "Gold-hardware Birkin," but which is
"most common" is a genuine judgment call, so treat the default as soft. (2) **Chèvre Mysore as a
Birkin leather** — it is current at the house but appears far more on the Kelly and small bags than
on Birkins; seeded seasonal, flagged. (3) **Ruthenium** permanence — intermittent, seeded seasonal.
(4) **Birkin 40** is still produced but scarce. **Deliberately excluded, sourced:** the **HAC** (Haut
à Courroies) is the Birkin's taller predecessor and a **separate model line**, not a Birkin size, so
it is not seeded here. **Birkin 45** (historic travel size) is effectively retired and omitted rather
than guessed. Special-construction editions (Birkin Touch, Cargo, Shadow, 3-in-1, Faubourg) are
limited-run variants captured per-listing, not seeded as construction toggle values. Exotic
blind-stamp symbols are from the established authentication beat (medium), consistent with `hermes.md`.

---

## Two things to wire when you paste

1. Register both in the `STYLES` array: `{ styleId: 434, name: "Alma", rows: LV_ALMA }` and
   `{ styleId: 4, name: "Birkin", rows: BIRKIN }`.
2. The `SRC` constant should credit this doc alongside the others, e.g. append
   `"; lv-alma-hermes-birkin-production-matrix.md"` so the provenance string stays honest.
