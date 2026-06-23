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

| Icon | Style # | Rows | Size variants |
|---|---|---|---|
| LV **Speedy** | 433 | 109 | 20/25/30/35/40/Nano/HL |
| LV **Alma** | 434 | 105 | BB/PM/MM/GM/Mini/Nano |
| Dior **Book Tote** (cross-brand) | 454 | 82 | Mini/Small/Medium/Large |

Adapter targets: `lv-speedy-*`, `lv-alma-*`, `dior-book-tote-*` in `trr-jsonld.ts`
(generic `modelSize()` whole-word size predicate; `rawKey` shares one capture across an
icon's sizes). **Remaining Tier-1 icon queue:** Chanel Boy, Gucci Jackie 1961, Celine
Luggage, YSL Loulou (+ go wide from there).

**Hero variants loaded** (TRR, all 12 sizes; Fashionphile on most; Vestiaire Chanel+Birkin30):
Chanel Classic Flap Medium; Hermès Birkin 25/30/35/40, Kelly 25/28/32; LV Neverfull MM/PM;
Gucci GG Marmont S/M. Chanel flap is **3-source** (232 listings). Migrations 0021–0025
applied (per-listing fidelity via `listing_ref` dedup).

⚠️ **Known data bug:** Birkin 40's rows mis-resolved (catalog has messy/duplicate Birkin
styles — see §5). Several brand catalogs are messy; the backbone (§4) is the fix.

---

## 2. Capture is browser-gated (read this before promising "overnight")

The captures run through the **owner's logged-in Chrome** (Claude-in-Chrome MCP) on
TRR/Fashionphile/Vestiaire — same-origin `fetch` defeats their bot-blocking. **This needs
the owner's Mac awake + Chrome logged in.** Risks on a long unattended run: the site
**session can expire** or **rate-limit**, and you **cannot log the owner back in**
(their credentials — off-limits). So sustained capture is **fragile** — it can stall and
not self-heal. The **catalog build (§4–5) needs no browser** (pure DB/code).

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
JSON**: `fetch('/collections/<brand>/products.json?limit=250&page=N')` returns FULL product
objects (title, body_html, variants). Filter handles for the bag. Parser reads **title +
body_html** (NOT tags — tags are junk like "Cardi B"). Recipe: `docs/research-drafts/fashionphile-capture.md`.

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

⚠️ **HUMAN-GATED — migration 0026 not yet applied.** Apply via GitHub → Actions → "Apply
database migrations" (it's on `main`), then re-run the loads to capture the discovered
layer. Until then the loader degrades gracefully (logs `42P01`, captures nothing — today's
behaviour), so nothing is broken.

**Known gap (next enhancement):** the discovered layer currently only catches *loader*-level
misses. Listings dropped at the *adapter* predicate stage (e.g. a generic "Alma" with no
size in the title, or "Book"-truncated names without a size) never reach the loader, so
they're still not captured. To truly get "every bag," add a **catch-all capture mode**
(emit every search result with a best-guess style/size → discovered_listing) alongside the
curated size-targets. **The promotion/normalization pass** (recurring discovered models →
curated styles/variants) is also still TODO.

**Catalog cleanup (separate, DESTRUCTIVE — owner-gated):** Chanel/Hermès/LV have 65–73
styles each, many verbose one-off names; this is why Birkin 40 mis-resolves. A cleanup pass
(merge/dedupe to canonical styles) is needed but involves deletes/merges — do NOT run
unattended; prepare a dry-run plan for the owner.

---

## 6. Pipeline code map

- **Pure parsers (tested):** `src/lib/ingest/{trr,fashionphile,vestiaire}.ts`, `types.ts`
  (PriceObservation + validation), `trr.ts` (multi-brand vocab). Tests in
  `src/lib/__tests__/{ingest,fashionphile,vestiaire}.test.ts` (306 total, all green).
- **Source adapters:** `supabase/ingest/sources/{trr-jsonld,trr-paste,fashionphile,vestiaire}.ts`
  — each has a `TARGETS` map (brand/style/size + requireTokens, tuned per site's naming;
  e.g. Vestiaire calls the Chanel flap "Timeless/Classique", Fashionphile "Medium Double Flap").
- **Loader/refresh:** `supabase/ingest/load-prices.ts`, `refresh-summary.ts`. npm scripts:
  `ingest:fashionphile:raw`, `ingest:vestiaire`, `load:prices`, `summary:refresh`.
- **Catalog:** `brand`/`style`/`variant` tables (12 brands, 222 styles, 321 variants —
  rich attributes; backbone adds the clean canonical spine).

---

## 7. Next steps (prioritized)

1. ~~Owner's architecture call (§5)~~ **DONE — chose B, built.** Now: **apply migration
   0026** (GitHub Action), then re-run loads to start filling `discovered_listing`.
2. ~~Apply the backbone~~ **DONE** (see §4).
3. **Per Tier-1 style:** add variant scaffolds (sizes) + capture-filter, then pull listings
   across all 3 sites *filtered to that style* (depth per icon). **Speedy is the worked
   example (§1).** Recipe per icon: (a) browser-capture the TRR search, transport via the
   `get_page_text` body trick (§3), merge+dedup to `data/ingest/_raw/<key>.json`; (b) add
   size targets to `trr-jsonld.ts` (share one capture via `rawKey`; whole-word size
   predicates so years don't collide); (c) create the size variants on the canonical
   style (loader DROPS rows for a style with zero variants — scaffolds are required, and
   real sizes are NOT "inventing"); (d) run ALL targets in ONE adapter call (it clears the
   landing dir per run); (e) `load:prices --write` then `refresh-summary` (no `--write`
   flag — its only arg is an optional variant_id). Next icons: LV Alma, Chanel Boy, Dior
   Book Tote, Gucci Jackie 1961, Celine Luggage, YSL Loulou.
4. **Catalog cleanup** (§5) — owner-gated, destructive; dry-run plan first.
5. **Enrichment:** condition-detail capture (Fashionphile collection pages render condition
   grades) → `enrich-conditions` (ANTHROPIC_API_KEY is in `.env.local`).

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
