# Listing-freshness runbook

*How we keep article + bag prices current. Created 2026-06-26 after the owner flagged staleness as
imperative. The honest constraint: eBay/Poshmark/TRR are browser-gated, so they cannot refresh in
headless CI the way Fashionphile does.*

## What refreshes automatically today
- **Fashionphile:** `.github/workflows/market-refresh.yml` runs daily (06:00 UTC): re-crawls live
  inventory and retires sold listings. The only source crawlable headless.
- **Derived views:** Vercel cron `price-summary` (daily) rebuilds the per-variant summary.
- **NOT auto-refreshed:** eBay, Poshmark, TheRealReal asking + all the peer-to-peer SOLD data. These
  are the figures the new articles cite, and they only update when re-captured by hand.

## The cadence (until product feeds land)
Run a **monthly** re-capture of the article/hero bags. It is browser-gated, so it runs in a logged-in
Claude-in-Chrome session (or `/loop` self-paced), NOT in CI. Per bag: navigate the eBay sold search,
capture via the `get_page_text` body-transport (`docs/data-collection-handoff.md` §12), load with
`load-sold.ts`, refresh the summary. The article bags to re-pull:
- Coach Tabby 26/20/Std, Rogue, Brooklyn, Pillow Tabby, Willow
- Chanel Classic Flap Medium (v199), LV Neverfull MM (v218), LV Speedy (v497/498)
- Dior Lady Dior, Dior Saddle, Gucci GG Marmont small
- Mid-tier: Kate Spade Knott/Sam, MK Jet Set, Longchamp Le Pliage, Mulberry Bayswater

After each monthly pull, run `docs/article-freshness-report.md`'s drift check (the `_drift` query) and
update any article figure that moved.

## The real fix (hands-off, no browser)
Pursue the **affiliate product feeds** (CJ / Impact / Awin), which deliver fresh prices + images
server-side daily with no browser and no rate limit. This is the only truly hands-off path and is gated
only on the affiliate program approvals (most are pending). When a feed lands, build a per-network feed
ingester (extend the existing adapter pattern) and the article numbers stay current automatically.

## Self-updating charts (partial, in progress)
The data-article charts hold hardcoded numbers. Refactoring them to read live from `price_history`
(helper `src/lib/article-data.ts`, planned) makes the CHART self-update on each refresh. Caveat: the
article PROSE also cites figures in freeform text, which a live chart does not touch, so the drift check
above stays the mechanism that keeps the written numbers honest.
