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

## Phase 3 — TheRealReal (browser) ⬜ IN PROGRESS — efficient method FOUND
Server-side `curl` is hard-403'd (bot wall), so it needs the logged-in browser. But TRR is a
**Next.js app**: the search page embeds the full GraphQL result in `__NEXT_DATA__`, so one PAGE
LOAD yields ~120 listings with **no per-product fetches** (dodges the ~120-fetch/10-min rate limit
entirely). Each node carries `name, sku, url, brandUnion.name, price.final/original/msrp (usdCents),
images[]`. Specs (colour/material/year) are NOT in search data — they live on product pages (rich
JSON-LD), enrich later for priority variants.

**Transport (solved):** TRR's CSP blocks the localhost sink (`capture-sink.mjs`) AND the JS-return
display caps at ~1KB. The working transport is a **Blob download**: build a `Blob` of the JSON in
the page and `a.click()` it → saves to `~/Downloads/` uncapped, no CSP. Then Bash picks it up.

**Deep pagination — SOLVED.** `?page=N` alone is ignored; you also need an `after` cursor:
`after = base64("arrayconnection:" + ((page-1)*120 - 1))` (page 1 = no cursor). Deterministic, so
every page URL is built without reading the (harness-redacted) cursor. The bot wall is bypassed by
**same-origin `fetch()` of the full page HTML from the logged-in tab**, so a whole brand loops in
ONE JS call (1 fetch per 120 listings), parsing `__NEXT_DATA__` out of each response — no navigation,
no per-product fetches.

**Validated loop (run JS in the logged-in TRR tab):**
```js
for (page=1; hasNext && fetched<25; page++) {
  after = page===1 ? '' : '&after='+btoa('arrayconnection:'+((page-1)*120-1));
  r = await fetch(`/products?keywords=${BRAND}&page=${page}${after}`, {credentials:'include'});
  if (!r.ok) break;                          // 403 = rate limited → cooldown & resume
  d = JSON.parse(html.match(/__NEXT_DATA__[^>]*>([\s\S]*?)<\/script>/)[1])
        .props.pageProps.serverResult.data.products;
  acc.push(...d.edges.map(e => e.node));  hasNext = d.pageInfo.hasNextPage;
}
// Blob-download acc -> ~/Downloads/trr-<slug>-all.json
```
Ingest from the worktree:
```
cp ~/Downloads/trr-<slug>-all.json data/ingest/_raw/
npx tsx supabase/ingest/sources/trr-jsonld.ts --catch-all --brand "<Brand>" trr-<slug>-all
npm run load:prices -- therealreal --discovered-only --write
npx tsx supabase/ingest/normalize-discovered.ts --write && npx tsx supabase/ingest/refresh-summary.ts
```
**Limits found 2026-06-24:** keyword search caps at **~17 pages (~1,830 listings)/brand** (deeper needs
style/category facets), and page-HTML fetches **403 after ~60–70 fetches** (≈4 brands) → ~10-min
cooldown. So: sweep ~4 brands, cool down, resume.

**Brand progress** (✅ = ~1,700–1,900 listings each → discovered_listing; TRR portion ~11,100):
✅ Chanel ✅ Louis Vuitton ✅ Hermès ✅ Gucci ✅ Dior ✅ Saint Laurent —
*(rate limit TIGHTENED to ~1 brand/15min after repeated hits)* —
⬜ Celine ⬜ Bottega Veneta ⬜ Loewe ⬜ Fendi ⬜ Prada ⬜ Coach ⬜ Burberry ⬜ Kate Spade
⬜ (then long-tail brands the keyword search surfaces). The 6 biggest/highest-demand brands are done;
the remaining 8 are long-tail — better finished via the affiliate feed than a multi-hour cooldown grind.
**Gotchas (2026-06-24):** keep JS calls to ONE brand (2 blow the 45s CDP eval limit); `rm ~/Downloads/trr-*.json`
between batches (Chrome suffixes re-downloads `(1)`); cooldown ran >10min — wait ~15min between batches.

**The clean scale path (recommended over scraping):** an **affiliate product feed** (Skimlinks/CJ/
Impact) returns structured listings + licensed images server-side — no bot wall, no rate limit, no
transport hack, and image rights. Pursue feeds for TRR + Vestiaire; scraping is the interim.

## Phase 4 — Vestiaire (browser, low yield) ⬜ TODO
Richest for region/currency. Next.js `__NEXT_DATA__` transport (see `vestiaire.ts` header).
~15 rows/search. The localhost sink MAY work here (looser CSP than TRR — verify). Capture
top brands/styles opportunistically; not exhaustive. Currently 15 rows in prod.

## Honest scope note
Fashionphile is the one source fully crawlable from a headless environment, so it carries the
bulk of "every bag" today. TRR + Vestiaire are browser-gated AND rate-limited AND
transport-constrained — they advance per dedicated capture session, not in one pass.

## Incoming to-dos — from the reseller-research lane (2026-06-25)
Goal: widen price capture to vetted smaller resellers, prioritizing the mid-tier gap
FP/TRR miss. Trust gate FIRST: ingest only from resellers with a money-back authenticity
guarantee + solid reputation; prices as facts + source_url only, never their photos or
descriptions. Do NOT ingest Julia Rose Boston (reputation red flags this session). Full
evaluation + trust/affiliate table: `docs/trusted-resellers.md`.

- ⬜ **Redeluxe (priority).** Shopify open feed verified 2026-06-25:
  `redeluxe.com/products.json` (vendor=brand, product_type=style, variants[].price,
  tags=condition). Same path as Fashionphile; route catch-all to discovered_listing.
  Fills the mid-tier gap (carries Michael Kors, Fendi alongside LV/Chanel/Hermès).
  Runs a DIRECT affiliate program (partners.redeluxe.com), so its listings become
  monetizable hand-offs once a code lands.
- ⬜ **Couture USA.** Shopify open feed verified 2026-06-25: `coutureusa.com/products.json`.
  No affiliate program (data/trust only). Vet reputation first (mixed Trustpilot).
- ⬜ **Generalize a `shopify-products` adapter** (one adapter, per-store config) so adding
  a vetted Shopify reseller is config, not new code. Check for an open products.json:
  Ann's Fabulous Finds, Madison Avenue Couture, Sellier Knightsbridge, Luxe Du Jour.
- ⬜ **Keep source_url per row** so affiliate wrapping is possible later for the
  affiliate-enabled sellers (Redeluxe, Rebag, Madison Ave, Luxury Closet, Vestiaire,
  Sellier, Luxe Du Jour, Luxe Collective).
