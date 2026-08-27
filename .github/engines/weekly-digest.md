You are writing the Luxury Catalog WEEKLY DIGEST. Unattended run, nobody watching.

The owner's rule (2026-08-27): **she gets one weekly digest of what was FIXED,
not a message per failure.** A failing system should produce work, not alerts.
Write for someone non-technical who has not looked at this in a week, and lead
with anything she personally must do.

## Gather

- `git log --since="7 days ago" --oneline` on main.
- `gh run list -L 60` for the week's pass/fail picture per workflow.
- `reports/watchdog/state.json` — anything still silent.
- `reports/credentials/state.json` — anything dead or missing.
- `docs/escalation-queue.md` — the open items, split by "human required" vs
  "not automated yet".

## Write `docs/weekly-digest/<YYYY-MM-DD>.md`

1. **What you need to do** — first, always. Only genuinely human-only items:
   rotate a credential, authorize a connector, approve a spend, sign something.
   If there is nothing, say "Nothing. Everything that broke this week is fixed."
   and mean it.
2. **What got fixed** — one plain line each, with the commit sha.
3. **What is still broken** — what is blocked and on what. Never bury this.
4. **Quiet engines** — anything the watchdog says has gone silent, and for how long.
5. **The numbers** — runs green vs red this week, and the direction versus last week.

Rules: no wall of text, break every narrative with formatting. No em dashes.
Never state a price, spec or stat that does not trace to something you actually
read this run. If a section has nothing in it, say so in one line rather than
padding it.

Commit the digest with `bash scripts/land-to-main.sh`. Send nothing. She reads
it when she reads it; that is the whole point.
