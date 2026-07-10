# Priority-reseller capture runbook (daily for-sale + sold)

**Goal:** daily-fresh "what's for sale" and "what sold" for the prioritized resellers, at the
lowest spend that covers it. Companion to [data-collection-handoff.md](data-collection-handoff.md) §0.

> Reconciled 2026-07-10: TheRealReal + eBay-sold capture run on **committed cloud-Apify
> actors** (not Firecrawl). Apify is a real part of this pipeline, on **paid Starter**. An
> earlier draft of this doc called Apify "not wired"; that was stale. See the capture TL;DR in
> `docs/handoff.md`.

## The principle (why this stays cheap)

- **"Sold" from consignment resellers is derived, not scraped.** One daily for-sale snapshot
  per source; when a `listing_ref` stops appearing, `reconcile-sold.ts` stamps `status=sold`
  + `delisted_on`. No extra scrape for sold on those sources.
- **Route by source.** Free Shopify feeds where they exist; Apify cloud actors for the
  bot-walled / session-dropping sites (TheRealReal) and for eBay realized-sold; Firecrawl for
  the rest.
- **eBay is a separate animal** (peer-to-peer, realized-sold, counterfeit-noisy), captured
  **auction-only via Apify** so best-offer masking can't occur. See below.

## Lanes

| Reseller | Tool | Cost | Sold via | Status |
|---|---|---|---|---|
| **Fashionphile** | Shopify `products.json` (direct) | $0 | `market-refresh.yml` (every 3h) | ✅ wired |
| **TheRealReal** | **Apify** (`trr-apify.ts`) | Apify CU (~$60/mo w/ eBay in the standing refresh) | daily diff + `reconcile:sold` | ✅ wired (`trr-refresh.yml`, 2-day) |
| **eBay (sold)** | **Apify** (`ebay-sold-apify.ts`, auction-only) | Apify CU | realized comps at capture | ✅ wired |
| **Redeluxe** ⭐ | Shopify `products.json` (direct) | $0 | daily diff + `reconcile:sold` | ✅ wired (`redeluxe-refresh.yml`, daily) |
| **The Luxury Closet** | CJ product feed (advertiser 5312449) | $0 | daily diff + `reconcile:sold` | ✅ wired (`ingest-tlc.yml`, daily) |
| **Couture USA** | Shopify `products.json` (direct) | $0 | daily diff + `reconcile:sold` | 🔧 build-next (adapter) |
| **Vestiaire** | Firecrawl (`vestiaire.ts` adapter) | Firecrawl credits | daily diff + `reconcile:sold` | 🔧 build-next (needs crawl feed) |
| **Rebag** | CJ product feed once approved (mirror TLC) | $0 when live | daily diff + `reconcile:sold` | 🔧 gated on Rebag CJ approval (advertiser 5749848, pending) |

### Fashionphile (free, automated)
```
npx tsx supabase/ingest/sources/fashionphile-crawl.ts handbags
npx tsx supabase/ingest/sources/fashionphile.ts --raw
npm run load:prices -- --write
npm run reconcile:sold -- --platform=fashionphile --snapshot=data/ingest/_raw/fashionphile-live.json --write
npm run summary:refresh
```
`reconcile:sold` safety: skips a platform if the snapshot is empty or would retire more than
`--max-retire-frac` (default 0.5) of its live rows, so a broken crawl never mass-retires a catalogue.

### Redeluxe (free Shopify feed, automated via `redeluxe-refresh.yml`)
```
npx tsx supabase/ingest/sources/redeluxe-crawl.ts
npx tsx supabase/ingest/sources/redeluxe.ts --raw
npm run load:prices -- redeluxe --write
npm run reconcile:sold -- --platform=Redeluxe --snapshot=data/ingest/_raw/redeluxe-live.json --write
npm run summary:refresh
```
Keeps only bags it can name via `canonicalModel` (brand from `vendor`, condition from tags,
size from the title). Unnamable bags are the **discovered-listing follow-up** (not yet wired),
never a guessed name. Verified 2026-07-10: a 2-page sample gave 175 clean named rows (Hermès /
Chanel / Dior / LV) with sane prices, 0 invalid.

### TheRealReal (Apify, automated via `trr-refresh.yml`)
Cloud actor via `trr-apify.ts` / `apify-trr-refresh.ts` (the browser/Firecrawl path was flaky:
TRR drops the login + bot-blocks). Standing 2-day refresh, age-based retirement.

### eBay realized-sold (Apify, auction-only)
`ebay-sold-apify.ts` (broad catch-all) + `ebay-sold-sweep.ts` (scoped second-sourcing). Runs
tier-1/3 brand queries **auction-only** so bid-settled finals can't be best-offer masked, with
a **$500 AG floor**. This is the primary eBay-sold engine (718 realized comps captured, 676 on
pages as of 2026-07-10).

## eBay `--sold` Firecrawl mode = manual fallback only

`firecrawl-ebay.ts --sold` (added 2026-07-10) is a **dispatch-only backup** for when Apify is
capped, not the primary. It is weaker than the Apify path (it includes Buy-It-Now, where
best-offer masking lives, and only heuristically drops masked rows). Prefer `ebay-sold-apify.ts`.

- **Command:** `npx tsx supabase/ingest/sources/firecrawl-ebay.ts all --sold --limit=15`
  (hits `LH_Sold=1&LH_Complete=1`, stamps `price_type: sold`, drops rows showing "best offer accepted").
- **No schedule** (dispatch-only, `firecrawl-ebay.yml`) to avoid a redundant Firecrawl credit
  burn against the Apify path.
- **Refinement if ever promoted:** parse the eBay sold date into `observed_on` (today it falls
  back to ingest date, fine for a "sold in the last N days" read, not exact sold-date history).

## Cost + plan implication

- **Free** for Fashionphile + any other Shopify feed (Redeluxe, Couture USA build-next).
- **Apify (paid Starter)** carries TheRealReal + eBay-sold; standing spend ~$60/mo, well inside
  Starter with a raised cap.
- **Firecrawl** carries the build-next Firecrawl resellers (Vestiaire/Rebag/TLC) + the eBay
  manual fallback.
- **On an Apify spike:** raise the Starter cap + diagnose the burn (Insights). Don't jump to
  Scale ($199/mo) unless sustained usage is ~$180+/mo.

## Owner-gated unblocks (spend / secrets, not code)

- **Apify:** on paid Starter with a raised cap (done). Keep it while `trr-refresh` is live;
  don't downgrade to Free.
- **Firecrawl:** `FIRECRAWL_API_KEY` is a GH Actions secret (CI-only, not local); Standard-tier
  upgrade stays her call, gated on a real breadth need.
