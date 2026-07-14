# Hermès Kelly + Chanel WOC + Dior Saddle + Chanel 19 + Gucci Dionysus + Gucci Horsebit 1955 — production matrices (selector seed)

*Archivist run 2026-07-13. Same shape and rigor as `lv-alma-hermes-birkin-production-matrix.md`,
`onthego-ladydior-saintlouis-jackie-production-matrix.md`, and
`cassette-jackie-artois-pochettemetis-production-matrix.md`: one reviewed source-of-truth list per
style, NOT a full combination matrix. Each axis value traces to a cited, dated source; anything I
could not source is hedged (MEDIUM) or omitted, never invented. Six sections, each a ready `Row[]`
to paste into `load-production-options.ts`.*

Reused ground truth (already sourced + banked, so not re-scraped this run):
`seasonal-archive/hermes.md` (the leather table, the permanent colour core with official codes, and
the Kelly notes — Courchevel replaced by Epsom for Sellier 2004, Chèvre/Lizard on small Kellys),
carried over intact from the just-shipped Birkin matrix; `seasonal-archive/chanel.md` +
`chanel.jsonl` (Chanel's house-wide permanent palette Black/Beige/White/Red/Navy, the no-official-
seasonal-colour-name rule, Diamond/Chevron quilting vocabulary from the Classic Flap/Boy);
`seasonal-archive/dior.md` (Saddle model = 1999 Galliano / SS2000 RTW, revived 2018 by Chiuri;
Dior Oblique jacquard 1967-Bohan/SS1969, Toile de Jouy, and the Dior-names-its-colours regime);
`seasonal-archive/gucci.md` + `gucci.jsonl` (Dionysus = 2015/SS2016 Michele with the tiger-head
spur clasp; Horsebit 1955 = bag 1955 / motif 1953 loafer / modern "Horsebit 1955" line relaunched
~2020-21 by Michele; and the load-bearing fact that **Gucci does NOT name its colours** —
descriptor families only).

New this run (2026-07-13, all free-tier Firecrawl): JaneFinds "Hermès Bag Size Guide" (the full
Kelly 20/25/28/32/35/40 run + Sellier/Retourné premium + most-liquid size, auction-grade reseller
reference), Fashionphile "A Quick Dior Saddle Bag Size Guide" (Micro/Mini/Classic dims) + dior.com
Saddle PLP snippet (Saddle Pouch, Mini Saddle with strap), Redeluxe "Chanel 19 Size Guide" +
chanel.com CHANEL 19 page (the gourmette silver+ruthenium+aged-gold chain, confirmed house copy) +
eBay CHANEL 19 category note, miloura "Complete Guide to Chanel Wallet on Chain" (Classic + Mini
WOC dims), Fashionphile + luxbags.fr Gucci Dionysus size guides (Super Mini/Mini/Small/Medium), and
gucci.com Horsebit 1955 shoulder-bag PDP + suitnegozi Horsebit Mini spec (cm).

`Row` type (unchanged): `{ axis, value, permanence?, season_code?, is_default?, note?, sort_order }`.
`permanence` is `"permanent" | "seasonal"`; omit it to mean discontinued/historic. **Colour-naming
rule per the banked archive, applied below:** Hermès + Dior **NAME** their colours (seed permanent
anchors, rotate the rest per-listing); Chanel does **NOT** name seasonal colours (seed only the
permanent palette Black/Beige/White/Red/Navy, everything else per-listing + season code); Gucci does
**NOT** name colours at all (descriptor families only, explicitly not house names). cm are approximate
where converted from resellers' inch measurements.

---

## STYLE 1 — Hermès Kelly (style_id 5)

Hermès **leather-primary**, encoded exactly like the Birkin (style 4): **leather is the primary spec
axis** (Togo default), **hardware is a real axis** (Gold/Palladium permanent), **construction is a
genuine toggle** (Sellier rigid/outside-stitch vs Retourné soft/inside-stitch), and the **colour
palette rotates by the hundreds each season**, so only the house-permanent anchors are seeded — the
same eight anchors + official codes as the Birkin, carried over from `hermes.md`. The Kelly's own
wrinkle: **Sellier is far more defining for the Kelly than for the Birkin** (the structured trapezoid
is the classic Grace Kelly image), and **Chèvre + Lizard appear more on the Kelly** (esp. the Mini)
than on the Birkin.

