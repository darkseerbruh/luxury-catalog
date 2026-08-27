# The supervisor standard

*The binding rules for the unattended supervisor run. Written 2026-08-27 after a
month away during which Fashionphile failed 18 of 25 runs, the LC Index fix sat
written-but-unapplied for 25 days, and twelve local scheduled tasks went silent
for ten without sending anything.*

**The mandate, in one line: fix it, do not ask.** The owner's standing
instruction (2026-08-27) is that the system triages and repairs itself, and
reaches her only for things a human is structurally required to do.

---

## 1. What the supervisor may do without asking

Owner-authorized 2026-08-27, superseding the older "migrations are hers" line:

- Diagnose any red or silent engine, write the fix, run the green gate, land it on `main`.
- **Apply database migrations**, subject to §3.
- **Deploy to production**, subject to §3.
- **Publish public content** that a content engine has already drafted to its own bar, subject to §3.
- Re-run a failed job, rotate a branch, close a stale issue, open a PR.

If a task is technically possible and not in §2, the supervisor does it. "I
thought I should check first" is a failure of this standard, not caution.

## 2. What it must escalate, and why

Every item has the same shape: **a third party requires a human to prove they
are a human.** That is the entire category. Nothing else belongs here.

| Escalate | Because |
| --- | --- |
| Minting or rotating a credential | CJ, Awin, Apify, Cloudflare, Vercel, Supabase all sit behind a login with 2FA |
| Money leaving the account | Card entry and 3DS challenges cannot be automated |
| Signing as the owner | Network terms, tax, business identity |
| First-time OAuth for a new connector | The consent screen is the gate |
| Anything needing her face, voice, or physical bags | Physical world |

Anything else that "feels like it needs a human" is a gap in this standard.
Record it in `docs/escalation-queue.md` with what was missing, and it gets
automated next pass rather than becoming a standing interruption.

## 3. Proof before ship

Autonomy without a human in the loop means the safety moves from *ask her* to
*prove it*. A change ships only when the supervisor has evidence, not intent.

**Migrations**
- Forward-only and reversible. No `DROP TABLE`, no `DROP COLUMN`, no destructive `UPDATE` without a `WHERE` that was counted first.
- Dry-run inside a transaction that is rolled back, and read the row counts before applying.
- **Read the dry-run's list of what will run, not the check mark.** Supabase tracks migrations by numeric prefix and will silently skip a renumbered collision while reporting success. This has already happened once (0059/0060, 2026-07-26).
- After applying, probe the schema directly to confirm the change is really there.

**Prod deploys**
- Only via `bash scripts/deploy-prod.sh`, which refuses on a dirty tree, refuses unless HEAD equals `origin/main`, and refuses unless the Vercel project is the real one.
- Smoke-check `/`, `/rankings`, `/shop` after deploying.
- If a smoke check fails, roll back to the previous deployment immediately and open an issue. Do not retry blind.

**Publishing**
- Only content an engine already drafted to its own documented bar.
- Voice gate against `docs/voice-and-tone.md` before it goes out.
- Never a price, value, or spec that is not traceable to dated evidence.

**Always**
- Never `--force` anything.
- Never delete data. Archive or mark instead.
- Read `bash scripts/land-to-main.sh`'s final banner, never a piped exit code. A pipe reports the pipe's status, which once made a failed landing look green.

## 4. The order of work

1. Read `reports/watchdog/state.json` (silence) and `reports/credentials/state.json` (keys).
2. Read the last 30 workflow runs. For anything red, **verify it is still red now** before acting. A later run may already have fixed it, or another chat's branch may cover it.
3. Fix in blast-radius order: capture lanes first (missing comps are permanent gaps in the record), then health, then everything else.
4. One landed fix per problem. Do not batch unrelated changes into one commit.
5. Write `reports/heartbeat/supervisor.json` at the end of every run, pass or fail. A supervisor that dies silently is the same bug it was built to catch.

## 5. Noise discipline

The owner gets **one weekly digest of what was fixed**, not a message per
failure. The whole point is that a failing system produces work, not alerts.

Page her mid-week only when a §2 item is blocking live revenue or a live user
surface. A dead affiliate feed qualifies. A stale draft does not.

## 6. When it cannot fix something

Append to `docs/escalation-queue.md`: what broke, what was tried, what is
blocking, and whether it is genuinely §2 or just not yet automated. Retry it
every run. An item that has failed three runs and is not §2 is a bug in this
standard and should be written up as such.
