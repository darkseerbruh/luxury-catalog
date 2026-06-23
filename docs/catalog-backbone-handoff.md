# Catalog Backbone + Data Pull — Handoff (bootstrap a fresh chat with THIS file)

*Self-contained brief. Point a new chat here. Last updated 2026-06-23 (25-icon TRR
higher-fidelity pass, 3 batches). Companion: `docs/data-collection-handoff.md` (capture
techniques in depth) + `docs/data-sourcing-research.md` (legal posture).*

> **🚀 Latest session (2026-06-23 — TRR higher-fidelity pass, prod 9,087 → 11,139
> listed rows (+2,052), TRR now 4,391 rows, 3 batches merged to `main`):**
> Mission #1 + the full curated-TRR tail — added a 2nd source (TheRealReal) + per-listing
> year to **25 icons** (every backbone icon with meaningful TRR inventory) via **curated
> per-size TRR targets** (the §3 browser-gated JSON-LD flow; all 25 captures clean,
> **0 rate-limit blocks** the entire session, gentle ~450ms sequential, one icon per
> ~5-min window with load/code work between as the cooldown). Every one is now **2-source**.
> - **Batch 1 (9):** Ophidia 72 · Evelyne 115 · Keepall 95 · Picotin 118 · Vanity Case 55 ·
>   Pochette Métis 115 · OnTheGo 113 · Bumbag 112 · Deauville 105. (+900)
> - **Batch 2 (5):** Blondie 82 · Capucines 102 · NéoNoé 67 · Lindy 109 · Herbag 93. (+453)
> - **Batch 3 (11 long-tail):** Diana 96 · Coussin 104 · Twist 65 · Bolide 80 · Soho Disco
>   76 · Bamboo 1947 57 · Jypsière 92 · Dauphine 26 · Petite Malle 57 · Roulis 43 ·
>   Attache 3 (TRR thin). (+699)
> - **New predicates** (all in `trr-jsonld.ts`, all whole-word \b, all with tests — 73 in
>   `trr-jsonld.test.ts`): numeric-cm mappers `evelyneSize`/`herbagSize`/`picotinSize`/
>   `keepallSize`/`lindySize`/`bolideSize`/`jypsiereSize`; Super-Mini/EW-first
>   `ophidiaSize`/`capucinesSize`/`dianaSize` (Diana **TRR "Large" = backbone Maxi**);
>   token/letter `pochetteMetisSize`/`onTheGoSize`/`bumbagSize`/`neoNoeSize`/`coussinSize`/
>   `dauphineSize`/`twistSize`/`roulisSize`/`attacheSize`/`sohoDiscoSize`(requires "disco")/
>   `bamboo1947Size`(requires "1947")/`petiteMalleStandard`; Blondie+Deauville reuse `modelSize`.
> - **⚡ Key learnings:** (1) TRR sizes **Hermès by NUMERIC cm in the NAME** (Evelyne
>   16/29/33, Picotin 18/22/26, Herbag 31/39, Lindy 26/30/34, Bolide/Jypsière numeric),
>   NOT the FP letter codes — ALWAYS inspect the live name distribution first. (2) A broad
>   model search pulls **sibling models** (NéoNoé→Noé/Neverfull, Lindy→Halzan, Bamboo→vintage
>   Bamboo Top Handle, Soho→Soho Chain, Dauphine→everything) AND **jewelry/SLGs** (Twist
>   bracelet, Roulis Slim wallet/Double Tour bracelet) — REQUIRE a distinguishing token +
>   guard SLGs/jewelry. (3) ~30-50% of modern-bag listings are **unsized** in the TRR title →
>   they DROP (or, where the bag is single-size like Soho Disco / Petite Malle, the unsized =
>   the standard). (4) **Year coverage scales with bag AGE** (Hermès/older ~65-79%, 2020s
>   LV/Gucci 0-50%) — even 0% year still adds a 2nd source of full colour/material/hardware
>   comps. (5) TRR drops accents ("Metis"/"Neonoe"/"Jypsiere") + has seller typos ("Pictoin"/
>   "Petit Malle") — match accent-insensitively, drop typos. (6) Marketplace size LABELS can
>   differ (Diana: FP "Maxi" = TRR "Large") — map them onto the same variant.
> - **Still open (all OPTIONAL polish):** deferred-ambiguous FP icons (YSL Cassandre,
>   Fendi C'mon, Chanel Reissue, Loewe — owner-gated, need NEW catalog work); non-FP brands
>   Kate Spade/Coach (need TRR/other source). **The curated-TRR pass is essentially COMPLETE**
>   — every backbone icon with meaningful TRR inventory now has a 2nd source. Further TRR
>   would be re-captures for freshness or net-new backbone styles.

> **🚀 Latest session (2026-06-23 PM) — 62 NEW icons via Fashionphile, prod 6,232 →
> 9,059 listed rows (+2,827), 0 unresolved, 8 clean merges to `main`:**
> The big browser-free "go wide" pass. Every clean unfilled backbone style with FP
> coverage is now filled (variants #611–803, +193 size buckets; styles unchanged at
> 315 — all 62 were pre-seeded backbone styles). Batches:
> - **Batch 2 (13):** Hermès Garden Party/Evelyne · Celine Belt Bag/Ava · YSL Niki/
>   Le 5 à 7 · Bottega Andiamo/Arco · Fendi First/Sunshine Shopper · Prada Galleria/
>   Re-Edition 2005 · Dior Lady D-Joy. (+671)
> - **Batch 3 (10 LV):** NéoNoé · Capucines · OnTheGo · Pochette Métis · Keepall ·
>   Coussin · Bumbag · Dauphine · Twist · Petite Malle. (+772)
> - **Batch 4 (7 Hermès):** Picotin Lock · Bolide · Lindy · Herbag · Kelly Pochette ·
>   Roulis · Jypsière. (+362)
> - **Batch 5 (6 Gucci):** Ophidia · Bamboo 1947 · Soho Disco · Diana · Attache ·
>   Blondie. (+410)
> - **Batch 6 (11):** YSL College/Icare/Lou Camera/Manhattan/Solferino · Dior Caro/
>   Bobby/Toujours · Fendi Mon Trésor/By the Way/Fendigraphy. (+237)
> - **Batch 7 (12):** Prada Cleo/Symbole/Moon/Arqué · Bottega The Pouch/Loop/Knot/
>   Sardine/Lauren 1980 · Chanel Deauville/Vanity Case/Business Affinity. (+362)
> - **Batch 8 (3 Burberry):** The Knight · Lola. (+13)
> - **⚡ Technique win:** a one-pass **OR-capture** (`_fpcapture.mjs`: crawl a brand
>   collection ONCE, merge every product matching ANY icon token) replaced N per-icon
>   crawls — far gentler on FP's rate limit (one 429 early under parallel inspection;
>   sequential single-crawl-per-brand held clean the rest of the session).
> - **Traps caught & encoded** (all in `fashionphile.ts` comments): Celine "belt" vs
>   Triomphe waist-belts (require `belt-bag`); "havana" colour ⊃ "ava"; Bottega
>   `maxi-intrecciato` is the WEAVE not a size (Arco + The Pouch); Evelyne "tpm" ⊃
>   "pm" (anchor `-pm`/`-gm`); LV Keepall numeric `-NN-` (a "25mm" strap ≠ "-25-");
>   Gucci Diana "jumbo" = GG monogram SCALE not a size; Prada Symbole = mostly
>   SUNGLASSES; Dior "diorbobby" sunglasses + "d-bobby" hat; Fendi/First nano =
>   bag-charm; Burberry "knight" is also a COLORWAY. Numeric Hermès sizes anchored
>   `-NN-` so a 7-digit product-id can't false-match.
> - **Deferred (ambiguous naming — left for a careful pass):** YSL Cassandre Envelope
>   (conflated with SLG pouches), Fendi C'mon (handle token mismatch — try "cmon"),
>   Chanel Reissue 2.55 (only verbose one-off styles, no clean canonical), Loewe
>   (NOT a brand in the catalog). **FP-empty brands:** Kate Spade + Coach (no FP
>   collection — TRR/other source only). **Note:** the brief Burberry Knight glitch
>   left 3 stale rows in `discovered_listing` (209→212) — same data now correctly
>   `listed`; harmless, clean up opportunistically.

