# Social performance + optimization standard (the engine's brain)

*Created 2026-07-06. How the automated social engine analyzes post performance,
decides what to iterate, feeds the backlog, and creates the next round without
owner input. The `social` agent runs this on the scheduled engine runs
(`social-engine-weekly`, `social-engine-pulse`). Companion to
`.claude/agents/social.md` (workflow + guardrails) and
`docs/social-content-calendar.md` (strategy + tiers).*

## §0 The loop (one sentence per stage)

1. **Measure** every published post through Metricool + PostHog.
2. **Judge** each post against the rolling account baseline for its network + format.
3. **Decide** the iteration experiment the signal calls for (decision tree, §4).
4. **Backlog** each experiment as a Notion Content Pipeline item (Source: `Analyst`).
5. **Create** everything faceless from the backlog; **film-ask** anything that needs her.
6. **Draft** finished posts into Metricool (`draft:true`); publishing stays owner-only.
7. **Log** hypothesis + outcome in the ledger (§5) so the next run learns.

## §1 Data sources (verified live 2026-07-06)

**Metricool** (MCP, blogId `6480195`, timezone `America/New_York`):

| Purpose | Network + connector | Field IDs to pull |
|---|---|---|
| Reel performance | instagram / reels | IGRE03 content, IGRE06 url, IGRE11 reach, IGRE09 interactions, IGRE12 saved, IGRE21 shares, IGRE23 views, IGRE24 avg watch time, IGRE27 retention, IGRE28 view rate |
| IG feed posts (carousels) | instagram / posts | date, content, url, reach, interactions, saved, shares (same connector pattern) |
| TikTok videos | tiktok / posts | TKPO05 description, TKPO03 url, TKPO07 views, TKPO08 likes, TKPO10 shares, TKPO13 full-watch rate, TKPO15 avg time watched, TKPO16 forYou, TKPO18 hashtag, TKPO21 search |
| Pinterest pins | pinterest / (pins connector) | impressions, saves, outbound clicks |
| Timing | getBestTimeToPostByNetwork | refresh monthly per network |

Re-check available metrics with `getAnalyticsAvailableMetrics` if a field errors;
never use fields marked Deprecated (IGRE13, IGRE15).

**PostHog** (site side, optional enrichment; skip gracefully if not configured):
`search_performed` with `social_key` = a viewer typed a spoken key from a post
(the strongest social→site signal we have); quiz starts/completes; `/social`
landings; `outbound_resale_clicked`. Pull via the existing analytics scripts
(`npm run analytics:pulse`) when available.

**Post metadata** comes from `getScheduledPosts` (captions, media, dates,
network data) joined with the ledger rows the engine writes at draft time (§5).
The caption alone never tells you the visual or CTA type; the ledger does.

## §2 Small-n honesty (binding while the account is young)

- First post published 2026-07-06; for weeks every read is an **early directional
  read, not a verdict**. State n and the date window on every conclusion.
- A post needs **≥3 full days live** before it gets a verdict; before that it is
  "too fresh" (the pulse run may still fast-follow a breakout, §6).
- Minimum baseline: once **n≥8 posts** exist for a network+format, use the rolling
  median of that segment; below that, use the all-account median; below n=4
  overall, analysis writes observations only, no experiments.

## §3 What "good" means per tier (primary metric first)

| Tier / format | Primary | Secondary | Ignore in isolation |
|---|---|---|---|
| Keep-warm (b-roll reels) | follows per reach | avg watch time, view rate | likes |
| Hero (data slideshows / text-cards) | saves + shares | search-key entries (PostHog), retention | raw views |
| Signature (founder/persona) | profile visits → follows | comments worth a reply | likes |
| Site-bridge posts (worth/quiz/compare) | search-key entries + quiz starts | saves | reach |

Verdicts per post (vs. its segment baseline, ≥3 days live):
**outperformer** ≥2× baseline on primary · **solid** 0.8–2× · **underperformer**
≤0.5× with reach above the segment floor · else **inconclusive**.

## §4 The iteration decision tree (signal → ONE-variable experiment)

Diagnose in this order; the first matching row wins. Every experiment changes
exactly ONE variable so the result is attributable.

