<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Operating rules — APPLY TO EVERY RESPONSE (non-negotiable)

The owner's always-on rules live in **ONE place**: the `ENFORCED:start..ENFORCED:end`
block at the top of `docs/preferences.md`. They bind every turn, not just at session
start — the `UserPromptSubmit` hook (`.claude/hooks/operating-rules.sh`) reads that block
live and re-injects it into every response. **Read that block now and obey it.**

Do not maintain a second copy of these rules here or in the hook — the block is the
single source of truth, so it can never drift out of sync. To add/remove an always-on
rule, edit only that block (see the wrap-up maintenance step below).

# The Preference Bar — every stored preference must pass this

The owner wants stored preferences **short, decisive, and clear** so priorities are never
ambiguous — which includes being decisive about *where nuance is required*. Before writing
ANY line into `docs/preferences.md` (or `handoff.md`), run it through this filter. If a
candidate fails any rule, rewrite it until it passes — or don't store it.

1. **One decision per line.** "And also / but also" means split it into separate lines.
2. **Decisive, not deliberative.** Lead with the rule. The why/backstory goes in a trailing
   parenthetical or a linked doc, never the headline.
3. **Short.** One to two lines. If it needs a paragraph, store a one-liner + a pointer to
   the detail doc; put the detail there, not here.
4. **Testable.** Concrete enough to check whether a reply obeyed it. Ban *wishy-washy rule
   phrasing* (try to, be mindful, generally, when appropriate). **Prescribing a hedge is NOT
   wishy-washy** — "frame the value as an estimate" is decisive; it's the instruction that's
   firm, even when it mandates uncertainty in the output.
5. **De-duplicated.** Merge into the existing bullet on that topic; never add a near-twin.
6. **Placed by altitude.** Always-on non-negotiable → the ENFORCED block (one terse line).
   Nuance → a prose section. Volatile task status → `handoff.md`, never here.
7. **Decisive about nuance, never falsely certain.** When the subject is inherently uncertain
   (value, authenticity, fit, taste, money, legal), the decisive rule is to *prescribe the
   hedge*, not drop it. Write it as a crisp **"X, not Y"** contrast — what we claim and what
   we explicitly don't. Our canonical frames: value = *estimate, not appraisal*; tax =
   *records, not advice*; insurance = *refer, not act as agent*; recommendations = *informed
   opinion / "my take," not a directive*; authentication = *markers to check, not a verdict*.
   Decisive ≠ pushy (the Je Suis Lou model: "we don't judge," "fashion is subjective").

The `doc-budget.sh` guard checks the mechanical parts (ENFORCED block stays terse + decisive,
docs stay within budget) and warns at session start when something drifts. Note: the guard's
"decisive" check flags wishy-washy qualifiers, never a prescribed hedge.

# Branch & sync workflow — READ FIRST, EVERY SESSION

`main` is the **single source of truth** for this project. Work accumulates there
so separate Claude sessions/chats don't drift into parallel copies.

1. **Start of every session:** sync with `main` before doing any work —
   `git fetch origin && git checkout main && git pull`. If the environment
   assigned you a per-session branch, create it FROM the latest `main`
   (`git checkout -b <branch> origin/main`).
2. **End of every session (wrap-up — do BOTH, every chat):**
   a. **Merge your work back into `main` and push it**, so the next chat starts from
      it. Never leave finished work stranded only on a per-session branch. **This
      applies even when the environment assigned you a per-session branch and told
      you to develop on it** — that branch is where you *develop*; `main` is where
      verified work *lands*. So: develop + commit + push on the session branch, then
      at the end merge it into `main` (`git checkout main && git merge --no-ff
      <session-branch>`) and `git push origin main`. Don't wait to be asked. **Only**
      skip the merge if the user explicitly says to hold it on the branch or to open
      a PR for review instead. Gate the merge on green `tsc --noEmit`, `eslint src`,
      `next build`, and `npm test`.
   b. **Update `docs/preferences.md`** with any DURABLE working preferences,
      decisions, or product/brand choices the owner revealed this chat (how she likes
      to work, things she locked or paused). **Every line you add must pass The Preference
      Bar above** (short, decisive, clear, one decision per line). Merge in/refine — don't duplicate, don't
      remove anything still valid, keep it concise; skip volatile task status (that
      lives in `docs/handoff.md`). **Then promote anything enforce-worthy:** if a new
      preference is a non-negotiable that should apply to EVERY response (not just
      nuance), add ONE terse line inside the `ENFORCED:start..ENFORCED:end` block at the
      top of the file — that block is the single source the hook + AGENTS.md both use, so
      this is the only step needed to make a rule always-on. Keep the block short; demote
      anything that's really just nuance back into the prose sections. Commit + push to
      `main` with the rest of the wrap-up.
   c. **Keep the docs lean (anti-bloat).** When you add to `preferences.md` or
      `handoff.md`, *dedupe as you go* — merge into the existing bullet, don't append a
      near-duplicate; an ENFORCED rule that needs a paragraph means the paragraph goes in a
      prose section and the ENFORCED line stays a one-liner + pointer. Move older
      session-by-session recaps out of `handoff.md` into `docs/handoff-archive.md` (keep
      only current TL;DRs + the live checklist + durable reference). The SessionStart
      `doc-budget.sh` guard warns when these drift over budget — when it fires, do the
      cleanup pass that session rather than letting it grow.
3. **Never start new work from an old per-session branch** (e.g.
   `claude/desktop-display-test-*`, `claude/luxury-catalog-analytics-plan-*`,
   `claude/catalog-enhancements-*`). They are stale/archived — always base off
   `main`.
4. The current handoff lives at `docs/handoff.md` on `main`. Read it first.
5. Read `docs/preferences.md` — the owner's working preferences and locked
   decisions — at the start of every session, and keep it updated as you learn more.

