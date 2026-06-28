# Gucci: seasonal naming archive (models + materials/motifs + named signatures/colors)

*Archivist run, 2026-06-28 (Early Task 4, fifth and final house of the big-five sweep, after
Louis Vuitton, Dior). Gucci is a Regime A house: the house assigns permanent model names, so the
model name IS the canonical key, and Gucci leans hard on its dated model names (Bamboo 1947,
Horsebit 1955, Jackie 1961, Diana, Sylvie 1969) and its motif vocabulary far more than on
per-season color names. Three layers below: a Models table (incl. collabs), a Materials/signature-motifs
table, and a "named seasonal" layer. Every row carries a source URL and a confidence. Companion
data file: `gucci.jsonl`.*

## How to read confidence

- **high** = house fact (gucci.com/official Gucci post), auction catalog (Christie's, Sotheby's),
  or a fact cross-checked across two independent strong references (e.g. a debut year confirmed by
  both Christie's and Vogue).
- **medium** = single well-sourced reference site / reseller blog, consistent with the beat but
  not double-confirmed this run.
- **low** = single mention or established-beat knowledge not re-sourced this run; a lead to verify.

## Hard rules I held to

1. **Model and motif/material are separate facts.** The model is the silhouette (Jackie 1961);
   the GG monogram canvas, the Web stripe, the Horsebit hardware, and the Bamboo handle are
   motifs/materials that carry their own origin year and their own vocabulary. They cross many
   models. I did not collapse them.
2. **A debut year is the bag's debut, distinct from a motif's debut.** The Horsebit motif appeared
   on a Gucci loafer in 1953; the Horsebit *bag* dates to 1955. The GG monogram canvas was patented
   in 1969; the Jackie *bag* dates to 1961. I logged each fact to the right layer.
3. **The honest finding on Gucci "seasonal colors":** like Dior, **Gucci does not publish a unique
   official color NAME per season for most of its bags.** GG Marmont, Dionysus, and Jackie rotate in
   seasonal colors that are usually plain descriptors (Black, Rosso Ancora, Dusty Pink, etc.) without
   a per-season house color name. The one genuine, named house color is **Rosso Ancora** (Sabato De
   Sarno's signature red, from his SS2024 debut). So Gucci's "named signature" layer is small and
   motif/collab-led, captured below, not invented. I did not fabricate per-season colorway names.
4. **Creative-director attribution is load-bearing for Gucci dating.** Tom Ford (1994-2004), Frida
   Giannini (2006-2014), Alessandro Michele (2015-2022), Sabato De Sarno (2023-2025), Demna (2025-).
   Many modern model debuts are Michele-era; I attributed each where sourced.

---

## 1. Models (the canon, incl. collabs)

| Model | Identity (one line) | Debut / era | Status | Source | Confidence |
|---|---|---|---|---|---|
| Bamboo 1947 / Bamboo | The original heat-bent bamboo-handle top-handle bag; born 1947 (orig. product no. "0633") from a post-war leather shortage; reissued Feb 2022 as "Bamboo 1947"; Frida Giannini's "New Bamboo" came SS2010 | 1947 | Current core (heritage icon) | christies (Gucci trio: Bamboo 1947); luisaviaroma (Bamboo 1947 / New Bamboo SS2010) | high |
| Horsebit 1955 | Small flap shoulder bag carrying the horsebit (double-ring-and-bar) clasp; the bag dates to 1955 (motif first on a 1953 loafer); modern "Horsebit 1955" line relaunched by Michele | 1955 (bag); modern line ~2021 | Current core (heritage icon) | christies (Horsebit bag 1955); luisaviaroma (Horsebit 1955) | high |
| Jackie 1961 / Jackie (vintage) | Crescent-shaped hobo with a cylindrical piston closure; first introduced 1961 (orig. "Fifties Constance"), renamed for Jackie Kennedy; reissued with more structure as "Jackie 1961" by Michele 2020-21; softer "Jackie" by Demna 2025 | 1961 | Current core (heritage icon) | christies (Jackie 1961); vogue (Fifties Constance, Michele 2021, Demna 2025) | high |
| Diana | Bamboo-handle tote with removable leather belts on the handles; debuted 1991, a Princess Diana favorite; reissued by Michele 2021 | 1991 | Current | luisaviaroma (Diana 1991, Michele reissue); marieclaire (Diana 1991) | high |
| Dionysus | Structured shoulder/chain bag with the tiger-head horseshoe (spur) clasp; named for the Greek god; Michele's first It-bag | 2015 (SS2016, Alessandro Michele) | Current core | luisaviaroma (Dionysus, Michele 2015); vogue (Michele's Dionysus) | high |
| GG Marmont | Matelassé chevron-quilted flap with the antique-gold Double-G logo (from 70s belts); named for Chateau Marmont | 2016 (Alessandro Michele) | Current core | luisaviaroma (GG Marmont 2016, Michele); sothebys (Marmont) | high |
| Ophidia | GG Supreme canvas line with the green-red-green Web stripe and a Tom Ford-era pin closure; boxy totes, mini shoulder, Boston | Cruise 2018 (Alessandro Michele) | Current | vogue (Ophidia, Cruise 2018, Michele) | high |
| Sylvie / Sylvie 1969 | Top-handle/shoulder bag with a Web stripe and a chain-and-buckle closure; "Sylvie 1969" is the smaller vintage-shape version | 2016 (SS2016, Michele; first seen Sept 2015 show) | Current | gucci/facebook (Sylvie SS2016, Michele); sothebys (Sylvie 1969) | high |
| Padlock | GG Supreme/leather shoulder bag with a horsebit-detail padlock closure | 2016 (SS2016, Michele) | Current | sothebys (Padlock, SS2016) | high |
| Soho / Soho Disco | Round/boxy crossbody (Disco) and tote (Soho) with an embossed interlocking-G medallion; the "reasonably priced luxury crossbody" cult bag | 2012 (Frida Giannini) | Discontinued/heritage | bustle (Soho Disco 2012, Giannini); instagram (Soho Disco 2012) | medium |
| Blondie | Round Interlocking-G-medallion bag; the G emblem patented 1971, relaunched as the Blondie line by Michele | 2022 (Alessandro Michele) | Current | gucci/facebook (Blondie, Interlocking G patented 1971) | high |
| Attache | Slim elongated half-moon shoulder bag with a Web stripe and a vintage-G pull; a Michele archive revival | 2021 (Alessandro Michele) | Current | vogue (Attache reissued by Michele); marieclaire (Attache) | medium |
| Zumi | Rounded top-handle/shoulder bag with a horsebit-and-bar closure; named for a Michele muse | 2019 (Alessandro Michele) | Current/quieter | established beat (Michele 2019) | low |
| Bree | GG Supreme canvas bag with a leather trim and Web; a Giannini-era line | ~2013 (Frida Giannini) | Discontinued/heritage | established beat | low |
| Aphrodite | Slouchy hobo/shoulder bag with a crystal-Double-G hardware, a Michele late-era release | 2022 (Alessandro Michele) | Current | established beat (Michele 2022) | low |
| Queen Margaret | GG Supreme/leather top-handle with a metal bee and a Web; a Michele archive-flora release | ~2018-2019 (Alessandro Michele) | Discontinued/heritage | yoogiscloset (Queen Margaret, cited in brand-naming-research) | low |
| Boston | The classic barrel-shaped GG/Web doctor-bag silhouette; runs across eras (Ophidia Boston, vintage GG Boston) | heritage (recurring) | Recurring | vogue (Ophidia small Boston) | medium |
| GG emblem / GG Supreme totes | Open totes and bucket bags in GG Supreme coated canvas with the Web; the everyday workhorse format across eras (incl. the De Sarno-era "GG emblem" line) | recurring; "GG emblem" current | Current | vogue (GG emblem tote / bucket, current) | medium |
| GG Milano | Polished structured top-handle introduced by Sabato De Sarno; reflects his streamlined vision | 2023-2024 (Sabato De Sarno) | Current | vogue (De Sarno introduced the GG Milano) | medium |
| Madison / Borsetto / Mercato | New styles introduced by Demna for Gucci (Madison shoulder bag, Borsetto, Mercato tote), Cruise 2027 era | 2025-2026 (Demna) | Current (new) | vogue (Demna's Madison, Borsetto, Mercato) | medium |

### Collaborations (base-model capsules)

| Collab | What it is | Year | Source | Confidence |
|---|---|---|---|---|
| The Hacker Project (Gucci x Balenciaga) | Gucci "hacking" Balenciaga (and vice versa) across base models: the Balenciaga Hourglass in Gucci GG/Flora, the Gucci Jackie 1961 in Balenciaga BB monogram, plus the Hacker pouch; part of the Aria collection for Gucci's 100th anniversary | Unveiled Apr 2021 (Aria); retail Nov 2021 | sothebys (Hacker Hour Glass bag, 2021); vogue (Hacker Project, Aria) | high |
| Gucci x adidas | adidas Trefoil + Gucci GG/Web co-branding across Horsebit 1955, Ophidia, and duffle/holdall styles | 2022 (Exquisite Gucci, FW22) | established beat | low |
| Gucci x Disney | Mickey Mouse (2020 Chinese New Year / "Year of the Rat") and Donald Duck (2024) capsules on GG Supreme totes, Ophidia, mini bags | 2020 (Mickey); 2024 (Donald) | established beat | low |
| Gucci x The North Face | Floral/GG print outdoor capsule across totes, backpacks, duffles | 2021 (first drop); 2022 (second) | established beat | low |

*Disambiguation logged for the categorizer: "Jackie 1961" and the vintage "Jackie" / "Fifties
Constance" are the same lineage (one model, renamed and reissued across eras), kept as one row
with the history in-line. "Bamboo" the handle (a motif, see materials) is distinct from "Bamboo
1947" / "Diana" the bags that USE the bamboo handle. "Soho" (tote) and "Soho Disco" (round
crossbody) are the same Giannini line, two silhouettes. "Sylvie" and "Sylvie 1969" are the same
line, two shapes. "GG Marmont" the bag is distinct from the GG/Double-G logo motif (see materials).*

---

## 2. Materials / signature motifs (the qualifier vocabulary)

These cross many models and are the real Gucci "qualifier" vocabulary, i.e. what a listing means by
"GG Supreme" vs "Guccissima" vs "Web."

| Motif / material | What it is | Origin / era | Notable | Source | Confidence |
|---|---|---|---|---|---|
| Diamante | The original 1930s repeated geometric diamond pattern (dark brown on tan canvas); the ancestor of the GG monogram | 1930s | The pre-war house canvas; basis of later GG | christies (Diamante 1930s, predecessor of GG) | high |
| GG monogram canvas (vintage) | The interlocking reversed double-G trellis jacquard, an update of the 1930s Diamante; the patent was filed 1969 | patent 1969 | Vintage Jackie, Boston, accessories; the "GG canvas" of the 60s-90s | christies (GG monogram patent 1969) | high |
| GG Supreme canvas | The modern coated-canvas version of the GG monogram (more durable, beige/ebony); the base for Ophidia, Dionysus, Padlock, GG totes | modern (2010s onward) | The current everyday Gucci canvas | luisaviaroma (GG Supreme canvas on Dionysus); vogue (Ophidia GG Supreme) | high |
| Diamante / Guccissima | The embossed/tonal version of the Diamante diamond, pressed into leather as "Guccissima"; a Giannini-era signature leather | Guccissima from ~2006 (Giannini) | Guccissima leather Soho, totes, wallets | established beat (Guccissima Giannini-era) | medium |
| Web stripe (green-red-green) | The signature ribbon stripe, first seen early 1950s; a reinterpretation of the equestrian girth strap (the band holding a horse's saddle) | early 1950s | Across Ophidia, Sylvie, Attache, vintage Jackie, Web totes; sometimes blue-red-blue variant | christies (Web stripe early 1950s, girth-strap origin); luisaviaroma (green-red-green stripe) | high |
| Horsebit hardware | The double-ring-and-bar metal clasp from English equestrian bridles; first on a Gucci loafer 1953, then the Horsebit bag 1955 | motif 1953; on bags from 1955 | Horsebit 1955, Horsebit Chain, 1955 line, loafers | christies (horsebit motif on 1953 loafer); luisaviaroma (horsebit 1953/1955) | high |
| Bamboo handle | The heat-bent burnished bamboo cane handle, born of a 1947 post-war leather shortage; still hand-bent over flame by Gucci artisans; patented by Gucci | 1947 | Bamboo 1947, Diana, Bamboo accessories | christies (bamboo handle 1947, leather shortage); luisaviaroma (bamboo handle patented) | high |
| Matelassé chevron (GG Marmont quilting) | The soft chevron/herringbone quilting on the GG Marmont, with the antique-gold Double-G logo | 2016 (with the GG Marmont) | The GG Marmont signature surface | luisaviaroma (GG Marmont matelassé) | medium |
| Flora | The botanical floral print, created as a silk scarf for Grace Kelly in the 1960s; "remains a house code to this day" | 1960s (Grace Kelly scarf) | Flora-print bags, scarves, the Hacker Flora Hourglass | vogue (Flora, Grace Kelly, house code) | high |
| Microguccissima | The fine, small-scale embossed Guccissima (mini diamond) on leather SLGs and small bags | Giannini/Michele-era | Microguccissima wallets, mini bags | established beat | low |
| Rosso Ancora | The De Sarno-era house red (deep oxblood); not strictly a material but used as a house "finish"/code across leathers and jacquards (see also colors) | 2023 (Sabato De Sarno) | The De Sarno signature surface color | vogue (Rosso Ancora / Gucci Rosso) | high |

*Note on Guccissima/Diamante: "Diamante" is the 1930s woven canvas pattern (high, Christie's);
"Guccissima" is the embossed-leather version popularised under Frida Giannini (~2006) and
"Microguccissima" its small-scale variant (both logged medium/low, established beat, not
auction-confirmed this run). They share the same diamond DNA as the GG monogram.*

---

## 3. Named seasonal layer (signatures + the genuinely-named color, recent first)

The honest finding (see Hard Rule 3): **Gucci does not publish a unique official color NAME per
season for most bags.** GG Marmont / Dionysus / Jackie rotate in seasonal colors that are plain
descriptors. The one genuine, named, sourced house color is **Rosso Ancora**. So the "named
seasonal" layer for Gucci is small and motif/collab/house-color-led, captured below, not invented.

| Name | Type | Year / era | What it is | Source | Confidence |
|---|---|---|---|---|---|
| Rosso Ancora ("Gucci Rosso") | house color | 2023 (SS2024 debut) | Sabato De Sarno's signature deep oxblood red, named to mark his creative chapter ("ancora" = "again"); used across leathers, jacquards, and the "Gucci Ancora" / "Design Ancora" campaigns. A color "Gucci has used before," pulled from the archive | vogue (Gucci Rosso / Rosso Ancora, De Sarno SS24); gucci/facebook (Design Ancora in Rosso Ancora); hero-magazine (Rosso Ancora, SS24) | high |
| Flora (print, seasonal rotations) | named print | recurring (1960s origin) | The botanical Flora print rotates seasonally across bags/scarves; a house code, not a per-season color name | vogue (Flora house code) | medium |
| Ken Scott (GG Marmont print) | named print capsule | 2021 (Epilogue/Aria era) | GG Marmont in vivid Ken Scott archival floral prints, a named licensed-artist print, not a color name | luisaviaroma (GG Marmont in Ken Scott design) | medium |
| The Hacker Project (Balenciaga "hacked" finishes) | named collab finish | 2021 | GG/Flora/BB-monogram "hacked" surfaces on base models (Hourglass, Jackie); the named capsule IS the finish identity | sothebys (Hacker finishes 2021); vogue | high |

*Honest scope note: I did NOT log per-season GG Marmont / Dionysus / Jackie color names (e.g. a
"Dusty Pink" or "Emerald" of a given season) as official named colorways, because Gucci does not
name them per season the way Hermès uses color codes or Chanel uses season codes. Rosso Ancora is
the exception that proves the rule: it is genuinely named and house-promoted. Anything below that
bar is a descriptor, queued as a lead, not logged as an official color.*

---

## Cross-house context (dated 2026-06-28, sourced)

Vogue's De Sarno-red piece (2023-09-22) usefully frames the current "house claims a color" trend,
which is real cross-house naming data for the catalog:
- **Gucci**: Rosso Ancora / Gucci Rosso (De Sarno, SS24, oxblood red).
- **Valentino**: PP Pink (Pierpaolo Piccioli, FW2022).
- **Bottega Veneta**: Parakeet Green (Daniel Lee, 2021; Vogue notes it being "subtly fazed out"
  of the brand's verbiage as of 2023). This corroborates the BV trend-read lead in the worklist:
  log Parakeet Green as a real BV named color (Lee era) and watch its quiet retirement.
- **Burberry**: Knight Blue (Daniel Lee).
- **Hermès**: the orange, "the OG of brand It colors."

All five are sourced to the Vogue piece; treat as confirmed *named* house colors, with the BV
"fading" note as a dated read, not a house statement.

---

## Cultural-layer read (dated 2026-06-28, hedged)

- **Creative-director churn is the live Gucci story, and it is fast.** Sabato De Sarno's tenure
  (creative director from 2023, SS24 debut) was short; **Demna** (ex-Balenciaga) was named in 2025
  and unveiled his first Gucci through a digital lookbook and a short film, *The Tiger*, rather than
  a runway, leaning on horsebits, equestrian references, and archival silhouettes (sourced: Vogue).
  My take, not a house statement: with three creative directors inside roughly three years, Gucci's
  naming vocabulary is in flux, and the safe long-term keys are the dated heritage models (Bamboo
  1947, Horsebit 1955, Jackie 1961, GG Marmont, Dionysus), not the per-director color or capsule names.
- **The heritage trio is the collector core.** Christie's explicitly frames the Bamboo (1947),
  Horsebit (1955), and Jackie (1961) as "the Gucci Trinity" and a mainstay of any serious Gucci
  collection, with the Tom Ford-era Horsebits (early 2000s) riding the Y2K resurgence. This is a
  sourced auction-house read, useful for valuation framing (estimate, not appraisal).

---

## What I could not source this run (queued)

1. **gucci.com was NOT scraped.** Per the LV/Dior-run warning that brand .com sites Akamai-block
   Firecrawl and can burn 5 credits on a bot-shell, I did not scrape gucci.com. The Jackie capsule,
   the Ancora collection page, and the Blondie line surfaced as search snippets / official Gucci
   Facebook posts only. Pull the gucci.com Ancora / Jackie / Bamboo 1947 pages via the
   **owner-present Claude-in-Chrome path** for any per-season color names.
2. **Exact debut years for the low-confidence models** (Zumi, Bree, Aphrodite, Queen Margaret).
   Logged `low`; confirm against gucci.com archive, Sotheby's lots, or PurseForum Gucci threads.
3. **Collab years for adidas / Disney / The North Face** are established-beat (logged low). Confirm
   the exact season/year against the collab press releases (Exquisite Gucci FW22 for adidas; the
   2020 Mickey CNY and 2024 Donald Duck for Disney; the 2021/2022 North Face drops).
4. **Whether any GG Marmont / Dionysus seasonal color is genuinely house-NAMED** vs a plain
   descriptor. Rosso Ancora is the only one confirmed named this run. Check gucci.com season pages
   (Chrome path) before logging any others as official colors.
5. **Christie's has NO dedicated Gucci artist/handbag-history landing page** the way it does for Dior
   (the `/artists/gucci/gucci-handbag` URL redirects to a generic search). The Gucci "stories"
   collecting-guide page (Bamboo/Horsebit/Jackie) IS the clean auction-grade source and was the
   workhorse this run; reuse it.
