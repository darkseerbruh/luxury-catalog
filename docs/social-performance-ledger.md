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
| 2026-07-07 | TT:7660204296478166303 / IG:DaibTf-FYa- | IG reel+TT | hero / data explainer | Chanel 2026 starter map | formula:data-explainer | "new to Chanel and your feed's a mess" | slides:chanel-2026-map | in-app (not captured) | spoken key "chanel 2026" + link-bio | key:chanel-2026 | tags:chanel-core (#chanel25 +5) | no | one-screen "map + real prices" explainer travels + drives the spoken key (measured post, backfilled at analysis) |
| 2026-07-06 | TT:7659477382461426974 | TT (carousel) | hero / data carousel | Lady Dior size pricing (TT arm of 346134521) | formula:data-carousel-7 | "you'd think the biggest bag costs the most" | slides-v4:lady-dior-sizes | in-app | save + link-bio | none | tags:brand+resale-core | no | TT arm of the seed; counterintuitive flip earns cold forYou reach |
| 2026-07-07 | TT:7660280690914626829 / IG:DajEYQBAsV7 | IG reel+TT | keep-warm / b-roll reel | "which bag feels most like you" | formula:keepwarm-broll | "Both! tell me the bag that makes you feel most like you" | broll:scenery | in-app | follow (+ soft engage) | none | tags:bagtok-core | no | question-hook keep-warm invites comments + follows |
| 2026-07-06 | TT:7659909655946153229 / IG:DagfgCvDus3 | IG reel+TT | keep-warm / b-roll reel | "you, this view" | formula:keepwarm-broll | "you, this view, and the bag you keep coming back to" | broll:scenery | in-app | follow | none | tags:quietluxury-core | no | reflective-register keep-warm earns follows on aspirational scenery |
| 2026-07-06 | TT:7659538661620403469 / IG:Dad6w_DgbQt | IG reel+TT | keep-warm / text-card | love language (handbag edition) | formula:text-card | "what's your love language? mine's Words of Authentication…" | broll:IMG_5193 (black Chanel bag, car seat) | in-app | comment/engage | none | tags:chanel+bagtok | no | funny "ask-a-question" text-card invites "which one's yours" replies |

> **Published-post note (2026-07-09):** Metricool groups both network arms under one
> internal postId only for posts it still holds as scheduled. For already-PUBLISHED posts
> the scheduled endpoint returns nothing, so measured posts above are keyed by their stable
> platform ids (TikTok video id / IG reel shortcode). The seed row (346134521) keeps its
> Metricool id since it was known at draft time.

## Scheduled runway inventory (owner-built, live in Metricool — pulled 2026-07-09)

*Replaces the first-run BACKFILL note. Rationale: the ~90 scheduled posts are the OWNER'S
own work — she created and activated all of them herself in Metricool on 2026-07-06
(`draft:false`, `autoPublish:true`, each with a TikTok sound picked). The engine did not
create them and must never modify them (§7). Per-post ledger rows are added as each post
PUBLISHES and earns a verdict — that is when ingredient→performance attribution is real.
Backfilling 90 pre-performance rows the owner already owns would bloat the ledger against
the anti-bloat rule and duplicate Metricool, which is the source of truth.*

- **Volume + span:** ~90 posts, 2026-07-09 → 2026-09-06, every one IG + TikTok. Cadence
  ~2–3/day in July, easing through August. Metricool ids run 346251301 → 346757918.
- **Tier mix** (65 sampled from the 07-09→07-24 and 08-09→09-06 windows; the 07-25→08-08
  stretch is the data-heaviest): ~34 keep-warm b-roll reels · ~20 hero data-carousels ·
  ~5 other carousels · ~4 authentication-marker carousels · 1 taste-quiz · 1 hot-take.
  A deliberate explore/exploit calendar — keep-warm front-loaded, data-carousels
  concentrated late-July → early-August.
- **Sound rotation** (uses across the 65 sampled): Sunshine 7 · LINK! 6 · Rush / Salt And
  Water Feels / Hey Honey / FOCUS ON THE PROCESS / The Jazzy Flow / About You / Kome On /
  Make It Look Sexy 5 each · i think i'm addicted 4 · Dior 3 · Sexy and fantastic chill-out 3.
  Founder/talking reels carry `soundVolume 18` (music ducked under her voice, per the sound
  standard); faceless carry `50`.
- **Runway status: FULL** through early September. The engine adds NO posts this run (§7:
  keep 1–2 weeks, never bulk-dump) and flags rather than piling on.

## Ingredient scorecard

*Cross-post rollup per §5b: promote proven ingredients, retire consistent
losers (only after a clean one-variable test). Everything here is n<3 and ≤3 days
live — directional priors only, nothing promoted or retired.*

| ingredient | type | uses (n) | median primary vs baseline | status | since |
|---|---|---|---|---|---|
| formula:data-reveal (carousel/explainer) | formula | 2 published | ~17× & ~3× TT view-median (reach); saves/search-key not yet earned | neutral (early-positive — promote at n≥3 if it holds) | 2026-07-09 |
| formula:keepwarm-broll | formula | 3 published | ~1× TT view-median; PRIMARY metric (follows-per-reach) not in this field pull | neutral (metric pending — pull follows next run) | 2026-07-09 |

## Verdicts

*Baseline: all-account medians (n<8 per segment, so no segment medians yet, §2). Pull
2026-07-09; published window 2026-07-06→08, so ≤3 days live — directional reads, not locked
verdicts. Account medians this pull: TikTok views ≈106 (n=5); IG reel reach ≈98 (n=4).*

- **TT:7659477382461426974 (Lady Dior size-flip, seed 346134521)** · ~3d · TikTok 1,851
  views ≈ **17× account median**, forYou 0.989, 33 likes, 1 share · **early OUTPERFORMER on
  distribution** · experiment: none produced (runway full) · why: the counterintuitive-data
  format travels cold on TikTok with almost pure algorithmic (forYou) reach. BUT full-watch
  0.0013 and TikTok search-key 0.0 → watch-through + routing are the open problem, not reach.
  n=1 for this format; watch the late-July data-carousels to confirm.
- **TT:7660204296478166303 / IG:DaibTf-FYa- (Chanel 2026 map)** · ~2d · TikTok 319 views ≈
  **3× median**, 21 likes, 2 shares, forYou 0.978; IG reach 120, 1 save · **SOLID+ (directional)**
  · the second data/explainer post and the second-best reach post — two data posts, two
  leaders. Reinforces the data-tier-travels read. Too fresh to lock.
- **TT:7659909655946153229 / IG:DagfgCvDus3 ("you, this view")** · ~3d · TT 106 views ≈ median;
  IG reach 49 · **INCONCLUSIVE** · keep-warm's primary metric is follows-per-reach (§3), which
  this field set does not return — cannot judge on its own terms yet. Not an underperformer.
- **TT:7660280690914626829 / IG:DajEYQBAsV7 ("Both! …feel most like you")** · ~2d · TT 102 ≈
  median; IG reach 77, viewRate 29.9 · **INCONCLUSIVE** · same reason (follows unread).
- **TT:7659538661620403469 / IG:Dad6w_DgbQt (love language)** · ~3d · TikTok **2 views**,
  forYou 0.059 (TikTok did not push it) — but IG reach 127 / 180 views / viewRate **38.1
  (best IG of the batch)** · **INCONCLUSIVE — platform split** · same post buried on TikTok,
  landed on IG: normal cold-start variance under ~200 followers. NOT a retire (one platform,
  no clean one-variable test).

**Meta-read (directional, 2026-07-09):** the two data/explainer posts are the account's top
two reach posts on TikTok; keep-warm reels sit at/below median. Early support that the
data tier travels cold — but tiers are judged on different primary metrics, so this is a
prior to test as the queued data-carousels publish, not a head-to-head verdict. The sharpest
open question the data raises: does forYou-driven reach (0.98) convert to follows + site
entries, or is it hollow reach? (Lady Dior: 1,851 views, search-key 0.)

## Open questions (drive the exploratory slots, §6b)

*What we don't know yet. Each ties to the experiment that would answer it;
weekly runs pick from here first and append new questions as they surface.*

- **Does high forYou reach convert, or is it hollow?** Lady Dior pulled 1,851 TikTok views at
  forYou 0.989 but search-key 0.0 and full-watch 0.0013. Watch whether the queued
  data-carousels repeat the reach AND whether any drive follows / site entries. (New, 2026-07-09
  — the run's #1 question.)
- **TikTok vs IG cold-start variance:** the same post can bury on TikTok (love language, 2
  views) and land on IG (127 reach). How many posts before segment medians (§2 n≥8) stabilize
  enough to trust a verdict? (New, 2026-07-09.)
- **Which rotated sounds correlate with reach?** 13 TikTok sounds are in rotation (see inventory).
  Once keep-warm posts reach ≥3 uses per sound, roll sound → reach into the scorecard. (New.)
- Keep-warm follows: aspirational vs reflective register? (Staged as a natural A/B across the
  keep-warm queue; read once both arms have ≥4 posts live AND follows are pulled — not in this
  field set.)
- Same data story as carousel vs as reel: which bridges better to the site (search-key / saves)?
  (Lady Dior carousel traveled; still need a reel-format data post to compare.)
- Does the spoken search key produce more site entries than "link in bio" on matched posts?
  (PostHog `social_key` vs `/social` landings — PostHog not wired in this worktree; site is
  pre-launch so entries ≈0 for now.)
- Question-hook cover vs statement cover on carousels: which earns more saves?

## Pending Notion sync

*(empty — no experiments spawned this run: n is at the §2 floor and the runway is full, so
there is nothing to produce or greenlight yet. Experiments resume once the data-carousels
publish and a ≥3-day verdict clears the bar.)*

## Run summaries

- 2026-07-13 · **PULSE** (Metricool reachable; the standing "requires authentication" notice was stale — getBrandSettings + both analytics pulls + scheduled pull all succeeded). Pulled last-7-days TikTok (11 rows) + IG-reel (8 rows) analytics and the near-term runway. No PostHog (site pre-launch, creds analyst-only).
- 2026-07-13 · BREAKOUT: none new. Lady Dior (1,872 TikTok views) and the Chanel-2026 map (393) are the same established leaders already read + logged 07-09; nothing new this window is ≥3× its segment baseline on primary metric, so no fast-follow. (Note for Thursday: "What's your love language" TikTok buried at 7 views / forYou 0.043 while its IG twin pulled 142 reach — a clean cold-start-variance data point for that open question; no verdict, small-n + pulse doesn't write verdicts.)
- 2026-07-13 · RUNWAY: FULL. ~28 owner-built posts in the next 10 days alone (07-13→23, all autoPublish + draft:false), dense through Sept. 0 top-ups, 0 drafts, 0 posts modified. Nothing urgent → no notification.
- 2026-07-09 · **WEEKLY — first real analysis run** (Metricool reachable this time; getBrandSettings + analytics + full scheduled pull all succeeded). Pulled IG-reel (n=4) + TikTok (n=5) analytics for the 5 published posts (window 07-06→08, ≤3 days live) and the full owner-built runway (~90 posts to 09-06). PostHog enrichment skipped (creds live only in the analyst worktree; site pre-launch).
- 2026-07-09 · Read: the two data/explainer posts are the account's early reach leaders on TikTok (Lady Dior 1,851 views ≈17× median at forYou .989; Chanel 2026 map 319 ≈3×); keep-warm reels cluster at/below median but their primary metric (follows) was not in the field pull. Small-n, directional — no verdicts locked, none retired. Logged 5 published rows + 2 scorecard seeds; replaced the BACKFILL note with a runway inventory (owner built + activated the whole queue herself; per-post rows added as each publishes).
- 2026-07-09 · Actions: 0 posts created (runway FULL through Sept — flag, don't add), 0 experiments spawned (n at floor + can't produce into a full queue), 0 posts modified (never touch her scheduled posts). Nothing urgent → no notification. Next run: pull follows / profile-visits for keep-warm + IG-carousel metrics for Lady Dior, and watch the late-July data-carousels as they go live.
- 2026-07-06 · engine built this session; no analysis run yet (n=1 published post, below the n=4 floor in §2).
- 2026-07-06 · weekly run SKIPPED — Metricool MCP unreachable (getBrandSettings 503 / OAuth not available in unattended session). No analytics pulled, no drafts created.
- 2026-07-06 · PULSE run SKIPPED (log-and-skip per social-performance.md §7). Metricool server instructions present in context but every tool call ("No such tool available": getScheduledPosts, getBrandSettings, getAnalyticsAvailableMetrics, getAnalyticsDataByMetrics, createScheduledPost). Tools not exposed in this session's namespace. BREAKOUT: could not pull last-7-days analytics, no breakout detectable, no fast-follow drafted. RUNWAY: could not read scheduled-ahead count, no top-ups pushed. No fabricated data, no blind drafts. Recurring failure mode (2nd unattended run blocked on the same wiring); needs the Metricool MCP tool namespace fixed before an engine run can execute.
- 2026-07-06 · CORRECTION to the line above (verified from a session that DOES have Metricool tools). Two separate causes, not a namespace break: (1) the `social` subagent type's toolset does not include the Metricool MCP tools, so a run delegated to it can never call them — the pulse must call Metricool from the main engine session, or the social agent def needs the tools added; (2) Metricool's data API was returning intermittent 503s: `getBrandSettings` succeeded on retry, but `getScheduledPosts` and `getAnalyticsDataByMetrics` returned 503 on 5+ retries (server-side, Metricool's platform, not fixable here). PULSE still SKIPPED (no runway read, no analytics, no drafts). Small-n note: account's first post published 2026-07-06, so runway = only what's staged and breakout detection is premature regardless (n=1, below §2 floor); a blocked pulse today costs ~nothing. Retry the runway/breakout read once Metricool's API is responding, or let Thursday's weekly run cover it.
