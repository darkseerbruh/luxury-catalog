# Automation map — every loop, and how they feed each other

*Created 2026-07-06 (owner: "I want everything to be circular, self-updating").
The one-page registry of the business's closed loops. Every engine reads this;
the cross-feed rules in §2 are binding on every scheduled run.*

## §1 The loops

| Loop | Sensor | Decider (standard) | Actor (run) | Memory (ledger) | Her gate |
|---|---|---|---|---|---|
| **Social engine** | Metricool + PostHog `social_key` | `social-performance.md` | `social-engine-weekly` (Thu) + `-pulse` (Mon) | `social-performance-ledger.md` | Flip a Metricool draft live |
| **Article engine** | pulse (`search_not_found`, article reads) + backlogs | `article-engine.md` | `article-engine-weekly` (Tue) | `article-backlog.md` | Flip a DB draft → published |
| **Analyst + implementer** (three lenses: analyst · marketer · UX reviewer, §7; monthly persona walk) | `npm run analytics:pulse` | `analyst-standard.md` (§6 implementer, §7 lenses) | `analyst-daily-scan` + `analyst-weekly-brief` (Mon, implements ≤3 `Class: AUTO`) | `analyst-decisions.md` | `Class: OWNER` decisions |
| **Archivist pull** | seasonal-archive worklist | archive conventions | `archivist-monthly-pull` (1st + 15th) | `research-drafts/seasonal-archive/` | none (doc-only, sourced) |
| **Market data → site** | Firecrawl/FP captures | `capture-runbook.md` | GitHub Actions (daily/monthly) | DB `price_history` | none (pages live-query) |
| **Content freshness** | quarterly re-review | `freshness-runbook.md` | `quarterly-content-freshness-review` | freshness report | ALL number changes (by design) |
| **Market report** (monthly "State of the Resale Market") | DB `price_history` | factuality protocol (n-gated in `market-report-core.ts`) | `market-report-monthly` (1st): `npx tsx scripts/market-report.ts --write` | `docs/research-drafts/market-reports/` | ALL publishes (draft-only by design) |

Still open, waiting on her: **comment engagement** (needs a non-Metricool pipe,
e.g. Apify free tier), **GSC query data → article engine** (GSC itself IS connected: domain verified + sitemap submitted 2026-06-22, desktop-todo D1; what is missing is the queries pipe, via CSV export or API grant). *(Newsletter
opt-in SHIPPED 2026-07-06 — capture live once migration `0045` is applied;
sending/campaigns still to build with the first send.)*

## §2 Cross-feed rules (binding; this is what makes it a flywheel)

1. **Social winner → article.** A social outperformer with no covering article
   becomes an `article-backlog.md` item (the social run writes it; evidence =
   the verdict line).
2. **Article winner → social series.** An article drawing entries/clicks spawns
   a social kit idea in the Notion pipeline (the article run writes it).
3. **`search_not_found` → data capture.** Site searches for bags/pages we lack
   become `data-content-worklist.md` capture targets (article run writes the
   pointer; the data loop's standing pass picks them up).
4. **Archivist → both content engines.** Monthly pull findings land as backlog
   items with evidence pointers (archivist run writes them).
5. **Analyst → every engine.** Instrumentation gaps and funnel findings become
   `Class: AUTO` fixes (implemented) or OWNER decisions; engines trust the
   pulse the analyst keeps honest.
6. **Every loop leaves a dated, n-carrying trail in its ledger** — the next
   run's first read. No verbal handoffs, no chat-only state.

## §3 The shared safety line (never crossed by any engine)

Publishing, DB migrations, spend, email to humans, DNS, published-number
changes, primary-nav changes: **hers**. Engines run to the draft/report line,
gates green, evidence in the ledger.
