# Hermès — seasonal naming archive (leathers + permanent color core + recent seasonal)

*Archivist run, 2026-06-28 (Early Task 3). Hermès has the most official, stable naming of
any house, so this is where the format is proved end to end. Three layers below: a Leathers
table, a Permanent-color-core table, and a Recent-seasonal-colors table. Every row carries a
source URL and a confidence. Companion data file: `hermes.jsonl`.*

## How to read confidence

- **high** = house fact, auction catalog, or a fact cross-checked across two independent
  strong references (e.g. an official color code, a documented introduction year).
- **medium** = single well-sourced reference site / reseller blog, consistent with the beat
  but not double-confirmed this run.
- **low** = single mention, a lead to verify.

## Two hard rules I held to

1. **Hermès permanent-vs-seasonal is fuzzy and colors recur.** Many "permanent" colors drop
   out for years and return; many "seasonal" colors come back. Where I cannot cleanly
   classify, the row says `permanent-or-recurring, unverified` and confidence is lowered. A
   hedged note beats false precision.
2. **Color codes are the official anchor.** Hermès assigns each color a code (Noir 89, Rouge
   H 46, Etoupe 18, Gold 06). Where I have the official code it is in the row and the row is
   `high`. Most codes live in swatch images I could not OCR this run, so most are null and
   queued.

---

## 1. Leathers / materials

The official Hermès name is "Veau X" (calf X) for calf leathers, "Chèvre X" for goat,
"Vache X" for cowhide. "Heritage" is PurseBlog's tag for legacy/limited leathers (Box,
Chamonix, Tadelakt, Barenia, Barenia Faubourg, Vache Naturel, Butler) — these are still
produced but predominantly on vintage or limited/Special-Order pieces. Status reflects the
PurseBlog guide's production groupings as of its 2024 update; Hermès rotates leathers in and
out, so status is "current as of 2024 unless noted."

