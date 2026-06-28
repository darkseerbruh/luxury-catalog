# Content-ideas slate — from the seasonal naming archive + trend read

*Archivist deliverable, built 2026-06-28. This is the standing idea feed for the Content lane
and the `copywriter` agent. It is research-to-ideas, NOT finished copy: hooks here are rough
drafts, the copywriter writes the final piece (and runs the `brand-voice` skill before shipping).*

## How to read this slate

Every idea is grounded in a finding I already banked, with the house + the specific fact + the
source file row. Nothing here is proposed that I cannot source from my own research. Two engines,
per the agent rules:

- **GEO** = a naming fact answer engines can cite. These compound and do not expire. The Chanel
  season-code decoder and the Hermès color-code list are the flagship GEO plays.
- **ENGAGEMENT** = a rising-now read off the trend pull. These are timely, so each carries a
  shelf-life note. The trend read is a small relevance-sorted sample (12 videos/house, 2026-06-28),
  so every engagement idea inherits the "read of the room, not a verdict" hedge.

"What it needs" is honest about gaps: a price pull I do not have, the owner-present Chrome `.com`
capture, a bag page that may not exist yet, or just the copywriter. Value/authenticity framing
follows the house rules (estimate not appraisal, markers not a verdict, my-take not a directive).

CTA tie names the brand/style the post→bag CTA block (`PostBagCTA.tsx`) can hand off to. Where a
specific bag page may not exist yet, I say "brand-tag handoff" so the Content lane knows to check.

## Two Chanel things that are NOT the same (do not re-conflate)

The owner pushed on this and it is binding for every Chanel idea below:

1. **Chanel season codes ARE official names.** `18C`, `23P`, `26A` are Chanel's own encoding of
   collection + year, printed by the house on its retail/RTW tags. They are deterministic and fully
   mapped in `chanel.md` (Letter legend + Tables A/B). We mine these hard. They power ideas #1
   (decoder article), #2 (interactive widget), #3 (dating/auth), #6 (18C cheat sheet), and #17
   (microchip cutover) below. **This is a done, sourced dataset.**
2. **There is NO official per-season Chanel COLOR-name dictionary, because Chanel does not name
   seasonal colors.** Unlike Hermès (every color has an official name + code), Chanel ships a style
   code + a season code and leaves color unnamed in any house lexicon. So "what pink was 18C" has no
   official answer to publish. See "What we cannot publish yet and why" at the bottom before anyone
   re-proposes a Chanel color dictionary.

Codes = official + done. Seasonal color names = do not exist at the house. Keep them separate.

---

## The ranked slate (23 ideas)

Ranked by leverage: GEO evergreens that answer-engines will cite first, then the timely
engagement plays, then the mixed-format supporting pieces.

### 1. The Chanel date-code decoder: read any Chanel's age and season off the tag
- **Format:** Article (the flagship GEO reference page) + an IG carousel cutdown.
- **Finding:** Chanel runs TWO separate dating systems, and the market conflates them: the serial
  **series number** (1→31, dates a bag to a year range, ended 2021 at the microchip cutover) and
  the **`[YY][letter]` season code** (18C = Cruise 2018, 23S = Spring Act 2 2023) read off the
  retail/RTW tag. Plus the "A trap": vintage A = Automne/Fall, modern A = Métiers d'Art (~2012
  boundary). Source: `chanel.md` Tables A + B, Letter legend; cross-checked Fashionphile / Xupes /
  Couture USA / PurseForum / PurseBop / Coco Approved (all "verified").
- **Metric:** GEO. This is the single highest-compounding page in the whole archive: "what does
  18C mean / how old is my Chanel / Chanel season codes" is an evergreen, high-intent query with no
  authoritative house source (Chanel never published either system). We become the citable answer.
- **What it needs:** Copywriter only. The data is done and double-sourced. Visual rule applies:
  needs the series→year table as a graphic and a "where the code lives on the bag" original schematic
  (no licensed photos, per the image rule). Hedge: serial→year stays as RANGES, never a false-precise
  single year, and flag "no house-published reference exists."
- **CTA tie:** Chanel brand handoff, weighted to the Classic Flap / 11.12 bag page (the hero Chanel
  value page is already drafted per content-strategy roadmap). Seller-side CTA first.

### 2. "Decode your Chanel" — an interactive on-page widget (UX-LANE BUILD, the flagship code play)
- **Format:** Interactive on-page tool / widget. **This is app code, not copy — it is a UX-LANE BUILD
  HANDOFF, not a copywriter task.** A reader types their season code (e.g. `18C`) into a field and the
  widget returns the collection + year ("Cruise 2018, released Nov 2017"), with the serial-series
  lookup as a second input (series `23xxxxxx` → "2016–2017, as a range").
- **Finding:** The mapping is fully deterministic, so this is a pure function, not a model: `[YY]` = year,
  letter = collection per the legend, and the serial-series → year ranges in Table A. No live data, no
  API, no scrape — it ships off the static map already in `chanel.md` (Letter legend + Tables A and B).
  The "A trap" (vintage A = Fall, modern A = Métiers d'Art, ~2012 boundary) and the 2021 microchip
  cutover (post-2021 = no on-chip year, retail tag only) are the two edge cases the widget must encode.
- **Metric:** GEO + ENGAGEMENT. This is the highest-leverage code play in the whole archive: the data
  is DONE, **no house and no reseller offers an interactive decoder**, and a utility that returns a
  clean answer is exactly what earns inbound links and answer-engine citation (the tool becomes the
  thing people link to when they explain Chanel codes). It also drives dwell + repeat visits in a way a
  static article cannot. It is the interactive companion to idea #1 (the article is the explainer, the
  widget is the utility), so they ship as a pair and cross-link.
