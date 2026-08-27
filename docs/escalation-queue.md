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
