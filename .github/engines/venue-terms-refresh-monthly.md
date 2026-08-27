
You run the monthly venue-terms refresh for Luxury Catalog (a Next.js luxury-handbag resale reference site). The seller fees on /where-to-sell and the buyer protections on /where-to-buy are HARD, dated facts that must never go stale. This run re-verifies them against each venue's OWN published page and opens a PR for Arielle to merge. Arielle is non-technical; explain plainly. NEVER auto-merge a figure change; the PR is her gate.

Work in /Users/ariellecoambes/Documents/luxury-catalog.

SETUP
1. `git fetch origin main`, then create a working branch off origin/main: `git checkout -b ops/venue-terms-$(date +%m%d) origin/main`. Do NOT `git checkout main` (it is held by another worktree). If node_modules is missing/stale, run `npm ci`.
2. Read and obey: docs/venue-terms-refresh.md (the standard for THIS task), docs/preferences.md (the ENFORCED block + the calibrated-hedge frames, especially the third-party-fees rule), docs/voice-and-tone.md. Note the owner's rule: seller fees and buyer choices are HARD numbers, stated exactly and dated. Do NOT soften them to "varies / check current terms". The date is how we stay honest, not vagueness.

GET THE WORKLIST
3. Run `npx tsx scripts/venue-terms-refresh.ts --report --cadence=30`. This writes reports/venue-terms/<today>.md listing every dated cell that is 30+ days past its checkedAt, grouped by venue with the exact sourceUrl to re-check. If nothing is due, there is no work: write a one-line note and stop (no PR).

RE-VERIFY EACH DUE CELL
4. For each due cell, WebFetch/WebSearch its sourceUrl (the venue's own published policy/fee page) and read the current figure. Compare to the stored value in src/lib/where-to-sell.ts or src/lib/where-to-buy.ts.
   - If it CHANGED: update the exact value in the lib (the fact's claim, and any numeric field it feeds, e.g. a commission tier, threshold, window, or fee) to the new published figure, and bump that fact's checkedAt to today.
   - If it is UNCHANGED and you confirmed it on the page: bump only checkedAt to today.
   - If you CANNOT confirm it (page blocked/403, JS-rendered, ambiguous): leave the value AND the old checkedAt untouched, and list it under "unverified this run" for Arielle to check manually. Some venues block automated fetch (The RealReal 403, Fashionphile help pages are JS-rendered) — flag those rather than guessing.
   NEVER invent or approximate a figure. Every number you write must come from the venue's own page, today.

VERIFY + OPEN THE PR
5. Run the gates: `npx tsc --noEmit`, `npx eslint src`, `npm test` (the registries have sourcing + em-dash + freshness tests). Fix any break you caused.
6. Commit on your branch and push it, then open a PR (use `gh pr create`) titled "Venue terms refresh <month year>". PR body = a plain-language drift summary: (a) what CHANGED (venue, field, old -> new, with the source link), (b) what was CONFIRMED unchanged (checkedAt bumped), (c) what is UNVERIFIED and needs her manual check. Do NOT merge. Do NOT run scripts/land-to-main.sh. Leave the merge to Arielle.
7. Also commit the reports/venue-terms/<date>.md report on the branch.

Close any open GitHub issue titled "Venue terms due for re-verification" only after the PR is opened, with a comment linking the PR.

End with a one-line recommendation for Arielle (e.g. "3 fees changed, 1 needs your manual check; review and merge PR #NN").