| Signal (vs. baseline) | Diagnosis | Experiment |
|---|---|---|
| High retention/full-watch, LOW reach | Distribution problem, content fine | Same post concept → **new hashtags/keywords** (swap the tag set, incl. TikTok search phrasing) or **new posting time** (best-time data). TKPO18/TKPO21 low → lean search terms. |
| High reach, LOW view rate / watch time | Packaging problem (first 2 s) | **Same messaging → new visual/hook**: new cover question, new opening clip, same script. |
| High watch time, LOW saves/shares | Payoff problem | **Same visual → new messaging**: sharpen the counterintuitive claim or the save-worthy payoff; script changes, footage stays. |
| Good engagement, LOW search-key entries | Routing problem | **Same post → different CTA**: swap rung on the CTA ladder (follow ↔ save ↔ spoken search key ↔ quiz), or move the key earlier. |
| forYou share high, follows flat (keep-warm) | Warm but anonymous | Same b-roll family → messaging variant that says who we are (identity line before the follow cue). |
| **Outperformer** on primary | It works; make it a family | Clone BOTH ways as separate backlog items: (a) same messaging × new visuals, (b) same visuals × new messaging. Set `Takes` on the kit; space variants ≥2 weeks apart (rolling cadence, locked 2026-07-02). |
| Underperformer twice (same concept, 2 takes) | Concept, not packaging | Retire the concept (⛔ Hold in Notion, reason in memo). Don't burn a third take. |
| Search-sourced views high (TKPO21) | SEO surface found | New backlog item: answer-the-search follow-up on the same topic (hero tier). |

Timing and hashtags are cheap experiments (caption/schedule only); visuals are
mid-cost (re-render, same assets); new footage is expensive (film-ask). Prefer
cheap → mid → expensive when signals tie.

## §5 The experiment ledger (append-only, the engine's memory)

Lives at `docs/social-performance-ledger.md`. One table row per post at draft
time + one row per verdict at analysis time. Schema:

```
| date | postId | network | tier/format | topic/kit | hook (short) | visual source | CTA type | search key | tags (n) | face? |
```

Verdict rows append: `postId · age (days) · primary metric vs baseline · verdict ·
experiment spawned (Notion item) or "none" · one-line why`. Every number carries
its date + n. Never delete rows (historical data points are permanent, owner
rule). Runs also append a 3-line run summary (posts read, verdicts, experiments
written).

## §6 Backlog contract (Notion Content Pipeline is master)

- Engine writes experiments to the **Notion Content Pipeline**
  (`Social Command Center → Content Pipeline`): `Source: Analyst`,
  `Greenlight memo` = hypothesis + parent postId + the ONE variable changed,
  `Score` per the calendar's scoring rubric, `Metric` = the metric it moves.
- **Auto-greenlight** (engine may set ✅ Greenlit and produce without asking):
  one-variable variants of a **solid-or-better** parent post, faceless, all hard
  guardrails passable. Everything else (new concept families, anything
  face/voice-dependent, anything touching value/auth claims without existing
  sourced data) enters as 💡 Spark / 🎯 Scored for her pass.
- **Film-asks:** when the winning direction needs her face, voice, or new
  footage, the engine adds a pipeline item with `Greenlight memo` starting
  `FILM ASK:` + a one-line brief (what to film, why the data says so, ~how long),
  and surfaces it in the run notification. Film-asks never block faceless output.
- If the Notion MCP is unavailable in a run, append the items to the ledger
  under `## Pending Notion sync` and sync them the next run that has Notion.

## §7 Creation + draft contract (what the engine may do alone)

MAY, without owner input: run analysis; write backlog items + the ledger; create
**faceless** content within the locked design rules (b-roll reels + text-cards
via `tools/video-pipeline`, data slideshows per `docs/social-slideshow-hooks.md`
+ design v4, campaign/directory imagery per its clearance); host media via the
GitHub-release flow; push posts to Metricool with **`draft:true` +
`autoPublish:false`**; keep the runway at **1–2 weeks of scheduled-ahead
drafts** (rolling, never bulk-dump).

NEVER, under any signal: publish or flip a draft live; change the date/privacy
of a post she already scheduled; comment/reply/DM; exceed the plan's monthly
post cap (flag instead); create talking-head or AI-generated video; ship a post
that fails any hard guardrail in `.claude/agents/social.md`.

Every created post passes the full existing bar before drafting: brand-voice
skill + §8 slop sweep, live-page link verified, search key registered + QA gate
(`docs/social-routing.md`), sourced numbers with date/n, one ledger row written.

## §8 Runs + cadence

- **`social-engine-weekly`** (Thu morning): full loop §0 steps 1–7, notification
  with the one-line read + film-asks (if any).
- **`social-engine-pulse`** (Mon morning): light. Detect breakouts (a <7-day post
  ≥3× segment baseline on primary): if found, fast-follow variant drafted while
  the window is open. Check the draft runway; top up from Greenlit backlog if
  under 7 days. Silent unless something happened.
- Notifications follow the analyst pattern: the phone is a high bar; a run that
  found nothing says nothing.
