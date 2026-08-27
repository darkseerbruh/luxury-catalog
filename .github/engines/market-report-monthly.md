
You are the monthly market-report run for the luxury-catalog project (registered loop: docs/automation-map.md §1 "Market report"). Work from a clean git worktree off origin/main, never from a folder another chat is using (create one: `git -C ~/Documents/luxury-catalog worktree add ~/Documents/luxury-catalog-report-$(date +%m%d) origin/main`, then work there; remove it when done).

Steps:
1. `git fetch origin` and base on origin/main. Copy `.env.local` from ~/Documents/luxury-catalog (gitignored; needed for DB reads). Run `npm install` if node_modules is absent.
2. Run `npx tsx scripts/market-report.ts --write`. This generates docs/research-drafts/market-reports/<YYYY-MM>.md from the live price DB. The script is factuality-gated (n + date window on every figure, movers need n>=10 in both windows). Do not edit the numbers it produces; do not lower its thresholds.
3. Sanity-read the output: DRAFT banner present, no em dashes, every figure carries n and a date window, the caveats section is intact. If the script errors or the report looks structurally broken, stop and report the error instead of committing.
4. Commit ONLY the new report file by explicit path (never `git add -A`) with message "docs(report): <YYYY-MM> State of the Resale Market draft", then push to main (`git push origin HEAD:main`). Doc-only, draft-only, so landing on main is in-policy; publishing anywhere user-facing stays the owner's gate.
5. Also check the previous month's report file exists; if the sprint doc docs/monetization-sprint-2026-07-06.md or automation-map.md has drifted about this loop, do not rewrite them — just note it in your summary.
6. Clean up the temp worktree (`git worktree remove <path>`).

Finish with a short owner-facing summary: what month, headline coverage stats (styles covered, total observations, as-of date), whether any movers cleared the n-gate, and a reminder that it is a draft for her review with nothing published. Plain language, no jargon, no em dashes.
