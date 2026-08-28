# Escalation queue

*What the supervisor could not fix, and why. It retries every item every run, so
this is a work queue, not an archive. Created 2026-08-27.*

**How to read this.** Two categories only:

- **Human required** — a third party needs a person to prove they are a person.
  Credential rotation, money, signing as the owner, first-time OAuth, anything
  physical. This is the complete list; see `docs/supervisor-standard.md` §2.
- **Not automated yet** — the supervisor could not do it but nothing structural
  stopped it. Every one of these is a gap in the standard, not a standing chore.
  Three failed runs on the same item means it needs writing up as a bug.

---

## 2026-08-27 — seeded by hand at build time

**Human required**

- **Apify and Metricool MCP connectors are unauthorized.** Neither can be called
  from an unattended run until the owner completes the OAuth consent once, in her
  connector settings. Blocks the social engine and the TRR capture lane from ever
  running unattended, no matter where they are hosted.

**Not automated yet**

- **TRR capture has been silent 29 days** (found by the watchdog's first run).
  Cause not yet diagnosed. Scheduled every 2 days, so this is roughly 14 missed
  runs and a real hole in the record.
- **Ten agent engines have no heartbeat**, so the watchdog reports them as never
  having run. Correct and deliberately loud, but they stay red until each engine
  either moves into Actions or learns to write `reports/heartbeat/<id>.json`.
- **No `VERCEL_TOKEN` in repo secrets**, so the supervisor cannot deploy to
  production from CI even though the owner authorized it. Adding the secret is a
  human step; using it afterwards is not.

---

## 2026-08-27 23:27 UTC — supervisor run (DRY_RUN=true, landed nothing)

`DRY_RUN` was `true`, so this run diagnosed and wrote but did not land. Every fix
below is specified to the line so the next live run can apply it without
re-deriving anything.

### Fixed

Nothing landed, by instruction. The board was **not** clean, but `DRY_RUN=true`
forbids shipping.

### Verified already fixed — do not fix twice

- **Daily data health** — last run on `main` (33120047086, 21:51 UTC) was red on
  `price_history count failed` at `scripts/data-health.ts:96`. That run predates
  the fix. `fix/price-history-scale-0827` landed at 22:59 (`c7d2d76`, confirmed
  ancestor of `main`) and the branch was deleted. Re-ran `npx tsx
  scripts/data-health.ts` read-only against the live DB during this run: full
  scorecard, **zero reds**, one unchanged yellow (pseudo-styles, 1, prev 1). The
  red is stale. No fix opened.
- **Fashionphile capture, Rebag, TLC, myGemma, Redeluxe, Couture USA, Ann's, CJ
  token alarm, IndexNow** — all green on `main` as of this run. The earlier
  Fashionphile and Rebag failures were repaired before the supervisor started.
- **Green gate on `main`** is clean (`npx tsc --noEmit` exit 0).

### Still open

**1. The autonomy layer reports success no matter what it does. (NOT AUTOMATED YET — P1)**

`.github/workflows/supervisor.yml:112` and `.github/workflows/agent-engines.yml:127`
share this shape:

```
set -uo pipefail
claude -p ... 2>&1 | tee <log>
echo "... exited ${PIPESTATUS[0]}"
```

There is no `set -e`, and the trailing `echo` is the step's last command, so the
step exits **0** whatever Claude did. Reproduced in this run with a stub that
returns 1: the log printed `Engine exited 1` and the step still exited **0**.

Consequences, all live right now:
- `agent-engines.yml` writes `"result": "${{ job.status }}"` into
  `reports/heartbeat/<id>.json`, so a crashed engine records a **green**
  heartbeat.
- `supervisor.yml`'s `if: failure()` step, commented "the one alarm that must
  never be ignored", can never fire.

Fix: drop the `echo`, or capture the status and `exit` on it, in both files.
Blocking: nothing. `DRY_RUN` only.

**2. The watchdog treats "ran and failed" as healthy. (NOT AUTOMATED YET — P1)**

`scripts/watchdog.ts:294` reads only `beat.at` and ignores `beat.result`. Even
once item 1 is fixed, a heartbeat written by the `if: always()` step with
`"result": "failure"` still reads as alive. Fix: red when `result` is not
`success`, with a distinct title so it does not collide with the silence issue.
Compounds item 1 — ship them together or item 1 buys nothing.

**3. `SUPABASE_DB_PASSWORD` is NOT missing. The probe is not given it. (NOT AUTOMATED YET — P1)**

This was the board's only "genuinely human-only" credential. It is not one.

`supervisor.yml`'s "Refresh the sentinels" step env block passes eight secrets
and **omits `SUPABASE_DB_PASSWORD`**; `watchdog.yml`'s radar step passes nine and
includes it. Same script, two callers, different answers. Confirmed this run: the
secret **is** set in the repo and was present in the supervisor's own step, while
the radar step one step earlier saw nothing and wrote `status: "missing"`.

So the two sentinels fight: the watchdog writes the credential green twice a day,
the supervisor rewrites it red every six hours, and the issue open/close logic
churns on a credential nobody needs to touch.

Fix: add `SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}` to the
sentinel-refresh env block in `supervisor.yml`. One line. **Do not ask the owner
to rotate this credential.** Removed from the human-required list below.

**4. The watchdog cries wolf on TRR, and its advice would spend money. (NOT AUTOMATED YET — P2)**

TRR capture is not broken. Its schedule was **deliberately paused 2026-08-02** in
an owner cost review (`trr-refresh.yml:31-45`: 69% of the Apify bill, $68.99 of
$100.01 in July, for ~1.2% of monthly data). The watchdog has no concept of a
paused lane, so it reports "silent 29d" and will do so forever.

Worse, the issue body it generates says *"This is a GitHub workflow, so the
supervisor can re-run and repair it."* Re-running a pay-per-result Apify lane the
owner shut off for cost is money leaving the account — a §2 line the watchdog is
actively nudging an unattended agent across. **This run did not re-run it.**

The precedent already exists: `src/lib/data-health-core.ts:161` carries
`exemptReason: "capture paused 2026-08-02 (owner cost review); not a failure"`
and the scorecard reports TRR as ℹ️ info. Fix: give `Engine` in
`scripts/watchdog.ts` the same optional `pausedReason`, report those lanes as
paused rather than red, and never emit the "supervisor can re-run it" line for
them.

This supersedes the 2026-08-27 seeded entry "TRR capture has been silent 29 days,
cause not yet diagnosed". **Diagnosed: intentional.** It is not a defect and not
an escalation. Resuming it *would* be §2 (money) and is the owner's call, not
the supervisor's.

**5. The watchdog tells the fixer to go look at a laptop that no longer runs anything. (NOT AUTOMATED YET — P3)**

`scripts/watchdog.ts:353` emits, for every `heartbeat` engine, *"This engine runs
outside GitHub Actions, so nothing here can restart it. If it lives on a laptop,
that is the bug, not the symptom."* Commit `c916dca` moved seven of them into
`agent-engines.yml`: analyst-daily-scan, article-engine-weekly,
dictionary-gap-report, market-report-monthly, venue-terms-refresh-monthly,
archivist-monthly-pull, weekly-digest. All seven have briefs in
`.github/engines/` and ids matching the registry. `supervisor` is also tagged
`heartbeat` and is likewise a workflow now. The text is false for eight of the
thirteen open watchdog issues (#63-#74) and misdirects whoever reads them.

Fix: mark which heartbeat engines are cloud-hosted and say so.

**6. `agent-engines.yml` has never executed once. (NOT AUTOMATED YET — P2)**

`gh run list -w agent-engines.yml` returns nothing. It was committed today and
its first cron (`10 12 * * *`) fires before the next supervisor run, so it may
self-verify. But seven engines depend on a workflow no one has watched run, and
item 1 guarantees that if it fails it will report success and write green
heartbeats. Not dispatched this run: a successful dispatch commits to `main`,
which `DRY_RUN` forbids. **Next live run: dispatch one engine and read the log,
after fixing item 1.**

**7. `supervisor-run.log` is neither gitignored nor committed. (NOT AUTOMATED YET — P3)**

It is untracked and the commit step only adds `reports` and
`docs/escalation-queue.md`, so nothing leaks today. But it is the full run
transcript sitting in the working tree, and a carelessly written probe can put a
secret value into it — that happened during this run's diagnosis of item 3. Add
it to `.gitignore`.

**8. Human required — genuinely §2**

- **Apify and Metricool MCP connectors are unauthorized.** Carried from
  2026-08-27. Still blocks `vendor-inbox-scan` (Gmail), `social-engine-weekly`
  and `social-engine-pulse` (Metricool + Notion), and `analyst-weekly-brief`
  (Gmail) — the four engines `agent-engines.yml` explicitly did not port. The
  OAuth consent screen is the gate. Watchdog issues #63, #65, #66, #67 stay open
  and correctly so.
- **No `VERCEL_TOKEN` in repo secrets.** Carried from 2026-08-27. The supervisor
  cannot deploy to production from CI even though §1 authorizes it. Adding the
  secret is the human step; using it afterwards is not.

### Reading of the board

Nine of the thirteen open watchdog issues and the single open credential finding
are **false or stale**: one paused on purpose (#62), eight mislabelled as
laptop-hosted, and one credential that is present but not passed to its own
probe. The four real ones are all the same §2 OAuth gate.

The genuine defect this run found is not on the board at all: the supervisor and
the engine runner both discard their exit codes, so the layer built to notice
silence cannot notice its own failure. That is the July "false green" bug
reappearing inside the thing meant to catch it, and it is item 1 for the next
live run.

---

## 2026-08-27 — dictionary-gap-report engine (GitHub Actions)

**Not automated yet**

- **`npm run aggregate:aliases` cannot run in Actions.** It reads only local JSON
  dumps under `data/ingest/_raw/`, which is gitignored (`.gitignore:48`) and so
  does not exist in a fresh clone — the run died with
  `ENOENT: scandir '…/data/ingest/_raw'`. The alias aggregation is therefore
  laptop-only, and any engine brief that names it will keep half-failing in CI.
  It aggregates reseller *aliases* for models already in the dictionary, so it is
  not on the critical path for the gap report itself; this week's report was
  built from Supabase without it. **Fix is one of:** point the script at
  `discovered_listing` in Supabase instead of the raw dumps, or commit/publish the
  dumps somewhere CI can fetch. Until then, treat alias aggregation as a manual
  step on the Mac.

---

## 2026-08-28 00:32 UTC — supervisor run (DRY_RUN=false)

**Read this one first. The supervisor cannot land code.** It found and wrote six
fixes and could not ship a single one of them, for three reasons that have
nothing to do with the fixes. The mandate is "fix it, do not ask", and the
machinery to do that does not currently exist. That is the finding of this run;
the six fixes are secondary.

### The board, verified

Capture is healthy. Fashionphile, TLC, Rebag, myGemma, Redeluxe, Couture USA and
Ann's all green, no holes in the price record. Credentials: 8 checked, 0 red.
Every "still open" item from the 2026-08-27 dry run was re-checked against the
tree rather than trusted, and four were already closed overnight by `9b2ce35`
and `0b5a819` — those were not fixed twice. Details under "verified" below.

### The three blockers

**B1. The green gate cannot run in CI. (NOT AUTOMATED YET — P0)**

`scripts/land-to-main.sh` runs `next build`. The build prerenders `/social`,
which reads Supabase through `src/lib/supabase.ts:15` and needs
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. `supervisor.yml`'s env block passes nine
secrets and that is not one of them, so the build dies:

```
Error: supabaseKey is required.
Export encountered an error on /social/page: /social, exiting the build.
⛔ land-to-main: green gate FAILED at step: build
```

The gate has only ever run on the owner's Mac, where `.env.local` supplies it.
Nothing in Actions has ever executed `next build`, so this has been true since
the supervisor was written and only surfaced now, on the first run that tried to
land something.

Consequence: the supervisor can land **docs only**. `gate_scope` in
`land-to-main.sh` skips the gate for `*.md`, `docs/`, `.claude/` and
`scripts/*.sh`; every other path takes the full gate, which cannot pass. This
entry landed. The six fixes did not.

Fix, in preference order:
1. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to repo secrets and to the env blocks in
   `supervisor.yml` and `agent-engines.yml`. The key is public by design
   (`docs/security-baseline.md:17`), so this is not a secrecy decision, but
   reading it out of the Supabase dashboard is a login, so **the owner adds it
   once**. Everything after that is automated.
2. Do **not** substitute `SUPABASE_SERVICE_ROLE_KEY`. A `NEXT_PUBLIC_*` var is
   inlined into client bundles at build time; that would publish the service
   role key to every visitor. Flagged here because it is the obvious shortcut
   and it is a serious one.

Separately worth fixing on its own merits: `/social` is the only data page in
`src/app` with no `dynamic`/`revalidate` export, so it prerenders at build time
while every sibling data page does not. The docstring on `getSupabase()` says
the lazy client exists specifically so a keyless environment does not crash the
build; it defers the crash rather than preventing it. **Not changed this run.**
Altering how a live user surface renders, with no ability to smoke-test it (see
B3) and only to unblock my own pipeline, is the tail wagging the dog.

**B2. The token cannot modify workflow files. (Human required — §2)**

Two of the six fixes are one-line job-timeout changes in `.github/workflows/`.
The push was rejected outright:

```
! [remote rejected] refusing to allow a GitHub App to create or update workflow
  `.github/workflows/agent-engines.yml` without `workflows` permission
```

This is not a `permissions:` block that can be widened. GitHub does not grant
`GITHUB_TOKEN` the `workflow` scope at all; it requires a PAT (or a GitHub App
with that permission) stored as a secret. Minting one is a login behind 2FA, so
this is genuinely §2 — the first §2 item on this board that is not an OAuth
consent screen.

Until then, **no engine can repair its own schedule, timeout, secret list, or
cron**, which is a large share of what actually breaks here. Two of six this run.

**B3. Actions cannot open pull requests. (NOT AUTOMATED YET — P1)**

The fallback for B1/B2 was to open a PR for review. Also refused:

```
GraphQL: GitHub Actions is not permitted to create or approve pull requests
```

That is the repo/org setting *Allow GitHub Actions to create and approve pull
requests*, which is off. Turning it on is a settings toggle, not a credential.
With all three blockers live, the supervisor's only outputs are a pushed branch
and a docs commit. Supervisor-standard §1 lists "open a PR" as something it may
do; right now it cannot.

### Written, tested, pushed — not landed

Branch **`fix/watchdog-truthful-0828`** (pushed, 4 commits off `main`). Each
passes `npx tsc --noEmit` and `npx eslint scripts/watchdog.ts`, and each was
verified against a live `npx tsx scripts/watchdog.ts` before commit. Merging it
needs a human until B1 or B3 is cleared.

| Commit | Defect |
| --- | --- |
| `0ff8db6` | Watchdog read `beat.at` and ignored `beat.result`, so a heartbeat reporting `failure` counted as a live engine |
| `d55398f` | No concept of a paused lane: TRR red forever, and the issue body told an unattended agent to re-run a pay-per-result Apify actor |
| `a831396` | Every heartbeat issue ended with "if it lives on a laptop, that is the bug" — false for the eight now in Actions, misleading for the four behind an OAuth gate |
| `8dfbadd` | Four scheduled workflows (`catalog-promote`, `fashionphile-enrich`, `ebay-midtier-refresh`, `analytics-digest`) were in no registry at all |

Item 1 was not a theory. `reports/heartbeat/dictionary-gap-report.json` carried
`"result": "failure"` from run 33127509241 at the moment this run started, and
the watchdog reported that engine **green**. After the fix the same state reads
`RAN AND FAILED`. That is the July false-green bug at its third level: the
runner lied, `9b2ce35` made the runner honest, and the reader was still deaf.

Item 4 is the quiet one, and it is the reason two more problems below went
unseen. A **cancelled** job sends no failure mail. `catalog-promote` was in no
registry either. So seventeen days of a stalled catalogue build-out passed with
nothing anywhere saying so.

**Blocked by B2 — two one-line changes a human can paste in 30 seconds:**

- `.github/workflows/catalog-promote.yml:42` — `timeout-minutes: 30` → `90`.
  The normalise step is the whole cost and it scales with `discovered_listing`:
  2m (07-13), 3m, 6m, 14m, 29m30s (08-10), then killed at 30m on 08-17 and
  08-24 with the promote step never starting. Two weekly reports lost. Nothing
  is hanging; the table outgrew the budget.
- `.github/workflows/agent-engines.yml:56` — `timeout-minutes: 40` → `90`.
  Run 33127509241 (dictionary-gap-report) was cancelled at 39m31s. It got as far
  as appending to this file and produced no gap report, so that week's output is
  simply missing. An Opus run over the live catalogue was sized like a script
  step.

### Verified already fixed — did not fix twice

- **Runners discard their exit code** (2026-08-27 item 1) — closed by `9b2ce35`.
  Confirmed in the wild, not by reading: run 33127509241 was killed and its
  heartbeat recorded `failure`, not `job.status`. That truthful heartbeat is
  what exposed the watchdog defect above.
- **`SUPABASE_DB_PASSWORD` missing from the sentinel-refresh env** (item 3) —
  closed by `9b2ce35`. `reports/credentials/state.json` has zero red findings
  this run, where it previously carried a false human-required flag.
- **`supervisor-run.log` untracked and unignored** (item 7) — closed by `9b2ce35`.
- **`agent-engines.yml` had never executed** (item 6) — it has now, twice, and
  needed no dispatch to prove anything: 33127060327 died `exit 128` on a bare
  `git push` (closed by `0b5a819`) and 33127509241 hit the timeout (above).
- **TRR "silent 29 days"** (2026-08-27 seeded) — diagnosed intentional last run,
  confirmed again. Superseded; see below.

### Still open, beyond the blockers

**1. `catalog-promote` normalises the whole table every week. (NOT AUTOMATED YET — P2)**

The timeout bump buys headroom, not a cure. The pass re-scans all of
`discovered_listing` every run and the cost has roughly doubled per fortnight
since July, so 90 minutes buys a few months and then this recurs. The real fix
is to normalise only rows unseen since the last run; `promoted_at` already gives
the watermark. Not attempted this run — a script rewrite against live data
deserves its own run, not the tail end of this one.

**2. `classify-families` dies on a Supabase statement timeout. (NOT AUTOMATED YET — P3)**

Run 30698050292 (2026-08-01) failed with `57014 canceling statement due to
statement timeout`. Manual-dispatch only and nothing depends on it on a
schedule, so it has sat red 27 days without consequence. Same shape as item 1:
an unbounded query over a table that outgrew it. Left for the same run.

**3. `npm run aggregate:aliases` cannot run in Actions. (NOT AUTOMATED YET — P3)**

Carried unchanged. It reads `data/ingest/_raw/`, gitignored and absent in a
fresh clone. Point it at `discovered_listing` in Supabase instead.

**4. The supervisor's own 45-minute budget is the next version of this bug. (NOT AUTOMATED YET — P2)**

Two of the six fixes above were timeouts sized for scripts rather than agent
runs. `supervisor.yml:43` has the same shape: 45 minutes to triage the board,
read logs, write fixes, and run a full `next build` per landing. This run fit
only because the build failed fast. It is also a workflow file, so B2 blocks it.

### Human required — genuinely §2

- **A PAT with `workflow` scope** (B2, new this run). Without it no engine can
  repair its own schedule or timeout. This is the highest-value single item on
  the board: it converts a whole class of breakage from "escalate" to "fixed".
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY` in repo secrets** (B1, new this run). Only
  the reading of it is human; the key itself is public by design.
- **Apify, Metricool, Gmail and Notion connectors are unauthorized.** Carried.
  The consent screen is the gate. Blocks `vendor-inbox-scan`,
  `social-engine-weekly`, `social-engine-pulse`, `analyst-weekly-brief`. Their
  watchdog issues will stop blaming a laptop once `a831396` merges.
- **No `VERCEL_TOKEN` in repo secrets.** Carried. No deploy was needed this run.

### One thing that is not an escalation

**TRR capture is not broken and must not be "fixed".** Schedule pulled
2026-08-02 in the owner's cost review — 69% of July's Apify bill, $68.99 of
$100.01, for ~1.2% of monthly rows. The watchdog called it red for 29 days and
told the reader *"the supervisor can re-run and repair it"*, which is an
unattended agent being instructed to spend money. `d55398f` fixes the advice.
Resuming the lane is §2 and hers.
