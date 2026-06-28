# Seasonal Naming Archive — the archivist's standing assignment

*Owner: the `archivist` agent. Created 2026-06-28. This is the resumable queue for the
30-year, house-by-house, season-by-season reconstruction of what each house called its
**bags, materials, and colors**. Read this first; write progress back here on every run.*

Companion docs: `docs/brand-naming-research.md` (the naming regimes), `docs/data-collection-handoff.md`
§0b (the price/reseller registry — do not redo it here), `docs/data-analysis-standard.md` (rigor bar).

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

## Progress checkpoint (update every run — this is how a cold session resumes)

Per the autonomous-run protocol in the ENFORCED block: work one house/decade unit at a
time, commit after each, never stop to ask. Stops allowed only at: queue empty, hard
technical block, or an outward-facing op. Checkpoint here, do not summarize-and-halt.

| House | Models done | Materials done | Colors: decades covered | Last touched | Next unit |
|---|---|---|---|---|---|
| Hermès | ⬜ | ⬜ | ⬜ none | — | leathers + permanent colors first |
| Chanel | ⬜ | ⬜ | ⬜ none | — | build season-code map (18C…) |
| Louis Vuitton | ⬜ | ⬜ | ⬜ none | — | Monogram + Empreinte colorways |
| Dior | ⬜ | ⬜ | ⬜ none | — | Lady Dior cannage colors by season |
| Gucci | ⬜ | ⬜ | ⬜ none | — | GG Marmont + Dionysus colorways |
| Bottega / YSL / Celine / Fendi / Prada / Loewe | ⬜ | ⬜ | ⬜ none | — | queued after the big five |

---

## Early tasks (the first runs, in order)

1. **Map the community beat** — verify and expand the chatter source list above into a dated
   registry (which forum/thread/account is authoritative for which house). One pass, write it
   into this doc. Cheap, high-leverage, and it seeds every later lead.
2. **Decode the Chanel season-code system** — produce the full `season-code → season/year` map
   (17B, 18C, 23S…) back ~30 years. Deterministic and reusable; unblocks all Chanel seasonal
   color work.
3. **Hermès lexicon first** — leathers (permanent set) + the permanent color core, then the
   seasonal color rotations year by year. Hermès has the most official, stable naming, so it
   is the highest-confidence place to prove the format end to end.
4. **Lookbook + runway sweep, big five** — walk Vogue Runway and each house's newsroom season
   by season, pulling debut/reissue/retire seasons for each model and the named seasonal colors.
5. **Backfill the rest** — Bottega, YSL, Celine, Fendi, Prada, Loewe.

## Recommendation to flag to the owner (do not build unsolicited)

Once the lexicon has real volume, a dedicated `color_lexicon` / `season_lexicon` reference
table (keyed by brand + season + official name, with the alias layers) would let bag pages and
JSON-LD resolve nickname/color queries automatically. That is an owner-gated migration. Surface
it as a decision with the GEO upside; do not add the migration yourself.
