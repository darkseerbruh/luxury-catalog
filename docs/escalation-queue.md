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
