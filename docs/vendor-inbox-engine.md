# Vendor inbox engine — standard

*The runbook the `vendor-inbox-scan` scheduled agent reads on every run. It is the
sensor for the "tool/vendor mail arrives → something acts on it" loop the owner asked
for. Twice-daily. Autonomous to the PR / doc-draft / ledger + phone-ping line; the
owner merges, spends, rotates keys, and replies. Fits the §3 safety line in
[automation-map.md](automation-map.md).*

## §0 Where the mail lives (the one dependency)

Vendor/tool mail all lands in **ariellecoambes@gmail.com** — the personal Gmail already
wired to the Gmail connector. Most vendors mail there directly; the
arielle@luxurycatalog.com Workspace mail is auto-forwarded there too (owner set the
forward). So the engine reads the ONE connected personal Gmail; no second connector.
If the Gmail connector is not available in the run, the engine can do nothing: write one
ledger line "inbox connector unavailable, skipped" and stop. It never guesses at mail it
cannot read. (Forwarded mail keeps the original sender, so the §1 sender scope still
matches it.)

## §1 What counts as a vendor/tool email (sender scope)

Only act on mail from the tools that run Luxury Catalog. Everything else is ignored.

- **Affiliate networks + programs:** Awin, CJ / Commission Junction, Impact,
  Fashionphile, Redeluxe / GoAffPro, myGemma, Ann's Fabulous Finds, Couture USA.
- **Data + infra:** Apify, Firecrawl, Supabase, Vercel, GitHub, Google Search Console,
  PostHog.
- **Content + ops:** Metricool, Notion.

If a sender is new but clearly one of these tools (e.g. a sub-domain), treat it as
in-scope and note it in the ledger so the list can grow.

## §2 Classify each new email (one bucket per message)

| Bucket | Looks like | The engine's action (to the gate line) |
|---|---|---|
| **feed/adapter broke** | feed URL moved, SFTP retired, schema changed, listings 404 | Diagnose against the adapter/script, open a fix PR, ledger it, ping |
| **key/auth expiring** | API key rotation, token expiry, re-auth required | Update refs + open PR, ledger it, ping (she rotates the actual key) |
| **CI/job failed** | GitHub Action red, cron capture failed, deploy error | Diagnose, open a fix PR, ledger it, ping |
| **outage/incident** | provider status, degraded, maintenance window | Check the health scorecard, ledger it, ping only if it hits us now |
| **program approve/decline** | affiliate application result, network status change | Update `docs/data-collection-handoff.md` §11 board on a branch → PR |
| **terms/policy change** | fee change, commission change, ToS update | Hand to the venue-terms loop: note it as a due cell, ledger it |
| **payout/invoice/spend** | payout notice, invoice, billing, overage | Ledger it only (a spend record). Never pay. |
| **newsletter/marketing** | product news, digests, "what's new" | Ledger a one-line note if it names a change we use; else drop |

Never invent the bucket. If a message is ambiguous, file it as a ledger line under
"needs your eyes" and ping — do not open a PR on a guess.

## §3 How it acts (autonomous to the gate line)

Work in `/Users/ariellecoambes/Documents/luxury-catalog`. Branch off `origin/main`
(`git checkout -b ops/vendor-inbox-$(date +%m%d) origin/main`); never `git checkout
main`. `npm ci` if node_modules is stale.

- **Code fixes** (feed/adapter/CI/key-ref): make the change, run the gates
  (`npx tsc --noEmit`, `npx eslint src`, `npm test`), open a PR with `gh pr create`.
  Plain-language body: what broke, the email that flagged it (sender + date), the fix,
  what she still has to do (merge; rotate the key in Vercel/dashboard; approve spend).
  NEVER merge. NEVER `land-to-main.sh`. The PR is her gate.
- **Doc updates** (program board, terms-due, ledger): edit on the branch, same PR.
- **Nothing to fix** (outage FYI, payout, newsletter): ledger only.

## §4 The ledger (memory — every run's first read)

Append to [vendor-inbox-ledger.md](vendor-inbox-ledger.md). One dated block per run:
each email as `date · sender · bucket · action taken (PR #NN / ledger-only / needs your
eyes)`. This is how the next run avoids re-acting on the same mail — skip anything
already logged. Commit the ledger on the PR branch (or push to main only if the run
produced no PR, best-effort, never forced).

## §5 Urgent-push thresholds (when it pings the phone)

Ping (one line + a pointer) only when something is actively costing us now:

1. A live data feed is broken (myGemma/TLC/TRR listings down) → revenue-surface pages
   go thin.
2. A key expired or expires within 48h → a pipeline is about to stop.
3. A GitHub Action / daily capture has failed 2+ runs.
4. A provider outage is hitting a surface that is live to users.

Everything else waits silently in the ledger + PR for her next look. Payouts,
newsletters, and unchanged-terms confirmations never ping.

## §6 The safety line (never crossed)

Merges, spend/payment, key rotation, replies to vendors, DB migrations, DNS, published-
number changes: **hers.** The engine runs to the PR / draft / ledger + ping and stops.
