# Monthly re-capture task (article + hero bags)

*The standing monthly routine that keeps the article/hero bag prices fresh. The capture is
browser-gated (eBay/Poshmark/TheRealReal block headless CI), so it runs in a logged-in
Claude-in-Chrome session, NOT in CI. This doc IS the task definition; the
`.github/workflows/monthly-recapture-reminder.yml` workflow only fires the reminder.*

## How it fires
- **Reminder:** `monthly-recapture-reminder.yml` runs on the 1st of each month (07:13 UTC) and
  opens (or reuses) a GitHub issue labeled `recapture` titled "Monthly re-capture due". That issue
  is the trigger — it survives container reclaim and needs no live session, which an in-session
  cron (7-day expiry, ephemeral) cannot.
- **Run it:** open a logged-in Claude-in-Chrome session and paste the loop prompt below, or run
  `/loop` with it. Close the issue when the drift check is done.

## The loop prompt (paste into a logged-in Claude-in-Chrome session)

> Re-capture the article/hero bag prices for this month. For each bag below: navigate the eBay
> **sold/completed** search, capture the listing prices via the `get_page_text` body-transport
> (`docs/data-collection-handoff.md` §12), load with `load-sold.ts`, then refresh the summary.
> Asking (listed) for Hermès Birkin/Kelly + premium-resale bags comes from TheRealReal/Fashionphile,
> not eBay. After all bags, run the `_drift` query in `docs/article-freshness-report.md` and update
> any article PROSE figure that moved (the charts self-update from the DB; the prose does not).
> Commit + push to `main`. Skip Hermès Birkin/Kelly **eBay sold** (counterfeit noise — asking only).

### Bags to re-pull (eBay SOLD unless noted)
- Coach: Tabby 26/20/Std (v596/595/597), Rogue (v602/605), Brooklyn (v606), Pillow Tabby (v598/599), Willow (v610)
- Chanel Classic Flap Medium (v199) · LV Neverfull MM (v218) · LV Speedy 25/30 (v497/498)
- Dior Lady Dior (v570-573) · Dior Saddle (v574/575) · Gucci GG Marmont small (v207)
- Mid-tier: Kate Spade Knott (v925) / Sam (v927) · MK Jet Set (v928) · Longchamp Le Pliage (v930) · Mulberry Bayswater (v932)
- Asking-only (no eBay sold): Hermès Birkin, Hermès Kelly (TheRealReal/Fashionphile listed medians)

## After the pull
- Run `docs/article-freshness-report.md` `_drift` query; update moved PROSE figures before any
  affected draft is published.
- The 6 self-updating charts (`src/lib/article-data.ts` + the `[slug]` chart components) refresh
  automatically once the new rows land — no code change needed.
- Close the `recapture` issue.

## The real fix (retires this task)
Affiliate product feeds (CJ / Impact / Awin) deliver fresh prices server-side daily with no browser.
When a feed lands, build the per-network ingester and this manual monthly pull goes away. Gated only
on the affiliate approvals (`docs/freshness-runbook.md`).
