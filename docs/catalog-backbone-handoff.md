# Catalog Backbone + Data Pull — Handoff (bootstrap a fresh chat with THIS file)

*Self-contained brief. Point a new chat here. Last updated 2026-06-23. Companion:
`docs/data-collection-handoff.md` (capture techniques in depth) +
`docs/data-sourcing-research.md` (legal posture).*

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

**~1,787 `listed` resale rows across 3 marketplaces** (per-listing colour / leather /
hardware / year / source_url), feeding the bag-page value module:

| Source | Rows | How captured |
|---|---|---|
| TheRealReal | ~1,312 | browser same-origin JSON-LD (§3) |
| Fashionphile | ~432 | collection `products.json` (§3) |
| Vestiaire | ~15 | `__NEXT_DATA__` product node (§3) |

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

**Prod total: ~2,910 listed rows** (TRR ~1,660 · Fashionphile ~1,235) as of 2026-06-23 PM.
This session added Boy/Jackie/Celine/Loulou (+~1,123 rows) across TRR + the new Fashionphile
Node path. **Vestiaire not added this session** (browser-gated, ~15 rows/search — deprioritized;
opportunistic future add).

Adapter targets: `lv-speedy-*`, `lv-alma-*`, `dior-book-tote-*`, `chanel-boy-*`,
`gucci-jackie-*`, `celine-luggage-*`, `ysl-loulou-*` in `trr-jsonld.ts` (generic
`modelSize(model, size, siblings, notTokens?)` whole-word predicate; `notTokens` excludes
adjacent sub-models like Luggage **Phantom**; `rawKey` shares one capture across an icon's
sizes). Fashionphile targets in `fashionphile.ts` gained an `excludeTokens` field (keep a
style's size buckets clean of Boy-line accessories / Loulou Puffer / Luggage Phantom / SLGs).
**Remaining Tier-1 icon queue:** finish Loulou TRR, then go wide (Hermès Constance, Chanel
19/Gabrielle/WOC, Gucci Dionysus/Horsebit, Celine Triomphe, YSL Sac de Jour/Kate, …).

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

**Why `discovered_listing` is still 0:** all curated icon loads resolve 100% (tight size
targets), so they never miss → nothing to capture. The layer fills from **wide catch-all
captures of UNCURATED models** (e.g. a broad "celine" TRR search → Triomphe/Box/etc land in
discovered for later promotion). **TODO (cheap, do next):** run one wide catch-all capture to
demonstrate the layer end-to-end.

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
  Loulou 525-528.

---

## 7. Next steps (prioritized)

1. ~~Architecture call + migration 0026 + catch-all/promotion~~ **DONE** (§5).
2. ~~Apply the backbone~~ **DONE** (§4). ~~Speedy/Alma/Book Tote~~ + ~~Boy/Jackie/Celine/Loulou~~
   **DONE** (§1, ~2,910 prod rows).
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
