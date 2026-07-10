# Priority-reseller capture runbook (daily for-sale + sold)

**Goal:** daily-fresh "what's for sale" and "what sold" for the prioritized resellers, at the
lowest spend that covers it. Companion to [data-collection-handoff.md](data-collection-handoff.md) §0.

## The principle (why this is cheap)

- **"Sold" is derived, not scraped.** One daily for-sale snapshot per source; when a
  `listing_ref` stops appearing, `reconcile-sold.ts` stamps `status=sold` + `delisted_on`.
  You never pay to scrape sold from the consignment resellers.
- **Route by source, don't put it all on one tool.** Free Shopify feeds where they exist,
  Firecrawl for the bot-walled sites. **Apify is NOT wired into this pipeline** and is not
  required for it (it has only ever been an ad-hoc TRR bulk tool).
- **eBay is a separate animal** (peer-to-peer marketplace, realized-sold, counterfeit-noisy),
  so it runs as its own weekly sold-sweep, not the nightly snapshot. See below.

## Nightly lanes (for-sale snapshot -> derive sold)

| Reseller | Tool | Cost | Sold via | Status |
|---|---|---|---|---|
| **Fashionphile** | Shopify `products.json` (direct) | $0 | `market-refresh.yml` (every 3h) | ✅ wired |
| **Redeluxe** ⭐ | Shopify `products.json` (direct) | $0 | daily diff + `reconcile:sold` | 🔧 build-next (adapter) |
| **Couture USA** | Shopify `products.json` (direct) | $0 | daily diff + `reconcile:sold` | 🔧 build-next (adapter) |
| **TheRealReal** | Firecrawl (`firecrawl-trr.ts`) | Firecrawl credits | daily diff + `reconcile:sold` | ✅ wired (`firecrawl-capture.yml`) |
| **Vestiaire** | Firecrawl (`vestiaire.ts` adapter) | Firecrawl credits | daily diff + `reconcile:sold` | 🔧 build-next (needs crawl feed) |
| **Rebag** | Firecrawl | Firecrawl credits | daily diff + `reconcile:sold` | 🔧 build-next (adapter) |
| **The Luxury Closet** | Firecrawl or CJ feed (affiliate live, CID 5312449) | Firecrawl credits / $0 if feed | daily diff + `reconcile:sold` | 🔧 build-next |

### Nightly sequence (exact commands, per source)

Fashionphile (free, already automated):
```
npx tsx supabase/ingest/sources/fashionphile-crawl.ts handbags
npx tsx supabase/ingest/sources/fashionphile.ts --raw
npm run load:prices -- --write
npm run reconcile:sold -- --platform=fashionphile --snapshot=data/ingest/_raw/fashionphile-live.json --write
npm run summary:refresh
```

TheRealReal (Firecrawl, already automated via `firecrawl-capture.yml`):
```
npx tsx supabase/ingest/sources/firecrawl-trr.ts <target> --limit=<N>
npm run load:prices -- therealreal --write
npm run reconcile:sold -- --platform=therealreal --snapshot=<fresh-crawl.json> --write
npm run summary:refresh
```

`reconcile:sold` safety: skips a platform if the snapshot is empty or would retire more than
`--max-retire-frac` (default 0.5) of its live rows, so a broken crawl never mass-retires a
catalogue.

## eBay weekly sold-sweep lane (separate on purpose)

eBay is your realized-*sold* source (auction finals + many sellers), but it is
counterfeit-noisy and its sold data has masking landmines, so it runs **weekly**, not daily,
and stays scoped to hero/T1.

- **Workflow:** `firecrawl-ebay.yml`, weekly cron + manual dispatch.
- **Command:** `npx tsx supabase/ingest/sources/firecrawl-ebay.ts all --sold --limit=15`
  (the `--sold` mode hits eBay's `LH_Sold=1&LH_Complete=1` filter and stamps `price_type: sold`).
- **Guardrails (built in):**
  - 🚫 **Masked best-offer dropped.** When a sold page shows "best offer accepted," the accepted
    amount is hidden and the only exposed number is the pre-offer ask, so the row is skipped
    (never loaded). Conservative: drops when unsure.
  - 📉 **Per-target price floors/ceilings** already guard counterfeit noise (e.g. Birkin
    `minPrice 6000`, Chanel `2500`); tier-1/3 floors sit at or above the $500 policy line.
  - ⚠️ **Hermès is low-trust** on eBay regardless (counterfeit density); treat as directional.
  - ⏳ **Live-capture-only for descriptions:** eBay purges ended-listing detail, so sold rows
    can't be back-enriched. Capture on cadence, don't let it lapse.

### Status: report-only until one CI run is verified

The `--sold` mode cannot be run locally (Firecrawl key is CI-only), so the **scheduled runs
write nothing** (`WRITE=false` on schedule): they capture to a landing snapshot and print row
counts + credit burn. This mirrors the repo's validate-first pilot pattern.

**To promote the lane to writing** after reviewing the first weekly report:
1. Open the Actions run, confirm the landing snapshot has clean numeric sold prices (not masked
   ranges) and sane counts.
2. Refinement to land before trusting the numbers long-term: parse the eBay **sold date** into
   `observed_on` (today it falls back to ingest date). Until then, sold rows carry the capture
   date, which is fine for a "sold in the last N days" read but not for exact sold-date history.
3. Flip the weekly schedule to write: set the workflow's schedule `WRITE` to `true`
   (or dispatch it manually with `write=true`), then it runs `load:prices -- ebay --write`.

## Cost + plan implication

- **Free** for Fashionphile + any other Shopify feed (Redeluxe, Couture USA).
- **Firecrawl** carries TRR + the build-next resellers + the eBay weekly lane. Per the measured
  budget in data-collection-handoff.md (2026-06-28), broad daily coverage fits the **~$83
  Standard** plan when we parse ourselves and detail-scrape only new listings.
- **Apify is not required** for the committed daily pipeline. Keep it only as a TRR bulk
  fallback for when Firecrawl gets captcha-walled; scope any TRR Apify run to hero/T1 +
  new-listings so it fits a raised Starter cap rather than the $199 Scale plan.

## Owner-gated unblocks (spend / secrets, not code)

- **Firecrawl plan:** confirm the plan supports the daily credit budget (Standard tier per the
  measured math). `FIRECRAWL_API_KEY` is a GH Actions secret (CI-only, not local).
- **Apify cap:** only if you keep a TRR Apify fallback; raise the Starter cap, don't jump to Scale
  on a spike (see the billing analysis). One measured TRR-only run sizes it exactly.
