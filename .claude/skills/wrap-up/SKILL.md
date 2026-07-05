---
name: wrap-up
description: End-of-session routine for the luxury-catalog repo. Reflects on the chat to capture durable preferences/decisions, updates preferences.md + handoff.md + memory, then runs the green gate and merges the session branch into main. Use when the user says "wrap up", "wrap this up", "end of session", "we're done", "close out", "ship it for the day", or otherwise signals the chat is ending.
---

# Wrap-up: self-healing end-of-session routine

You are closing out a working session on the luxury-catalog repo. The point of this
skill is that the wrap-up runs the same way every chat instead of depending on the
model remembering the AGENTS.md checklist. Work top to bottom. Do not skip steps.
Do not stop to ask permission for the doc edits or the merge: those are the job. Only
pause for an outward-facing or irreversible op (see step 5).

## Step 0 — Orient
- `git status` and `git branch --show-current` to see the branch and what changed.
- `git fetch origin main`, then `git log origin/main..HEAD --oneline` to see what this
  session actually produced. (Compare against `origin/main`, not local `main` — local
  `main` is checked out in the analyst worktree and is usually behind.)
- Read `docs/handoff.md` (current state) and the ENFORCED block + Preference Bar at the
  top of `docs/preferences.md` before editing either.

## Step 1 — Reflect (the self-healing part)
Scan THIS session for anything durable the owner revealed about how she works or
decides, or any product/brand choice she locked or paused. Candidates:
- A way she likes you to work, or a correction she gave you.
- A decision, lock, or pause on a product/brand/copy/pricing direction.
- A new always-on non-negotiable (applies to EVERY response, not just this task).

Ignore volatile task status (that goes in handoff.md, not preferences.md) and anything
the repo already records.

## Step 2 — Filter through the Preference Bar
Before any line goes into `docs/preferences.md`, it must pass ALL of these (rewrite
until it does, or drop it):
1. One decision per line. "And also" means split it.
2. Decisive, not deliberative. Lead with the rule; why/backstory goes in a trailing
   parenthetical or linked doc.
3. Short. One to two lines max; long detail goes in a linked doc with a one-line pointer.
4. Testable. Concrete enough to check whether a reply obeyed it. No wishy-washy phrasing
   (try to, be mindful, generally, when appropriate). A PRESCRIBED hedge is not
   wishy-washy ("frame value as an estimate" is decisive).
5. De-duplicated. Merge into the existing bullet on that topic; never add a near-twin.
6. Placed by altitude: always-on non-negotiable goes in the ENFORCED block as ONE terse
   line; nuance goes in a prose section; volatile status goes in handoff.md.
7. Decisive about nuance, never falsely certain. On uncertain domains (value,
   authenticity, fit, taste, money, legal) prescribe the hedge as "X, not Y".

## Step 3 — Update the docs
- `docs/preferences.md`: merge/refine new durable preferences into the right prose
  section. Dedupe as you go. If a new rule is enforce-worthy, add ONE terse line inside
  the `ENFORCED:start..ENFORCED:end` block (and demote anything there that is really just
  nuance back into prose). Keep the block short.
- `docs/handoff.md`: update the current TL;DR + the live checklist for the lane you
  worked. Move older session-by-session recaps out to `docs/handoff-archive.md` so
  handoff stays lean.
- Memory (`~/.claude/projects/-Users-ariellecoambes-Documents-luxury-catalog/memory/`):
  if a durable user / feedback / project fact surfaced, write or update the relevant
  memory file and add its one-line pointer to `MEMORY.md`. Check for an existing file on
  that topic first; update it rather than duplicating.
- If `doc-budget.sh` has been warning about drift, do the cleanup pass now.

## Step 4 — Land on main via the landing script (NEVER `git checkout main`)
`main` is the single source of truth. Verified work must land there, even when the
session was developed on a per-session branch. Local `main` is permanently checked out
in the analyst worktree, so `git checkout main` FAILS in every other chat — landing
happens by pushing to the remote, and `scripts/land-to-main.sh` is the only sanctioned
way to do it.

1. Commit your work on the current branch with a clear message. End the commit message
   with the Co-Authored-By trailer this environment requires.
2. Run `bash scripts/land-to-main.sh` and show its output. It does, in order:
   merge `origin/main` into your branch → full green gate (`tsc --noEmit`, lint,
   `next build`, `npm test`; auto-skipped when the diff is docs/hooks-only) → waits on
   the shared landing lock so two chats never build at once → `git push origin
   HEAD:main`, retrying with a re-merge if another chat lands first.
3. If the gate is red: fix it and rerun the script, or if you cannot fix it, STOP and
   report the failure with output. Do not land a red tree.
4. If the script reports a merge conflict: resolve it in YOUR worktree, commit the
   merge, rerun the script.
5. EXCEPTION: only skip the landing if the owner explicitly said to hold the work on
   the branch or to open a PR for review instead. In that case push the branch and say so.

## Step 5 — Leave the outward-facing ops to her
Do NOT perform email, public posts, paid sign-ups, DNS changes, or DB migrations. If the
session produced any, list them as a short "your turn" checklist at the end.

## Step 6 — Report
Close with: what landed on main (with the commit/merge evidence), what you wrote into
preferences/handoff/memory, the gate result, and any "your turn" outward-facing items.
Back every "done/pushed/merged" claim with the actual command output, never assert it.
