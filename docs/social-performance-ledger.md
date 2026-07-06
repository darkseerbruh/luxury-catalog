# Social performance ledger (append-only)

*The engine's memory. Schema + rules: `docs/social-performance.md` §5. One
metadata row per post at draft time; verdict lines appended at analysis time.
Rows are permanent historical data points — never deleted, never called stale.*

## Post metadata

| date | postId | network | tier/format | topic/kit | hook (short) | visual source | CTA type | search key | tags (n) | face? |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-07-06 | 346134521 | IG+TT | hero / data carousel (7 slides) | Lady Dior size pricing | "You'd think the biggest bag costs the most" | in-session slide renders (design v4) | save + link-in-bio | none | 7 | no |

> **BACKFILL (first engine run):** pull every post from `getScheduledPosts`
> (blogId 6480195, window 2026-07-06 → 2026-09-06) and `tools/video-pipeline/reels-log.md`,
> add one metadata row each (staged drafts included, marked `draft`). ~60 items
> as of 2026-07-06.

## Verdicts

*(none yet — first post published 2026-07-06; verdicts need ≥3 days live, §2)*

## Pending Notion sync

*(empty)*

## Run summaries

- 2026-07-06 · engine built this session; no analysis run yet (n=1 published post, below the n=4 floor in §2).
- 2026-07-06 · weekly run SKIPPED — Metricool MCP unreachable (getBrandSettings 503 / OAuth not available in unattended session). No analytics pulled, no drafts created.
- 2026-07-06 · PULSE run SKIPPED (log-and-skip per social-performance.md §7). Metricool server instructions present in context but every tool call ("No such tool available": getScheduledPosts, getBrandSettings, getAnalyticsAvailableMetrics, getAnalyticsDataByMetrics, createScheduledPost). Tools not exposed in this session's namespace. BREAKOUT: could not pull last-7-days analytics, no breakout detectable, no fast-follow drafted. RUNWAY: could not read scheduled-ahead count, no top-ups pushed. No fabricated data, no blind drafts. Recurring failure mode (2nd unattended run blocked on the same wiring); needs the Metricool MCP tool namespace fixed before an engine run can execute.
- 2026-07-06 · CORRECTION to the line above (verified from a session that DOES have Metricool tools). Two separate causes, not a namespace break: (1) the `social` subagent type's toolset does not include the Metricool MCP tools, so a run delegated to it can never call them — the pulse must call Metricool from the main engine session, or the social agent def needs the tools added; (2) Metricool's data API was returning intermittent 503s: `getBrandSettings` succeeded on retry, but `getScheduledPosts` and `getAnalyticsDataByMetrics` returned 503 on 5+ retries (server-side, Metricool's platform, not fixable here). PULSE still SKIPPED (no runway read, no analytics, no drafts). Small-n note: account's first post published 2026-07-06, so runway = only what's staged and breakout detection is premature regardless (n=1, below §2 floor); a blocked pulse today costs ~nothing. Retry the runway/breakout read once Metricool's API is responding, or let Thursday's weekly run cover it.
