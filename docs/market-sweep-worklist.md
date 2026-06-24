# Market-wide price capture — "every bag" worklist

*Started 2026-06-24. Goal: price data for every bag on the secondary luxury market,
across Fashionphile, TheRealReal, Vestiaire. Resumable — pick up at the next ⬜.*

## Architecture (integrity-first)
Adapter → landing → `load:prices` → **curated variant** (`price_history`) *or*
**`discovered_listing`** (catch-all) → `promote-discovered` rolls recurring real
models into the curated catalog → `summary:refresh`.

**Rule we locked (2026-06-24):** low-confidence catch-all rows must NOT be force-matched
onto curated variants — `pickVariant` returns the first variant even at score 0, which
would stamp a wrong price on a real bag. So catch-all loads use **`load:prices <src> --discovered-only --write`**,
which routes everything to `discovered_listing`. Clean promotion happens later via
`promote-discovered` (gated — see Phase 2 caveat).

## Phase 1 — Fashionphile (server-side, no browser) ✅ DONE 2026-06-24
FP runs on Shopify; `/collections/<slug>/products.json` answers plain Node fetch.
Throttles a burst (~25 quick pages → HTTP 503) but recovers on short backoff.

```
# 1. Crawl the site-wide bag inventory to exhaustion (polite pacing + 503 backoff)
npx tsx supabase/ingest/sources/fashionphile-crawl.ts handbags
#    (resume past an HTTP 500 wall by re-running; merges dedup-by-url into the raw dump)
# 2a. Curated -> price_history
npx tsx supabase/ingest/sources/fashionphile.ts --raw
npm run load:prices -- fashionphile --write
# 2b. Catch-all remainder -> discovered_listing (integrity-safe)
npx tsx supabase/ingest/sources/fashionphile.ts --catch-all
npm run load:prices -- fashionphile --discovered-only --write
# 3. Refresh
npm run summary:refresh
```
**Result:** raw dump 18,617 listings → 7,477 curated rows (326 variants) + 10,937 to
discovered_listing. The `handbags` crawl stopped at page 61 on an HTTP 500 (not retried) —
**⬜ re-run to grab any pages past 60**, and ⬜ crawl `all` for non-handbag categories if wanted.

## Phase 2 — Normalize + promote discovered → curated ✅ NORMALIZER BUILT (promotion owner-gated)
The model-name normalizer is built and run:
```
npm run normalize:discovered            # dry-run: conversion rate + clean clusters
npm run normalize:discovered -- --write # rewrite style_guess to canonical model
npm run promote:discovered              # review clean clusters (≥5)
```
- `src/lib/ingest/model-normalize.ts` — `canonicalModel(brand, rawName)`: curated per-brand
  model dictionary + SLG/accessory exclusion (5 unit tests). Honors "never invent" → null when
  unknown. **Extend MODELS as new recurring models surface.**
- `normalize-discovered.ts` rewrote `style_guess` → canonical model on **~2,640 rows (23%)**,
  producing **120 clean promotable clusters** (e.g. GG Marmont Mini ×122, Classic Flap Jumbo ×120,
  Fendi Baguette ×82, Multi Pochette ×56). `raw_name` keeps the original title.
- **Fixed:** `promote-discovered` `loadRows()` was capped at 1000 rows (Supabase default) — now paginates.
- ⬜ **Promotion (`promote:discovered --write`) is still the intentional owner-gated stub** — it would
  mass-create catalog styles/variants, and the catalog `style` table already has verbose junk rows.
  Next: (a) wire find-or-create + re-point, run it only for clusters mapping to a CLEAN existing
  style first; (b) raise dictionary coverage past 23% so more of the 11.5k discovered listings cluster.

## Phase 3 — TheRealReal (browser, rate-limited) ⬜ IN PROGRESS
Browser capture is **validated** (extracted 120 Chanel listings via same-origin JSON-LD).
Two hard constraints make this a dedicated multi-session grind:
- **Rate limit:** ~120 same-origin fetches → 403, ~10-min cooldown. One search page = ~120 listings.
- **Transport:** TRR's CSP blocks the localhost sink (`scripts/capture-sink.mjs`), and the
  JS-return display caps at ~1KB. Documented transport = chunked `get_page_text` body-transport
  (write ≤~6KB of JSON into `document.body` as text, read it, repeat) — slow but works.

**Per-brand loop (in Claude-in-Chrome, logged in):**
```
# 1. Open https://www.therealreal.com/products?keywords=<Brand>&page=<N>
# 2. Collect product URLs:  [...document.querySelectorAll('a[href*="/products/"]')]
#       .map(a=>a.getAttribute('href')).filter(h=>h && !h.includes('/similar/'))
# 3. same-origin fetch each (credentials:'include'), parse the JSON-LD Product block ->
#       {url,name,sku,price,currency,condition,desc}  — batch ≤18/call (CDP 45s limit), watch for 403
# 4. Transport the array to data/ingest/_raw/trr-<brand>-<page>.json (chunked body-transport)
# 5. Adapt (catch-all) + load to discovered:
npx tsx supabase/ingest/sources/trr-jsonld.ts --catch-all --brand "<Brand>" trr-<brand>-<page>
npm run load:prices -- therealreal --discovered-only --write
```
**Brand priority** (catalog depth + demand): ⬜ Chanel ⬜ Louis Vuitton ⬜ Hermès ⬜ Gucci
⬜ Dior ⬜ Saint Laurent ⬜ Prada ⬜ Bottega Veneta ⬜ Celine ⬜ Fendi ⬜ Loewe ⬜ Coach
⬜ Goyard ⬜ Balenciaga ⬜ Burberry ⬜ (then long-tail brands the keyword search surfaces).
Note: TRR keyword search includes non-bag results (footwear/SLGs) — fine, they land in discovered.

## Phase 4 — Vestiaire (browser, low yield) ⬜ TODO
Richest for region/currency. Next.js `__NEXT_DATA__` transport (see `vestiaire.ts` header).
~15 rows/search. The localhost sink MAY work here (looser CSP than TRR — verify). Capture
top brands/styles opportunistically; not exhaustive. Currently 15 rows in prod.

## Honest scope note
Fashionphile is the one source fully crawlable from a headless environment, so it carries the
bulk of "every bag" today. TRR + Vestiaire are browser-gated AND rate-limited AND
transport-constrained — they advance per dedicated capture session, not in one pass.
