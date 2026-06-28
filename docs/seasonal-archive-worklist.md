# Seasonal Naming Archive — the archivist's standing assignment

*Owner: the `archivist` agent. Created 2026-06-28. This is the resumable queue for the
30-year, house-by-house, season-by-season reconstruction of what each house called its
**bags, materials, and colors**. Read this first; write progress back here on every run.*

Companion docs: `docs/brand-naming-research.md` (the naming regimes), `docs/data-collection-handoff.md`
§0b (the price/reseller registry — do not redo it here), `docs/data-analysis-standard.md` (rigor bar).

**Content feed:** `docs/research-drafts/seasonal-archive/content-ideas.md` is the standing,
ranked idea feed for the Content lane / `copywriter`, built from these findings (research-to-ideas,
not finished copy). Update it when a run banks a new finding worth a piece.

---

## The mission

For each house, going back ~30 years (roughly 1995 to today), reconstruct the lexicon:

1. **Bag (model) names** by line and the season each debuted, was reissued, or retired.
2. **Material names** the house uses (leather names, canvas/exotic names, finishes).
3. **Official color names** by season, with the season label the house used.

Output is structured and sourced, never prose. Every row carries a `source_url` and a
`confidence`. A null with "not yet sourced" beats an invented name. Community nicknames are
tagged `community`, never promoted to official (see `brand-naming-research.md` alias model).

**Why this matters (the metric it moves):** naming precision is the GEO + authority moat.
One place that resolves "what did Chanel call this pink in Cruise 2018" to an official answer
is something the houses' own staff cannot do, and answer engines will cite it. It also
unlocks the `colorway` / `season` / `material` columns already in `price_history` and the
`bag_alias` table, which are mostly empty today.

---

## Output format (one row per name fact)

Write findings into `docs/research-drafts/seasonal-archive/<brand>.md` as a table, and mirror
the normalized rows into `docs/research-drafts/seasonal-archive/<brand>.jsonl` for ingest:

| Brand | Season label (house) | Year | Type | Name | Maps to model/line | Source URL | Confidence |
|---|---|---|---|---|---|---|---|
| Hermès | (permanent) | — | color | Étoupe | all lines | <forum/auction url> | high |
| Chanel | Cruise / Resort 2018 | 2018 | color | Rose Pourpre | Classic Flap | <lookbook url> | medium |
| Chanel | 18C | 2018 | season-code | 18C = Cruise 2018 | — | <serial-decode url> | high |

`Type` is one of: `model` · `material` · `color` · `season-code`. `Confidence`: high (house
or auction catalog), medium (well-sourced reference site/reseller blog), low (single forum
mention, treat as a lead to verify).

---

## Where each house stores its history (start here, verify, expand)

**Regime A — houses with official, mappable model names** (do these first, they are tractable):

- **Hermès** — colors and leathers are an official, permanent-plus-seasonal system. The
  richest historic record is the PurseForum Hermès reference threads (color charts by year)
  cross-checked against auction catalogs (Christie's/Sotheby's name color + leather + year
  exactly). Leathers: Togo, Clemence, Epsom, Box, Swift, Chevre, Barenia, Ostrich, Croc
  (Niloticus/Porosus), Lizard. Verify the seasonal color rotations per year.
- **Louis Vuitton** — model + line/leather qualifier (Neverfull, Speedy, Alma…); seasonal
  capsules and Empreinte/Epi/Mahina/Monogram colorways. Source: louisvuitton.com season
  pages + Vogue Runway + the resale blogs for retired colors.
- **Dior** — Lady Dior and sub-lines (D-Lite, D-Joy), Saddle, Book Tote, 30 Montaigne, Caro.
  Cannage colorways rotate seasonally; Vogue Runway + dior.com newsroom.
- **Gucci** — Dionysus, GG Marmont, Jackie 1961, Ophidia, Horsebit 1955, Bamboo, Diana…
  plus collab capsules (Hacker Project). Vogue Runway + gucci.com.

**Regime B — Chanel (the hard, high-value case):**

- Permanent icons ARE named (Classic Flap / 11.12, 2.55, Boy, 19, 22, 25, Coco Handle,
  Gabrielle, Deauville). Seasonal/runway bags have **no official name** — only a **style code
  (A#####)** and a **season code** in the serial (e.g. `18C` = Cruise 2018, `23S` = Spring
  2023). Reconstruct the season-code → season map first (it is deterministic), then catalog
  seasonal colors against it. Community names ("Hula Hoop", "Milk Carton") are labels only.
- Sources: Spotted Fashion + Bragmybag season guides, Fashionphile/Yoogi's serial-decode
  guides, PurseForum Chanel reference threads, Vogue Runway.

**Other houses to queue after the big five:** Bottega Veneta (Jodie, Cassette, Andiamo;
named colorways like Parakeet/Fondant), Saint Laurent (Loulou, Kate, Le 5 à 7), Celine
(Triomphe, Luggage, Belt), Fendi (Baguette, Peekaboo), Prada, Loewe (Puzzle, Hammock).

---

## The community / chatter beat (keep current — feeds the cultural layer)

Not part of the naming pull, but where you watch the live pulse and pick up leads:
PurseForum, Reddit (r/handbags, r/chanel, r/Louisvuitton, r/Hermes), TikTok #BagTok,
Instagram (house + resale + influencer accounts), PurseBop, Substack bag newsletters.
Log notable shifts (a line going quiet, a color "having a moment") as dated, hedged reads.

### Authoritative-source registry per house (dated 2026-06-28, verify + expand)

The single most authoritative place(s) for naming/color history per house. Confidence:
`verified` = URL confirmed live this run via Firecrawl search; `lead, verify` = known-strong
from the beat but the exact URL was not re-confirmed this run, so treat it as a lead.

**Hermès** (the deepest naming archive anywhere)
- Forum (primary): PurseForum Hermès Reference Library subforum —
  `https://forum.purseblog.com/forums/hermes-reference-library.58/` — holds per-year color
  charts and per-leather threads ("Hermès Colors", "Special Order Bags"). **verified.**
- Reference site: PurseBop annual Special Order color-chart guides (`pursebop.com`, e.g. the
  "Hermès 2026 Special Order Guide"). **verified** (live this run).
- Reseller blog: Yoogi's Closet Hermès guide (`yoogiscloset.com/hermes/guide`), styles plus
  palette history. **verified** (live this run).
- Reddit: r/Hermes. **lead, verify** (active, but forum + auction beat it for naming history).
- Auction (cleanest high-end naming): Christie's / Sotheby's / Bonhams handbag catalogs name
  leather, color, hardware, and year exactly. **lead, verify** per sale.

**Chanel** (hard case, seasonal has no official name, only a style code + season code)
- Forum (primary): PurseForum Chanel subforum — `https://forum.purseblog.com/forums/chanel.18/`
  (Chanel Clubhouse plus reference and color threads). **verified.**
- Reference site: Spotted Fashion Chanel archive — `https://www.spottedfashion.com/chanel/` —
  season guides with color codes (e.g. "22P"). **verified.** Bragmybag is the companion. **lead, verify.**
- Season/serial decode: Fashionphile "Reading Chanel Tags" guide
  (`fashionphile.com/blogs/academy/a-quick-guide-to-reading-chanel-tags`), reads year, season,
  and color off the tag. **verified** (live this run). Yoogi's serial guide is the companion. **lead, verify.**
- Reddit: r/chanel. **verified** (live this run).