```ts
// Hermès Kelly (style 5), archivist-sourced 2026-07-13. Leathers + permanent colour core + codes
// reused intact from seasonal-archive/hermes.md + the shipped Birkin matrix (auction + reference
// cross-checked). Size run + construction + most-liquid size confirmed against JaneFinds "Hermès Bag
// Size Guide" (janefinds.com/pages/hermes-size-guide, captured 2026-07-13, auction-grade reseller):
// Sac à dépêches 1935, renamed Kelly 1977; Kelly 20 (Mini II) is Sellier-only w/ strap; 28 is the
// most liquid/versatile size; Sellier runs 20-30% above Retourné. LEATHER is the primary spec axis
// (Togo default); the palette rotates by the hundreds seasonally so only house-permanent anchors are
// seeded, the rest per-listing. Sellier vs Retourné is a genuine construction toggle.
const KELLY: Row[] = [
  { axis: "size", value: "20", permanence: "seasonal", note: "Mini Kelly II, ~20 cm; Sellier-only, crossbody strap included; the current grail, tightest allocation", sort_order: 1 },
  { axis: "size", value: "25", permanence: "permanent", note: "~25 cm; Sellier or Retourné; the strongest demand centre, competes with the B25", sort_order: 2 },
  { axis: "size", value: "28", permanence: "permanent", is_default: true, note: "~28 cm; the most versatile and the most liquid Kelly size overall (Retourné more common here)", sort_order: 3 },
  { axis: "size", value: "32", permanence: "permanent", note: "~32 cm; the classic Grace Kelly proportion, strong vintage-collector following (Box Calf)", sort_order: 4 },
  { axis: "size", value: "35", permanence: "permanent", note: "~35 cm; work/substantial carry, the lowest secondary premium of the core sizes", sort_order: 5 },
  { axis: "size", value: "40", permanence: "seasonal", note: "~40 cm; travel size, rare in current production (MEDIUM: produced but scarce)", sort_order: 6 },
  { axis: "material", value: "Togo", permanence: "permanent", is_default: true, note: "Veau Togo; fine pebbled calf, the most common Retourné Kelly leather", sort_order: 1 },
  { axis: "material", value: "Clemence", permanence: "permanent", note: "Veau Taurillon Clemence; soft flat-grained bull calf, relaxed; Retourné", sort_order: 2 },
  { axis: "material", value: "Epsom", permanence: "permanent", note: "Veau Epsom; embossed rigid calf that holds shape; the primary Sellier Kelly leather (replaced Courchevel 2004)", sort_order: 3 },
  { axis: "material", value: "Swift", permanence: "permanent", note: "Veau Swift; soft near-smooth calf, takes colour brightly; smaller sizes + the Kelly Pochette", sort_order: 4 },
  { axis: "material", value: "Box Calf", permanence: "permanent", note: "Veau Box; smooth glossy heritage calf that patinates; the classic vintage Sellier Kelly leather", sort_order: 5 },
  { axis: "material", value: "Chevre Mysore", permanence: "permanent", note: "bright-grained goat; more common on the Kelly (esp. small/Mini) than on the Birkin", sort_order: 6 },
  { axis: "material", value: "Barenia", permanence: "seasonal", note: "smooth saddle calf, patinas/darkens; heritage, highly sought", sort_order: 7 },
  { axis: "material", value: "Lizard", permanence: "seasonal", note: "Lézard Niloticus/Varanus; tiny fine scales, high shine; mostly the Mini Kelly (cyclical exotic)", sort_order: 8 },
  { axis: "material", value: "Ostrich", permanence: "seasonal", note: "Autruche; quill-bump exotic, cyclical", sort_order: 9 },
  { axis: "material", value: "Niloticus Crocodile", permanence: "seasonal", note: "Nile croc exotic; two-dot blind stamp", sort_order: 10 },
  { axis: "material", value: "Porosus Crocodile", permanence: "seasonal", note: "saltwater croc, smallest/most-prized scales; caret blind stamp", sort_order: 11 },
  { axis: "material", value: "Alligator", permanence: "seasonal", note: "Alligator Mississippiensis exotic; square blind stamp", sort_order: 12 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "GHW; warm-tone (MEDIUM: Palladium is co-equal, default is a judgment call)", sort_order: 1 },
  { axis: "hardware", value: "Palladium", permanence: "permanent", note: "PHW; bright silver-tone, equally standard", sort_order: 2 },
  { axis: "hardware", value: "Permabrass", permanence: "seasonal", note: "warm brushed-brass tone; intermittent, seen on small Sellier Kellys", sort_order: 3 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark gunmetal tone; intermittent", sort_order: 4 },
  { axis: "hardware", value: "Rose Gold", permanence: "seasonal", note: "limited", sort_order: 5 },
  { axis: "hardware", value: "So Black", permanence: "seasonal", note: "all-black hardware, limited editions", sort_order: 6 },
  { axis: "construction", value: "Retourne", permanence: "permanent", is_default: true, note: "stitched inward, softer rounded silhouette; the more-produced form, broader leather + size range (MEDIUM: Sellier is co-defining for the Kelly, so the default is soft)", sort_order: 1 },
  { axis: "construction", value: "Sellier", permanence: "permanent", note: "stitched outward, rigid architectural trapezoid; the classic Grace Kelly image; Epsom/Box; 20-only + 25/28/32; runs 20-30% above Retourné", sort_order: 2 },
  { axis: "color", value: "Noir", permanence: "permanent", is_default: true, note: "code 89; true black, the anchor", sort_order: 1 },
  { axis: "color", value: "Etoupe", permanence: "permanent", note: "code 18; grey-brown taupe, the bestselling everyday neutral", sort_order: 2 },
  { axis: "color", value: "Gold", permanence: "permanent", note: "code 06; warm camel-brown, the iconic Hermès tan (Or)", sort_order: 3 },
  { axis: "color", value: "Etain", permanence: "permanent", note: "code 8F; mid-dark cool pewter grey", sort_order: 4 },
  { axis: "color", value: "Craie", permanence: "permanent", note: "code 10; soft chalk off-white", sort_order: 5 },
  { axis: "color", value: "Gris Tourterelle", permanence: "permanent", note: "code 81; soft taupe-grey, a perennial collector neutral", sort_order: 6 },
  { axis: "color", value: "Rouge H", permanence: "permanent", note: "code 46; deep brown-red near-burgundy, since 1925", sort_order: 7 },
  { axis: "color", value: "Orange H", permanence: "permanent", note: "code 93; the signature box orange (Feu)", sort_order: 8 },
];
```

