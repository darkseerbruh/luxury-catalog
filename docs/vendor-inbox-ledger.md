# Vendor inbox engine — ledger

*Memory for the `vendor-inbox-scan` engine (see [vendor-inbox-engine.md](vendor-inbox-engine.md)).
Every run appends one dated block; the next run reads this first and skips mail already
logged. One line per email: `date · sender · bucket · action`.*

<!-- runs append below, newest first -->

## Run 2026-07-15 (scan window ~48h)

- 2026-07-15 · notifications@github.com · **CI/job failed — Refresh TLC live listings (CJ feed)** · **key/auth (hers)** — CJ API HTTP 403 "Could not authenticate given token"; `CJ_API_TOKEN` secret is present but CJ rejects it (both CJ feeds succeeded <24h earlier). Token revoked/expired on CJ's side. No code ref to change (secret name is correct). → ledger + **PING**. Action: she regenerates the CJ personal access token and updates the GitHub Actions secret (`CJ_API_TOKEN`) + Vercel env.
- 2026-07-15 · notifications@github.com · **CI/job failed — Refresh Rebag live listings (CJ feed)** · **key/auth (hers)** — same CJ 403 as TLC (one shared token). Covered by the ping above.
- 2026-07-15 · notifications@vercel.com · outage/route-error (504 on /bag/[variantId]) · **already resolved, no action** — verified live 200 x3 (bag page slow 5–11s, a known perf item, but up). Stale anomaly alert.
- 2026-07-15 · notifications@github.com · CI/job failed — Fashionphile enrichment (condition + fields) · **needs your eyes** — intermittent `canceling statement due to statement timeout` (57014); the timeout fix (b3c6171) already landed and the job succeeded between failures. Non-user-facing enrichment job. Not guessing at the residual slow query. No PR.
- 2026-07-14 · no-reply@awin.com · program approve — myGemma (aid 59483) · **PR** — Awin membership now active; §11 board still said "pending". Flipped board rows to APPROVED 2026-07-14 (myGemma already wired via the Awin feed).
- 2026-07-14 · notifications@vercel.com · outage/route-error (500 on /brand/[brandId]) · **already resolved, no action** — verified live 200 x3 (~2.5s). Stale anomaly alert.
- 2026-07-14 · noreply@supabase.com · security advisory — RLS disabled ("Table publicly accessible", project pewmdztviyrtbhtebcct) · **needs your eyes** — DB row-level-security is hers to set; can't tell if the public table is intentional. Weekly advisor notice, not a live exploit. No PR, no ping. Resolve in Supabase → Advisors → Security.
- 2026-07-14 · notifications@github.com · CI/job failed — Daily data health · **already resolved, no action** — recovered on the 2026-07-14 21:19 run (latest is green).
- 2026-07-14 · forwarding-noreply@google.com · config/consent — arielle@luxurycatalog.com → Gmail forward confirmation · **needs your eyes** — the engine depends on this forward (§0). Owner-level consent to accept; benign. Click confirm in Gmail if you want Workspace mail to keep landing here.
- 2026-07-14 · joe@posthog.com · newsletter/marketing · **dropped** — names no change we use.
- 2026-07-13 · noreply@supabase.com · payout/spend — org Luxury Catalog exceeded usage quota · **ledger-only** — known free-tier ceiling (Disk IO / Fluid CPU, being worked via ISR de-cooking). A usage record, no action here.
- 2026-07-13 · notifications@github.com · CI/job failed — Refresh myGemma handbag listings (Shopify feed) · **already resolved, no action** — that workflow was retired; myGemma now refreshes via the Awin feed (all recent "Awin feed" runs green).