**Louis Vuitton**
- Forum (primary): PurseForum Louis Vuitton subforum and its Reference Library. **lead, verify**
  (exact thread URLs not re-confirmed this run; the subforum is the right entry point).
- Primary source: louisvuitton.com season pages plus Vogue Runway (season-labeled back to ~1998).
  **lead, verify.**
- Reseller blog: Fashionphile / Yoogi's LV guides for retired colorways. **lead, verify.**
- Reddit: r/Louisvuitton. **lead, verify.**

**Dior**
- Primary source: dior.com newsroom plus Vogue Runway for Lady Dior cannage colorways by season.
  **lead, verify.**
- Forum: PurseForum Dior subforum. **lead, verify.**
- Reference: PurseBop plus reseller (Fashionphile / Yoogi's) Lady Dior guides. **lead, verify.**

**Gucci**
- Primary source: gucci.com plus Vogue Runway for GG Marmont / Dionysus colorways. **lead, verify.**
- Forum: PurseForum Gucci subforum. **lead, verify.**
- Reseller: Yoogi's Closet Gucci guide (strong on vintage plus collab naming, cited in
  `brand-naming-research.md`). **lead, verify.**

**Cross-house live-trend accounts (TikTok/IG, observed in this run's pull, 2026-06-28):**
resale houses `@fashionphile` (verified account) and `@sellierluxurybags` / Sellier
Knightsbridge (verified) post naming-rich authentication and size-comparison content;
`@bagista.uk` runs high-reach real-vs-fake content. These are trend and
authentication-signal accounts, not official-naming sources. Treat their naming as a lead
and confirm against the house or an auction catalog.

**Note on Firecrawl feedback:** `firecrawl_search_feedback` IS in this agent's allowlist
(added 2026-06-28) and refunds 1 of the 2 credits per search. Always call it right after
each search, within the ~2 minute window. Keep searches few and broad regardless.

**How you reach it (free-only, verified 2026-06-28):**
- **Default: Firecrawl free tier (1,000 credits/mo, $0).** `firecrawl_search` returns
  TikTok/IG results with captions and transcript snippets, plus all the open-web archive.
  Search = 2 credits, refunded to 1 via `firecrawl_search_feedback` (always send it). Raw
  scrape = 1 credit; parse yourself, never the 5-credit LLM-extract.
- **Login-walled depth: the Claude-in-Chrome extension ($0, owner-present).** Full comment
  threads / engagement / login-walled IG via the owner's logged-in browser
  (`tabs_context_mcp` → `navigate` → `get_page_text`/`read_page`). Interactive only.
- **Unattended depth: Apify (free tier, CONNECTED 2026-06-28).** The owner's chosen
  hands-off path. Use `call-actor` with `apidojo/tiktok-scraper` ($0.0003/post, cheap
  breadth) or `clockworks/tiktok-scraper` ($0.0037/result, rich fields). Cap every run
  with `maxItems` + `resultsPerPage`; never use the $0.048/min transcript add-on (the
  free `transcriptionLink` field already carries it); the $5/mo credits do not roll over,
  so size weekly pulls well under $5. Proven 2026-06-28: a "chanel bag" search returned
  captions + engagement + sounds + hashtags + naming signal (e.g. "Chanel 25 mini black
  GHW"). TikTok official API stays gated to vetted researchers, not a path here.
- **Legal:** capture names/hashtags/trends as facts and leads; never republish video,
  images, or verbatim captions; attribute with a source URL.

---

## First TikTok trend read (2026-06-28)

*Source: Apify `clockworks/tiktok-scraper`, three capped keyword pulls (12 videos each,
`/video` search, MOST_RELEVANT), US region, run 2026-06-28. This is a small, relevance-sorted
sample (12 per house), so read everything below as a read of the room, evidence plus opinion,
never a verdict or a count of "the whole platform." Engagement figures are what the data
returned for those specific videos, not house-wide totals. No names below are invented; every
model or color reference is lifted from a caption in the pull, and where a caption only implies
something I say so.*

**Chanel (query "chanel bag")**
- The naming signal that keeps surfacing is the **Chanel 25** (the mini in particular):
  captions tagged `#chanel25bag`, `#chanel25mini`, and one creator explicitly unboxing a
  "Chanel 25 mini" and gushing about the color. The **26A** season code also showed up in a
  collection caption (`#chanel26a`), which tracks with how Chanel is identified by season code,
  not a seasonal name (see `brand-naming-research.md`). My read: the 25 is the bag the
  conversation is centered on right now, and color ("ganda ng color", "the color is stunning in
  person") is the hook more than the model. Not a house confirmation, just where the chatter sits.
- Format leans **unboxing and collection** content; the single highest-engagement video in the
  sample was a street-style "what's in my bag" (`@bagista.uk`, ~4.6M plays in-sample). Classic
  Flap size comparisons (small vs medium) are still steady reference content.
- Sounds: almost entirely **original sound** (creator voiceover), so no single trending audio to
  flag for Chanel in this sample.

**Hermès (query "hermes birkin")**
- The clearest naming signal is **size discourse on the Birkin**: the **25** is framed as the
  aspirational/"changed my perspective" size and the **30** as the practical everyday one, with a
  recurring "**Birkin 25 vs 30**" and "**30 vs 35**" comparison framing. One creator calls the
  **35** a bag she would "never buy again." Also surfacing: **Retourné vs Sellier** construction
  and a Picotin mention. My read: the 25 is the desire object and the 30 is the sensible pick in
  the current conversation, consistent with what resale houses have been signaling. Opinion, not
  a house statement.
- A **Sex and the City / Samantha Jones** throwback ("$4,000 Birkin") was the highest-engagement
  video in the Hermès sample (~8.6M plays in-sample), i.e. the cultural-reference content still
  pulls hard. `@fashionphile` (verified) and `@sellierluxurybags` (verified) both appear with
  educational/size content, reinforcing them as authentication and naming-signal accounts.
- Note on sample freshness: a few high-reach Birkin videos in this relevance-sorted pull are from
  mid-2025, so the Birkin sample mixes evergreen viral content with June-2026 posts. Weighted to
  recent posts, the size-comparison and "first Birkin unboxing" angle is the live one.

**Bottega Veneta (query "bottega bag")**
- Strongest model naming in this sample, by a distance. Captions name specific lines and colors:
  **Maxi Jodie** (in black and in "porridge"), **Large Andiamo** (in chestnut suede), **Sardine**
  (medium in "**fondant**"), and a **Foulard** bag, all in one collector's breakdown. Andiamo
  shows up again on its own (`#andiamo`). My read: Bottega is being talked about by **line name
  plus color name** far more than Chanel or Hermès are, which makes it the richest house in this
  pull for confirming colorway naming. Still a lead: "porridge", "fondant", and "chestnut" should
  be checked against Bottega's own season naming before any are logged as official.
- A heavy **dupe/Amazon** strand runs through the Bottega chatter ("it's linked on my Amazon",
  `#dupes`), which is its own signal: the woven intrecciato look is being mass-copied right now.
  Worth watching as a brand-health and authentication note, not a naming fact.
- Sounds: more varied here (bossa nova / lo-fi beds alongside original sound), no single dominant
  trending audio to flag from this sample.

**Cross-house, hedged:** the live conversation across all three is **color-led and size-led**, and
the resale houses (Fashionphile, Sellier) are doing a lot of the educational naming work in
short-form. None of the above is a house confirmation; it is what a 36-video relevance sample
showed on 2026-06-28. Use it to point the naming pull (start Bottega colorway verification on
"fondant" / "porridge"; confirm the Chanel 25 and 26A season mapping), not as catalog fact.

---

## Progress checkpoint (update every run — this is how a cold session resumes)

Per the autonomous-run protocol in the ENFORCED block: work one house/decade unit at a
time, commit after each, never stop to ask. Stops allowed only at: queue empty, hard
technical block, or an outward-facing op. Checkpoint here, do not summarize-and-halt.

**Run log**
- **2026-06-28 (run 12)** — Did the FENDI lexicon (house 9, "other houses" queue, after Celine).
  Output `docs/research-drafts/seasonal-archive/fendi.{md,jsonl}` (37 jsonl data rows: 22 models / 9
  materials-motifs / 6 colors incl. the honest-finding row). **THE KEY VALUE was the DESIGNER
  ATTRIBUTION, and the brief's framing held: the BAGS are SILVIA VENTURINI FENDI's** — she created
  the **Baguette (1997)**, the **Spy (2005)**, and the **Peekaboo (~2008/2009)** — while **Karl
  Lagerfeld led FUR + RTW (1965-2019)** and designed the **LOGOS only** (the FF 'Zucca' double-F =
  'Fun Fur', 1965/66; **Karligraphy** 1981). Did NOT over-credit Lagerfeld for the bag silhouettes.
  **Kim Jones led womenswear/couture 2020-2024** (the **First**, his debut bag, Fall 2021, F-shaped
  clasp; **Fendigraphy** 2022; reimagined the Peekaboo ISeeU/Sunshine). **2025-2026 UPDATE that
  POST-DATES THE BRIEF (flag it): Silvia moved to Honorary President Oct 1 2025 (stays on
  accessories/menswear); MARIA GRAZIA CHIURI became Creative Director of Womenswear+Couture, debut
  Feb 2026** (remixing Silvia's Baguette/Spy/Peekaboo). The brief's Kim-Jones-2020-2024 line was
  correct; Chiuri is the current womenswear lead. **CULTURAL: the Baguette is the It-bag origin via
  Sex and the City** ('It's not a bag, it's a Baguette!', 2000 episode), discontinued in the 2000s,
  **revived 2019**, 25th-anniv at NYFW Sept 2022, **1000+ variations** (auction-near-grade across
  Fashionphile + Luxury London + Harper's). **TWO-SIGNATURE MATERIAL DNA captured: the LOGO** (FF
  Zucca = larger double-F / **Zucchino** = smaller FF, discontinued / **FF 1974** = modern embossed /
  Karligraphy 1981) **AND the LEATHER CRAFT** (the **Selleria** hand-saddle-stitch line — 'saddlery'
  in Italian, technique to the family **1925**, modern handbag introduced by Adele Fendi **1960s**, on
  **Cuoio Romano** leather, silver tag engraved 1925; W Magazine + L'Officiel) — plus **Pequin stripe**,
  fur/shearling, exotics. The Zucca-vs-Zucchino distinction is the GEO-valuable decoder. **HONEST COLOR
  FINDING HELD (Dior/Gucci/YSL/Celine camp, NOT Hermès/Bottega): Fendi does NOT name its per-season
  colors** — fendi.com lists flat shade descriptors (Brown, Camelia listed 'White', Black, Tobacco,
  Spring Turquoise); naming weight sits on the MODEL + the LOGO/MATERIAL treatment, so the color layer
  is short + honest, not invented. HELD RIGOR: **Kan I / Kan U** and **Touch** did NOT surface with a
  clean debut year — logged low/unsourced leads, NOT fabricated; **'C'mon'** did not surface at all and
  is **omitted, not invented**; undated models (Sunshine/2Jours/Way original debuts) have IDENTITY
  sourced but YEAR flagged null/medium. Two source conflicts flagged in-row not smoothed (FF Zucca
  1965-vs-1966; Peekaboo 2008-vs-2009). Appended 1 content idea (#23, the Baguette / Sex-and-the-City
  heritage-and-revival explainer, GEO + engagement; Fendi Baguette bag CTA, flagged check-if-bag-page-
  exists). **Next unit: PRADA** (Galleria/Re-Edition/Cleo), then LOEWE (Puzzle/Hammock/Flamenco), or the
  Hermès seasonal backfill (2020-2023 + pre-2020, the highest-GEO-value open gap).
- Tooling note (run 12): 6 firecrawl_search (all refunded 2→1 via feedback within 2 min) + 4 raw
  scrapes (Fashionphile Herstory = the DESIGNER-ATTRIBUTION + Baguette/Spy/Peekaboo WORKHORSE;
  Fashionphile Iconic Logos = the LOGO/Zucca-vs-Zucchino WORKHORSE; PurseBop Kim Jones Fall 2021 = the
  First/ISeeU debut-date WORKHORSE; Luxury London buyer's guide = the multi-model debut-year WORKHORSE;
  W Magazine Selleria = the leather-craft second source) = ~10 credits net. **fendi.com NOT scraped
  wholesale** (Akamai bot-shell risk per LV/Dior/Gucci/BV/YSL/Celine); fendi.com product copy (Mon
  Tresor colors, Selleria) + official Fendi FB/TikTok (Roll bag 1997 + Pequin; Mamma Baguette FendiSS25)
  came through as search SNIPPETS. No Christie's/Sotheby's/Heritage Fendi collecting-guide page surfaced
  (same as BV/YSL/Celine) — Fendi's clean free sources were Fashionphile Academy + PurseBop + Luxury
  London + W Magazine + PurseBlog + Spotted Fashion. The Kan I/Kan U + Touch + C'mon dating is the queued
  Chrome/PurseForum backfill.
- **2026-06-28 (run 11)** — Did the CELINE lexicon (house 8, "other houses" queue, after Saint Laurent).
  Output `docs/research-drafts/seasonal-archive/celine.{md,jsonl}` (37 jsonl data rows: 23 models / 9
  materials-motifs / 5 colors). **THE KEY VALUE was the THREE-ERA + ACCENT attribution, and it held
  clean:** **Phoebe Philo (2008-2018) = accented "Céline"** (Luggage Spring 2010 / Trapeze 2010 / Box
  2011 / Belt Pre-Fall 2014 / Trio / Phantom / Cabas / Sangle bucket / Big Bag Winter 2017 — minimalist
  icons, near all now DISCONTINUED: Trapeze 2017, Box 2023, Luggage+Belt March 2025); **Hedi Slimane
  (2018-2024) DROPPED the accent to "CELINE"**, new logo from the 1960s typeface, REVIVED the Triomphe
  clasp (a 1970s archive motif, the canvas monogram "first revealed in 1972," double-C from the Arc de
  Triomphe chains) + built the 16 (his FIRST bag, Nov 2018, named after 16 Rue Vivienne, 16-turn lock,
  Lady Gaga first) / Triomphe (Spring 2019 runway) / Ava (2020) / Cuir Triomphe (2022) canon; **Michael
  Rider (2024-present)** kept "CELINE", reviving Philo shapes (the "New Luggage", Printemps 2026 debut).
  **BRIEF CORRECTION (flag it): the post-Slimane CD is MICHAEL RIDER, not Marco De Vincenzo** — sourced
  across Numéro/Vogue/Le Monde/Brown Alumni (Rider officially succeeded Slimane Oct 2024, debut SS2026
  shown in Paris July 6 2025). De Vincenzo is at Etro, not Celine; the brief's name was wrong and I did
  NOT propagate it. **HONEST COLOR FINDING HELD (Dior/Gucci/YSL camp, NOT Hermès/Bottega): Celine does
  NOT name its per-season colors** — Tan/Black/Camel/Natural/Brown are plain descriptors; the naming
  weight sits on the MODEL + the MATERIAL/CANVAS (Triomphe Canvas, Drummed grained calfskin), so the
  color layer is short + honest, not invented. HELD RIGOR: five briefed smaller models (Conti, Romy,
  Folco, Tabou, Ring) did NOT surface in a usable source — logged low/unsourced leads, NOT fabricated;
  undated models (Trio/Phantom/Cabas/Sangle/Besace) have IDENTITY sourced but YEAR flagged null/medium,
  not invented. Triomphe DOUBLE-sourced (PurseBlog Spring 2019 + a+ Singapore 2019/1970s-archive); the
  1972 canvas monogram is auction-grade (celine.com product copy). Appended 1 content idea (#22, the
  "Céline vs CELINE: the accent tells the era" GEO + Old-Céline-revival explainer; Celine brand CTA,
  flagged check-if-bag-page-exists). **Next unit: FENDI (Baguette/Peekaboo), then Prada/Loewe, or the
  Hermès seasonal backfill (2020-2023 + pre-2020, the highest-GEO-value open gap).**
- Tooling note (run 11): 4 firecrawl_search (all refunded 2→1 via feedback within 2 min) + 3 raw scrapes
  (Spotted Fashion Philo-era guide = the PHILO-era WORKHORSE w/ debut years; Weekly Lux Drop discontinued
  guide = the DISCONTINUATION-DATE workhorse; PurseBlog "Four Most Important Hedi Slimane Celine Bags" =
  the SLIMANE-era workhorse; a+ Singapore = the Triomphe-heritage second source) = ~7 credits net.
  **celine.com NOT scraped** (Akamai bot-shell risk per LV/Dior/Gucci/BV/YSL); the 1972-monogram fact +
  the 16's Nov-2018 in-store date came through as search SNIPPETS (celine.com product copy + FB/EmQuartier).
  No Christie's/Sotheby's Celine collecting-guide page surfaced (same as BV/YSL) — Celine's clean free
  sources were Spotted Fashion + Weekly Lux Drop + PurseBlog + a+ Singapore. The five unsourced smaller
  models + the undated Philo bags are the queued Chrome/PurseForum backfill.
- **2026-06-28 (run 10)** — Did the SAINT LAURENT (YSL) lexicon (house 7, "other houses" queue).
  Output `docs/research-drafts/seasonal-archive/saint-laurent.{md,jsonl}` (39 jsonl data rows: 23
  models / 9 materials-motifs / 7 colors). **The honest finding HELD: YSL does NOT name its per-season
  colors** (same as Dior/Gucci, the opposite of Hermès/Bottega) — colors are plain descriptors (Noir,
  Crème, Dark Beige, Rouge); the naming weight sits on the MATERIAL (Grain de Poudre, matelassé
  chevron) and the HARDWARE TONE (gold vs silver Cassandre), so the color layer is short and honest,
  not invented. MODELS sourced with DESIGNER ERA — Tom Ford era: Mombasa (Spring 2002 collection /
  stores Dec 2001, deer-horn handle, DOUBLE-sourced PurseBlog + Vogue Adria; relaunched 2025/2026 w/
  Bella Hadid), Downtown (mid-2000s, year null); Pilati era: Muse (intro 2005, released Feb 2006),
  Muse Two (~2008, year null); Slimane era: Sac de Jour (2013), Sunset (2016, named after Sunset
  Blvd), + THE REBRAND (Slimane dropped "Yves" from the RTW logo 2012 → "Saint Laurent"; YSL/Cassandre
  emblem KEPT); Vaccarello era: Niki (Spring 2018, OFFICIAL YSL campaign tag), Cassandra (Summer 2020,
  official campaign), Kaia (SS2020, named for Kaia Gerber), All Over (AW2019), Loulou (named for Loulou
  de la Falaise) + Puffer/Toy, Kate (+ Tassel), Le 5 à 7, Manhattan (revival), Solferino, Jamie,
  Envelope, College, Lou camera, Icare. MATERIALS got the DNA treatment: the **Cassandre monogram
  (A.M. Cassandre, 1963)** is the house emblem AND the bag clasp; **matelassé CHEVRON** is the YSL
  quilt (distinct from Chanel's diamond — brief's chevron-vs-diamond ask held, both logged);
  **Grain de Poudre** is the powder-grain embossed calfskin (official product-name confirmed across
  Saks/Poshmark/Caroline's); + croc-embossed, smooth calf, Rive Gauche canvas (1969 store), Mombasa
  deer-horn. HELD RIGOR: undated models (Le 5 à 7, Manhattan, Solferino, Jamie, College, Lou, Muse Two,
  Downtown, modern Loulou, Puffer/Toy, Icare, Kate) have IDENTITY sourced but YEAR flagged null/low,
  NOT fabricated; Solferino/College logged low (beat knowledge, single-source) not invented. Noted
  Sac de Jour = official spelling, "Sac du Jour" = misspelling alias. Appended 1 content idea (the
  Cassandre-monogram GEO explainer + the Loulou-vs-Kate practical breakdown). **Next unit: CELINE
  (Triomphe/Luggage/Belt), then Fendi/Prada/Loewe, or the Hermès seasonal backfill (2020-2023 +
  pre-2020, the highest-GEO-value open gap).**
- Tooling note (run 10): 5 firecrawl_search (all refunded 2→1 via feedback within 2 min) + 3 raw
  scrapes (Rebag YSL history = the model+era WORKHORSE; Who What Wear = current canon + four-longevity
  styles; PurseBlog Mombasa = auction-grade Tom Ford detail) = ~8 credits net. **ysl.com NOT scraped**
  (Akamai bot-shell risk per LV/Dior/Gucci/BV). **No Christie's/Sotheby's YSL collecting-guide page
  surfaced** (same as BV — YSL's clean free sources were Rebag + Vogue + Who What Wear + PurseBlog).
  The Vogue "Saint Laurent Handbags 101" slideshow (Mombasa-to-Icare) is a JS gallery that did NOT
  render via Firecrawl (only the intro came through) — queue it for the Chrome path for the cleanest
  full-canon per-model dating. Official YSL social posts (X/YouTube) were the auction-grade equivalent
  for the Niki (Spring 2018) and Cassandra (Summer 2020) debut dates.
- **2026-06-28 (run 9)** — Did the BOTTEGA VENETA lexicon (house 6, first of the "other houses"
  queue). Output `docs/research-drafts/seasonal-archive/bottega-veneta.{md,jsonl}` (77 jsonl data
  rows: 18 models incl. 1 caption-lead / 9 materials / 50 colors). **The important finding held:
  BV genuinely NAMES its colors** (the counter-case to Dior/Gucci), so this is a real Hermès-like
  named-color layer — 50 colors captured, but only **Parakeet** logged `official` (double-sourced,
  reintroduced SS2021, the BV house green); the other 49 are `descriptive (reseller-attributed)`
  at medium confidence (Fashionphile's BV color guide), queued for promotion to official + debut
  seasons via bottegaveneta.com (Chrome path). The live trend leads CHECKED OUT: "porridge" and
  "fondant" ARE real BV color names (Fashionphile). MODELS sourced with designer era (Vogue
  workhorse + SACLÀB history): Maier era — Cabat (2001/2002, conflict flagged), Knot (2001), Veneta
  hobo, Roma; Lee era — Pouch (SS2020, his first), Jodie (Resort 2020), Cassette (pre-fall 2019,
  Padded FW2019), Arco; Blazy era — Sardine (FW2022 debut), Kalimero (FW2022), Clicker (resort 2023),
  Andiamo (SS2023), Hop (FW2023), Parachute (pre-fall 2024 re-release), Lauren 1980, Liberta (FW2024).
  HELD RIGOR: Loop/Mount/Point/Sunshine were briefed but NOT sourced — logged honestly as unsourced,
  NOT invented; Campana logged as a caption-attested model-name lead (no year). INTRECCIATO given DNA
  treatment with its SOURCED origin (a workaround for weak Veneto sewing machines, not a design
  flourish); Maxi Intrecciato (Lee 2019) + Padded Intreccio (Lee FW2019) variants captured. CULTURAL
  fact (official Kering): Matthieu Blazy left for Chanel (Dec 2024); **Louise Trotter** (ex-Carven)
  named Creative Director, joined end Jan 2025 — Trotter's new names are the live unknown to watch.
  Appended 2 BV content ideas (the "houses that name their colors vs houses that don't" GEO play +
  the "what BV actually calls its bags" Jodie/Andiamo/Sardine explainer riding the live trend).
  **Next unit: YSL (Loulou/Kate/Le 5 à 7), or the Hermès seasonal backfill (2020-2023 + pre-2020).**
- Tooling note (run 9): 4 firecrawl_search (all refunded 2→1 via feedback within 2 min) + 3 raw
  scrapes (Vogue BV history = the model WORKHORSE; Fashionphile BV color guide = the color
  WORKHORSE; SACLÀB BV history = Intrecciato origin + Maier-era heritage) = ~7 credits net.
  **bottegaveneta.com NOT scraped** (Akamai bot-shell risk per LV/Dior/Gucci). No Christie's/Sotheby's
  BV collecting-guide page surfaced this run (unlike Dior/Gucci) — BV's clean free sources were Vogue
  + Fashionphile + SACLÀB. The Vogue BV article is a 171k-char escaped-`\n` body — decode `\\n`→newline
  in Python before regex on `## ` headers (raw `\n##` won't match the escaped file). luxbags.fr BV
  color-code database surfaced but not scraped — it's the source to turn colors into a code-keyed
  lexicon next run.
- **2026-06-28 (run 8)** — CONTENT-IDEAS expansion (code-driven). Added 2 ideas to the slate
  (now 18): **#2 "Decode your Chanel" interactive widget** (flagged a UX-LANE BUILD handoff, the
  flagship code play — deterministic, ships off the `chanel.md` map with no backend, no house/reseller
  offers it) and **#3 "How to date your Chanel from the tag/code"** (copywriter-ready, no new data,
  auth-adjacent so bound by `authentication-standard.md`). Re-ranked DO-FIRST to 5 picks; the
  interactive widget now sits at #2, alongside the decoder article (#1) and the Hermès color-code (#4)
  / leather (#5) GEO plays. **Made the Chanel codes-vs-colors distinction binding in-doc** (new "Two
  Chanel things that are NOT the same" header + a "What we cannot publish yet and why" note): season
  CODES (18C/23P/26A) ARE official Chanel names and are done/writable; a per-season COLOR-name
  dictionary does NOT exist because Chanel does not name seasonal colors — that is a future DESCRIPTIVE
  data unit (sourced from listings, tagged descriptive/community, never "official"), not a now piece.
  Guards re-proposal of an unsourceable color dictionary. NO Firecrawl searches, $0 credits.
  **Next unit: back to the naming pull — Hermès seasonal colors 2020-2023 + pre-2020.**
- **2026-06-28 (run 7)** — CONTENT-IDEAS unit (not a naming pull). Built the first ranked
  content-ideas slate from the already-banked findings: `docs/research-drafts/seasonal-archive/content-ideas.md`,
  16 ideas (6 article-led, 6 IG-carousel-led/mixed, 4 TikTok/Short-led; most carry a cross-format
  cutdown). Each grounded in a specific finding + its source file row, split GEO (citable naming
  facts that compound) vs ENGAGEMENT (trend-read plays, each shelf-life flagged). DO-FIRST picks:
  Chanel date-code decoder (GEO), Hermès color-code guide (GEO), Hermès leather guide (GEO),
  Birkin 25-vs-30 size discourse (ENGAGEMENT, ~1-season hook). Honest gaps recorded in-doc (no
  per-season Chanel/Dior/Gucci color piece — those houses don't name seasonal colors; no newest-
  season LV/Dior/Gucci color piece — Akamai-blocked, queued for Chrome; no value/appreciation
  piece — compliance + no own price data). NO Firecrawl searches this run (worked from banked
  findings only), $0 credits. **Next unit: back to the naming pull — Hermès seasonal colors
  2020-2023 + pre-2020 (deepest archive, highest GEO value), then Bottega backfill.**
- **2026-06-28 (run 6)** — Did Early Task 4 house 5 of 5: the GUCCI lexicon. **Early Task 4
  (big-five first pass) is now COMPLETE** (LV, Dior, Hermès leathers, Chanel codes, Gucci all
  drafted). Output in `docs/research-drafts/seasonal-archive/gucci.{md,jsonl}` (39 jsonl data rows:
  24 models incl. 4 collabs / 11 materials-motifs / 4 named signatures). Models cover the full
  brief canon + heritage/discontinued, each with a sourced or low-flagged debut year. AUCTION-grade
  anchors (Christie's "Gucci trio" stories page + Sotheby's): Bamboo 1947 (orig. product no. "0633"),
  Horsebit bag 1955 (motif on a 1953 loafer), Jackie 1961 (orig. "Fifties Constance"), Diana 1991,
  Dionysus 2015, GG Marmont 2016, Ophidia Cruise 2018, Sylvie SS2016, Padlock SS2016 (Sylvie + Blondie
  also confirmed by OFFICIAL Gucci FB posts; Blondie Interlocking-G patented 1971). Collabs sourced:
  Hacker Project (Gucci x Balenciaga, Aria, 2021; Sotheby's dates a Hacker Hourglass to 2021); adidas/
  Disney/North Face logged low (established beat). Materials/motifs auction-anchored on the Christie's
  trio page: Diamante 1930s, GG monogram patent 1969, Web stripe early 1950s (girth-strap origin),
  Horsebit hardware 1953, Bamboo handle 1947, plus Flora (Grace Kelly 1960s scarf, Vogue). HELD RIGOR:
  (1) the HONEST FINDING that Gucci, like Dior, does NOT publish a unique per-season color name for
  most bags; the one genuinely-named house color is Rosso Ancora (Sabato De Sarno, SS2024 debut,
  Vogue + Gucci posts), captured, not invented; (2) motif debut vs bag debut kept separate (Horsebit
  motif 1953 vs bag 1955; GG patent 1969 vs Jackie bag 1961); (3) low-confidence model years (Zumi,
  Bree, Aphrodite, Queen Margaret) + the adidas/Disney/North Face collab years flagged low. CULTURAL
  READ logged: 3 creative directors in ~3 years (De Sarno 2023 SS24 debut, then Demna 2025- with a
  digital lookbook + film "The Tiger"); the safe long-term keys are the dated heritage models, not the
  per-director names. BONUS cross-house color data (sourced to the Vogue De Sarno piece): named house
  colors Valentino PP Pink (FW22), Bottega Parakeet Green (Lee 2021, Vogue notes it being phased out),
  Burberry Knight Blue (Lee), Hermès orange — feeds the BV/YSL backfill.
  **Next unit: the queued backfills. Recommend Hermès seasonal colors 2020-2023 + pre-2020 (the
  worklist's oldest-flagged gap, and the Hermès archive is the deepest/highest-GEO-value), then the
  Other-houses queue (Bottega first, given the live trend-read leads + the now-sourced Parakeet Green).**
- Tooling note (run 6): 5 firecrawl_search (all refunded 2->1 via feedback within 2 min) + 4 raw
  scrapes (Christie's Gucci-trio stories page + Vogue Gucci guide + LuisaViaRoma + Vogue De Sarno red
  = the WORKHORSES) = ~9 credits net. **No Christie's Gucci artist page exists** (the /artists/gucci/
  gucci-handbag URL redirects to a generic search showing Hermès lots, cost 1 credit, no Gucci data) -
  unlike Dior, Gucci's clean auction-grade source is the Christie's "stories" collecting-guide page,
  not an artist page. gucci.com NOT scraped (Akamai bot-shell trap per LV/Dior); Sylvie/Blondie/Ancora
  came from official Gucci FB posts as search snippets. Vogue Gucci guide is a huge single-line body
  (111k chars) - sliced with Python str.find, never regex over the whole line (catastrophic backtracking).
- **2026-06-28 (run 5)** — Did Early Task 4 house 2 of 5: the DIOR lexicon. Output in
  `docs/research-drafts/seasonal-archive/dior.{md,jsonl}` (39 jsonl data rows: 20 models / 10
  materials-techniques / 9 named capsules+art editions). Models cover the full brief canon +
  heritage/discontinued (Diorama 2015, Diorever 2016, Be Dior 2014, Dioraddict, Diorissimo tote,
  Dior Key, Toujours, Miss Dior bag, Nolita), each with a sourced or low-flagged debut year.
  Anchor facts are AUCTION-grade (Christie's Dior-handbag history page): Lady Dior 1995 (orig.
  "Chouchou"), Saddle 1999, Book Tote 2018, 30 Montaigne 2019, Caro 2021; cross-checked Vogue.
  Materials/techniques double-sourced: Cannage (1947 Napoleon III chairs, Vogue+Christie's),
  Oblique (Bohan 1967, SS1969 debut, Kim Jones 2018 resurgence — myGemma+Vogue), Toile de Jouy,
  Diorissimo canvas (distinct from the tote), cannage lambskin vs grained calfskin (Bag Religion).
  Held rigor hard: (1) the HONEST FINDING that Dior does NOT publish a unique official name per
  Lady Dior seasonal colorway (unlike Hermès codes / Chanel season codes), so the named-seasonal
  layer is capsules — Dior Lady Art #1/#2/#5/#10 (2016/2017/2020/2025, artnet+Christie's), My
  ABCDior, Toile de Jouy, Gradient/Ombré, Dioramour, Graphic Cannage AW24 — captured, not
  invented; (2) the Lady Dior 1999-vs-1995 conflict flagged not smoothed (Bag Religion's 1999 is
  a single-source error; logged 1995 high). Low-confidence model debut years (D-Joy, Be Dior,
  Dior Key, Toujours, Miss Dior, Bobby) labelled low. CULTURAL READ logged: Jonathan Anderson named
  Dior Creative Director 2025, succeeding Maria Grazia Chiuri (2016-25) — the live Dior story.
  **Next unit: Gucci (GG Marmont + Dionysus colorways), then Chanel/Hermès seasonal-color backfill.**
- Tooling note (run 5): 4 firecrawl_search (all refunded 2→1 via feedback within 2 min) + 5 raw
  scrapes (Vogue Dior history, Christie's Dior auction page — both free-archive WORKHORSES — Bag
  Religion, myGemma Oblique, artnet Lady Art) = ~9 credits net. **dior.com NOT scraped**: per the
  LV Akamai warning I avoided the brand .com bot-shell trap; the Lady 95.22 + Lady Dior pages
  surfaced as search snippets only. dior.com newsroom (95.22, craft/Cannage, capsules) is queued
  for the owner-present Chrome path. Christie's auction page parses as plain markdown and is the
  single cleanest free source for Dior model dating — reuse it for the Gucci run if Gucci has one.
- **2026-06-28 (run 4)** — Started Early Task 4 (big-five sweep): the Louis Vuitton lexicon,
  house 1 of 5. Output in `docs/research-drafts/seasonal-archive/louis-vuitton.{md,jsonl}`
  (73 jsonl data rows: 30 model rows / 19 materials / 24 colors). Models cover the full canon
  + key heritage/discontinued (Lockit, Tivoli, Galliera, Sologne, Papillon), each with a sourced
  or low-flagged debut year. Materials are near-complete and well-dated, double-sourced Xupes +
  Yoogi's: Monogram 1896, Damier Ebene 1888 / Azur 2006 / Graphite 2008, Epi 1985, Empreinte 2010,
  Multicolore 2003 (ended 2015), Vernis 1997, Mahina 2007, Taiga 1993, Eclipse/Reverse 2016, plus
  Taurillon/Suhali/Idylle/Mini Lin/Denim/Nomade/Antheia. Colors: Vernis + Epi DATED archive
  (sample through ~2015, with intro/discontinue years from Yoogi's) + the Empreinte name list
  (undated, queued). Held rigor: two intro-year conflicts flagged not smoothed (Empreinte
  2010-leather vs 2012-handbag-line; Vernis 1997-MJ vs 1998-first-color); low-confidence debut
  years labelled as established-beat-not-resourced; recent 2025 Empreinte names (Cognac/Blue Jean/
  Brume) logged as a single-source LEAD (low), not a fact. **Next unit: Dior (Lady Dior cannage
  colors by season), then Gucci.**
- Tooling note (run 4): 4 firecrawl_search (all refunded 2→1 via feedback within 2 min) + 2 useful
  raw scrapes (Vogue LV history, Xupes materials, Yoogi's guide — Yoogi's+Xupes were the workhorses)
  = ~6 credits net. **LV warning confirmed:** louisvuitton.com Akamai-blocks Firecrawl; the Heritage
  page scrape returned only the Akamai shell AND cost 5 credits (stealth-proxy auto-upgrade). Do NOT
  scrape louisvuitton.com via Firecrawl; use the search SNIPPET (which carried OnTheGo 2019 + Petite
  Malle 2014) or the owner-present Chrome path for season-labeled 2023-2026 colors.
- **2026-06-28 (run 3)** — Did Early Task 3: the Hermès lexicon. Output in
  `docs/research-drafts/seasonal-archive/hermes.{md,jsonl}` (69 jsonl rows: 31 leathers/skins
  + Electrum hardware, 23 permanent/staple colors, 13 recent seasonal colors). Leathers are
  near-complete with official "Veau X" names, introduction years, and current/heritage/discontinued
  status, cross-checked PurseBlog leather guide + Sellier Knightsbridge. Permanent color core
  anchored on official codes (Noir 89, Rouge H 46, Etoupe 18, Gold 06, Orange H 93, Blanc 01,
  Etain 8F, Rouge Casaque Q5, Craie 10, Bleu Nuit 2Z) from RareCollection, cross-checked
  jewelsaficionado. Recent seasonal (SS2025 five new + 2024/2025 returns) double-sourced
  PurseBlog SS25 + PurseBop 2025. Held the rigor line: fuzzy permanent-vs-seasonal rows tagged
  "permanent-or-recurring, unverified" at lowered confidence; numeric codes that live in swatch
  images left null + queued, not invented. **Next unit: Early Task 4, the big-five
  lookbook/runway sweep (Vogue Runway + house newsrooms, season by season).**
- Tooling note (run 3): 4 firecrawl_search (all refunded 2→1 via feedback within 2 min) + 5 raw
  scrapes = ~9 credits net. Parsed raw with Python; never the 5-credit LLM-extract. Caution: huge
  single-line markdown bodies hang naive `grep -oE` regex (catastrophic backtracking) — read in
  chunks or use Python `str.find`, not regex over the whole line.
- **2026-06-28 (run 2)** — Did Early Task 2: the Chanel season-code + serial-series map, back
  to the mid-1980s. Output in `docs/research-drafts/seasonal-archive/chanel.{md,jsonl}`. Mapped
  TWO systems kept deliberately separate: (1) serial series number 1→31 → approximate year
  RANGES (pre-2021 sticker era; first digit(s) ≈ production year, no collection), and (2) the
  `[YY][letter]` season code → collection+year (deterministic once the legend is fixed). Letter
  legend C/P/S/A/B/K (+M Coco Beach) cross-checked across PurseForum + PurseBop + Coco Approved;
  serial→year cross-checked Xupes (explicit 1984–2021 table) + Couture USA (anchors) +
  Fashionphile (era framework). Flagged the vintage-A (Automne/Fall) vs modern-A (Métiers d'Art,
  ~2012 boundary) trap as medium confidence. No house-published reference exists, so serial→year
  stays as RANGES and nothing is rated above the cross-check. **Next unit: Early Task 3, Hermès
  leathers (permanent set) + permanent color core, then seasonal color rotations.**
- Tooling note (run 2): `firecrawl_search_feedback` IS now in the allowlist and works — both
  searches this run refunded 2→1 credit. Net Firecrawl spend: 2 searches (1 credit each after
  refund) + 6 raw scrapes = ~8 credits. Always send feedback within ~2 min of each search.
- **2026-06-28 (run 1)** — First archivist run. Did Early Task 1 (community-beat registry, dated,
  per house) and a first dated TikTok trend read (Apify clockworks, 3 capped pulls of 12). Naming
  pull itself not started yet. Apify spend this run ~$0.15 (well under $5/mo).
- Tooling note (run 1): apidojo/tiktok-scraper search returned `noResults` on all three
  keyword/URL variants; clockworks/tiktok-scraper worked. Prefer clockworks for keyword search
  until apidojo search recovers.

| House | Models done | Materials done | Colors: decades covered | Last touched | Next unit |
|---|---|---|---|---|---|
| Hermès | ⬜ | ✅ leathers + exotics (31, near-complete) | 🟨 permanent-core (codes partial) + seasonal 2024–2025 only | 2026-06-28 (run 3: ✅ → `hermes.{md,jsonl}`) | seasonal colors 2020–2023 + pre-2020; OCR/auction-catalog pass for null color codes |
| Chanel | ⬜ | ⬜ | ⬜ none | 2026-06-28 (run 2: ✅ season-code + serial-series map → `chanel.{md,jsonl}`) | seasonal colors per season code (use the map) — after Hermès |
| Louis Vuitton | ✅ canon + heritage/discontinued (30 rows) | ✅ Monogram/Damier/Epi/Empreinte/Mahina/Taurillon/Taiga/Suhali families (19, well-dated) | 🟨 Vernis + Epi dated archive (sample, through ~2015) + Empreinte name list (undated); 2023–2026 season-labeled queued | 2026-06-28 (run 4: ✅ → `louis-vuitton.{md,jsonl}`) | 2023–2026 named Empreinte/Epi seasonal colors w/ house season labels (Chrome owner-present path; LV site Akamai-blocks Firecrawl) + confirm low-confidence model debut years |
| Dior | ✅ canon + heritage/discontinued (20) | ✅ Cannage/Oblique/Toile de Jouy/Diorissimo + leathers (10, well-dated) | 🟨 named capsules + art editions (9: Lady Art #1/#2/#5/#10, ABCDior, Toile, Gradient, Dioramour, Graphic Cannage); per-season plain colors are descriptive not named (Dior doesn't name them) | 2026-06-28 (run 5: ✅ → `dior.{md,jsonl}`) | dior.com newsroom (95.22, craft, capsules) via owner-present Chrome path; Lady Art #3/#4/#6-#9 per-edition rows; confirm low-confidence model debut years |
| Gucci | ✅ canon + heritage/discontinued + 4 collabs (24 rows) | ✅ Diamante/GG monogram/GG Supreme/Web/Horsebit/Bamboo handle/Flora/matelassé (11, mostly auction-anchored) | 🟨 named layer is small: Rosso Ancora (De Sarno SS24) + Flora + Ken Scott + Hacker finishes (4). Gucci does NOT name most per-season colors (honest finding) | 2026-06-28 (run 6: ✅ → `gucci.{md,jsonl}`) | gucci.com Ancora/Jackie/Bamboo season pages (owner-present Chrome path) for any named colors; confirm low-confidence model years (Zumi/Bree/Aphrodite/Queen Margaret) + adidas/Disney/North Face collab years |
| Bottega Veneta | ✅ canon + heritage/era (17 sourced; Loop/Mount/Point/Sunshine logged unsourced not invented) | ✅ Intrecciato DNA + Maxi/Padded variants + leathers (9) | ✅ NAMED layer real (50 colors: Parakeet official SS2021 + 49 descriptive/reseller-attributed incl. Fondant/Porridge/Barolo/Travertine) | 2026-06-28 (run 9: ✅ → `bottega-veneta.{md,jsonl}`) | promote 49 descriptive colors to official + add debut seasons via bottegaveneta.com (Chrome path) + luxbags.fr color-code DB; source Loop/Mount/Point/Sunshine/Campana debut years; resolve Cabat 2001-vs-2002 |
| Saint Laurent (YSL) | ✅ canon + heritage/era (23 rows; Tom Ford/Pilati/Slimane/Vaccarello attributed; undated ones flagged null/low not invented) | ✅ Cassandre monogram (1963) + matelassé chevron vs diamond + Grain de Poudre + croc/smooth calf + Rive Gauche + Mombasa horn (9) | 🟨 honest finding: YSL does NOT name per-season colors (Dior/Gucci camp). 7 rows: plain neutrals/darks + gold/silver Cassandre hardware-tone axis + Rive Gauche print | 2026-06-28 (run 10: ✅ → `saint-laurent.{md,jsonl}`) | exact debut seasons for Le 5 à 7/Manhattan/Solferino/Jamie/College/Lou/Muse Two/Downtown/modern Loulou/Icare/Kate via ysl.com heritage + Vogue Runway (Chrome path; ysl.com Akamai-blocks Firecrawl) + the Vogue 101 slideshow (JS gallery, Chrome); Christie's/Sotheby's YSL lots for auction-grade heritage years |
| Celine | ✅ canon + 3-era/accent attribution (16 sourced incl. Teen Triomphe; Conti/Romy/Folco/Tabou/Ring logged unsourced not invented) | ✅ Triomphe clasp (1970s archive) + Triomphe Canvas (1972 monogram) + Drummed/smooth calf + exotics + winged silhouette (9) | 🟨 honest finding: Celine does NOT name per-season colors (Dior/Gucci/YSL camp). 5 plain neutrals (Tan/Black/Camel/Natural/Brown) | 2026-06-28 (run 11: ✅ → `celine.{md,jsonl}`) | exact debut years for Trio/Phantom/Cabas/Sangle/Besace + source Conti/Romy/Folco/Tabou/Ring via celine.com (Chrome path; Akamai-risk) + PurseForum Celine subforum; Christie's/Sotheby's Celine lots for Philo heritage dating |
| Fendi | ✅ canon + designer attribution (22 rows; bags=Silvia Venturini Fendi, logos=Lagerfeld, First/Fendigraphy=Kim Jones; Kan I/Kan U + Touch logged unsourced-year not invented, C'mon omitted not invented) | ✅ TWO-signature DNA: FF Zucca + Zucchino + FF 1974 + Karligraphy (logos) + Selleria saddle-stitch (1925) on Cuoio Romano + Pequin + fur + exotics (9) | 🟨 honest finding: Fendi does NOT name per-season colors (Dior/Gucci/YSL/Celine camp). 6 rows: plain shade descriptors (Brown/Camelia/Black/Tobacco/Spring Turquoise) + the no-lexicon finding | 2026-06-28 (run 12: ✅ → `fendi.{md,jsonl}`) | clean debut years for Kan I/Kan U + Touch + verify/date 'C'mon' via fendi.com (Chrome path; Akamai-risk) + PurseForum Fendi subforum; original debut years for Sunshine/2Jours/Way; Christie's/Sotheby's/Heritage Fendi lots for Baguette/Peekaboo heritage dating; resolve FF Zucca 1965-vs-1966 + Peekaboo 2008-vs-2009 via fendi.com heritage |
| Prada / Loewe | ⬜ | ⬜ | ⬜ none | — | Prada next (Galleria/Re-Edition/Cleo), then Loewe (Puzzle/Hammock/Flamenco) |

---

## Early tasks (the first runs, in order)

1. ✅ **Map the community beat** (done 2026-06-28) — verified + expanded the chatter source list
   into a dated per-house registry (see "Authoritative-source registry per house" above). Hermès
   + Chanel anchors URL-verified; LV/Dior/Gucci marked "lead, verify". Re-run to URL-confirm the
   "lead, verify" anchors and add per-house reference threads.
2. ✅ **Decode the Chanel season-code system** (done 2026-06-28, run 2) — full `season-code →
   season/year` map (17B, 18C, 23S…) back ~30 years, PLUS the serial-series → year-range map
   for the pre-2021 sticker era. Output `docs/research-drafts/seasonal-archive/chanel.{md,jsonl}`.
   Deterministic and reusable; unblocks all Chanel seasonal color work.
3. ✅ **Hermès lexicon** (done 2026-06-28, run 3) — leathers (near-complete, official "Veau X"
   names + intro years + status) and permanent color core (anchored on official codes), plus
   recent seasonal colors (2024–2025, double-sourced). Output `hermes.{md,jsonl}`. STILL QUEUED
   for Hermès: seasonal colors 2020–2023 and pre-2020 (PurseBop "New Hermès Colors 20XX" archive
   + PurseForum per-year color charts), and an OCR/auction-catalog pass to fill the null numeric
   color codes for the staple neutrals (Gris Tourterelle, Nata, Béton, Gris Meyer, etc.).
4. ✅ **Lookbook + runway sweep, big five — COMPLETE (first pass)** — walked Vogue Runway, auction
   catalogs (Christie's/Sotheby's), and reseller guides house by house, pulling debut/reissue/retire
   facts for each model + the named layer.
   ✅ **Louis Vuitton** (run 4, `louis-vuitton.{md,jsonl}`): models + lines/canvases/leathers +
   Vernis/Epi dated colorways; Empreinte name list + 2023–2026 season-labeled colors queued.
   ✅ **Dior** (run 5, `dior.{md,jsonl}`): models + Cannage/Oblique/Toile de Jouy techniques +
   named capsules/Lady Art editions. Honest finding: Dior doesn't name per-season Lady Dior colors,
   so the named layer is capsules. dior.com newsroom queued for owner-present Chrome path.
   ✅ **Gucci** (run 6, `gucci.{md,jsonl}`): models incl. collabs + Diamante/GG/Web/Horsebit/Bamboo/
   Flora motifs + the named layer (Rosso Ancora + Flora + Ken Scott + Hacker). Same honest finding as
   Dior: Gucci doesn't name most per-season colors; Rosso Ancora (De Sarno SS24) is the exception.
   (Hermès leathers + Chanel codes were done in earlier tasks.) gucci.com season pages queued for Chrome.
   **NEXT: backfills — Hermès seasonal 2020-2023 + pre-2020 (deepest archive), then Bottega/YSL/Celine.**
5. **Backfill the rest** — ✅ **Bottega Veneta** (run 9, `bottega-veneta.{md,jsonl}`): models with
   designer era (Maier/Lee/Blazy) + Intrecciato DNA + a REAL named-color layer (50 colors; Parakeet
   official, the rest reseller-attributed, queued for bottegaveneta.com promotion). BV is the
   counter-case to Dior/Gucci: it genuinely names its colors. ✅ **Saint Laurent** (run 10,
   `saint-laurent.{md,jsonl}`): models with designer era (Ford/Pilati/Slimane/Vaccarello) + the
   Cassandre monogram (1963) / matelassé chevron / Grain de Poudre material DNA. Honest finding: YSL
   does NOT name per-season colors (Dior/Gucci camp) — naming weight is on material + hardware tone
   (gold/silver Cassandre). ✅ **Celine** (run 11, `celine.{md,jsonl}`): models with the THREE-era +
   accent attribution (Philo "Céline" 2008-2018 / Slimane "CELINE" 2018-2024 / Rider 2024-present) +
   the Triomphe clasp (1970s archive) / Triomphe Canvas (1972) material DNA. Honest finding: Celine does
   NOT name per-season colors (Dior/Gucci/YSL camp). Brief-correction: post-Slimane CD is Michael Rider,
   not Marco De Vincenzo. ✅ **Fendi** (run 12, `fendi.{md,jsonl}`): models with DESIGNER attribution —
   the bags are Silvia Venturini Fendi's (Baguette 1997, Spy 2005, Peekaboo ~2008/2009), Lagerfeld did
   the LOGOS only (FF Zucca 'Fun Fur' 1965/66, Karligraphy 1981), Kim Jones did the First (2021) +
   Fendigraphy (2022) — plus the TWO-signature material DNA (FF Zucca/Zucchino/FF 1974 logos + the
   Selleria saddle-stitch leather line, 1925, on Cuoio Romano). Honest finding: Fendi does NOT name
   per-season colors (Dior/Gucci/YSL/Celine camp). 2025-2026 update (post-dates the brief): Silvia →
   Honorary President Oct 2025; Maria Grazia Chiuri = new Womenswear/Couture CD, debut Feb 2026.
   **NEXT: Prada** (Galleria/Re-Edition/Cleo), then Loewe (Puzzle/Hammock/Flamenco).
   Hermès seasonal-color backfill (2020-2023 + pre-2020) also still open and is the highest-GEO-value gap.

## Recommendation to flag to the owner (do not build unsolicited)

Once the lexicon has real volume, a dedicated `color_lexicon` / `season_lexicon` reference
table (keyed by brand + season + official name, with the alias layers) would let bag pages and
JSON-LD resolve nickname/color queries automatically. That is an owner-gated migration. Surface
it as a decision with the GEO upside; do not add the migration yourself.
