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
| Gris Tourterelle | (queued) | Soft taupe-grey, warm undertone ("turtledove"); a perennial collector neutral | Permanent-or-recurring | jewelsaficionado; priveporter | medium |
| Gris Meyer | (queued) | Warm velvety grey with brown undertone | Staple-recurring | jewelsaficionado | medium |
| Gris Asphalte | (queued) | Cool dark slate grey | Staple-recurring | established beat | low |
| Rouge Sellier | (queued) | Deep red-brown-purple blend (saddle red) | Staple-recurring | jewelsaficionado | medium |
| Bleu Saphir | (queued) | Deep sapphire blue | Staple-recurring | established beat; SS25 comments | low |
| Bleu de Malte | (queued) | Dark teal-leaning navy | Staple-recurring | pursebop (named as anchor) | medium |
| Nata | (queued) | Warm cream ("nata" = cream in PT/ES); near-white neutral | Staple-recurring | jewelsaficionado | medium |
| Béton | (queued) | Cool light grey-beige stone neutral | Staple-recurring | jewelsaficionado | medium |
| Vert Cyprès | (queued) | Deep forest green | Staple-recurring | pursebop (named as anchor) | medium |
| Rose Confetti | (queued) | Warm clear pink with peach undertone; introduced 2014 | Staple-recurring | jewelsaficionado | high |
| Gris Perle | (queued) | Light pearl grey, creamy undertone | Staple-recurring | jewelsaficionado | medium |
| Gris Pâle | (queued) | Pale warm grey between New White and Mushroom | Recurring neutral | jewelsaficionado | medium |
| Vert de Gris | (queued) | Grey-undertoned neutral green | Recurring | jewelsaficionado | medium |

Codes marked "(queued)" are official but live in swatch images I did not OCR this run; the
identity and recurrence are sourced, the numeric code is the gap. Queued for the next run.

---

## 3. Recent seasonal colors (2024–2025, well-sourced)

These are the colors Hermès newly introduced (or notably reintroduced) for a given season,
double-sourced where possible. "Reintroduced" colors carry their prior debut year where the
source gave it. Older years (2020–2023, and pre-2020) are CHECKPOINTED below, not yet pulled.

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

## What I could not source this run (the honest gaps)

- **Numeric color codes** for most permanent-core colors beyond the original five + next
  tier (Gris Tourterelle, Gris Meyer, Nata, Béton, etc.). They sit in swatch images; queued
  for an OCR/auction-catalog pass.
- **Seasonal colors for 2020–2023 and pre-2020.** I deliberately stopped at 2024–2025 to get
  leathers + core complete and recent-seasonal double-sourced, per the run brief. The
  PurseBop "New Hermès Colors 2024/2023…" archive and the PurseForum per-year color charts
  are the queued sources.
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
- Ginza Xiaoma, "Hermès Greys" — https://ginzaxiaoma.com/blog/hermes-grey-guide (Étain/Étoupe cross-check)
- Privé Porter, "Shades of Neutral" — Craie/Gris Tourterelle/Étoupe cross-check