**Sourcing note (Hermès Kelly).** The leather table and the permanent colour core (with official
codes: Noir 89, Étoupe 18, Gold 06, Étain 8F, Craie 10, Gris Tourterelle 81, Rouge H 46, Orange H
93) are carried over intact from the already-banked `seasonal-archive/hermes.md` (which cross-checked
PurseBlog's leather guide, the Lilac Blue code chart, Bag Religion, and the Christie's colour guide)
and the shipped Birkin matrix — the Kelly and Birkin share Hermès's leather and colour vocabulary.
Size run, construction, and the most-liquid size were confirmed fresh against **JaneFinds "Hermès Bag
Size Guide"** (janefinds.com/pages/hermes-size-guide, captured 2026-07-13, auction-grade reseller):
the Kelly began as the **Sac à dépêches (1935)** and was **officially renamed the Kelly in 1977**;
it runs **20 / 25 / 28 / 32 / 35 / 40**, where the **Kelly 20 is the Mini Kelly II, Sellier-only,
with a crossbody strap**; the **28 is the most versatile and the most liquid Kelly size overall**
(Retourné is more common than Sellier in the 28); the **32** is "the size most associated with the
historic Grace Kelly photographs"; and **Sellier runs 20-30% above Retourné** in equivalent configs.
Chèvre-Mysore and Lizard's heavier presence on the Kelly (especially the Mini) vs the Birkin is from
`hermes.md`; Epsom's role as the primary Sellier leather (replacing **Courchevel in 2004**) is also
banked. **Defaults:** size **28** (decisive — most liquid/versatile); leather **Togo** (the most
common Retourné Kelly leather); colour **Noir**. **MEDIUM, hold or watch:** (1) **Construction
default** — I set **Retourné** default (the more-produced, softer, broader-range form, matching the
Birkin encoding), but Sellier is *co-defining* for the Kelly specifically (the rigid trapezoid is the
iconic image), so treat the default as soft. (2) **Hardware default** — Gold and Palladium are
co-equal house standards; Gold is set default as the classic pairing, but which is "most common" is a
judgment call. (3) **Kelly 20 + Kelly 40** — the 20 is current but the tightest allocation (seeded
seasonal as it is Sellier-only + limited), and the 40 is still produced but scarce (seeded seasonal).
**Deliberately omitted, sourced:** the Kelly's many **special formats** — Kelly Pochette (2004), Kelly
Cut (2008), Kelly Danse (2008), Kelly Élan (2000-02, reissued 2023), Kelly To Go, Kelly Ado backpack,
and the vintage Kelly 15 / Kelly 50 Voyage — are **separate silhouettes captured per-listing**, not
Kelly sizes, so none is seeded (a null beats false structure). Blind-stamp exotic symbols are from the
established authentication beat, consistent with `hermes.md`.

---

## STYLE 2 — Chanel Wallet on Chain / WOC (style_id 427)

Chanel **colour-primary**, encoded like the Classic Flap (style 1): the WOC is essentially **one
silhouette in one core size** (with a Mini WOC variant), so the axes that carry meaning are
**material** (Caviar default vs Lambskin vs seasonal Patent/Tweed/Exotic), **construction** (Diamond
vs Chevron quilting), **hardware** (a real minor Chanel axis), and **colour** (the Chanel PERMANENT
palette anchors only — Black/Beige/White/Red/Navy — with seasonal colours captured per-listing, since
**Chanel does not officially name seasonal colours**).

```ts
// Chanel Wallet on Chain / WOC (style 427), archivist-sourced 2026-07-13 (miloura "A Complete Guide
// to Chanel Wallet on Chain: Sizes, Colors & Materials" for the Classic + Mini WOC dims/materials;
// chanel.com Wallets on Chain PLP confirms Lambskin & Caviar + gold/silver-tone; material +
// quilting + permanent-palette vocabulary reused from the Classic Flap matrix + seasonal-archive/
// chanel.md). COLOUR-PRIMARY: essentially one size (Classic WOC ~19 x 12 x 3.5 cm), so material /
// quilting / hardware / colour are the axes. Chanel does NOT name seasonal colours — seed only the
// permanent palette, everything else per-listing + season code. cm approximate (from reseller inches).
const CHANEL_WOC: Row[] = [
  { axis: "size", value: "Classic", permanence: "permanent", is_default: true, note: "~19 x 12 x 3.5 cm; the one core WOC size (a flap wallet on a long chain)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "seasonal", note: "the smaller Mini WOC; recurring but not the standing core (MEDIUM: dims vary by season)", sort_order: 2 },
  { axis: "material", value: "Caviar", permanence: "permanent", is_default: true, note: "grained calfskin, holds shape; the most durable/most-requested WOC leather", sort_order: 1 },
  { axis: "material", value: "Lambskin", permanence: "permanent", note: "smooth, more delicate", sort_order: 2 },
  { axis: "material", value: "Patent", permanence: "seasonal", sort_order: 3 },
  { axis: "material", value: "Tweed", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "python / lizard, historic", sort_order: 5 },
  { axis: "construction", value: "Diamond", permanence: "permanent", is_default: true, sort_order: 1 },
  { axis: "construction", value: "Chevron", permanence: "permanent", note: "genuine seasonal variation, same tier", sort_order: 2 },
  { axis: "hardware", value: "Gold", permanence: "permanent", is_default: true, note: "the classic pairing", sort_order: 1 },
  { axis: "hardware", value: "Silver", permanence: "permanent", note: "palladium-tone", sort_order: 2 },
  { axis: "hardware", value: "Ruthenium", permanence: "seasonal", note: "dark aged tone; intermittent", sort_order: 3 },
  { axis: "hardware", value: "Aged gold", permanence: "seasonal", note: "antiqued, on some seasonal WOCs", sort_order: 4 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black caviar + gold = most requested", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry to bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];
```

