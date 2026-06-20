<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Branch & sync workflow — READ FIRST, EVERY SESSION

`main` is the **single source of truth** for this project. Work accumulates there
so separate Claude sessions/chats don't drift into parallel copies.

1. **Start of every session:** sync with `main` before doing any work —
   `git fetch origin && git checkout main && git pull`. If the environment
   assigned you a per-session branch, create it FROM the latest `main`
   (`git checkout -b <branch> origin/main`).
2. **End of every session:** merge your work back into `main` and push it, so the
   next chat starts from it. Never leave finished work stranded only on a
   per-session branch.
3. **Never start new work from an old per-session branch** (e.g.
   `claude/desktop-display-test-*`, `claude/luxury-catalog-analytics-plan-*`,
   `claude/catalog-enhancements-*`). They are stale/archived — always base off
   `main`.
4. The current handoff lives at `docs/handoff.md` on `main`. Read it first.

