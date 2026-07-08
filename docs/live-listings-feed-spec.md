# The Luxury Closet live listings — build + status

**Goal:** real in-stock TLC listings (photo + live price + tracked buy link) on bag pages via the CJ affiliate feed. "Learn here, buy there." Strongest lever on the buyer-affiliate stream. Outreach/terms: [affiliate-outreach-log.md](affiliate-outreach-log.md).

## Status (2026-07-08) — LIVE + EARNING (complete)
- ✅ **Feed → API → match → `price_history`: WORKING + LIVE.** A daily GitHub Action pulls TLC's catalog, matches bags, and loads them. Last run: **213,619 products fetched → 15,969 recognised bags → 15,876 matched to variants → ~5,342 distinct live listings** in `price_history`. Verified all hosts = `theluxurycloset.com`.
- ✅ **Drives real data on bag pages.** e.g. the Bottega Cassette page went from a bare stub to a **+206% resale trend ($420→$1,286, 115 sales)** with TLC asking prices dated today.
- ✅ **Attribution built + verified** (see §Attribution).
- ✅ **DONE:** the "For sale right now" rail renders TLC listings with **CJ-tracked buy links** (verified live: a wrapped link on www redirects to the product with `cjevent`). Two fixes got it there: (1) production was pinned to an old build — promoted via `vercel --prod`; (2) `getListingsForVariant` hit the **PostgREST 1000-row cap** once TLC pushed hot styles past 1000 price rows, so the target variant's offers were truncated — now fetched variant-scoped. ~80 tracked buy links/page.

## Transport — SFTP is DEAD, the CJ GraphQL API is the transport
- ❌ **CJ SFTP (datatransfer.cj.com) is unusable:** the server offers ONLY `ssh-dss` host keys (verified from its KEXINIT). DSA is removed from OpenSSH 10.x and Node `ssh2`, so no modern client can connect. Do not retry SFTP.
- ❌ **CJ HTTP** emails a fresh per-delivery URL (no stable pull endpoint).
- ✅ **CJ Product Feed GraphQL API** (`https://ads.api.cj.com/query`, `Authorization: Bearer <token>`). Adapter: `supabase/ingest/sources/tlc.ts` → `fetchApiRows()`.
  - Query: `products(companyId: $cid, partnerIds: $partner, currency: "USD", limit, page)`. **`partnerIds` is `[ID!]` and REQUIRED** — without it the query returns CJ's ENTIRE 266M-product network and mislabels everything as TLC. Scope to advertiser **5312449**.
  - `resultList` is the `Product` interface; select shopping fields via `... on Shopping { id title brand availability condition color material link imageLink price{amount currency} salePrice{amount currency} }`.
  - Paginate via `nextPage`. CID (publisher company id) = **7997608** (non-secret).
  - API `link` = the RAW `theluxurycloset.com` product URL (not pre-tracked) → must be deep-linked for attribution.

## Attribution — CJ deep link (verified working)
- API returns raw product URLs, so `affiliate.ts` wraps them: `cjDeepLink(url)` = `https://www.anrdoezrs.net/links/101810137/type/dlg/<url>` (our CJ website id/PID **101810137**, non-secret).
- **Verified empirically:** that deep link 302-redirects to the product page with a `cjevent` param + `utm_source=cj`. `affiliateListingUrl()` now wraps any raw `theluxurycloset.com` URL and never double-wraps an already-CJ-tracked link. Tests in `affiliate.test.ts`.

## Automation
- `.github/workflows/ingest-tlc.yml` — daily (`23 8 * * *`) + on-demand. Runs `ingest:tlc` (API) → `load:prices -- tlc --write` → `summary:refresh`.
- **Secrets (GitHub Actions):** `CJ_API_TOKEN` (the working one), Supabase service role (pre-existing). The old `CJ_FEED_HOST/USER/PASS` (SFTP) are now unused.

## Known follow-ups
- **Verify buy-card render + wrapped link on prod** after the deploy lands (the one 🟡 above).
- **Reconcile sold TLC listings:** `load:prices` appends; a sold TLC bag lingers until retired. Mirror `reconcile-sold`/`market-refresh` for TLC so dead links drop. (Pre-launch, low urgency.)
- **Fix the local `.env.local` anon key** (truncated) so `getListingsForVariant` can be tested locally.
- **Breadth:** `canonicalModel` (~68 models) bounds matches; extend `MODELS` in `model-normalize.ts` for more coverage.
