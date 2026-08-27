# Heartbeats

An engine that runs outside GitHub Actions writes `<engine-id>.json` here when it
finishes a run:

```json
{ "at": "2026-08-27T22:41:00Z", "engine": "vendor-inbox-scan", "result": "ok" }
```

`scripts/watchdog.ts` reads the `at` timestamp and alarms when it falls outside
that engine's allowed window. A MISSING file is a red, never a pass, so an
engine that never installed its heartbeat is loud rather than invisible.

This is the file that would have caught 2026-08-17, when every local scheduled
task stopped and nothing said so for ten days.