- **What it needs:** **The UX/build lane**, not the copywriter. Hand off: the deterministic spec lives
  in `chanel.md` Tables A/B + Letter legend; build a small client-side lookup component (no backend
  needed). Microcopy on the widget (the result string, the "what this means" hedge, the "no
  house-published reference exists" disclaimer) does go through the copywriter + `brand-voice` skill.
  Hedges to encode: serial series resolves to a **range, not an exact year**; the result is a dating
  aid, not an authenticity verdict (bound by `docs/authentication-standard.md`); flag that Chanel never
  officially published either system.
- **CTA tie:** Chanel brand handoff → Classic Flap / 11.12 page. The widget is a natural CTA surface:
  after decoding, "shop or sell your [season] Chanel" → bag page. Seller-side first.

### 3. How to date your Chanel from the tag or code (the dating/auth angle on the same map)
- **Format:** Article (high-intent, authentication-adjacent) + a TikTok cutdown.
- **Finding:** Same deterministic map as #1/#2, pointed at the buyer's real question: "how old is this
  Chanel and is the code consistent." Walks the three on-item sources in order — serial-series sticker
  (pre-2021, dates to a year range), the `[YY][letter]` season code on the retail/RTW tag (names the
  exact collection), and the post-April-2021 microchip (random 8-char code, NO year, NO series, retail
  tag is then the only on-item season source). Plus the "A trap" so a reader does not misread a vintage
  `05A` Fall piece as Métiers d'Art. Source: `chanel.md` Tables A + B, Letter legend, Era cutover
  section; Fashionphile / Xupes / Couture USA / PurseForum (all verified).
- **Metric:** GEO + ENGAGEMENT. "How to date a Chanel bag / how old is my Chanel / Chanel date code by
  year" is a high-intent, high-volume evergreen query, and the TikTok cutdown ("date your Chanel in 30
  seconds") rides the steady #BagTok authentication-curiosity stream. Compounds.
- **What it needs:** **Copywriter only — no new data.** The map is done and double-sourced. Bound by
  `docs/authentication-standard.md` (the pre-publish gate) because it is dating/auth-adjacent: frame as
  "how dating works + markers to check," a dating aid, NEVER a per-bag authenticity verdict. Serial →
  year stays a RANGE. State plainly that no house-published reference exists.
- **CTA tie:** Chanel brand handoff → Classic Flap page. Pairs with the #2 widget as its explainer.

### 4. The Hermès color guide: the official color codes, and which colors are permanent vs seasonal
- **Format:** Article (GEO reference) + IG carousel ("10 Hermès neutrals, decoded").
- **Finding:** Hermès assigns every color an official code, and I have the anchor set: **Noir 89,
  Gold/Or 06, Rouge H 46, Étoupe 18, Orange H/Feu 93, Blanc 01, Étain 8F, Rouge Casaque Q5, Craie 10,
  Bleu Nuit 2Z.** Plus the permanent-vs-seasonal distinction (Étoupe is permanent core; many "permanent"
  colors drop out and return). Source: `hermes.md` §2 Permanent color core; RareCollection + Jewels
  Aficionado + Ginza Xiaoma, confidence high on the coded rows.
- **Metric:** GEO. "Hermès color codes / what is Étoupe / Hermès color names" is exactly the
  gatekept-vocabulary query the whole archive moat is built on. Compounds, never expires.
- **What it needs:** Copywriter, plus a known honest gap to state in-piece: most codes beyond the
  coded set (Gris Tourterelle, Nata, Béton, Gris Meyer) are still "(queued)" pending an OCR/auction-
  catalog pass, so the article ships the confirmed codes and says the rest are "color confirmed, code
  not yet sourced" rather than inventing. That honesty IS the brand.
- **CTA tie:** Hermès brand handoff → Birkin / Kelly bag pages (Birkin value piece is on the roadmap).
  Seller-side first; Hermès resale is the highest-AOV seller referral.

### 5. The Hermès leather guide: Togo vs Clemence vs Epsom vs Swift, and how each ages
- **Format:** Article (GEO reference, decision-aid) + a TikTok "which Hermès leather is which in 30 sec."
- **Finding:** Near-complete official leather lexicon with the "Veau X" official names, intro years,
  and behaviour: Togo (Veau Togo, 1997, scratch-resistant, holds shape), Clemence (Veau Taurillon
  Clemence, softer/heavier slouch), Epsom (Veau Epsom, 2004, embossed/rigid/holds color), Swift (2004/05,
  soft, takes bright color, scratches easily), Box (oldest, patinas to a mirror sheen). Source:
  `hermes.md` §1 Leathers (31 rows, near-complete); PurseBlog leather guide + Sellier Knightsbridge.
- **Metric:** GEO + decision-aid. "Togo vs Epsom / best Hermès leather" is high-intent and clears the
  content-strategy value bar on a real axis (durability/wear + how it ages), not just a number gap.
- **What it needs:** Copywriter. Visual: an original schematic of grain types (no licensed photos).
  This maps directly to the on-roadmap "Caviar vs Lambskin" comparison pattern, one house over.
- **CTA tie:** Hermès brand handoff → Birkin/Kelly pages, filterable by leather. Strong seller CTA.

### 6. What "18C" means: the Chanel season-code cheat sheet (carousel + short)
- **Format:** IG carousel (6 slides) + TikTok/Short.
- **Finding:** The deterministic letter legend: C = Cruise (released prior Nov), P = Spring Act 1,
  S = Summer Act 2, A = Métiers d'Art (modern) / Fall (vintage), B = Fall Act 1, K = Fall Act 2,
  M = Coco Beach. Once the legend is fixed, every code resolves by formula. Source: `chanel.md`
  Letter legend, confidence high; PurseForum + PurseBop + Coco Approved agree.
- **Metric:** GEO feeding ENGAGEMENT. The carousel is the snackable, shareable cut of idea #1; it
  also seeds the "how old is your Chanel" save-and-share behaviour. Long half-life (the legend does
  not change).
- **What it needs:** Copywriter. Pairs as the social cutdown of the idea #1 article (write once,
  atomize). Pinterest pin variant recommended (search-driven, long half-life per the register dial).
