# Dior — seasonal naming archive (models + materials/techniques + named colorways/capsules)

*Archivist run, 2026-06-28 (Early Task 4, second house of the big-five sweep, after Louis
Vuitton). Dior is a Regime A house: the house assigns permanent model names, so the model name
IS the canonical key. Three layers below: a Models table, a Materials/signature-techniques
table, and a "named seasonal" layer. Every row carries a source URL and a confidence. Companion
data file: `dior.jsonl`.*

## How to read confidence

- **high** = house fact, auction catalog (Christie's), or a fact cross-checked across two
  independent strong references (e.g. a model debut year confirmed by both Christie's and Vogue).
- **medium** = single well-sourced reference site / reseller blog, consistent with the beat but
  not double-confirmed this run.
- **low** = single mention or established-beat knowledge not re-sourced this run; a lead to verify.

## Hard rules I held to

1. **Model and material/technique are separate facts.** The model is the silhouette (Lady Dior);
   the Cannage quilting and Oblique jacquard are techniques/materials that carry their own origin
   year and their own vocabulary. I did not collapse them.
2. **A debut-year conflict is flagged, not smoothed.** Bag Religion's Lady Dior guide says the
   "ChouChou" first appeared in 1999 *and* was gifted to Diana in 1995 (internally inconsistent).
   Christie's and Vogue both date the Lady Dior debut to **1995** (Ferré era), so I logged 1995
   (high) and recorded the 1999 figure as a single-source error, not a competing fact.
3. **The honest finding on Dior "seasonal colors":** unlike Hermès (official color codes) or
   Chanel (season codes), **Dior does not publish a unique official NAME per Lady Dior seasonal
   colorway.** The Lady Dior rotates in colors (often just "Latte", "Black", "Sky Blue", etc.,
   as plain descriptors) without a per-season house color name. So Dior's genuine "named
   seasonal" layer is its **named capsules and numbered art editions** (Dior Lady Art #1–#10,
   My ABCDior, Toile de Jouy, Dior Gradient/Ombré, Dioramour), which I capture below. I did not
   invent named colorways to fill the Hermès-shaped gap.

---

## 1. Models (the canon)

`Sz` notation for Lady Dior: Micro < Mini < Small < Medium < Large (dims in the Bag Religion
guide). Sub-lines of the Lady Dior family are flagged as such.

| Model | Identity (one line) | Debut / era | Status | Source | Confidence |
|---|---|---|---|---|---|
| Lady Dior | The icon: structured boxy top-handle, Cannage quilting, hanging D.I.O.R. charms; born as a 1995 custom (orig. "Chouchou"/"Chou Chou") gifted to Princess Diana, renamed for her | 1995 (Gianfranco Ferré era) | Current core | christies (Dior handbag history); vogue (Dior handbags) | high |
| Lady D-Lite | Embroidered-canvas soft sister of the Lady Dior (Oblique/Toile de Jouy canvas, same shape, charms) | 2019 | Current | mygemma (Toile Lady D-Lite); established beat | medium |
| Lady D-Joy | Lower, more elongated Cannage Lady Dior cut; D.I.O.R. charms reading along the front | 2021 | Current | christies (Lady D-Joy lots dated 2016 are mislabel-prone; line marketed from ~2021); established beat | low |
| Lady 95.22 | A 2022 reinvention of the Lady Dior lines; "95.22" = 1995 creation + 2022 revival; new D-shaped handle and CD signature clasp | 2022 | Current | crfashionbook (Lady 95.22); dior.com newsroom 95.22 (search snippet, not scraped) | high |
| Saddle | Galliano's curved saddle-shaped flap with the stirrup-D; the Y2K It-bag, revived 2018 by Chiuri | 1999 (SS2000 RTW, John Galliano) | Current | christies; vogue (Saddle 1999) | high |
| Book Tote | Flat open embroidered tote, a "canvas" for Oblique/Toile/personalisation; from a 1967 Bohan sketch | SS2018 (Maria Grazia Chiuri) | Current | vogue (Book Tote 2018); christies (Book Tote 2018) | high |
| 30 Montaigne | Structured flap with the antique-gold "CD" clasp; named for Dior's 30 Avenue Montaigne address | 2019 | Current | christies (30 Montaigne 2019); established beat | high |
| Montaigne 30 / Montaigne | The broader 30 Montaigne line label (bag, pouch, box, hobo variants) | 2019 onward | Current | christies (30 Montaigne family lots) | medium |
| Caro | Chain-strap Cannage flap with a twist-CD clasp; named after Christian Dior's sister Catherine ("Caro") | 2021 | Current | christies (Dior Caro 2021) | high |
| Bobby | Crescent shoulder flap with a saddle-style clasp on a wide leather strap; named for Christian Dior's dog Bobby; East-West variant | 2020 | Current | established beat; youtube/reseller (East-West Bobby 2021) | medium |
| Dior Vibe / D-Vibe | Sporty drawstring/zip bag with chunky CD-signature strap; Oblique + calfskin | 2022 (D-Vibe lots dated 2024 at Christie's) | Current | christies (D-Vibe 2024 lot); established beat | medium |
| Diorama | Geometric chain flap with a slide-lock "CD" clasp; Raf Simons era | 2015 | Discontinued/heritage | christies (Diorama 2015 lots) | high |
| Diorever | Top-handle trapeze flap with a turn-lock "CD" plaque; Chiuri's early signature | 2016 | Discontinued/heritage | artnet (names Diorever among Dior icons); established beat | medium |
| Be Dior | Soft top-handle flap with a flip-lock and rolled handle; Raf Simons era "it" bag | 2014 | Discontinued/heritage | established beat | low |
| Dioraddict | Flap-and-chain bag, often denim/embroidered; mid-2010s | ~2016 (lots dated 2017) | Discontinued/heritage | christies (Dioraddict 2017 lot) | medium |
| Diorissimo | Structured open tote with winged sides and Cannage charms; also the name of a heritage canvas (see materials) | 2012 | Discontinued/heritage | christies (Diorissimo 37, 2013 lot); established beat | medium |
| Dior Key | Soft North-South shoulder/tote with a key-charm; Chiuri-era | 2022 | Current | established beat | low |
| Toujours | Structured Macrocannage tote with rolled handles; a 2020s launch | 2023 | Current | established beat | low |
| Miss Dior | Cannage chain flap (a distinct line; not the fragrance), revived under Chiuri | 2023 (modern Miss Dior bag) | Current | established beat | low |
| Nolita | Calfskin shoulder flap, a quieter 2024 launch | 2024 | Current | christies (Nolita 2024 lot) | medium |

*Disambiguation logged for the categorizer: "Dior Bobby" = Bobby (one model, two labels). "Montaigne
30" and "30 Montaigne" = the same line. "Diorissimo" is BOTH a model (the winged tote) and a heritage
canvas name (see materials) — keep them as two rows. "Miss Dior" the bag is distinct from Miss Dior
the fragrance and from the 1950s "Miss Dior" licensed sub-line stamp noted by Vogue.*

---

## 2. Materials / signature techniques (the qualifier vocabulary)

| Technique / material | What it is | Origin / era | Notable | Source | Confidence |
|---|---|---|---|---|---|
| Cannage | The signature diamond quilting, inspired by the woven cane (cannage) Napoleon III chairs Monsieur Dior seated guests on at his first 1947 shows | 1947 chairs; quilting codified on the Lady Dior 1995 | The single most identifying Dior leather code; on Lady Dior, Caro, D-Joy | vogue (Napoleon III chair inspiration); christies | high |
| Macrocannage | Oversized Cannage quilting (larger diamonds) | 2020s | Toujours tote, oversized Lady Dior editions | established beat | low |
| Micro-Cannage | Fine, small-scale Cannage quilting | 2020s | smaller Lady Dior/D-Joy editions, SLGs | saclab (Lady Dior cannage detail); established beat | low |
| Dior Oblique | The diagonal repeating "Dior" jacquard monogram | Created 1967 by Marc Bohan; runway debut SS1969; major resurgence under Kim Jones (Dior Men) from 2018 | Book Tote, Saddle, D-Lite, luggage; blue is the signature, also grey/black/pink colorways | mygemma (Oblique history: Bohan 1967, SS1969); vogue (Bohan Oblique 1967) | high |
| Toile de Jouy | The house's pastoral printed/jacquard toile (animals + foliage), a Chiuri-era signature on canvas | revived ~2019 (Chiuri) | Book Tote, Lady D-Lite, Saddle; rotates colors (Pink, Navy, Grey, Around the World prints) | mygemma (Toile de Jouy Lady D-Lite); established beat | medium |
| Diorissimo (canvas) | Heritage Dior monogram canvas (distinct from the Diorissimo tote model) | heritage (vintage Dior) | vintage Diorissimo canvas wallets/bags | mygemma (vintage Diorissimo canvas) | medium |
| Cannage lambskin | Cannage quilting on supple lambskin — the classic, softest Lady Dior leather | core since 1995 | the standard Lady Dior leather | bagreligion (Lady Dior materials) | high |
| Cannage calfskin (grained) | Cannage on grained calfskin — sturdier, more scratch-resistant than lambskin | used over the years | the durable Lady Dior alternative | bagreligion (Lady Dior materials) | high |
| Patent / nubuck / exotics | Lady Dior also in patent calf, nubuck, and (limited) croc, python, ostrich, lizard, karung, tweed, velvet | over the years | exotic Lady Dior editions fetch resale premiums | bagreligion; christies (exotic Lady Dior lots) | high |
| D-Royaume / embroideries | Heavily embroidered / beaded / sequined treatments (the embroidery vocabulary, incl. the Lady Art capsules) | capsule/limited | beaded, studded, raffia, denim Graphic Cannage editions | bagreligion (embroidered/studded); youtube (Graphic Cannage AW24) | low |

*Note on "D-Royaume": logged as a low-confidence lead. I could not isolate "D-Royaume" as a distinct,
sourced Dior technique name this run; it reads as part of Dior's broad embroidery/atelier vocabulary.
Treat it as a lead to verify against a dior.com craft page (owner-present Chrome path), not a fact.*

---

## 3. Named seasonal layer (capsules + art editions, recent first)

The honest finding (see Hard Rule 3): **Dior does not publish a unique official NAME per Lady Dior
seasonal colorway.** So the named seasonal layer for Dior is its **named capsules and numbered art
editions**, captured below with their house labels and years. Per-season plain-color rotations
(e.g. a "Latte" or "Sky Blue" Lady Dior of a given season) are descriptive, not named, and are not
logged as official colorways.

### Dior Lady Art — the numbered annual artist capsule

| Edition | Year | Note | Source | Confidence |
|---|---|---|---|---|
| Dior Lady Art #1 | 2016 | First edition, launched for Art Basel Miami Beach 2016; 7 British-American artists (incl. Ian Davenport, Marc Quinn) | artnet (Lady Art 10-year history) | high |
| Dior Lady Art #2 | 2017 | Christie's catalogues a "Lady Art 2" medium Lady Dior dated 2017 | christies (Lady Art 2, 2017) | high |
| Dior Lady Art #5 | 2020 | Christie's catalogues "Lady Art 5" editions dated 2020 | christies (Lady Art 5, 2020) | high |
| Dior Lady Art #10 | 2025 | Tenth edition, 10 artists, Rizzoli monograph + podcast; marks 30 years of the Lady Dior; first cycle under new CD Jonathan Anderson's purview | artnet (Lady Art #10, 2025) | high |

*The Lady Art project runs annually 2016→present; #N year ≈ 2015 + N (e.g. #1 = 2016, #10 = 2025).
Editions #3, #4, #6–#9 (2018, 2019, 2021–2024) exist by that cadence but were not each line-item
sourced this run; logged as a queued range, not invented per-artist rows.*

### Named capsules / finishes (house labels)

| Capsule / finish | Era | What it is | Source | Confidence |
|---|---|---|---|---|
| My ABCDior | from ~2018 | Personalisation program: Lady Dior with removable enamel letter-charm "badges" to spell a name; rotates seasonal charm colors | instagram/reseller (My ABCDior Lady Dior); established beat | medium |
| Toile de Jouy (capsule) | from 2019 | Seasonal Toile prints across Book Tote / D-Lite / Saddle (Pink, Navy, Grey, "Around the World", "Sauvage/Reverse") | mygemma (Toile de Jouy); established beat | medium |
| Dior Gradient / Ombré | seasonal | Dégradé/ombré-dyed Cannage and exotic Lady Dior editions (e.g. "Espresso Ombré" alligator 30 Montaigne, "green & blue tie-dye" alligator Lady Dior) | christies (Espresso Ombré 30 Montaigne 2020; tie-dye Lady Dior 2020) | medium |
| Dioramour | seasonal (Valentine/CNY) | Heart-motif Cannage capsule released around Valentine's / Lunar New Year | established beat | low |
| Graphic Cannage (AW24) | AW2024 (Chiuri) | Raffia + denim Lady Dior with an enlarged graphic Cannage, AW24 by Maria Grazia Chiuri | youtube (Making of the Graphic Cannage Lady Dior, DiorAW24) | medium |

---

## Cultural-layer read (dated 2026-06-28, hedged)

- **Creative-director change is the live Dior story.** **Jonathan Anderson** is the newly-appointed
  Creative Director of Dior (named 2025), succeeding **Maria Grazia Chiuri** (2016–2025). The first
  Lady Art cycle and seasonal colorways under Anderson are just beginning; expect the naming
  vocabulary to shift. This is a sourced fact (artnet/WWD), but the *design* implications are a read,
  not a house statement. (Director timeline: Christian Dior 1947–57 · Yves Saint Laurent 1957–60 ·
  Marc Bohan 1961–89 · Gianfranco Ferré 1989–96 · John Galliano 1996–2011 · Bill Gaytten interim ·
  Raf Simons 2012–15 · Maria Grazia Chiuri 2016–25 · Jonathan Anderson 2025–. Source: mygemma +
  vogue + artnet.)
- **2025 = 30 years of the Lady Dior** (born 1995), which Dior is marketing around. My take, not a
  house claim: the anniversary plus a new CD makes the Lady Dior the bag to watch for Dior naming
  changes this cycle.

---

## What I could not source this run (queued)

1. **dior.com newsroom was NOT scraped.** Per the LV-run warning that brand .com sites Akamai-block
   Firecrawl and can burn 5 credits on a bot-shell, I did not scrape dior.com. The Lady 95.22 and
   Lady Dior product pages surfaced in search snippets only. Pull the dior.com newsroom (95.22,
   craft/Cannage, seasonal capsules) via the **owner-present Claude-in-Chrome path**.
2. **Per-edition Lady Art rows for #3, #4, #6–#9** (2018, 2019, 2021–2024). The cadence is sourced;
   the per-year artist line-items are not. Backfill from the Rizzoli monograph index or PurseBop.
3. **Exact debut years for the low-confidence models** (Lady D-Joy, Be Dior, Dior Key, Toujours,
   Miss Dior bag, Bobby). Logged `low`/`medium`; confirm against PurseBop launch posts or dior.com.
4. **Whether "Macrocannage" / "Micro-Cannage" / "D-Royaume" are official Dior terms** vs reseller
   shorthand. Cannage and Oblique are house-official (high); the others are logged low pending a
   dior.com craft-page confirm.
