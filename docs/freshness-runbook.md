# Listing-freshness runbook

*How we keep article + bag prices current. Created 2026-06-26 after the owner flagged staleness as
imperative. The honest constraint: eBay/Poshmark/TRR are browser-gated, so they cannot refresh in
headless CI the way Fashionphile does.*

## Two different freshness needs (do not conflate)
- **Live listings** (the ShopThisBag affiliate card, `getStyleShopData`): individual offers sell
  hourly. A sold-out "view" link is a dead affiliate click, so these need to be as fresh as the
  source allows. Headless sources can refresh fast; browser-gated ones cannot.
- **Chart medians** (`getMedians`): aggregates over n=80 to 177 sold comps. One more sale does not
  move a median of $198 (n=177), so a monthly re-capture keeps the medians honest. The hourly churn
  is individual listings, not the aggregate.

## What refreshes automatically today
- **Fashionphile:** `.github/workflows/market-refresh.yml` runs **every 3 hours**: re-crawls live
  inventory and retires sold listings. The only source crawlable headless, so it is also the most
  reliable "still live" signal. The ShopThisBag card ranks Fashionphile (then TheRealReal) first for
  its clickable "view" links, since those are the offers least likely to be already sold.
- **Derived views:** Vercel cron `price-summary` (daily) rebuilds the per-variant summary.
- **NOT auto-refreshed:** eBay, Poshmark, TheRealReal asking + all the peer-to-peer SOLD data. These
  are the figures the new articles cite, and they only update when re-captured by hand.

## The cadence (until product feeds land)
Run a **monthly** re-capture of the article/hero bags — the full routine, bag list, and paste-ready
loop prompt live in **`docs/monthly-recapture-task.md`**. It is browser-gated, so it runs in a
logged-in Claude-in-Chrome session (or `/loop` self-paced), NOT in CI.

**Trigger:** `.github/workflows/monthly-recapture-reminder.yml` opens a `recapture` GitHub issue on
the 1st of each month. (A scheduled workflow is the only durable monthly trigger — an in-session
Claude cron auto-expires in 7 days and dies with the ephemeral container.)

After each monthly pull, run `docs/article-freshness-report.md`'s drift check (the `_drift` query) and
update any article figure that moved.

## The real fix for hourly listing freshness (hands-off, no browser)
**Affiliate product feeds** (CJ / Impact / Awin) are the only way to get hourly-fresh listings with no
browser: they deliver live inventory + prices + images server-side, refreshable as often as we pull,
with no rate limit. This is also the monetization mechanism (the links carry our affiliate ID), so it
moves the same metric twice: fresher cards AND commissioned clicks. Gated only on the affiliate program
approvals (owner-side; most pending). When a feed lands, build a per-network ingester (extend the
existing adapter pattern) and both the cards and the chart numbers stay current automatically. Until
then, browser-gated eBay/Poshmark/TRR listing status can only be refreshed by the manual re-capture, so
their individual "view" links carry the most staleness risk — which is why the card prefers Fashionphile.

## Self-updating charts (done 2026-06-26)
All 6 data-article charts now read live from `price_history` at render via `src/lib/article-data.ts`
(`getMedians`), with the captured numbers kept as a per-field fallback so a chart never renders empty.
The CHART self-updates on each refresh. Caveat: the article PROSE also cites figures in freeform text,
which a live chart does not touch, so the drift check above stays the mechanism that keeps the written
numbers honest.