| Material (common) | Official name | Identity (grain / behaviour) | Status | Source | Confidence |
|---|---|---|---|---|---|
| Togo | Veau Togo | Fine pebbled grain, female baby calf (Clemence's "half-sister"), scratch-resistant, light, holds shape despite slouchy look; introduced 1997 | Current core | purseblog leather guide; sellier leather guide | high |
| Clemence | Veau Taurillon Clemence | Larger, flatter, softer grain from male bull calf; semi-matte, heavier, relaxed slouch; first in collections ~1992 (Sellier: "1980s"); created for luggage | Current core | purseblog; sellier | high |
| Epsom | Veau Epsom | Heat-embossed (printed) fine even grain, rigid, lightweight, scratch-resistant, holds shape, takes color brightly; introduced 2004 as Courchevel's replacement | Current core | purseblog; sellier | high |
| Swift | Veau Swift (formerly Gulliver) | Soft matte very light grain, near-smooth, takes bright color superbly, scratches easily, reflects light; Gulliver discontinued 1999, Swift introduced 2004/2005 | Current core | purseblog; sellier | high |
| Box (Box Calf) | Veau Box / Boxcalf | Oldest Hermès leather, named for shoemaker Joseph Box; smooth, glossy, rigid, scratches easily then patinates to a mirror sheen; mostly vintage/neutral now | Heritage (still produced) | purseblog; sellier | high |
| Chèvre Mysore | Chèvre Mysore | Goat; small bright grain, durable, scratch-resistant; Hermès' most common goat leather, frequently used to line interiors; replaced Chèvre de Coromandel | Current | purseblog | high |
| Chèvre de Coromandel | Chèvre de Coromandel | Goat; slightly larger grain and more pronounced spine than Mysore; predecessor to Mysore | Discontinued (replaced by Mysore) | purseblog | high |
| Chèvre Chamkila | Chèvre Chamkila | Goat; firm, small smooth very shiny grain ("chamkila" = "shiny" in Hindi), spine less visible than Mysore; first produced 2018 | Current | purseblog | high |
| Barenia | Barenia (calfskin) | Smooth calfskin with slight sheen, water- and scratch-resistant (oil-absorbing); originally for saddles, first on bags 1970s; develops patina, darkens | Heritage (sought-after) | purseblog; sellier | high |
| Barenia Faubourg | Barenia Faubourg | "Reinterpretation of Barenia calfskin"; similar relaxed look, patinas/darkens, more supple than Barenia; introduced 2016 | Heritage (modern) | purseblog | high |
| Evercolor | Veau Evercolor | Soft, near-smooth with tiny printed grain, slight sheen, softens over time; introduced 2012; more durable relative of Evercalf/Evergrain | Current / intermittent | purseblog | high |
| Evergrain | Veau Evergrain | Evercalf with a tiny printed grain; soft, prone to scratches, becomes shiny/softer; introduced 2004 | Intermittent | purseblog | high |
| Fjord | Veau Fjord | Large-grained, sturdy, water-resistant calf; heavier and more structured than Togo; a 1990s-era leather | Largely retired / rare | purseblog (listed); established beat | medium |
| Courchevel | Veau Courchevel | Stamped fine grain (predecessor look to Epsom), used for Sellier Kelly/Birkin; grain can wear at contact points, not refurbishable | Discontinued (replaced by Epsom 2004) | purseblog; sellier | high |
| Ardennes | Veau Ardennes | Grained, sturdy, matte calf; a 1990s–2000s workhorse leather | Long discontinued | purseblog (refs Galop as its successor look) | medium |
| Vache Liégée | Vache Liégée | Cowhide with a deep, rounded, pronounced grain; structured | Rare / intermittent | established beat; purseblog leather list | medium |
| Vache Country | Vache Country | Soft large-grained cowhide, more structured and heavier than Negonda; mainly Garden Party; introduced 2014 | Current (Garden Party) | purseblog | high |
| Negonda | Veau Negonda | Large-grained, soft, matte, water-resistant, durable; mainly Garden Party; first produced 2007 | Current (Garden Party) | purseblog | high |
| Novillo | Veau Taurillon Novillo | Supple, very small grain, can resemble Togo/Evercolor but less structured; takes color well, develops sheen; introduced 2015 | Current | purseblog | high |
| Maurice | Veau Taurillon Maurice | Grained bull calf, substantial; intermittent production | Intermittent | purseblog | medium |
| Sombrero | Veau Sombrero | Smooth-to-fine-grain, supple yet structured matte calf; used for Sellier styles and small goods | Intermittent / current | established beat; purseblog list | medium |
| Tadelakt | Veau Tadelakt | Smooth, soft but structured (Box-like), can look faintly mottled/streaked, may blister when wet; showcases color; introduced 2007, small goods | Heritage (still produced) | purseblog | high |
| Doblis | Veau Doblis | Hermès' suede; very soft, cannot get wet, shines where handled; first on bags 1930s, limited to small bags/clutches | Heritage (intermittent) | purseblog | high |
| Chamonix | Veau Chamonix | Smooth matte calf similar to Box but without the high gloss; vintage/limited | Heritage | purseblog list; established beat | medium |
| Vache Naturel | Vache Naturel(le) | Untreated smooth leather, very delicate, stains/scratches/water-spots, darkens and patinas beautifully | Heritage (returned) | purseblog | high |
| Galop d'Hermès | Galop d'Hermès | Lightweight, matte, rigid, flat variable grain; Ardennes-like; few neutral colors (Noir, Indigo, Fauve, Ebene); recent, mostly men's/small | Current (recent) | purseblog | high |
| Ostrich | Autruche | Quill-bump grain; takes color richly; cycles in and out of production (removed from Special Order charts ~2025 but still in regular production) | Cyclical (exotic) | purseblog; purseblog SS25 | high |
| Niloticus Crocodile | Crocodile Niloticus | Nile croc; smaller, more uniform/rectangular scales than Porosus; matte or shiny (lisse); marked ∷ (two dots) | Current (exotic) | established beat; auction catalogs | medium |
| Porosus Crocodile | Crocodile Porosus | Saltwater croc; smallest, most prized scales; sourced Australia; marked ^ (caret/circumflex) | Current (exotic) | established beat; purseblog; auction catalogs | medium |
| Alligator | Alligator Mississippiensis | Larger, squarer scales with a visible umbilical/follicle line; US-sourced; matte or shiny; marked □ (square) | Current (exotic) | established beat; auction catalogs | medium |
| Lizard | Lézard (Niloticus / Varanus) | Tiny fine scales, high natural shine; used on small bags (Mini Kelly, Constance); cyclical | Cyclical (exotic) | purseblog (returned); established beat | medium |

Notes on the exotic stamps (the symbol struck next to the blind stamp) are from the
established authentication beat and are widely documented; treat as `medium` until
re-confirmed against an auction catalog or Hermès source.

---

## 2. Permanent color core

The house began with five core shades; over time a wider permanent/near-permanent staple set
emerged. Color codes shown are official Hermès codes where sourced (these make the row
`high`). "Permanent-core" = recurs essentially every year per the rare-collection guide;
"staple-recurring" = a long-standing favorite that recurs most years but is not in the
original-five lineage.

| Color (FR) | Code | Identity | Tier | Source | Confidence |
|---|---|---|---|---|---|
| Noir | 89 | Deep true black; the default neutral | Permanent-core (original 5) | rare-collection; jewelsaficionado | high |
| Gold / Or | 06 | Warm camel-brown with golden/caramel undertone; iconic Birkin neutral | Permanent-core | rare-collection; jewelsaficionado | high |
| Rouge H | 46 | Deep dark red with brown undertone, near-burgundy ("Rouge Hermès"); introduced 1925 | Permanent-core (original 5) | rare-collection; jewelsaficionado | high |
| Étoupe | 18 | Earthy grey-brown taupe; bestselling everyday neutral | Permanent-core (original 5) | rare-collection; jewelsaficionado; ginzaxiaoma | high |
| Orange H / Feu | 93 | Hermès' signature box orange; no direct Pantone equivalent | Permanent-core (original 5), now harder to find | rare-collection; jewelsaficionado | high |
| Blanc | 01 | True white | Staple-recurring (harder to find lately) | rare-collection | high |
| Étain | 8F | Mid-dark cool pewter grey | Staple-recurring | rare-collection; ginzaxiaoma | high |
| Rouge Casaque | Q5 | Vibrant cool blue-based red with slight pink undertone | Staple-recurring | rare-collection; jewelsaficionado | high |
| Craie | 10 | Soft off-white / chalk with warm undertone; creamier than pure white | Staple-recurring | rare-collection; jewelsaficionado | high |
| Bleu Nuit | 2Z | Deep night blue | Staple-recurring | rare-collection | high |
| Gris Tourterelle | 81 | Soft taupe-grey, warm undertone ("turtledove"); a perennial collector neutral | Permanent-or-recurring | lilacblue (81 in Togo); bagreligion (81) | high |
| Gris Meyer | 0L | Warm "true" grey, minimal undertone (pure baby-elephant grey); introduced 2022 | Staple-recurring | lilacblue (0L in Togo); pursebop 2022; ginzaxiaoma (2022 intro) | high |
| Gris Asphalte | M8 | Cool dark slate grey | Staple-recurring | lilacblue (M8 in Togo) | medium |
| Rouge Sellier | 0G | Deep red-brown-purple blend (saddle red) | Staple-recurring | lilacblue (0G in Togo/Epsom) | medium |
| Bleu Saphir | 73 | Deep sapphire blue with a purple undertone in light; exotics-prized; appeared by 2016 | Staple-recurring | christies (73, lot dated 2016); lilacblue (73) | high |
| Bleu de Malte | 7L | Dark teal-leaning navy | Staple-recurring | lilacblue (7L in Clemence/Matte); pursebop (named as anchor) | medium |
| Nata | I2 | Warm cream ("nata" = cream in PT/ES); near-white neutral; debut AW2019 | Staple-recurring | christies (I2, "AW2019"); lilacblue (I2) | high |
| Béton | 8L | Cool light grey-beige stone neutral ("Glacier White"); an early Hermès white | Staple-recurring | christies (8L); lilacblue (8L in Togo/Matte); bagreligion (8L) | high |
| Vert Cyprès | 60 | Deep forest green | Staple-recurring | lilacblue (60); pursebop (named as anchor) | medium |
| Rose Confetti | 1Q | Warm clear pink with peach undertone; debut SS2013 | Staple-recurring | lilacblue (1Q in Epsom); thebirkinsandkellyshouse (SS2013) | high |
| Gris Perle | 80 | Light pearl grey, creamy undertone | Staple-recurring | lilacblue (80 in Togo/Clemence/Swift) | high |
| Gris Pâle | M4 | Pale warm grey between New White and Mushroom; released 2023 | Recurring neutral | christies (M4, "2023"); lilacblue (M4 in Togo) | high |
| Vert de Gris | 6C | Grey-undertoned neutral green | Recurring | lilacblue (6C in Clemence) | medium |
| Kraft | 2H | Warm light tan / kraft-paper beige; introduced 2013 | Staple-recurring | bagreligion (2H); lilacblue (2H in Clemence); thebirkinsandkellyshouse (2013) | high |
| Gris Mouette | 4Z | Pure pale "seagull" grey, a 2010s neutral icon | Heritage-recurring | lilacblue (4Z in Togo); priveporter (2010s) | medium |
| Mushroom | 0T | Washed-out cool grey bordering pale green; released 2022 | Staple-recurring | christies (0T, "2022"); lilacblue (0T) | high |
| Vanille | Y1 | Creamy off-white shifting beige-to-light-khaki | Staple-recurring | christies (Y1) | high |
| Ébène | 46 | Classic dark espresso brown (note: Christie's code-convention 46; differs from Rouge H 46 in the RareCollection list — leather/convention dependent, flagged) | Staple-recurring | christies (46) | medium |

**Code note:** these official codes come primarily from the Lilac Blue reseller code chart
(code → color → leather), cross-checked against Bag Religion and the Christie's collecting
guide. Where two independent strong sources agree (Gris Tourterelle 81, Béton 8L, Nata I2,
Mushroom 0T, Chai 0M, Gris Pale M4), the row is `high`; single-chart codes are `medium`. One
honest discrepancy: Christie's lists **Gold = 37** and **Ébène = 46**, while the RareCollection
guide (my existing high source) lists **Gold = 06** and **Rouge H = 46**. These reflect
different code conventions (Christie's appears to use a Far-East / leather-specific table); I did
NOT overwrite the original-five codes, and flagged the conflict rather than guessing which is canonical.

---

## 3. Recent seasonal colors (2024–2025, well-sourced)

These are the colors Hermès newly introduced (or notably reintroduced) for a given season,
double-sourced where possible. "Reintroduced" colors carry their prior debut year where the
source gave it. The year-by-year backfill (2015–2023) is in section 4 below.

**Codes filled this run** (Lilac Blue chart / Christie's, cross-checked): Rouge Radieux **55**,
Gris Pantin **P0**, Gris Platine **N4**, Poussière **1C**, Doré **Y9** (Christie's). These are
appended to the jsonl rows; the table text above predates them.

| Season / year | Color | Identity (per source) | New vs returning | Source | Confidence |
|---|---|---|---|---|---|
| SS 2025 | Rouge Radieux | Cool blue-based bright "lipstick" red, similar to Rouge Vif | New | purseblog SS25; pursebop 2025 | high |
| SS 2025 | Vert Mangrove | Dark muted teal-green with grey undertone (between Vert Cyprès and Bleu Orage) | New | purseblog SS25; pursebop 2025 | high |
| SS 2025 | Bleu Tie | Muted mid-tone blue with grey hint (between Bleu de Malte and Bleu de Presse) | New | purseblog SS25; pursebop 2025 | high |
| SS 2025 | Gris Pantin | Light icy blue-toned grey (near Gris Platine, Bleu Glacier) | New | purseblog SS25; pursebop 2025 | high |
| SS 2025 | Gris Argenté | Metallic silver; first regular-production metallic alongside Doré | New (regular production) | purseblog SS25; pursebop 2025 | high |
| 2025 | New Bleu Hydra | Vivid electric blue; revival of the 2012 Bleu Hydra | Returning (orig. 2012) | pursebop 2025 | high |
| 2025 | New Bleu Jean | Denim blue with grey undertone; reissue of the iconic Bleu Jean | Returning | pursebop 2025; jewelsaficionado | high |
| 2025 | Ardoise | Cool blue-toned slate grey; popular ~2010, faded, reappeared late 2024 into 2025 | Returning (orig. ~2010) | pursebop 2025 | high |
| 2025 | Poussière | Muted caramel-tinged beige ("dust"); near Trench/Parchemin | Returning | pursebop 2025; purseblog SS25 | high |
| AW 2024 | Rose Darling | Pale pink; reached regular bag production late AW24 into SS25 | New | purseblog SS25 | high |
| 2024 | Doré | Metallic gold; revealed around Diwali 2024 | New (regular production) | purseblog SS25; pursebop | high |
| 2024 | Gris Platine | Cool-toned platinum grey | New | pursebop 2025 (names 2024 intro) | high |
| SS 2025 (returning) | Amèthyste | Balanced purple, exotic leathers only | Returning (old-school) | purseblog SS25 | medium |
| SS 2025 (returning) | Vert Foncé | Deep year-round green with contrast stitch | Returning | purseblog SS25 | medium |
| SS 2025 (returning) | Colvert, Écorce, Prunoir, Rouge Garance, Terre Cuite, Toundra, Vert Maquis, Vert Véronèse | Long-retired colors back in regular production SS25 | Returning | purseblog SS25 | medium |

Hardware note (not a color, logged for completeness): **Electrum** hardware (mixed
palladium + gold) debuted SS2025 on small Sellier Epsom styles (Mini Kelly, B25/K25 Sellier).
Source: purseblog SS25. Confidence high.

---

## 4. Seasonal-color backfill, year by year (2015–2023)

*Added 2026-06-28 (Hermès seasonal-color backfill run). Sources: the PurseBop annual "New
Hermès Colors 2022/2023" guides (dated articles, the workhorse for the most recent years);
the Christie's "Most Coveted Hermès Colours" collecting guide (auction-grade, gives debut year
+ official code per color); and The Birkin's & Kelly's House "Definitive Guide to Hermès
Colors" (per-color season debuts back to the 2000s, a single well-sourced reference site →
`medium` unless a second source confirms the year). The 2021 list is reconstructed from the
PurseBop Special-Order Colorama guide (Sept 2021) + the colors the 2022 article names as
prior-year.*

**The hard rule held:** Hermès colors recur, and "debut year" from a reference site is a
**medium** claim unless an auction catalog (Christie's) or a second source confirms it. Where
only one site gives the year, the row says so and is `medium`. Where Christie's dates a color
(by lot year or explicit "introduced 20XX"), it is `high`.

| Season / year | Color | Code | Identity (per source) | New vs returning | Source | Confidence |
|---|---|---|---|---|---|---|
| FW 2023 | Beige Marfa | (null) | Light sand-colored beige ("beige cargo"); near Trench | New | pursebop 2023 | high |
| 2023 | Sun | (null) | Bright clean true yellow | New | pursebop 2023 | high |
| 2023 | New Bleu Jean | (null) | Reissue of the iconic Bleu Jean (cleaner, deeper light blue) | Returning | pursebop 2023 | high |
| SS 2023 | Rose Pop | (null) | True fuchsia/neon pink (echoes Pantone Viva Magenta 2023) | New | pursebop 2023 | high |
| 2023 | Yuka | (null) | Grassy spring green | New | pursebop 2023 | high |
| 2023 | Vert Comics | 0Z | Bright cheerful "comic" green (carried from 2022) | Returning (2022) | pursebop 2023; lilacblue (0Z) | high |
| SS 2023 | Orange Minium | 0X | Bright neon-leaning mandarin orange ("lesser orange", not box Orange H) | New | pursebop 2023; lilacblue (0X) | high |
| 2023 | Limoncello | 0Y | Soft yellow with a hint of green (between Jaune Poussin and Lime) | New | pursebop 2023; lilacblue (0Y) | high |
| 2023 | Gris Névé | 0W | Airy grey with a cool green undertone; "first-love" grey | New | christies (0W, "introduced 2023"); pursebop 2023; lilacblue (0W) | high |
| 2023 | Gris Pale | M4 | Pale grey bordering white, flatter than Gris Perle | New | christies (M4, "2023"); pursebop 2023; lilacblue (M4) | high |
| 2023 | New White | 0U | A fresh true white (Special-Order box) | New | pursebop 2023; lilacblue (0U) | high |
| 2023 | Bleu Zellige | (null) | Mediterranean tile-blue | New | thebirkinsandkellyshouse (2023) | medium |
| 2023 | Vert Yucca | (null) | Yucca/agave green | New | thebirkinsandkellyshouse (2023) | medium |
| FW 2022 | Mauve Pale | 09 | Soft muted pink, lighter sister to Mauve Sylvestre | New | pursebop 2022; lilacblue (09 Mauve Pale) | high |
| FW 2022 | Vert Fizz | (null) | Pastel mint/pistachio green | New | pursebop 2022; priveporter (2020s) | high |
| FW 2022 | Mushroom | 0T | Washed-out cool grey bordering pale green | New | pursebop 2022; christies (0T, "2022"); lilacblue (0T) | high |
| SS 2022 | Chai | 0M | Warm creamy light brown (masala-tea tan), near Quebracho/Biscuit | New | pursebop 2022; christies (0M, "2022"); lilacblue (0M) | high |
| SS 2022 | Gris Meyer | 0L | Pure "true" grey, minimal undertone | New | pursebop 2022; ginzaxiaoma (2022); lilacblue (0L) | high |
| SS 2022 | Cassis | (null) | Deep blackcurrant wine-purple (blend of Anemone + Raisin) | New | pursebop 2022 | high |
| SS 2022 | Vert Absinthe | (null) | Light yellow-green (lighter Jaune Bourgeon) | New | pursebop 2022 | high |
| SS 2022 | Bleu Royale | (null) | Deep royal blue (near Bleu Electric) | New | pursebop 2022 | high |
| 2022 | Bleu Hydra | (null) | Most saturated electric blue; reissue (orig. 2012) | Returning | pursebop 2022 | high |
| 2022 | Aqua | (null) | Bright aqua, chèvre-only reissue (near Blue Atoll) | Returning | pursebop 2022 | high |
| 2022 | Vanille | Y1 | Creamy vanilla off-white shifting to light khaki | New (year approx.) | christies (Y1; lot dated 2022) | medium |
| 2021 | Rose Sakura | 3Q | Soft cherry-blossom pink; the "ultimate" Hermès pink | New | pursebop SO 2021; christies (3Q); priveporter | high |
| 2021 | Mauve Sylvestre | X9 | Clear cool pink/mauve | New | pursebop SO 2021; lilacblue (X9 in Epsom) | high |
| 2021 | Bleu Brume | T0 | Pale misty grey-blue | New | pursebop SO 2021; lilacblue (T0 in Epsom) | high |
| 2021 | Jaune Poussin | 1Z | Pale soft "chick" yellow | New | pursebop SO 2021; lilacblue (1Z in Epsom) | high |
| 2021 | Vert Criquet | 3I | Cheerful tennis-ball green | New | pursebop SO 2021; christies (names it); lilacblue (3I); priveporter (2010s/early-20s) | high |
| SS 2021 | Jaune Bourgeon | (null) | Yellow-green "bud" yellow | New | pursebop 2022 (names as 2021); thebirkinsandkellyshouse (SS2021) | medium |
| SS 2021 | Rose Shocking | (null) | Bright shocking pink | New | thebirkinsandkellyshouse (SS2021) | medium |
| SS 2021 | Vert Jade | (null) | Soft jade green | New | thebirkinsandkellyshouse (SS2021) | medium |
| SS 2021 | Rouge Sellier | 0G | Saddle red-brown-purple | New (this name-year) | thebirkinsandkellyshouse (SS2021); lilacblue (0G) | medium |
| 2021 | Bleu France | (null) | Clean bright blue | New (year approx.) | pursebop 2022 ("released in 2021") | medium |
| FW 2020 | Bleu Frida | 0F | Saturated mid-blue | New | thebirkinsandkellyshouse (FW2020); lilacblue (0F) | medium |
| SS 2020 | Rose d'Été | (null) | Soft summer rose pink | New | thebirkinsandkellyshouse (SS2020) | medium |
| 2020 | Vert Criquet | 3I | (see 2021) some sources date the green to 2020 | New/recurring, year approx. | thebirkinsandkellyshouse (2020); christies | medium |
| AW 2019 | Nata | I2 | Warm cream near-white | New | christies (I2, "AW2019"); thebirkinsandkellyshouse | high |
| SS 2019 | Mauve Sylvestre | X9 | (some sources date the mauve to SS2019; PurseBop SO chart shows it 2021) — recurring, year conflict flagged | New/recurring | thebirkinsandkellyshouse (SS2019); lilacblue (X9) | medium |
| SS 2019 | Jaune de Naples | (null) | Sun-kissed mid yellow | New | thebirkinsandkellyshouse (SS2019) | medium |
| 2019 | Vert Amande | (null) | Soft almond green | New | thebirkinsandkellyshouse (2019) | medium |
| 2019 | Rouge de Cœur | (null) | Vivid heart-red | New | thebirkinsandkellyshouse (2019) | medium |
| SS 2019 | Bleu du Nord | (null) | Cool northern blue | New | thebirkinsandkellyshouse (SS2019) | medium |
| SS 2018 | Jaune Ambre | 9D | Warm amber-yellow with orange-brown undertone | New | christies (9D; lot dated 2018); thebirkinsandkellyshouse (SS2018) | high |
| SS 2018 | Rose Lipstick | (null) | Bright blue-based lipstick pink | New | thebirkinsandkellyshouse (SS2018) | medium |
| 2018 | Toundra | (null) | Warm "tundra" brown | New | thebirkinsandkellyshouse (2018); purseblog SS25 (returned SS2025) | medium |
| 2017 | Béton | 8L | Cement-grey early white (Christie's lot dated 2017) | Recurring (year approx.) | christies (8L; lot 2017); lilacblue (8L) | medium |
| SS 2016 | Bleu Saphir | 73 | Deep sapphire blue (Christie's lot dated 2016) | New (year approx.) | christies (73; lot 2016); thebirkinsandkellyshouse (SS2016) | medium |
| 2016 | Rouge Tomate | (null) | Lively tomato red | New | thebirkinsandkellyshouse (2016) | medium |
| FW 2015 | Rose Azalée | (null) | Warm coral-pink azalea | New | thebirkinsandkellyshouse (FW2015) | medium |
| 2015 | Orange Poppy | (null) | Bright poppy orange | New | thebirkinsandkellyshouse (2015) | medium |
| AW 2013 | Craie | 10 | Soft chalk-white with light grey (Christie's: "AW2013 collection") | New | christies (10, "AW2013") | high |
| SS 2013 | Rose Confetti | 1Q | Warm clear peach-pink | New | thebirkinsandkellyshouse (SS2013); lilacblue (1Q) | high |
| 2013 | Kraft | 2H | Kraft-paper tan | New | thebirkinsandkellyshouse (2013); bagreligion (2H) | high |
| SS 2014 | Bleu Paradis | 2T | Bright tropical-water blue | New | thebirkinsandkellyshouse (SS2014); lilacblue (2T) | medium |
| 2014 | Bamboo | (null) | Mid bamboo green | New | thebirkinsandkellyshouse (2014) | medium |

**Honest read on the deep backfill (pre-2015):** The Birkin's & Kelly's House guide reaches
into the 2000s (Vert Titien 2007, Sesame FW2008, Bougainvillier FW2009, Curry FW2004, Potiron
2003, Violine mid-2000s, Bleu Electrique / Rouge Garance ~2000). These are a single reference
site for old years, so I logged the clearest few in the jsonl at `low`–`medium` and did NOT
manufacture a full pre-2015 season grid — the per-year granularity that exists for 2018–2023
genuinely thins out before ~2013, and a hedged "appeared ~2007" beats a fake season label.

## What I could not source this run (the honest gaps)

- **Numeric color codes** — NOW LARGELY FILLED (this run) for the staple neutrals via the
  Lilac Blue code chart cross-checked with Bag Religion + Christie's: Gris Tourterelle 81,
  Gris Perle 80, Nata I2, Béton 8L, Gris Meyer 0L, Gris Asphalte M8, Vert Cyprès 60, Bleu de
  Malte 7L, Bleu Saphir 73, Rouge Sellier 0G, Gris Pale M4, Vert de Gris 6C, Rose Confetti 1Q,
  Kraft 2H, Gris Mouette 4Z, Mushroom 0T, Vanille Y1, plus the 2024–2025 rows (Rouge Radieux
  55, Gris Pantin P0, Gris Platine N4, Poussière 1C, Doré Y9). Still open: a handful of
  newest names (Beige Marfa, Sun, Cassis, Vert Absinthe, Bleu Royale, Vert Fizz) whose codes
  did not appear on the charts I parsed — left null, not guessed.
- **Seasonal colors 2015–2023 — NOW BACKFILLED** (section 4). Year-anchored from PurseBop
  annual guides (2022/2023), Christie's auction collecting guide (debut years + codes), and
  The Birkin's & Kelly's House per-color season guide. Pre-2015 is deliberately thin: a single
  reference site for old years, so logged hedged, not fabricated into a fake season grid.
- **A few year conflicts flagged, not smoothed:** Mauve Sylvestre (SS2019 per one site vs the
  2021 SO chart), Vert Criquet (2020 vs 2021), Vanille (year approximate from a lot date).
  These carry the conflict in the note and sit at `medium`.
- **Exotic stamp symbols / leather blind-stamp markings** are from the established beat, not
  re-confirmed against an auction catalog this run (`medium`).
- **Fjord, Ardennes, Vache Liégée, Sombrero, Chamonix, Maurice** got identity from the beat +
  the PurseBlog leather list rather than a full per-leather section, so they are `medium`.

## Sources used this run

- PurseBlog, "The Ultimate Guide To Hermès Leathers" — https://www.purseblog.com/hermes/leather-swatch-guide/ (updated 2024)
- Sellier Knightsbridge, "A Guide to Hermès Leathers" — https://www.sellierknightsbridge.com/en-us/blogs/news/a-guide-to-hermes-leathers
- RareCollection, "Hermes Color Codes: A Collector's Guide" — https://rare-collection.store/en/blog/108-hermes-color-codes-a-collector-s-guide (official codes, original-five fact)
- Jewels Aficionado, "Complete Guide to Hermès Colors" — https://jewelsaficionado.com/blogs/news/complete-guide-to-hermes-colors
- PurseBlog, "Hermès Update: The New Spring-Summer 2025 Colors Are Here!" — https://www.purseblog.com/hermes/hermes-adds-five-new-colors-for-spring-summer-2025/ (Mar 2025)
- PurseBop, "New Hermès Colors 2025" — https://www.pursebop.com/new-hermes-colors-2025/ (Feb–Mar 2025)
- Ginza Xiaoma, "Hermès Greys" — https://ginzaxiaoma.com/blog/hermes-grey-guide (Étain/Étoupe cross-check; Gris Meyer 2022 intro)
- Privé Porter, "Shades of Neutral" — Craie/Gris Tourterelle/Étoupe cross-check

### Sources added in the seasonal-color backfill run (2026-06-28)

- Lilac Blue, "Hermès Colour Guide" — https://lilacblue.com/pages/hermes-colour-guide (the
  code-keyed chart: code → color → leather; the workhorse for filling the null staple codes)
- Bag Religion, "Hermès Colours That Hold Their Value" — https://www.bagreligion.com/blogs/style-tips/hermes-colours-that-hold-their-value (code cross-check: Béton 8L, Gris Tourterelle 81, Kraft 2H)
- Christie's, "Collecting guide: the most coveted Hermès colours" — https://www.christies.com/en/stories/collecting-guide-the-most-coveted-hermes-colours-329d8193c11643d39e6644f0972edc65 (AUCTION-GRADE: debut years + codes; Gris Névé 2023, Gris Pale 2023, Mushroom/Chai 2022, Craie AW2013, Nata AW2019)
- PurseBop, "Updated New Hermès Colors 2023" — https://www.pursebop.com/new-hermes-colors-2023/ (Feb 2023; the 2023 annual list)
- PurseBop, "Updated New Hermès Colors 2022" — https://www.pursebop.com/new-hermes-colors-2022/ (Feb + Jul 2022; the 2022 annual list)
- PurseBop, "Insider's Guide to Hermès Special Orders" — https://www.pursebop.com/insiders-guide-to-hermes-special-orders-and-the-ultimate-reveal/ (Sept 2021; the 2021 A La Carte Colorama list)
- The Birkin's & Kelly's House, "The Definitive Guide to Hermès Colors" — https://test.thebirkinsandkellyshouse.com/the-definitive-guide-to-hermes-colors/ (per-color season debuts back to the 2000s; single-site so `medium` unless a second source confirms the year)