**Sourcing note (Chanel WOC).** Sizes: the **miloura** "A Complete Guide to Chanel Wallet on Chain"
(miloura.com/blogs/news, captured 2026-07-13) gives the **Classic WOC at ~7.5 x 4.7 x 1.5 in**
(~19 x 12 x 3.5 cm) as "the quintessential model" and confirms a smaller **Mini WOC** — so the WOC is
correctly encoded as **one core size + a Mini variant**, not a multi-size run (a genuine departure
from the Flap/Boy, worth noting for the selector). Materials, Diamond/Chevron quilting, and the
permanent palette (Black/Beige/White/Red/Navy) are reused from the shipped **Classic Flap** matrix and
`seasonal-archive/chanel.md`; **chanel.com's Wallets on Chain PLP** independently confirms current WOCs
in **Lambskin & Gold-Tone** and Caviar. Hardware is seeded as a real minor axis (Gold default, Silver
permanent, Ruthenium/Aged-gold seasonal) matching how the Boy encodes Chanel hardware. **MEDIUM, hold
these:** (1) **Mini WOC** is recurring but its dimensions and availability rotate by season, so it is
seeded seasonal, not as a standing second core size. (2) **Caviar-vs-Lambskin default** — Caviar is
set default as the most durable and most-requested WOC leather, but Chanel produces both every season;
soft default. **The load-bearing colour rule holds:** Chanel does **not** assign official names to its
seasonal colours, so only the five permanent anchors are seeded here — the season's brights (the
pinks, greens, blues that dominate WOC resale) are captured **per-listing as descriptor + season
code** (e.g. "21C light green"), never seeded as fake named options. **Deliberately omitted:** the
"WOC" name spans a few Chanel silhouettes (Classic-flap WOC, Boy WOC, 19 WOC); this style_id is the
**Classic-flap WOC** (CC turn-lock), so Boy/19 WOC listings route to their own styles, not here.

---

## STYLE 3 — Dior Saddle (style_id 209)

Dior, faceted **size × material × colour** like the Lady Dior (style 208). The Saddle's signature is
the **Dior Oblique jacquard** (the blue monogram canvas is the reference look), with calfskin, grained
calfskin, exotic, and embroidered (Toile de Jouy / Mizza) as the other surfaces. **Dior NAMES its
colours**, so permanent anchors are seeded and the season's shades rotate per-listing. The curved
saddle flap with the stirrup-**D** and **CD** hardware is fixed; hardware tone largely tracks the
colorway (seeded modestly, like the Lady Dior).

```ts
// Dior Saddle (style 209), archivist-sourced 2026-07-13 (Fashionphile "A Quick Dior Saddle Bag Size
// Guide" for Micro/Mini/Classic dims + dior.com Saddle PLP snippet for the Saddle Pouch / Mini Saddle
// with strap; model = Galliano's curved saddle flap 1999 / SS2000 RTW, revived 2018 by Chiuri, +
// Oblique jacquard 1967-Bohan/SS1969 + Toile de Jouy, from seasonal-archive/dior.md). Faceted size ×
// material × colour. Dior NAMES its colours (seed permanent anchors, seasonal per-listing). NO real
// hardware axis worth faceting — the stirrup-D + CD is fixed and its tone tracks the colorway. cm
// approximate (converted from Fashionphile inches).
const DIOR_SADDLE: Row[] = [
  { axis: "size", value: "Micro", permanence: "permanent", note: "~13.3 x 12 x 3.8 cm (5.25 x 4.75 x 1.5 in); SLG-scale, worn as a mini/charm", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~18.5 x 15 x 5 cm (7.25 x 6 x 2 in); the popular compact crossbody, comes with a strap", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~24 x 20 x 6.5 cm (9.5 x 8 x 2.5 in); the Classic reference Saddle everyone pictures", sort_order: 3 },
  { axis: "size", value: "Saddle Pouch", permanence: "seasonal", note: "the flat pouch on a chain/strap; a per-season format, not a Saddle size", sort_order: 4 },
  { axis: "size", value: "Belt Bag", permanence: "seasonal", note: "the Saddle-shaped belt bag; recurring seasonal format", sort_order: 5 },
  { axis: "material", value: "Oblique Jacquard", permanence: "permanent", is_default: true, note: "the diagonal Dior monogram canvas; the signature Saddle (blue is the reference, also grey/black/pink)", sort_order: 1 },
  { axis: "material", value: "Calfskin", permanence: "permanent", note: "smooth calfskin; the polished leather Saddle, the colour-bearing surface", sort_order: 2 },
  { axis: "material", value: "Grained Calfskin", permanence: "permanent", note: "grained/textured calfskin, sturdier", sort_order: 3 },
  { axis: "material", value: "Ultramatte", permanence: "seasonal", note: "matte tonal calfskin with tonal hardware; recurring capsule", sort_order: 4 },
  { axis: "material", value: "Toile de Jouy", permanence: "seasonal", note: "the pastoral printed/jacquard toile (Pink/Navy/Grey/'Around the World'), from 2019", sort_order: 5 },
  { axis: "material", value: "Embroidered", permanence: "seasonal", note: "Mizza / beaded / sequined / other embroidered canvas editions, per-listing", sort_order: 6 },
  { axis: "material", value: "Exotic", permanence: "seasonal", note: "croc / python / lizard / ostrich, limited runs", sort_order: 7 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; black leather + antique-gold hardware = the reference leather Saddle", sort_order: 1 },
  { axis: "color", value: "Blue", permanence: "permanent", note: "Dior's signature Saddle blue (the Oblique blue in leather form); recurring (permanence soft)", sort_order: 2 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "Latte/nude; a standing Dior neutral (permanence soft)", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "Dior's recurring red; near-permanent (permanence soft)", sort_order: 4 },
];
```