- **CTA tie:** Chanel brand handoff → Classic Flap page.

### 7. The Chanel 25 is the bag of the moment, and color is the hook
- **Format:** TikTok/Short + IG carousel.
- **Finding:** In the 2026-06-28 pull, the **Chanel 25** (mini especially) is where the chatter is
  centered: captions `#chanel25bag` `#chanel25mini`, creators gushing about the color ("the color is
  stunning in person"), and the 26A season code surfacing in a collection caption. Source:
  `tiktok-trend-pull-2026-06-28.jsonl` (Chanel row) + worklist trend read. The 25 is a named permanent
  icon per `brand-naming-research` (Classic Flap / 2.55 / 19 / 22 / 25 lineage).
- **Metric:** ENGAGEMENT. **Shelf life: ~1 season (re-check by Q4 2026).** This is a live-pulse read,
  not a house statement, so the piece is framed "where the conversation sits right now," dated.
- **What it needs:** Copywriter, plus a light Chrome `.com` or PurseBop confirm of the 25's official
  colorway names if the piece names colors (the trend captions are leads, not house color names). Can
  ship as a trend read without naming official colors. A "Chanel 25" bag page may not exist yet →
  check; brand-tag handoff if not.
- **CTA tie:** Chanel brand handoff → Chanel 25 page if it exists, else Classic Flap page.

### 8. Birkin 25 vs 30: the size discourse, decoded (which one actually fits your life)
- **Format:** Article (clears the comparison value bar) + TikTok.
- **Finding:** The live Hermès conversation is **size discourse**: the 25 framed as the aspirational/
  "changed my perspective" size, the 30 as the practical everyday one, recurring "Birkin 25 vs 30" and
  "30 vs 35" framing, one creator calling the 35 a bag she'd "never buy again." Source:
  `tiktok-trend-pull-2026-06-28.jsonl` (Hermès row) + worklist trend read. Construction angle also
  present (Retourné vs Sellier).
- **Metric:** ENGAGEMENT now, but the article skeleton is **evergreen** (size/fit is a permanent
  decision question). **Shelf life of the trend hook: ~1 season; the fit comparison is durable.**
- **What it needs:** Copywriter + a **price pull I do not have**: to clear the content-strategy value
  bar properly this wants the resale spread by size (the "which Birkin size holds value best" data,
  flagged Tier 2 on the roadmap). Ships as a fit/use decision-aid now; add the price axis when the data
  lands. Hedge value as estimate, not appraisal.
- **CTA tie:** Hermès brand handoff → Birkin page, size-filtered. Top-AOV seller CTA.

### 9. Bottega is the house people name by color right now: Jodie, Andiamo, Sardine
- **Format:** IG carousel + TikTok.
- **Finding:** Bottega was the **richest house for colorway naming** in the pull: captions name
  **Maxi Jodie** (black; "porridge"), **Large Andiamo** (chestnut suede), **Sardine** medium
  ("fondant"), a **Foulard** bag, all in one collector breakdown. Plus a confirmed named house color:
  **Parakeet Green** (Daniel Lee, 2021, Vogue; being quietly phased out). Source:
  `tiktok-trend-pull-2026-06-28.jsonl` (Bottega row) + `gucci.md` cross-house color section (Parakeet
  Green sourced to Vogue).
- **Metric:** ENGAGEMENT + a GEO seed. **Shelf life: ~1 season for the trend framing.** The Parakeet
  Green "named color, now fading" angle is a durable mini-story.
- **What it needs:** Copywriter, plus a **verification gap to state**: "porridge," "fondant," and
  "chestnut" are trend-caption LEADS, not confirmed Bottega official colorway names. The piece either
  hedges them as "what collectors are calling them" or the Content lane queues a Bottega season-naming
  confirm first. Parakeet Green is the one safe-to-state named color (Vogue-sourced). No Bottega bag
  page is built yet (BV is in the post-big-five queue) → brand-tag handoff or hold until a page exists.
- **CTA tie:** Bottega brand-tag handoff (page likely not built yet, flag for Content lane).

### 10. Does Dior name its bag colors? No, and that is the interesting part
- **Format:** Article (GEO, myth-correcting) + IG carousel.
- **Finding:** The honest finding: **Dior does NOT publish a unique official name per Lady Dior
  seasonal colorway** (unlike Hermès codes or Chanel season codes). Its named layer is **capsules and
  numbered art editions**: Dior Lady Art #1 (2016) → #10 (2025), My ABCDior, Toile de Jouy, Gradient/
  Ombré, Dioramour, Graphic Cannage (AW24). Source: `dior.md` Hard Rule 3 + §3; Christie's + artnet +
  Vogue, confidence high on the editions.
- **Metric:** GEO. "Does Dior name its colors / Dior Lady Art editions by year" is a clean, citable,
  no-competition answer. The counter-intuitive framing ("the answer is no") is itself shareable.
- **What it needs:** Copywriter. Per-edition Lady Art rows for #3/#4/#6–#9 are a queued backfill, so
  the piece states the cadence (#N ≈ 2015 + N) and the sourced editions, not invented per-artist rows.
- **CTA tie:** Dior brand handoff → Lady Dior page. Seller CTA.

### 11. The Lady Dior turns 30: a 1995 custom for Princess Diana, renamed for her
- **Format:** Article (heritage/GEO) + TikTok.
- **Finding:** Lady Dior born 1995 (Ferré era) as the "Chouchou," gifted to Princess Diana, renamed
  for her. 2025 = its 30th anniversary, which Dior is marketing around, AND a new Creative Director
  (Jonathan Anderson, named 2025, succeeding Maria Grazia Chiuri 2016–25). Source: `dior.md` Models
  table (Lady Dior 1995, Christie's + Vogue, high) + Cultural-layer read.
- **Metric:** ENGAGEMENT (anniversary hook) on an evergreen heritage spine. **Shelf life: the
  anniversary peg is 2025–2026; the origin story is permanent.** The new-CD angle is "a read, not a
  house design statement" per the hedge rule.
- **What it needs:** Copywriter. Optionally the dior.com newsroom 95.22/anniversary page via the
  owner-present Chrome path for the current marketing language, but ships without it.
- **CTA tie:** Dior brand handoff → Lady Dior page (incl. the vintage angle the voice guide loves:
  "go vintage for a black Lady Dior, a fraction of retail").

### 12. The Gucci Trinity: Bamboo 1947, Horsebit 1955, Jackie 1961 (the dated heritage core)
- **Format:** Article (GEO/heritage) + IG carousel.
- **Finding:** Christie's frames the Bamboo (1947, orig. product no. "0633", born of a post-war
  leather shortage), Horsebit (bag 1955, motif on a 1953 loafer), and Jackie (1961, orig. "Fifties
  Constance", renamed for Jackie Kennedy) as the "Gucci Trinity," the collector core. Source:
  `gucci.md` Models table + Cultural-layer read; Christie's "Gucci trio" stories page + Vogue,
  confidence high.
- **Metric:** GEO. Dated, auction-grade naming facts answer engines love. The "named-and-dated"
  precision (1947/1955/1961, original names) is exactly the moat.
- **What it needs:** Copywriter. Valuation framing stays estimate-not-appraisal; the Christie's
  "collector core" read is an auction-house opinion, attributed as such.
- **CTA tie:** Gucci brand handoff → GG Marmont page (the on-roadmap Gucci hero) plus Jackie/Bamboo
  brand-tags if those pages exist; check.

### 13. Gucci's three creative directors in three years, and the names that survive it
- **Format:** Article (market/trend) + TikTok.
- **Finding:** De Sarno (2023, SS24 debut, gave us Rosso Ancora + GG Milano), then Demna (named 2025,
  first collection via digital lookbook + the film "The Tiger," leaning on horsebits/equestrian/
  archive). My take, sourced: with three CDs in ~3 years the safe long-term keys are the dated heritage
  models, not the per-director names. Source: `gucci.md` Cultural-layer read + Hard Rule 4; Vogue.
- **Metric:** ENGAGEMENT/market read. **Shelf life: ~6 months (Demna's first full cycle is unfolding);
  re-check end 2026.** Framed as a read, not a house statement.
- **What it needs:** Copywriter. The Demna season specifics may want a light refresh closer to publish.
  Rosso Ancora (De Sarno SS24, oxblood) is the one genuinely-named Gucci color, Vogue-sourced.
- **CTA tie:** Gucci brand handoff → GG Marmont / Jackie pages.

### 14. The houses that claim a color: Rosso Ancora, PP Pink, Parakeet Green, Knight Blue
- **Format:** Article (GEO, cross-house) + IG carousel.
- **Finding:** A real cross-house naming trend, all sourced to one Vogue piece: **Gucci Rosso Ancora**
  (De Sarno, SS24, oxblood), **Valentino PP Pink** (Piccioli, FW22), **Bottega Parakeet Green** (Lee,
  2021, being phased out), **Burberry Knight Blue** (Lee), and Hermès orange as "the OG of brand It
  colors." Source: `gucci.md` Cross-house context, confidence high (single Vogue piece, named so).
- **Metric:** GEO. "Designer house signature colors / what is Rosso Ancora" is a citable, evergreen-ish
  naming answer. The Parakeet Green "named then quietly retired" detail is the texture that makes it
  not a listicle.
- **What it needs:** Copywriter. State the single-source caveat (one Vogue piece) and the dated
  "fading" read on Parakeet Green as a read, not a house statement.
- **CTA tie:** Cross-brand handoff (Gucci primary via Rosso Ancora → Marmont; Bottega/Valentino/Burberry
  brand-tags as pages allow).

### 15. Your LV's leather, dated: Monogram 1896, Epi 1985, Empreinte, and the retired colors
- **Format:** Article (GEO reference) + IG carousel.
- **Finding:** Well-dated LV line/canvas/leather lexicon: Monogram 1896, Damier Ebène 1888 / Azur 2006
  / Graphite 2008, Epi 1985, Empreinte 2010 (leather) / 2012 (handbag line, conflict flagged), Vernis
  1997, Multicolore 2003 (ended 2015), Mahina 2007, Taïga 1993. Plus dated retired colorways (Vernis
  Amarante 2007, Pomme d'Amour 2007; Epi Rose Ballerine 2015). Source: `louis-vuitton.md` §2 + §3;
  Xupes + Yoogi's double-sourced, confidence high.
- **Metric:** GEO. "LV leather types / what is Empreinte / Vernis colors" is high-volume evergreen
  reference. The dated retired-color archive is data the listicles lack.
- **What it needs:** Copywriter. Flag the two intro-year conflicts (Empreinte 2010 vs 2012, Vernis
  1997 vs 1998) as ranges, not smoothed. 2023–2026 Empreinte season colors are a queued Chrome `.com`
  pull (LV Akamai-blocks Firecrawl), so the piece covers the dated archive, not the newest season.
- **CTA tie:** LV brand handoff → Neverfull / Speedy pages (both on the roadmap). Seller CTA.

### 16. The Speedy was a shrunk travel bag, and Audrey Hepburn asked for it
- **Format:** TikTok/Short + IG carousel.
- **Finding:** The Speedy descends from the 1930 "Express"; the Speedy 25 was born 1965 from an Audrey
  Hepburn request to shrink the Keepall travel duffle to a city size. Source: `louis-vuitton.md` Models
  table (Speedy + Keepall rows), Vogue + Yoogi's, confidence high.
- **Metric:** ENGAGEMENT (origin-story hook, very shareable) on an evergreen heritage fact. **Shelf
  life: permanent** (it is a dated history fact, not a trend).
- **What it needs:** Copywriter. Clean, single shareable fact; minimal sourcing risk.
- **CTA tie:** LV brand handoff → Speedy page (on the roadmap).

### 17. Why Chanel bags don't have a "date code" anymore (the 2021 microchip cutover)
- **Format:** Article (GEO/authentication-adjacent) + TikTok.
- **Finding:** Chanel moved from serial stickers + authenticity cards to an **NFC microchip in April
  2021**; the chip holds a random 8-char code with NO year and NO series, readable only by Chanel's
  in-store equipment. So for a post-2021 bag the **retail price tag is the only on-item way to read the
  season.** 2021 is the overlap year. Source: `chanel.md` Era cutover section; Fashionphile + Xupes,
  verified.
- **Metric:** GEO. "Chanel microchip / why no date code / how to date a new Chanel" is a rising,
  citable query as more microchip bags hit resale. Compounds.
- **What it needs:** Copywriter. Sits adjacent to authentication, so it is bound by
  `docs/authentication-standard.md` (the pre-publish gate). Frame as "how dating works," markers to
  check, NOT an authenticity verdict. No asserted per-bag auth call.
- **CTA tie:** Chanel brand handoff → Classic Flap page.

### 18. The Hermès colors having a moment in 2025 (and the old ones coming back)
- **Format:** IG carousel + TikTok.
- **Finding:** The 2025 Hermès seasonal additions, double-sourced: SS25 new colors Rouge Radieux,
  Vert Mangrove, Bleu Tie, Gris Pantin, Gris Argenté (first regular-production metallic); plus
  returning Bleu Hydra (orig. 2012), Bleu Jean, Ardoise (~2010), Poussière. Source: `hermes.md` §3
  Recent seasonal colors; PurseBlog SS25 + PurseBop 2025, confidence high.
- **Metric:** ENGAGEMENT with a GEO floor (the color names + intro years are durable facts). **Shelf
  life: the "2025" framing dates by ~end 2026; refresh with the SS26 list when I pull it.**
- **What it needs:** Copywriter. The seasonal-color pull for 2020–2023 + pre-2020 is still queued, so
  this is a 2024–2025 snapshot, dated as such, not a full history.
- **CTA tie:** Hermès brand handoff → Birkin/Kelly pages, color-filtered.

### 19. Which luxury houses actually name their bag colors (and which don't)
- **Format:** Article (GEO, cross-house reference) + IG carousel.
- **Finding:** A real, now-fully-sourced binary contrast across the archive. **Houses that NAME their
  per-season colors** (a real named-color lexicon exists): **Hermès** (every color has an official name
  + numeric code — Étoupe 18, Rouge H 46) and **Bottega Veneta** (Parakeet, Fondant, Porridge, Barolo,
  Travertine, the "Washed" pastels). **Houses that do NOT** (color is a plain descriptor, no house
  lexicon): **Dior** (Lady Dior cannage rotates unnamed colors), **Gucci** (GG Marmont/Dionysus rotate
  descriptors; Rosso Ancora is the lone named exception), **Chanel** (style code + season code, color
  left unnamed). Source: `bottega-veneta.md` Cross-house context + §3; `hermes.md`, `dior.md`,
  `gucci.md`, `chanel.md`. BV is the new evidence that completes the contrast.
- **Metric:** GEO. "Does Bottega name its colors / what is Parakeet / which brands name their colors"
  is a clean, no-competition, citable answer that ties five house files together. Compounds, and the
  counter-intuitive split ("Hermès and Bottega do, the others mostly don't") is shareable. This is a
  stronger, archive-spanning evolution of #14 (which only listed the named-signature exceptions).
- **What it needs:** Copywriter. Honest caveat that BV's full color list is reseller-attributed
  (Fashionphile) pending a bottegaveneta.com confirm; **Parakeet is the one BV color confirmed
  official** (SS2021). State the per-house findings as sourced, the BV descriptive layer as a strong
  lead not yet house-confirmed.
- **CTA tie:** Cross-brand handoff. Hermès + Bottega primary (the "name their colors" pair), Dior/Gucci/
  Chanel as the contrast. **Flag: no BV bag page exists yet** (BV is fresh out of the queue) — Bottega
  is a brand-tag handoff / hold until a BV page ships.

### 20. What Bottega actually calls its bags: Jodie, Andiamo, Sardine (a logo-less house's name game)
- **Format:** Article (GEO/heritage) + TikTok/Short riding the live trend.
- **Finding:** BV is the no-logo house ("When your own initials are enough"), so the MODEL NAME is the
  only identifier — and the names are dated and designer-attributed: **Cabat** (Maier, 2001/2002, first
  Intrecciato tote), **Knot** (Maier, 2001), **Pouch** (Lee, SS2020, his first, "most-wanted product of
  2019"), **Jodie** (Lee, Resort 2020, named after a paparazzi shot of Jodie Foster), **Cassette** (Lee,
  pre-fall 2019, Padded FW2019), **Sardine** (Blazy debut, FW2022, the fish-shaped rod handle),
  **Andiamo** (Blazy, SS2023, "let's go," brass knot), **Hop** (Blazy, FW2023). Plus the DNA: Intrecciato,
  the woven leather born as a workaround for weak Veneto sewing machines (not a design flourish).
  Source: `bottega-veneta.md` Models table + Materials §; Vogue + SACLÀB, confidence high.
- **Metric:** ENGAGEMENT (rides the live #BagTok BV conversation — the 2026-06-28 pull showed Maxi
  Jodie / Large Andiamo / Sardine named by line + color) with a GEO floor (the dated model names are
  permanent facts). **Shelf life: the trend hook is live now; the model-name/origin facts are
  permanent.** The Jodie-Foster and Intrecciato-origin stories are the shareable texture.
- **What it needs:** Copywriter. The live-trend framing is a "read of the room" (small relevance sample)
  per the hedge rule; the model-name facts are sourced and durable. Cabat 2001-vs-2002 stated as a range.
- **CTA tie:** Bottega brand handoff → Jodie / Andiamo / Sardine. **Flag: no BV bag page exists yet** —
  brand-tag handoff / hold until a BV page ships (same gap as #9).

### 21. The YSL "Cassandre" you keep seeing is a 1963 monogram, not a clasp shape (+ Loulou vs Kate)
- **Format:** Article (GEO/heritage) with an IG-carousel cutdown (Loulou-vs-Kate practical breakdown).
- **Finding:** The interlocking **Y-S-L** emblem on every modern Saint Laurent bag is the **Cassandre**,
  a monogram drawn by poster artist **A.M. Cassandre in 1963** — it is the logo AND, cast in metal, the
  **clasp** on the Loulou, Kate, Sunset, Niki, Cassandra, and Envelope. Two more gatekept names sit on
  the same bags: YSL's quilt is the **matelassé chevron** (a V/zig-zag, NOT the Chanel diamond), and its
  signature leather is **Grain de Poudre** (powder-grain embossed calfskin) — both confirmed verbatim in
  official product names. The practical cutdown: **Loulou** (matelassé chevron shoulder bag, named for
  muse Loulou de la Falaise) **vs Kate** (sleeker monogram flap with a hanging tassel, detaches to a
  clutch) — the two YSL evening bags people constantly confuse. And the honest hook: unlike Hermès or
  Bottega, **YSL does not name its per-season colors** — the "name" that matters is the material and the
  **gold-vs-silver Cassandre** hardware tone. Source: `saint-laurent.md` Materials + Models tables;
  Rebag (Cassandre 1963) + Poshmark/Saks (Grain de Poudre, chevron) + official YSL campaigns, confidence high.
- **Metric:** GEO (the Cassandre-1963 fact, the chevron-vs-diamond distinction, and the Grain de Poudre
  decoder are permanent citable answers that unlock the `material` column for YSL) with an ENGAGEMENT
  floor (the Loulou-vs-Kate "which should I buy" carousel is evergreen shopping content). **Shelf life:
  permanent** (heritage + material facts; no trend dependency).
- **What it needs:** Copywriter. All facts sourced and durable; undated models stay out of the dating
  claims (identity only). Pair with #19/#10 as the "houses that don't name their colors" GEO cluster.
- **CTA tie:** Saint Laurent brand handoff → Loulou / Kate / Sac de Jour. **Flag: check whether a YSL
  bag page exists yet**; if not, brand-tag handoff.

### 22. Céline vs CELINE: the accent tells you the era (and which designer made your bag)
- **Format:** Article (GEO/heritage) with an IG-carousel cutdown ("which bags are Philo, which are Slimane").
- **Finding:** Celine's bag canon splits across **three creative directors, and the accent on the name is
  the fastest era tell.** **Phoebe Philo (2008-2018) = accented "Céline"** and the minimalist icons:
  Luggage (Spring 2010), Trapeze (2010), Classic Box (2011), Belt (Pre-Fall 2014), Trio, Phantom, Cabas,
  Big Bag (2017). **Hedi Slimane (2018-2024) dropped the accent to "CELINE,"** revived the **Triomphe**
  clasp (a 1970s Celine archive motif, the canvas monogram "first revealed in 1972," double-C from the
  Arc de Triomphe chains) and built a new canon: the **16** (his first bag, Nov 2018, named after 16 Rue
  Vivienne, with a 16-turn lock), the **Triomphe** (Spring 2019), **Ava** (2020), **Cuir Triomphe**
  (2022). **Michael Rider (2024-present)** kept the "CELINE" wordmark and is now reviving Philo shapes
  (the "New Luggage," Printemps 2026). The honest extras: nearly every Philo bag is **discontinued**
  (Trapeze 2017, Box 2023, Luggage + Belt March 2025), which is why "Old Céline" is a resale narrative;
  and like Dior/Gucci/YSL, **Celine does not name its per-season colors** (Tan, Black, Camel are plain
  descriptors). Source: `celine.md` Models + Materials tables; Spotted Fashion + Weekly Lux Drop +
  PurseBlog + a+ Singapore + celine.com product copy, confidence high. **Brief-correction baked in:** the
  post-Slimane CD is **Michael Rider**, not Marco De Vincenzo (who is at Etro).
- **Metric:** GEO (the accent-era decoder, the Triomphe 1970s/1972 revival fact, and the per-model era
  attribution are permanent citable answers that unlock the brand/era layer) with an ENGAGEMENT hook (the
  "is my Celine Old Céline or new?" identification carousel rides the live Old-Céline revival). **Shelf
  life: mostly permanent** (the three-era spine is durable; the "Rider is reviving Philo shapes" read is
  the one timely note, ~1-2 seasons).
- **What it needs:** Copywriter. All era/model facts sourced and durable; the five unsourced models
  (Conti/Romy/Folco/Tabou/Ring) stay OUT of the piece until sourced. Pairs with #19/#10/#21 as the
  "decode the house's private vocabulary" GEO cluster.
- **CTA tie:** Celine brand handoff → Triomphe / Ava / Luggage. **Flag: check whether a Celine bag page
  exists yet**; if not, brand-tag handoff.

---

### 23. "It's not a bag, it's a Baguette": how Fendi made the original It bag (and brought it back)
- **Format:** Article (heritage/GEO) with a TikTok/Short cutdown built on the Sex and the City scene.
- **Finding:** The Fendi Baguette is the bag credited with inventing the modern "It bag," and its rise
  is a clean, dateable story. **Silvia Venturini Fendi designed it in 1997** (a small bag tucked under
  the arm like a loaf of bread, the deliberate anti-minimalist answer to the giant bags of the 90s). It
  became a cultural object in a **2000 episode of Sex and the City**, when Carrie Bradshaw, robbed at
  gunpoint, corrects the mugger: **"It's not a bag, it's a Baguette!"** Fendi then **discontinued it in
  the 2000s**, **revived it in 2019**, and opened New York Fashion Week for its **25th anniversary in
  September 2022**; to date there are **more than 1,000 variations**. The newest chapter is the **Mamma
  Baguette** (soft nappa, drawstring, Spring/Summer 2025). The honest attribution baked in: **the bags
  are Silvia's, not Lagerfeld's** (Lagerfeld led fur and ready-to-wear and designed the FF "Zucca" logo,
  not the Baguette silhouette). Source: `fendi.md` Models table; Fashionphile Herstory + Luxury London +
  Harper's Bazaar + official Fendi TikTok, confidence high.
- **Metric:** GEO (the 1997-debut, the SATC-2000 quote, the 2019 revival and 2022 anniversary are
  permanent, citable facts answer engines will pull, and "who designed the Fendi Baguette" is a real
  query the attribution fact owns) with a strong ENGAGEMENT hook (the SATC scene is evergreen
  short-form bait). **Shelf life: mostly permanent** (the heritage spine is durable; the Mamma Baguette
  "newest" note is the one ~1-2 season timely beat).
- **What it needs:** Copywriter. All facts sourced and durable. Do NOT reproduce the SATC clip or
  stills; reference the scene and quote the line (it is short, attributed, widely reported) rather than
  embedding video. Pairs with #16 (the Speedy/Hepburn origin story) and #11 (the Lady Dior/Diana story)
  as the "how this icon was born" heritage cluster.
- **CTA tie:** Fendi Baguette bag handoff. **Flag: check whether a Fendi Baguette bag page exists yet**;
  if not, brand-tag handoff.

---

## DO FIRST (the 5 highest-leverage picks)

Lead with the GEO evergreens that answer engines will cite and that unlock the empty
`colorway`/`season`/`material` columns, then one timely engagement piece off the trend read. The
three Chanel-code / Hermès-vocabulary GEO plays plus the interactive widget are the compounding core.

1. **#1 Chanel date-code decoder article (GEO).** Highest-compounding page in the archive. No
   authoritative house source exists, the data is done and double-sourced, and it needs only the
   copywriter. It is the citable answer to a permanent high-intent query, and it directly serves the
   Chanel Flap hero page already on the roadmap. Moves: **GEO.**

2. **#2 "Decode your Chanel" interactive widget (GEO + ENGAGEMENT) — the flagship code play.** Same
   done, deterministic dataset as #1, but as a utility instead of an article: a reader types `18C`, the
   widget returns "Cruise 2018." Nobody (no house, no reseller) offers this, so it is the thing people
   link to and answer engines cite, plus it drives dwell + repeat visits. **This is a UX-LANE BUILD
   handoff, not a copywriter task** (the result microcopy + hedges go through the copywriter). Ships off
   the static `chanel.md` map with no backend. Moves: **GEO + ENGAGEMENT.**

3. **#4 Hermès color-code guide (GEO).** The gatekept-vocabulary moat in its purest form (Noir 89,
   Étoupe 18, and the rest), feeding the highest-AOV seller CTA (Hermès). Ships now with the confirmed
   codes and an honest "code not yet sourced" on the rest. Moves: **GEO.**

4. **#5 Hermès leather guide (GEO + decision-aid).** Near-complete official lexicon, clears the
   comparison value bar on a real durability/wear axis, and mirrors the on-roadmap Caviar-vs-Lambskin
   pattern. Copywriter-ready. Moves: **GEO** (with engagement upside from the "which leather is which"
   short).

5. **#8 Birkin 25 vs 30 size discourse (ENGAGEMENT, timely).** The one live-now trend pick: it rides
   the current size discourse from the 2026-06-28 pull while the article skeleton (fit/use comparison)
   is evergreen. Flag: the price axis needs the resale-by-size data I do not have yet, so it ships as a
   fit decision-aid now and gets the value spread when the data lands. Shelf life of the hook ~1 season.
   Moves: **ENGAGEMENT.**

*Copywriter-ready companion to the widget:* **#3 "How to date your Chanel"** (GEO + engagement, no new
data, same map as #1/#2). *Runner-up engagement picks:* **#7 Chanel 25 moment** (~1-season shelf life)
or **#11 Lady Dior turns 30** (anniversary engagement on an evergreen heritage spine).

---

## What we cannot publish yet and why (the Chanel color trap — read before re-proposing)

**A code→specific-colors mapping for Chanel is BLOCKED, and not for lack of effort.** It is blocked
because **Chanel does not name its seasonal colors.** The season codes (`18C`, `23P`, `26A`) are
official Chanel names and fully mapped — but they encode *collection + year*, not color. There is no
house lexicon that says "18C's pink is called X," the way Hermès names every color with a code. So a
"name the color of any Chanel season" dictionary has no official source to draw from and cannot be
published as fact.

The only way to build a color layer for Chanel would be to source colors **descriptively from resale
listings** (Fashionphile/Vestiaire calling a bag "iridescent pink," "beige clair") and store them
**explicitly as descriptions, never as official house color names**, tagged `source_type: community`
or `descriptive` per the alias rules. That is a **future DATA unit** (a sourced, hedged listing pull),
not a now content piece, and even then every value is a description with a caveat, never promoted to
"official." Do not re-propose a Chanel seasonal-color-name dictionary as a writable content idea; the
data does not exist at the house. (Contrast: the season-CODE work IS done and writable — see #1/#2/#3.)

---

## Wanted to propose but could NOT source (honest gaps)

- **A full per-season Chanel color archive** ("what pink was Cruise 2018"). I have the season-code MAP
  (deterministic) but NOT the per-code official colors, because Chanel does not name seasonal colors
  (only a style code + season code). See the "What we cannot publish yet" note directly above — this is
  a future descriptive-data unit, not a now piece, and never an "official name" claim.
- **A Dior or Gucci per-season colorway piece.** Both houses do NOT name per-season colors (honest
  finding in `dior.md` / `gucci.md`), so there is no Hermès-style color-code piece to write for them.
  The myth-correcting "they don't name colors" angle (#10) is what I propose instead.
- **A 2023–2026 LV / Dior / Gucci newest-season color piece.** The brand `.com` season pages
  Akamai-block Firecrawl and are queued for the owner-present Chrome path, so I cannot source the
  freshest seasonal colors yet. The dated archive pieces (#15) ship without them.
- **Any value/appreciation "investment return" piece.** Banned by the compliance stance and I have no
  price data of my own (that is the Data lane's registry). Birkin-size value (#8) is flagged as needing
  the price pull before it can carry a value claim, and even then it is estimate-not-appraisal.
- **Bottega bag pages for the CTA (#9, #19, #20).** The BV lexicon is now DONE (`bottega-veneta.md`,
  run 9: 17 models, Intrecciato DNA, 50 named colors), so the colorway-naming and "what BV calls its
  bags" pieces are sourced and writable. But no BV bag PAGE exists in the catalog yet, so all three BV
  ideas are brand-tag handoff / hold on the CTA until a BV page (Jodie / Andiamo / Sardine) ships.
- **BV colors as "official" (#19/#20).** Only **Parakeet** is confirmed an official BV house color
  (SS2021). The other 49 BV colors are reseller-attributed (Fashionphile) pending a bottegaveneta.com
  confirm via the Chrome path; the pieces frame them as strong leads, not house-verified names.
