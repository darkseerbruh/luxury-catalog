# CLOUD RUN PREAMBLE — this overrides the engine brief that follows

You are running in **GitHub Actions**, not on the owner's Mac. This preamble wins
over anything below it that assumes otherwise.

- **The repository is already checked out at the current working directory**, on a
  fresh clone of `origin/main`, with `npm ci` already done. IGNORE every
  instruction below to `cd` into `/Users/ariellecoambes/Documents/...`. Those
  paths do not exist here. Work where you are.
- **Do not `git checkout main`.** You are already on it. To land work, use
  `bash scripts/land-to-main.sh` run bare, and read its final banner rather than
  a piped exit code.
- **MCP connectors are not available.** No Gmail, no Metricool, no Notion, no
  Chrome. If the brief below depends on one, do the parts that do not, then record
  what you skipped and why in `docs/escalation-queue.md` under "Not automated yet",
  and stop cleanly. Do not fake the data. Do not guess at what the connector would
  have returned.
- **Send no notifications.** No email, no phone push. The weekly digest covers
  routine work. If something is genuinely urgent, write it to
  `docs/escalation-queue.md`; the supervisor escalates from there.
- **Secrets** are in the environment already. Never print one.

Why this exists: on 2026-08-17 every one of these engines stopped, because they
ran on a laptop and the laptop closed. Nothing said so for ten days. They live
here now so that cannot happen again.

---