**Sourcing note (Dior Saddle).** Model and history: the banked `seasonal-archive/dior.md` (high
confidence, Christie's + Vogue) dates the Saddle to **1999 (SS2000 RTW, John Galliano)** — the Y2K
It-bag with the curved saddle silhouette and the stirrup-**D** — **revived in 2018 by Maria Grazia
Chiuri**; the **Dior Oblique** jacquard is Marc Bohan's 1967 monogram (runway SS1969), resurgent from
2018, and **Toile de Jouy** is a Chiuri-era canvas from ~2019. Sizes/cm this run: **Fashionphile "A
Quick Dior Saddle Bag Size Guide"** (fashionphile.com/blogs/academy, captured 2026-07-13) gives three
primary sizes — **Micro** 5.25 x 4.75 x 1.5 in (~13.3 x 12 x 3.8 cm), **Mini** 7.25 x 6 x 2 in
(~18.5 x 15 x 5 cm), and **Classic (Medium)** 9.5 x 8 x 2.5 in (~24 x 20 x 6.5 cm) — and notes newer
Saddles come with a removable strap; the **dior.com** Saddle PLP snippet confirms current **Mini Saddle
with Strap** and **Medium Saddle Pouch with Chain** in Blue Oblique, which is why the **Saddle Pouch**
and **Belt Bag** are seeded as seasonal *formats* rather than Saddle sizes. Colour is encoded
Dior-style (the house names its colours): **Black** the anchor, plus the signature **Blue**, **Beige/
Latte**, and **Red** as recurring named neutrals, with the season's shades captured per-listing.
**MEDIUM, hold these:** (1) **Blue/Beige/Red permanence** — the Saddle keeps a blue, a nude, and a red
most seasons but the exact shade rotates, so seeded permanent + flagged soft. (2) **Oblique-vs-Calfskin
default** — I set **Oblique Jacquard** default because the blue Oblique Saddle is *the* recognizable
reference; if resale volume skews to leather, revisit. **Deliberately omitted, sourced:** **no "Large"
Saddle** — the brief floated one, but no source this run shows a current large Saddle (Fashionphile's
run tops out at Classic/Medium), so it is **not seeded** (a null beats an invented size); **no separate
hardware axis** — the antique-gold stirrup-D + CD is fixed and its tone tracks the colorway (Ultramatte
capsules go tonal), matching the Lady Dior encoding; Lady Dior-style **Lady Art / personalisation**
editions are per-listing under Embroidered.

---

## STYLE 4 — Chanel 19 (style_id 425)

Chanel **colour-primary** like the Classic Flap, but with the 19's own signatures. Axes: **size**
(Small / Medium / Large / Maxi + the 19 WOC), **material** (the soft **lambskin/goatskin** mixed-quilt
launch leather + Caviar + seasonal Tweed), **construction** (the 19's oversized, puffy diamond quilt —
its defining look), **hardware** (the signature **gourmette** chain mixing **silver + ruthenium + aged
gold**, a real, noted feature), and **colour** (Chanel permanent anchors only, seasonal per-listing).

```ts
// Chanel 19 (style 425), archivist-sourced 2026-07-13 (Redeluxe "Chanel 19 Size Guide" 2023-12-20 for
// the size run: Small / Medium-Large / Maxi + Flap Coin Purse + WOC; chanel.com CHANEL 19 page confirms
// the gourmette chain combining SILVER, RUTHENIUM and AGED GOLD + the soft silhouette + the quilting;
// eBay CHANEL 19 category note corroborates the flap size run; material + palette from seasonal-archive/
// chanel.md). Launched 2019 (Virginie Viard's first, named for Rue Cambon 19 / Coco's 1883 birth year +
// the 2019 launch). COLOUR-PRIMARY: Chanel does NOT name seasonal colours — seed only the permanent
// palette, everything else per-listing + season code. The mixed-metal chain is the 19's signature.
const CHANEL_19: Row[] = [
  { axis: "size", value: "Small", permanence: "permanent", note: "~26 cm; evening/day, crossbody or clutch", sort_order: 1 },
  { axis: "size", value: "Medium", permanence: "permanent", is_default: true, note: "~30 cm; the launch size, the everyday reference (resellers also label this 'Medium/Large')", sort_order: 2 },
  { axis: "size", value: "Large", permanence: "permanent", note: "~36 cm; roomier day bag (MEDIUM: reseller size labels overlap the ~30 cm — verify per listing)", sort_order: 3 },
  { axis: "size", value: "Maxi", permanence: "permanent", note: "~36+ cm; fits a small laptop/tablet", sort_order: 4 },
  { axis: "size", value: "WOC", permanence: "permanent", note: "the 19 Wallet on Chain (~4.8 x 7.5 x 1.4 in); the compact 19 format", sort_order: 5 },
  { axis: "material", value: "Lambskin", permanence: "permanent", is_default: true, note: "the soft launch leather; the 19 mixes lambskin + goatskin in its quilt", sort_order: 1 },
  { axis: "material", value: "Goatskin", permanence: "permanent", note: "the more durable co-primary 19 leather (shevro), same tier as lambskin", sort_order: 2 },
  { axis: "material", value: "Caviar", permanence: "seasonal", note: "grained calfskin; produced but less common on the 19 than the soft leathers", sort_order: 3 },
  { axis: "material", value: "Tweed", permanence: "seasonal", sort_order: 4 },
  { axis: "material", value: "Denim", permanence: "seasonal", sort_order: 5 },
  { axis: "material", value: "Iridescent", permanence: "seasonal", note: "iridescent/metallic calfskin", sort_order: 6 },
  { axis: "construction", value: "Diamond (oversized)", permanence: "permanent", is_default: true, note: "the 19's signature large, puffy diamond quilt; the defining look (not the tight Classic-Flap diamond)", sort_order: 1 },
  { axis: "hardware", value: "Mixed", permanence: "permanent", is_default: true, note: "the signature 'gourmette' chain combining silver + ruthenium + aged gold; near-universal on the 19", sort_order: 1 },
  { axis: "hardware", value: "So Black", permanence: "seasonal", note: "all-black hardware, limited seasonal", sort_order: 2 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "clair/rosé, shifts by season", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. off-white/ivory", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "cherry to bordeaux", sort_order: 4 },
  { axis: "color", value: "Navy", permanence: "permanent", note: "near-permanent, returns most years", sort_order: 5 },
];
```

**Sourcing note (Chanel 19).** Model: the CHANEL 19 launched **2019** — **Virginie Viard's first
Chanel bag** (co-credited to the late Karl Lagerfeld), named for **Rue Cambon 19** / the 2019 launch,
with a deliberately soft, slouchy silhouette. Sizes: the **Redeluxe "Chanel 19 Size Guide"**
(redeluxe.com/blogs/all, pub. 2023-12-20, captured 2026-07-13) lists the family as **Small**, a
**Medium/Large** everyday flap, a **Maxi**, plus the **Flap Coin Purse** and the **Wallet on Chain** —
and the **eBay CHANEL 19** category note corroborates a flap "in three sizes: small, large and maxi"
plus the "Chanel 19 Wallet on Chain: 4.8 x 7.5 x 1.4 in." The **hardware and quilting are house-
confirmed on chanel.com's CHANEL 19 page**: the bag "stands out with its 'gourmette' chain strap
combining **silver, ruthenium and aged gold** finishes" over a soft quilted silhouette — so the
**mixed-metal chain is a genuine, house-stated signature**, seeded as the default (and near-universal)
hardware. The soft **lambskin + goatskin** mixed-quilt construction is the banked 19 fact from
`seasonal-archive/chanel.md`. **MEDIUM, hold these:** (1) **The size naming is genuinely messy** —
Chanel's ~30 cm launch flap is labelled "Normal," "Medium," or "Medium/Large" across resellers, and
the ~36 cm as "Large" or "Maxi"; I seeded **Small / Medium (default, the ~30 cm launch) / Large / Maxi
+ WOC** and flagged the Large/Medium label overlap — verify the exact size per listing rather than
trusting the word alone. (2) **Caviar on the 19** is produced but far less common than the soft
leathers, so it is seeded seasonal. **The colour rule holds:** Chanel does not officially name its
seasonal colours, so only the five permanent anchors are seeded; the 19's famous seasonal brights
(neon pink 21S, the greens, the blues seen on the resale floor) are captured **per-listing as
descriptor + season code**, never as fake named options. **Deliberately omitted:** the 19 **card
holder on chain**, **clutch with chain**, and **pouch** are SLG-scale formats captured per-listing,
not seeded as bag sizes; there is **no Chevron 19** — the 19 is defined by its single oversized diamond
quilt, so construction carries one honest value.

---

## STYLE 5 — Gucci Dionysus (style_id 201)

Gucci, faceted **size × material × colour**, **descriptor colours only** (Gucci does **not** name its
colours — house-confirmed). Axes: **size** (Super Mini / Mini / Small / Medium), **material** (GG
Supreme canvas default + leather + suede + velvet + embroidered), and **colour** (descriptor anchors,
explicitly not house names). The **antiqued-silver tiger-head (double-tiger spur) closure** is the
signature and is **fixed on every Dionysus** — noted, not an axis.

```ts
// Gucci Dionysus (style 201), archivist-sourced 2026-07-13 (Fashionphile "Everything You Need to Know
// About the Gucci Dionysus" + luxbags.fr "Size Guide: Gucci Dionysus" for the Super Mini/Mini/Small/
// Medium run + cm; gucci.com Dionysus Super Mini PDP confirms structured GG Supreme + chain; model =
// 2015/SS2016 Alessandro Michele It-bag with the tiger-head spur clasp, from seasonal-archive/gucci.md;
// colour treatment from chrome-com-colors-2026.md — GUCCI DOES NOT NAME ITS COLOURS, descriptors only).
// Faceted size × material × colour. Colour anchors are DESCRIPTORS, not house names. NO hardware axis
// (the antiqued-silver tiger-head closure is fixed/signature). cm approximate (from reseller inches).
const GUCCI_DIONYSUS: Row[] = [
  { axis: "size", value: "Super Mini", permanence: "permanent", note: "~16.5 x 10 x 4 cm; the smallest, chain-strap mini (attaches to a larger bag)", sort_order: 1 },
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20 x 16 x 6 cm (8 x 6.25 x 2.25 in); the popular chain mini", sort_order: 2 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~28 x 17 x 9 cm (11 x 7 x 3.5 in); the reference Dionysus shoulder/chain bag, most cross-shopped", sort_order: 3 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~30 x 21.5 x 9 cm; the roomier shoulder size", sort_order: 4 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", is_default: true, note: "beige/ebony coated GG Supreme canvas with leather trim; the everyday Dionysus", sort_order: 1 },
  { axis: "material", value: "Leather", permanence: "permanent", note: "smooth/pebbled calfskin; the polished leather version", sort_order: 2 },
  { axis: "material", value: "Suede", permanence: "seasonal", note: "suede body, recurring seasonal runs", sort_order: 3 },
  { axis: "material", value: "Velvet", permanence: "seasonal", note: "velvet, often embellished (crystals/pearls)", sort_order: 4 },
  { axis: "material", value: "Embroidered / Print", permanence: "seasonal", note: "Blooms / GG print / embroidered + exotic editions, per-listing", sort_order: 5 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
  { axis: "color", value: "Pink", permanence: "permanent", note: "the recurring light-pink Dionysus (descriptor); near-permanent (permanence soft)", sort_order: 5 },
];
```

**Sourcing note (Gucci Dionysus).** Model and history: the banked `seasonal-archive/gucci.md` (high
confidence, LuisaViaRoma + Vogue) confirms the Dionysus is **Alessandro Michele's first It-bag, 2015
(SS2016)**, a structured shoulder/chain bag with the **tiger-head (double-tiger) horseshoe spur
clasp** and **GG Supreme canvas** as its base. Sizes/cm this run: **Fashionphile "Everything You Need
to Know About the Gucci Dionysus"** (fashionphile.com/blogs/academy, captured 2026-07-13) and
**luxbags.fr "Size Guide: Gucci Dionysus"** give the run — **Super Mini** ~6.5 x 4 x 1.5 in / 16.5 x
10 x 4 cm, **Mini** 8 x 6.25 x 2.25 in (~20 x 16 x 6 cm), **Small** 11 x 7 x 3.5 in (~28 x 17 x 9 cm),
and **Medium** ~30 x 21.5 x 9 cm (an IG comparison corroborates the small/medium spread); **gucci.com**
confirms the Super Mini as "a structured GG Supreme canvas chain mini shoulder bag with a key ring."
The **colour treatment is the load-bearing Gucci fact**: `chrome-com-colors-2026.md` (Chrome capture
of gucci.com, 2026-06-28) house-confirms Gucci labels colours as **plain descriptors + material**, so
the five colour rows are **descriptor anchors, explicitly not house names** (the lone genuinely-named
Gucci house colour, **Rosso Ancora**, is De Sarno-era SS2024 and not a Dionysus staple, so it is not
seeded). **Defaults:** size **Small** (the reference silhouette, most cross-shopped); material **GG
Supreme Canvas**; colour **Black**. **MEDIUM, hold these:** (1) **Red + Pink permanence** — the
Dionysus keeps a red and a light pink most seasons, but the exact shade rotates, so seeded permanent
as descriptor families + flagged. (2) **Medium cm** are a reseller composite, so approximate.
**Deliberately omitted:** **no hardware axis** — the antiqued-silver tiger-head spur closure is fixed
on every Dionysus (its finish is part of the signature, not a shopper choice), matching how the Jackie
piston and Marmont Double-G were handled; the Dionysus **wallet-on-chain / mini chain / top-handle
(Dionysus 1955-adjacent)** formats and the Blooms/print capsules are per-listing, captured under
Embroidered/Print, not seeded as sizes.

---

## STYLE 6 — Gucci Horsebit 1955 (style_id 447)

Gucci, faceted **size × material × colour**, **descriptor colours only**. Axes: **size** (Mini /
Small / Medium), **material** (GG Supreme canvas default + smooth leather + exotic), and **colour**
(descriptor anchors, not house names). The **horsebit (double-ring-and-bar) hardware in gold-tone** is
the fixed signature — noted, not an axis. The multiple *silhouettes* in the 1955 family (shoulder bag,
top-handle, chain wallet, tote) are per-listing formats, addressed in the sourcing note.

```ts
// Gucci Horsebit 1955 (style 447), archivist-sourced 2026-07-13 (gucci.com "Horsebit 1955 small
// shoulder bag" PDP + "Gucci Horsebit 1955 Collection" capsule page + suitnegozi Horsebit Mini spec
// for cm; Reddit r/handbags mini-vs-small note; model = the horsebit bag dates to 1955, motif first on
// a 1953 loafer, modern "Horsebit 1955" line relaunched ~2020-21 by Michele, from seasonal-archive/
// gucci.md; colour treatment from chrome-com-colors-2026.md — GUCCI DOES NOT NAME ITS COLOURS,
// descriptors only). Faceted size × material × colour. Colour anchors are DESCRIPTORS, not house names.
// NO hardware axis (the gold-tone horsebit is fixed/signature). cm approximate (from reseller cm/inches).
const GUCCI_HORSEBIT_1955: Row[] = [
  { axis: "size", value: "Mini", permanence: "permanent", note: "~20.5 x 14.5 x 5 cm; the compact chain/shoulder mini", sort_order: 1 },
  { axis: "size", value: "Small", permanence: "permanent", is_default: true, note: "~25 x 18 x 8 cm; the reference Horsebit 1955 shoulder bag (two straps), most cross-shopped", sort_order: 2 },
  { axis: "size", value: "Medium", permanence: "permanent", note: "~30 cm; the larger shoulder/tote proportion (MEDIUM: less common; cm approximate)", sort_order: 3 },
  { axis: "material", value: "GG Supreme Canvas", permanence: "permanent", is_default: true, note: "beige/ebony coated GG Supreme canvas with leather trim + Web stripe option; the everyday 1955", sort_order: 1 },
  { axis: "material", value: "Smooth Leather", permanence: "permanent", note: "smooth calfskin; the polished leather 1955, the colour-bearing surface", sort_order: 2 },
  { axis: "material", value: "Exotic / Printed", permanence: "seasonal", note: "lizard / python / print + special editions (e.g. x adidas), per-listing", sort_order: 3 },
  { axis: "color", value: "Black", permanence: "permanent", is_default: true, note: "the anchor; descriptor, not a house colour name", sort_order: 1 },
  { axis: "color", value: "Beige", permanence: "permanent", note: "the GG Supreme beige/ebony + nude leather family; descriptor", sort_order: 2 },
  { axis: "color", value: "White", permanence: "permanent", note: "incl. cream/ivory leather; descriptor", sort_order: 3 },
  { axis: "color", value: "Red", permanence: "permanent", note: "the recurring Gucci red (descriptor); near-permanent (permanence soft)", sort_order: 4 },
];
```

**Sourcing note (Gucci Horsebit 1955).** Model and history: the banked `seasonal-archive/gucci.md`
(high confidence, Christie's + LuisaViaRoma) confirms the **horsebit (double-ring-and-bar) clasp**
first appeared on a **Gucci loafer in 1953**, the **horsebit bag dates to 1955**, and the modern
**"Horsebit 1955"** line was **relaunched ~2020-21 under Alessandro Michele** in **GG Supreme canvas**,
Web stripe, and smooth leather. Sizes/cm this run: the **gucci.com "Horsebit 1955 small shoulder bag"**
PDP ($3,290, "enriched with two different shoulder straps") anchors the **Small** as the reference
silhouette; **suitnegozi's Horsebit Mini** spec gives **L 20.5 x H 14.5 x D 5 cm**; and the
**r/handbags "Gucci 1955 horsebit in Mini or Small"** thread corroborates the mini-vs-small proportion
difference (the small is wider/thinner, the mini deeper). The **colour treatment is the load-bearing
Gucci fact**: `chrome-com-colors-2026.md` house-confirms Gucci uses **plain descriptors + material**,
so the four colour rows are **descriptor anchors, explicitly not house names**. **Defaults:** size
**Small** (the reference shoulder bag); material **GG Supreme Canvas**; colour **Black**. **MEDIUM,
hold these:** (1) **Medium** — the 1955 family runs to a larger shoulder/tote proportion, but I did not
pin an exact current cm this run, so it is seeded permanent + flagged, cm approximate. (2) **Red
permanence** — recurring, seeded permanent as a descriptor family + flagged. (3) **Small cm** are a
composite of the gucci.com PDP + reseller charts, so approximate. **Deliberately omitted:** **no
hardware axis** — the gold-tone horsebit is the fixed signature on every 1955, not a shopper choice
(matching Jackie/Dionysus/Marmont); the **1955 family's other silhouettes** — the **top-handle bag**,
the **chain wallet / mini chain bag**, the **bucket**, and the **tote** — are **separate formats
captured per-listing**, not Horsebit-1955 sizes, so none is seeded (a null beats false structure). The
**Horsebit 1955 vs the vintage Tom Ford-era Horsebit vs the Horsebit Chain** disambiguation is logged
in `gucci.md` for the categorizer.

---

## Two things to wire when you paste

1. Register all six in the `STYLES` array:
   `{ styleId: 5, name: "Kelly", rows: KELLY }`,
   `{ styleId: 427, name: "Wallet on Chain", rows: CHANEL_WOC }`,
   `{ styleId: 209, name: "Saddle", rows: DIOR_SADDLE }`,
   `{ styleId: 425, name: "Chanel 19", rows: CHANEL_19 }`,
   `{ styleId: 201, name: "Dionysus", rows: GUCCI_DIONYSUS }`,
   `{ styleId: 447, name: "Horsebit 1955", rows: GUCCI_HORSEBIT_1955 }`.
   (Confirm each style_id against the `style` table before writing — the IDs are from the brief.)
2. Extend the `SRC` constant to credit this doc, e.g. append
   `"; kelly-woc-saddle-chanel19-dionysus-horsebit-production-matrix.md"` so the provenance string
   stays honest.
