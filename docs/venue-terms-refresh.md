# Venue terms refresh (never-stale engine)

*Owner-directed 2026-07-11: seller fees and buyer protections are HARD numbers, and
they must stay current. This is the standing engine that re-verifies them on a cadence.*

## What it keeps fresh

Two pure registries of dated, sourced facts:

- `src/lib/where-to-sell.ts` (SELL_VENUES): seller economics, commission/fee schedules,
  payout speed and methods, acceptance, effort, price control, seller authentication.
- `src/lib/where-to-buy.ts` (VENUES): authentication, returns, fake remedy, payment
  protection.

Every cell carries a `sourceUrl` + `checkedAt`. These are facts, not estimates: state
the exact figure, dated, never soften it. (The only estimate on these pages is the resale
VALUE in the net estimator, which is hedged separately.)

## Cadence + backbone

- **Cadence:** monthly (30-day re-verify). A cell is "due" once it is 30+ days past its
  `checkedAt`.
- **Backbone:** `src/lib/venue-terms-freshness.ts` (pure, tested) collects every dated
  cell and reports which are due as of a date. `scripts/venue-terms-refresh.ts` prints a
  summary, writes a dated report (`--report`), or exits non-zero if anything is due
  (`--check`). No network: it produces the worklist, it does not fetch.

## Two pieces (matches the repo's engine split)

1. **Safety net (deterministic, GitHub Action `venue-terms-refresh.yml`, monthly):** runs
   the report, commits it to `reports/venue-terms/<date>.md`, and opens/updates a
   `venue-terms` issue when anything is due. Guarantees staleness is always visible even
   if the agent below fails.
2. **The refresh (scheduled cloud agent `venue-terms-refresh-monthly`):** works the due
   list. For each due cell, fetch the `sourceUrl`, compare the live published figure to
   the stored value, and:
   - update the value in the lib if it changed (exact new figure), and
   - bump `checkedAt` to today (whether or not it changed).
   Then open a PR with a drift summary (what changed, what was confirmed). The owner
   merges. Never auto-merge a value change.

## The re-verify bar (non-negotiable)

- Every figure traces to the venue's OWN published page (not a blog), with today's date.
- If a page can't be reached or the figure can't be confirmed, do NOT guess: leave the old
  value, do NOT bump `checkedAt`, and note it in the PR as "unverified this run".
- Keep the numbers HARD: exact percentages, thresholds, fees. No "varies / check current
  terms" softening on the site. The date is how we stay honest, not vagueness.
- After any value change, re-run `npm test` (the registries have em-dash + sourcing tests)
  and the freshness tests.

## Run it by hand

```
npx tsx scripts/venue-terms-refresh.ts --report   # write the due-list report
npx tsx scripts/venue-terms-refresh.ts --check     # exit 1 if anything is due
```