> **Prior batch (2026-06-23 AM) — prod 5,130 → 6,260 listed rows:**
> - **Gucci curated TRR** (the deferred #1): Super-Mini-aware `dionysusSize` +
>   1955-anchored `horsebitSize` predicates (footwear/SLG guarded). Captured
>   `gucci-wide` (477 records) → Dionysus 49/57/93/45 · Horsebit 66/44/107 · Jackie +
>   Marmont refreshed. **Super Mini stayed correctly separate** (the whole point).
>   Floors lowered (Dio $350, Horsebit $450) to keep TRR's real worn low-end.
> - **7 Fashionphile next-icons** (no browser, ~701 rows): Coco Handle · Lady Dior ·
>   Saddle · Jodie · Cassette · Peekaboo · Baguette. Ambiguous-size stock
>   (Cassette/Baguette no-size, weave-vs-size traps) routed to `discovered_listing`.
> - **Coach curated TRR** (the viral thrift engine): Tabby/Pillow Tabby/Rogue/Brooklyn/
>   Willow, ~200 rows. ⚠️ **TRR limitation found:** TRR exposes Coach's model+size in
>   the JSON-LD name only for CONTEMPORARY Coach; **vintage Coach is generic-named**
>   ("Leather Shoulder Bag", model-less desc) and NOT curatable from TRR structured
>   data. Use per-MODEL searches (`coach tabby`, not generic `coach`) to surface
>   model-named listings. Variants #563–610 scaffolded.
> - **TRR rate limit held at ~799 gentle fetches, 0 blocks** this session (sequential
>   ~450ms `__fetchGentle`, localStorage accumulator across navigations + cooldowns).

> **Sync first:** `git fetch origin && git checkout main && git pull`. Read this +
> `docs/preferences.md`. Everything below is on `main` unless marked otherwise.

---

## 0. The mission (owner-set)

**Ultimate goal: every bag ever made, in the database.** Approach the owner chose —
**TOP-DOWN, not bottom-up**: build from each fashion house's **permanent collection**
(the bags made every season) first, in depth; treat seasonal bags and one-offs as
low-priority, captured opportunistically later. **Do NOT let noisy listings define the
catalog of styles.** We start with a representative sample of every *permanent* bag
currently for sale, then deepen (colours/leathers/eras) and broaden (more styles) over time.

---

## 1. What's live right now (prod Supabase)

⚠️ *The 1,787 figure below is a HISTORICAL snapshot — current prod is **9,059 listed**
(see the top banner + the "Prod total" line further down). The per-source split is kept only to
show the capture method per marketplace.* Each row carries per-listing colour / leather /
hardware / year / source_url and feeds the bag-page value module:

| Source | How captured |
|---|---|
| TheRealReal | browser same-origin JSON-LD (§3) — now the bulk of rows |
| Fashionphile | collection `products.json`, server-side Node, no browser (§3) |
| Vestiaire | `__NEXT_DATA__` product node (§3) — deprioritized, ~15 rows only |

**Top-down icons done (2026-06-23)** — each resolves to the *clean* canonical backbone
style (the matcher scores an exact style name 100 vs ~56 for verbose one-offs, so the
backbone target wins; the messy duplicates are bypassed, not used):

| Icon | Style # | Rows | Sources | Size variants |
|---|---|---|---|---|
| LV **Speedy** | 433 | 109 | TRR | 20/25/30/35/40/Nano/HL |
| LV **Alma** | 434 | 105 | TRR | BB/PM/MM/GM/Mini/Nano |
| Dior **Book Tote** (cross-brand) | 454 | 82 | TRR | Mini/Small/Medium/Large |
| Chanel **Boy** | 424 | 599 | TRR+FP | Mini/Small/Medium/Large |
| Gucci **Jackie 1961** | 446 | 177 | TRR+FP | Mini/Small/Medium/Large |
| Celine **Luggage** (canon `Luggage Tote`) | 484 | 185 | TRR+FP | Nano/Micro/Mini/Medium |
| YSL **Loulou** | 460 | 190 | TRR+FP | Toy/Small/Medium/Large |

**Prod total: 11,139 listed rows + 212 `discovered_listing`** as of 2026-06-23 (the
25-icon TRR higher-fidelity pass added +2,052 second-source/year rows across 3 batches —
see the top banner; TheRealReal is now 4,391 rows). **315 styles / 629 variants** (no new
styles or variants — the TRR pass added price rows to existing per-size variants). Before
this the 62-icon Fashionphile go-wide reached 9,059; earlier the same day ~6,260, ~5,102.
The earlier session reached ~2,910; the **WIDE BATCH** session then added **+~2,192 listed**:

- **10 new Tier-1 icons via Fashionphile** (no browser, ~1,065 rows): **Hermès Constance**
  (18/24) · **Chanel 19** (S/M/L/Maxi) · **Chanel Gabrielle** (S/M/L) · **Chanel Wallet on
  Chain** (WOC) · **Gucci Dionysus** (Super Mini/Mini/S/M) · **Gucci Horsebit 1955**
  (Mini/S/Shoulder) · **Celine Triomphe** (Nano/Mini/S/M/Teen) · **Celine Classic Box**
  (S/M/Teen) · **YSL Sac de Jour** (Nano/Baby/S/M/L) · **YSL Kate** (S/M/L). Variants 529–561.
- **Fashionphile backfill on the 4 TRR-only styles** (~851 rows): **Book Tote** (slug
  `christian-dior`), **Speedy** (size anchored `-NN-` to catch Bandoulière), **Alma**,
  **Kelly** (fixed: handle is `kelly-sellier-NN`, the old `kelly-28` token matched 0 — that
  was why Kelly was FP-empty; scaffolded Kelly 35 #562).
- **TRR brand-wide catch-all × 4 brands** (Celine, Hermès, Saint Laurent, Chanel — 4 gentle
  120-fetch windows, **480 fetches, 0 blocks** — the rate limit did NOT bite tonight). Each
  resolves that brand's curated icons to their variants (adding **year data**, TRR's edge over
  FP's 0%) and routes uncurated models → `discovered_listing`. Net: Constance/Triomphe/Box/Sac
  de Jour/Kate/WOC gained TRR + year; the heroes (Classic Flap +119, Boy +113, Luggage, Loulou
  +, Birkin/Kelly) were refreshed; `discovered_listing` grew 0 → 209 (Celine 74 · Hermès 35 ·
  YSL 97 · Chanel 3). **Gucci was SKIPPED** on purpose: catch-all `detectSizeLabel` would
  mislabel **Super Mini Dionysus → Mini** and pollute the clean FP split — Gucci TRR needs a
  curated, Super-Mini-aware target (next session). Catch-all rows are `confidence:"low"`,
  size best-effort; the high-confidence per-size truth is the FP load.
- **Matcher fix** (`scoreVariantMatch`): added an exact-size-match bonus so a row sized
  "Mini" can no longer tie onto a SUPERSET size like "Super Mini" and win on insertion order
  (it was mis-routing all Dionysus Mini rows). Regression test added.

**Vestiaire still not added** (browser-gated, ~15 rows/search — deprioritized).

Adapter targets: `lv-speedy-*`, `lv-alma-*`, `dior-book-tote-*`, `chanel-boy-*`,
`gucci-jackie-*`, `celine-luggage-*`, `ysl-loulou-*` in `trr-jsonld.ts` (generic
`modelSize(model, size, siblings, notTokens?)` whole-word predicate; `notTokens` excludes
adjacent sub-models like Luggage **Phantom**; `rawKey` shares one capture across an icon's
sizes). Fashionphile targets in `fashionphile.ts` gained an `excludeTokens` field (keep a
style's size buckets clean of Boy-line accessories / Loulou Puffer / Luggage Phantom / SLGs).
The wide batch added Fashionphile `TARGETS` for all 10 new icons + the 4 backfills (validated
against the live collection JSON; `requireTokens` anchor the size, `excludeTokens` drop SLGs/
sub-models). **TRR `TARGETS` for the new icons are NOT yet written** — Celine TRR came via
catch-all; the other brands' TRR is the main remaining work (rate-limited, see §2).
**Remaining Tier-1 work:** curated TRR for Constance / Dionysus / Horsebit / 19 / Gabrielle /
WOC / Sac de Jour / Kate (year + 2nd source); then next icons (Coco Handle, Bottega
Cassette/Jodie, Fendi Baguette/Peekaboo, Coach full depth).

⚠️ **Celine near-duplicate style** — `#207 "Luggage"` (pre-existing) vs `#484 "Luggage Tote"`
(backbone). Loaded onto the backbone canonical **#484**; queue an owner-gated merge of #207→#484
in the catalog-cleanup pass.

**Hero variants loaded** (TRR, all 12 sizes; Fashionphile on most; Vestiaire Chanel+Birkin30):
Chanel Classic Flap Medium; Hermès Birkin 25/30/35/40, Kelly 25/28/32; LV Neverfull MM/PM;
Gucci GG Marmont S/M. Chanel flap is **3-source** (232 listings). Migrations 0021–0025
applied (per-listing fidelity via `listing_ref` dedup).

⚠️ **Known data bug:** Birkin 40's rows mis-resolved (catalog has messy/duplicate Birkin
styles — see §5). Several brand catalogs are messy; the backbone (§4) is the fix.

---

## 2. Capture is browser-gated (read this before promising "overnight")

Only **TheRealReal and Vestiaire** still need the **owner's logged-in Chrome** (Claude-in-Chrome
MCP) — same-origin `fetch` defeats their bot-blocking. (**Fashionphile no longer needs the
browser** — see §3.) **This needs the owner's Mac awake + Chrome logged in.** Risks: the site
**session can expire** or **rate-limit**, and you **cannot log the owner back in** (off-limits).

**⚠️ TRR rate-limit pattern (learned 2026-06-23):** TheRealReal (PerimeterX) tolerates roughly
**~120 same-origin product fetches per window**, then returns **403 "Access to this page has
been denied"** on the fetch endpoint (the search *results* page still renders + you stay logged
in — it is a rate-limit, NOT a logout, so don't stop). Two rules that worked:
1. **Fetch GENTLY** — sequential, ~450ms apart (`__fetchGentle`), NOT `Promise.all` bursts of 15
   (the bursts are what trip PX). The async loop keeps running in-page past the JS-tool's 45s
   CDP timeout — fire it once, then poll `window.__data` until `done===total`.
2. **One icon (~120 fetches) per window, then COOL DOWN ~8–12 min** before the next icon. Probe a
   single fetch (expect `status:200`, `ld≥1`) before resuming; if still 403, wait longer.
   Hammering while blocked extends the block.

So sustained TRR capture is **fragile + slow** (one icon per ~10 min). The **catalog build (§4–5)
and Fashionphile capture need no browser** (pure DB/code/Node).

---

## 3. Proven capture techniques (the unlocks)

**TheRealReal** — open `https://www.therealreal.com/products?keywords=<bag>`, then in the
page: collect `/products/` links (dedupe by trailing slug), `fetch(url,{credentials:'include'})`
each, parse JSON-LD `Product` → `{name, price, currency, desc}`. `desc` is `\n`-separated
facts ("From the 2011-2012 Collection.\nBlack Caviar Leather.\nGold-Tone Hardware…").
Chunk ≤20–25 fetches/call (tool times out ~45s). Parse with the **canonical**
`src/lib/ingest/trr.ts` `parseTrrDescription` (multi-brand vocab: Hermès leathers, French
colours, `-Plated` hw). Adapter: `supabase/ingest/sources/trr-jsonld.ts <targetKey>`.

**Fashionphile** — Shopify. The on-site search is useless; the unlock is the **collection
JSON**: `/collections/<brand>/products.json?limit=250&page=N` returns FULL product objects
(title, body_html, variants). Filter handles for the bag. Parser reads **title + body_html**
(NOT tags — tags are junk like "Cardi B"). Recipe: `docs/research-drafts/fashionphile-capture.md`.

**⚡ Fashionphile needs NO browser (verified 2026-06-23).** The collection `products.json` is
CDN-served and answers a plain **server-side Node fetch** (200 + full JSON) — only the on-site
*search* is bot-blocked. So Fashionphile capture is now a committed CLI, not a browser dance:
`npx tsx supabase/ingest/sources/fashionphile-collection.ts <brand-slug> [token ...]` pages the
brand collection, filters by token, and MERGES (dedup by url) into `data/ingest/_raw/fashionphile.json`;
then `fashionphile.ts --raw` maps → landing. This is reliable + parallelizable (no Chrome, no
rate-limit). Brand slugs: `chanel gucci celine saint-laurent louis-vuitton hermes dior`.

**Vestiaire** — Next.js. Search `https://www.vestiairecollective.com/search/?q=<bag>` →
collect `*.shtml` product URLs → `fetch` each → parse `<script id="__NEXT_DATA__">` →
`props.pageProps.product`. Node shape: `color.name`, `material.name`,
`condition.description` (OBJECT not string), `price.cents`, `model.name` (carries size).
Recipe: `docs/research-drafts/vestiaire-capture.md`. Yields only ~15/search (no easy pagination).

**TRANSPORT (updated 2026-06-23):** the **Blob download is the preferred path** — it
worked repeatedly this session for TRR (Speedy via body-transport, but Alma + Book Tote
via `a.download` Blob → landed in `~/Downloads/<name>.json`, read directly with Node, zero
hand-transcription). Trigger it in-page (`const a=document.createElement('a'); a.href=
URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})); a.download
='x.json'; a.click()`), then `cp ~/Downloads/x.json data/ingest/_raw/<key>.json`. If a site
ever blocks downloads, **fallback** = write the data into the page body
(`document.body.innerHTML='<article>'+text+'</article>'`) and read it whole with
`get_page_text` (no truncation, unlike the JS tool's ~1.8KB return cap; split >50KB into
halves). The localhost sink (`scripts/capture-sink.mjs`) is a third option but TRR's CSP
blocks it. The `data:` URL navigation trick is blocked — don't bother.

**Parallel fetch (fast):** fetch product pages in `Promise.all` batches of ~10–12; the JS
tool returns `{}` for the async but the loop keeps filling `window.__data` — re-call the
idempotent fetcher (skips already-captured URLs) until `collected === total`.

**Pipeline:** raw → `data/ingest/_raw/<key>.json` (gitignored) → adapter writes landing
`data/ingest/<source>/*.json` → `npm run load:prices -- <source> --write` (resolves
brand→style→variant via `src/lib/image-import-core.ts`; idempotent on the listing_ref
dedup index) → `npm run summary:refresh`. **PostgREST caps un-paginated selects at 1000
rows** — always use `{count:'exact',head:true}` for tallies (a "data dropped to 1000" scare
was this, not real loss).

---

## 4. The catalog backbone (APPROVED by owner 2026-06-23)

The top-down spine. **Data:** `supabase/seed/research/catalog-backbone.json` — 11 brands ×
tier-1 (perennial icons, build first) + tier-2 (permanent, secondary). Owner decisions:
**Celine Luggage stays Tier 1; Coach gets full depth.** ~70 Tier-1 styles total.

**Seed script:** `supabase/seed/seed-catalog-backbone.ts` (idempotent, dry-run default,
`--write` to persist). Find-or-creates clean canonical `style` rows + the missing
**Saint Laurent** brand; skips styles that already exist (exact-normalized match — verbose
per-item seed styles like "…Birkin 30 Bag" do NOT block the canonical "Birkin").

**APPLIED 2026-06-23.** Ran `--write`: created the **Saint Laurent** brand (tier `mid`,
France) + **93 canonical styles**. Catalog now **13 brands / 315 styles**. (One fix along
the way: the seed omitted the NOT-NULL `brand.tier` enum — now set to `mid` for new
backbone brands. Re-runs are idempotent: 0 to create.)

---

## 5. Architecture decision — RESOLVED: model B, BUILT (2026-06-23)

Owner chose **B (two-tier)**. **Built + merged to `main`:** migration
`0026_discovered_listings.sql` (a raw `discovered_listing` table) + the loader now writes
any listing it can't place on a curated variant (no brand/style/variant match) into that
table instead of dropping it — full parsed spec + partial match + raw title preserved for
a later promotion pass. The curated catalog stays clean.

✅ **Migration 0026 APPLIED 2026-06-23** (GitHub Action, run succeeded). `discovered_listing`
is live (0 rows so far — see below). The loader routes any unplaceable listing there with its
full parsed spec + partial match + raw title.

✅ **Catch-all capture mode + promotion pass BUILT & merged 2026-06-23** (closes the gap below):
- **Catch-all mode:** `tsx trr-jsonld.ts --catch-all --brand "<Brand>" [--style-guess "<style>"]
  <rawKey>` emits EVERY captured record (best-guess style/size via `detectSizeLabel`) so the
  loader places what it can on curated variants and routes the rest to `discovered_listing` —
  nothing dropped. The curated per-size targets are unchanged.
- **Promotion pass:** `npm run promote:discovered [--min=N] [--write]` clusters discovered rows
  by (brand_guess, style_guess, size_label), flags recurring models ≥ N as promotable, prints
  the find-or-create→re-point plan. DRY-RUN default; `--write` is a guarded stub (owner-gated —
  wire the upserts when approving a batch).

**✅ `discovered_listing` DEMONSTRATED end-to-end (2026-06-23 wide batch).** A wide
catch-all TRR capture (`trr-jsonld.ts --catch-all --brand "Celine" celine-wide`, 120 gentle
fetches, 0 blocks) routed **46 → curated** Triomphe/Box/Luggage variants and **74 →
`discovered_listing`** (34 `no_style` + 40 `no_variant`) — real uncurated Celine models
(Celine 16, Cabas Phantom, Trio, Trapeze, Trotteur, Belt Bag) with full spec preserved
(colour 100%, year 36%). `promote:discovered` clusters them (74 → 64 clusters; 0 promotable
at the default ≥5, as a single wide search is thin per-model — at `--min=2` it prints the
find-or-create→re-point plan for the recurring ones). The promotion `--write` stays an
**owner-gated stub**. The layer now grows with every brand-wide catch-all capture.

**Catalog cleanup (separate, DESTRUCTIVE — owner-gated):** Chanel/Hermès/LV have 65–73
styles each, many verbose one-off names; this is why Birkin 40 mis-resolves. A cleanup pass
(merge/dedupe to canonical styles) is needed but involves deletes/merges — do NOT run
unattended; prepare a dry-run plan for the owner.

---

## 6. Pipeline code map

- **Pure parsers (tested):** `src/lib/ingest/{trr,fashionphile,vestiaire}.ts`, `types.ts`
  (PriceObservation + validation), `trr.ts` (multi-brand vocab). Tests across
  `src/lib/__tests__/*` (**329 total, all green** — incl. `trr-jsonld.test.ts` catch-all +
  `promote-discovered.test.ts`).
- **Source adapters:** `supabase/ingest/sources/{trr-jsonld,trr-paste,fashionphile,vestiaire}.ts`
  — each has a `TARGETS` map. TRR `modelSize(model,size,siblings,notTokens)` (whole-word +
  sub-model exclusion); Fashionphile `requireTokens` + `excludeTokens`.
- **NEW capture/build tooling (2026-06-23):**
  - `supabase/ingest/sources/fashionphile-collection.ts` — server-side Fashionphile fetcher (NO browser).
  - `supabase/seed/scaffold-variants.ts` — find-or-create bare size variants on a canonical style.
  - `supabase/ingest/promote-discovered.ts` (`npm run promote:discovered`) — §5 promotion pass.
  - `trr-jsonld.ts --catch-all` — §5 catch-all capture mode.
- **Loader/refresh:** `supabase/ingest/load-prices.ts` (routes misses → `discovered_listing`),
  `refresh-summary.ts`. npm: `ingest:fashionphile:raw`, `ingest:vestiaire`, `load:prices`,
  `summary:refresh`, `promote:discovered`.
- **Catalog:** `brand`/`style`/`variant` tables (**13 brands / 315 styles**; backbone spine +
  per-icon size variants). Icon variant_ids: Boy 513-516, Jackie 517-520, Luggage Tote 521-524,
  Loulou 525-528. **Wide batch (529-562):** Constance 529-530 · Gabrielle 531-533 · WOC 534 ·
  Dionysus 535-538 · Horsebit 1955 539-541 · Triomphe 542-546 · Classic Box 547-549 · Sac de
  Jour 550-554 · Kate 555-557 · Chanel 19 558-561 · Kelly 35 562. **This batch (563-610):**
Coco Handle 563-567 · Lady Dior 568-573 · Saddle 574-575 · Jodie 576-578 · Cassette 579-581 ·
Peekaboo 582-588 · Baguette 589-593 · Coach Tabby 594-597 · Pillow Tabby 598-600 ·
Rogue 601-605 · Brooklyn 606-608 · Willow 609-610.

---

## 7. Next steps (prioritized)

1. ~~Architecture call + migration 0026 + catch-all/promotion~~ **DONE** (§5).
2. ~~Apply the backbone~~ **DONE** (§4). ~~Speedy/Alma/Book Tote~~ + ~~Boy/Jackie/Celine/Loulou~~
   **DONE**. ~~10 new icons + 4 FP backfills via Fashionphile~~ **DONE** (§1, ~4,896 prod rows).
   ~~Demonstrate `discovered_listing`~~ **DONE** (§5). ~~Celine #207→#484 merge plan~~ **DONE**
   (`docs/celine-luggage-merge-plan.md`, owner-gated).
2b. ~~TRR brand-wide catch-all for Celine / Hermès / Saint Laurent / Chanel~~ **DONE** (§1; 480
    fetches, 0 blocks, +TRR year on the new icons, discovered → 209).
2c. ~~**Gucci curated TRR** (Super-Mini-aware Dionysus + Horsebit)~~ **DONE** this session.
2d. ~~**Coach full depth**~~ **DONE** this session (curated per-model; see the TRR Coach
    limitation in the top banner — vintage Coach is generic-named & not curatable from TRR).
    **Remaining TRR (still open, all OPTIONAL polish):**
    - **Higher-fidelity re-do of the 4 catch-all brands' new icons:** Constance/19/Gabrielle/
      WOC/Sac de Jour/Kate currently have *catch-all* (low-confidence) TRR. Curated TRR targets
      would add per-size precision + year. FP per-size data is already high-confidence → polish.
    - **More Coach models** (Field, Bandit, Swagger, vintage Willis/Rambler/Station): Field/Bandit
      are thin on TRR; vintage models are model-LESS in TRR JSON-LD (see banner) → would need a
      non-TRR source. Tabby/Rogue/Brooklyn (the hyped modern ones) are the high-value ones, done.
    - **Coco Handle / Lady Dior / Saddle / Jodie / Cassette / Peekaboo / Baguette** have FP only
      (high-confidence per-size); a TRR pass would add year + 2nd source (polish).
3. **Go wide — next icons (the proven per-icon recipe, now faster):**
   - **(a) Fashionphile FIRST (no browser, fast):** `tsx supabase/ingest/sources/fashionphile-collection.ts
     <brand-slug> <token>` → `tsx supabase/ingest/sources/fashionphile.ts --raw`.
   - **(b) Scaffold variants:** `tsx supabase/seed/scaffold-variants.ts "<Brand>" "<Style>" <sizes…> --write`
     (loader DROPS rows for a style with zero variants — real sizes are facts, not "inventing").
   - **(c) Add targets:** Fashionphile `TARGETS` (`requireTokens` + `excludeTokens` for sub-models/SLGs);
     TRR `trr-jsonld.ts` `TARGETS` (`modelSize(model,size,siblings,notTokens)`, share one capture via `rawKey`).
   - **(d) TRR capture (browser, GENTLE — see §2 rate-limit playbook):** one icon (~120 fetches) per
     ~10-min window; `__fetchGentle` sequential; Blob-download to `~/Downloads` → `cp` to `data/ingest/_raw/<key>.json`.
   - **(e)** `load:prices <source> --write` → `summary:refresh`. Gate `tsc/eslint/next build/npm test`, branch-per-icon, merge to main.
   - **Queue:** Hermès Constance · Chanel 19 / Gabrielle / WOC / Coco Handle · Gucci Dionysus / Horsebit 1955 ·
     Celine Triomphe / Box · YSL Sac de Jour / Kate / Niki · Bottega Cassette/Jodie · Fendi Baguette/Peekaboo · Coach (full depth).
4. **Demonstrate `discovered_listing`:** one wide catch-all TRR capture (§5) → promotion-pass dry-run.
5. **Vestiaire (deprioritized):** browser-gated + ~15 rows/search; add opportunistically, not as a blocker.
6. **Catalog cleanup** (owner-gated, DESTRUCTIVE; dry-run plan first): merge Celine **#207 "Luggage" → #484
   "Luggage Tote"**; dedupe verbose Chanel/Hermès/LV one-off styles (Birkin 40 mis-resolve).
7. **Enrichment:** condition-detail capture (Fashionphile renders grades) → `enrich-conditions` (ANTHROPIC_API_KEY in `.env.local`).

---

## 8. Gotchas & rules

- **Browser captures need owner's awake Mac + logged-in Chrome; sessions expire; never re-login.**
- **Download origin-block** → use the `get_page_text` body-transport (§3).
- **PostgREST 1000-row default** → use exact-count for tallies.
- **Migrations are human-gated** via GitHub → Actions → "Apply database migrations", and must
  be MERGED TO `main` BEFORE running the Action (it applies what's on main).
- **`main` deploys live (Vercel).** Do prod-affecting/code work on a branch; merge is the
  owner's deploy gate. Don't auto-merge.
- **Never delete/overwrite unattended.** Additive + idempotent only.
- **`.env.local`** has `ANTHROPIC_API_KEY` (rotate — it was pasted in chat) + service role.
- **One workstream per chat / its own worktree** — parallel chats share one tree and collide.
