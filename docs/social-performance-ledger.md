# Social performance ledger (append-only)

*The engine's memory. Schema + rules: `docs/social-performance.md` §5. One
metadata row per post at draft time; verdict lines appended at analysis time.
Rows are permanent historical data points — never deleted, never called stale.*

## Post metadata

*A post = its ingredient combination (formula + hook + visual + audio + CTA +
tag set); use stable reusable ingredient names, per §5 of the standard.*

| date | postId | network | tier/format | topic/kit | formula | hook (short) | visual (clip/set) | audio | CTA type | search key | tag set | face? | hypothesis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-07-06 | 346134521 | IG+TT | hero / data carousel | Lady Dior size pricing | formula:data-carousel-7 | "You'd think the biggest bag costs the most" | slides-v4:lady-dior-sizes | none/native | save + link-in-bio | none | tags:brand+resale-core (#ladydior +6) | no | counterintuitive price-flip data earns saves (baseline seed, first post) |

## Ingredient scorecard

*Cross-post rollup per §5b: promote proven ingredients, retire consistent
losers (only after a clean one-variable test). Empty until ingredients reach
n≥3 uses with verdicts.*

| ingredient | type | uses (n) | median primary vs baseline | status | since |
|---|---|---|---|---|---|

> **BACKFILL (first engine run):** pull every post from `getScheduledPosts`
> (blogId 6480195, window 2026-07-06 → 2026-09-06) and `tools/video-pipeline/reels-log.md`,
> add one metadata row each (staged drafts included, marked `draft`). ~60 items
> as of 2026-07-06.

## Verdicts

*(none yet — first post published 2026-07-06; verdicts need ≥3 days live, §2)*

## Open questions (drive the exploratory slots, §6b)

*What we don't know yet. Each ties to the experiment that would answer it;
weekly runs pick from here first and append new questions as they surface.*

- Keep-warm follows: aspirational lines vs reflective lines? (Already staged as
  a natural A/B — the 20 keep-warm drafts alternate registers by odd/even date;
  read it once both arms have ≥4 posts live.)
- Same data story as carousel vs as reel: which bridges better to the site
  (search-key entries / saves)?
- Does the spoken search key produce more site entries than "link in bio" on
  otherwise-matched posts? (PostHog `social_key` vs `/social` landings.)
- Question-hook cover vs statement cover on carousels: which earns more saves?
- Does a trending audio lift keep-warm reach vs original/native sound, holding
  footage + copy?

## Pending Notion sync

*(empty)*

## Run summaries

- 2026-07-06 · engine built this session; no analysis run yet (n=1 published post, below the n=4 floor in §2).
- 2026-07-06 · weekly run SKIPPED — Metricool MCP unreachable (getBrandSettings 503 / OAuth not available in unattended session). No analytics pulled, no drafts created.
- 2026-07-06 · PULSE run SKIPPED (log-and-skip per social-performance.md §7). Metricool server instructions present in context but every tool call ("No such tool available": getScheduledPosts, getBrandSettings, getAnalyticsAvailableMetrics, getAnalyticsDataByMetrics, createScheduledPost). Tools not exposed in this session's namespace. BREAKOUT: could not pull last-7-days analytics, no breakout detectable, no fast-follow drafted. RUNWAY: could not read scheduled-ahead count, no top-ups pushed. No fabricated data, no blind drafts. Recurring failure mode (2nd unattended run blocked on the same wiring); needs the Metricool MCP tool namespace fixed before an engine run can execute.
- 2026-07-06 · CORRECTION to the line above (verified from a session that DOES have Metricool tools). Two separate causes, not a namespace break: (1) the `social` subagent type's toolset does not include the Metricool MCP tools, so a run delegated to it can never call them — the pulse must call Metricool from the main engine session, or the social agent def needs the tools added; (2) Metricool's data API was returning intermittent 503s: `getBrandSettings` succeeded on retry, but `getScheduledPosts` and `getAnalyticsDataByMetrics` returned 503 on 5+ retries (server-side, Metricool's platform, not fixable here). PULSE still SKIPPED (no runway read, no analytics, no drafts). Small-n note: account's first post published 2026-07-06, so runway = only what's staged and breakout detection is premature regardless (n=1, below §2 floor); a blocked pulse today costs ~nothing. Retry the runway/breakout read once Metricool's API is responding, or let Thursday's weekly run cover it.
