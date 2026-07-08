# Article engine — the website's closed loop (demand → draft → her publish)

*Created 2026-07-06 (owner: "everything circular, self-updating"). The site twin
of `docs/social-performance.md`. Scheduled run: `article-engine-weekly`. Backlog
+ results ledger: `docs/article-backlog.md`. Cross-loop rules:
`docs/automation-map.md`.*

## §0 The loop

1. **Listen** to demand signals (§1). 2. **Score** them into the backlog (§2).
3. **Write** the top items to the full bar (§3-4). 4. **Stage** as DB `draft`
post rows (§4). 5. **She publishes** (§5 — the only human step). 6. **Measure**
what published articles do and feed the next cycle (§6).

## §1 Demand signals (sensors, in priority order)

| Signal | Where | What it says |
|---|---|---|
| `search_not_found` | analytics pulse (PostHog) | Someone wanted a page we don't have — the strongest article/data gap signal |
| `search_performed` + `social_key` entries | pulse | What social viewers come to read; winners deserve deeper/sibling articles |
| Social outperformers | `docs/social-performance-ledger.md` verdicts | A topic that stopped scrollers supports a full article (cross-feed rule) |
| Archivist slate | `docs/research-drafts/seasonal-archive/content-ideas.md` + monthly pull output | Sourced, GEO-ready material nobody else has |
| Trend terms | Notion Social Command Center (412+ append-only terms) | What the audience is searching on-platform |
| GSC queries | **not connected yet** (owner setup) | Real search demand; add when she wires it |

Small-n honesty: pre-launch, these are directional reads (state n + window).
A signal with zero evidence rows never fabricates demand ("never invent").

## §2 The backlog — `docs/article-backlog.md`

One line per idea: `title-idea · signal + evidence (date/n) · department ·
target persona · revenue lane it feeds · score · status
(💡 idea / ✅ ready / ✍️ drafted / 🔴 published / ⛔ dropped)`.
Score = demand evidence × revenue proximity × effort (the calendar's rubric).
Data-gap ideas that need capture first get a `→ data-content-worklist` pointer
instead of a draft (the data loop feeds this one).

## §3 The writing bar (all binding, no exceptions for automation)

- `docs/content-strategy.md` — worth-it bar, comparison bar, "answers one real
  decision + ends in a hand-off".
- FULL `docs/voice-and-tone.md` incl. §7b article rules + §8 slop sweep. No em
  dashes (tagline exception).
- `docs/data-analysis-standard.md` — every number fresh from OUR data with
  date/n/anchor, date-controlled sold prices; too-thin = say so or cut.
- `docs/authentication-standard.md` for any auth content; calibrated hedges on
  value/auth/money (estimate not appraisal, markers not verdicts).
- ENFORCED #11: no walls of text; lead line, short beats, lists, non-logo
  iconography through every narrative.
- Topic-tag by runtime name lookup, never hardcoded ids (locked 2026-06-30).
- No appreciation/return promises; no unsourced retail.
- **Renderer tokens only** (`src/app/articles/[slug]/page.tsx`): `## ` heads,
  `- ` lists, `> ` quotes, paragraphs, `**bold**`, and `[diagram: <id>]` for a
  REGISTERED id only. It does NOT render markdown tables or `---` rules, so
  convert every table to `- **Label:** value` bullet beats and never leave a
  `---` line (both print as literal text). Verified 2026-07-07.

## §4 Production (what a run may do alone)

- Draft via the `copywriter` subagent (it loads `brand-voice` itself); numbers
  pulled fresh from the DB in the run, never from memory.
- Stage each batch with a seed script following the CLEAN template
  (`supabase/seed/seed-archive-reference-articles.ts`, added 2026-07-07):
  `status: "draft"` set ONLY on the INSERT branch, the update row omits status
  entirely. Do NOT copy `seed-data-articles.ts` verbatim: it puts `status` in
  the shared row used for both insert and update, so a re-run silently flips a
  since-published article back to draft. Run with the local service key; if the
  key is unavailable, commit the ready script + flag it in the notification.
- Cap: **2 new articles per weekly run** (quality over volume) + any number of
  backlog updates.
- Charts only via existing component patterns; a chart needing new build work
  becomes a backlog note for an interactive session, not an engine improvisation.

## §5 The publish gate (hers, absolute)

The engine NEVER flips `draft` → `published`, never edits a published article's
claims, never touches the primary nav. She publishes via the author UI or the
`publish-articles.yml` action, exactly as today.

## §6 Measure + iterate (what makes it circular)

Each weekly run reads, for published articles (pulse + PostHog, once
`article_viewed` is in the pulse — an OPEN analyst decision as of 2026-07-06):
entries, search-key arrivals, outbound/affiliate clicks, quiz starts from
article CTAs. Winners spawn follow-ups: sibling comparisons, a deeper dive, a
social series (cross-feed → the social backlog). Losers get one packaging
retry (title/lead), then rest. Results append to `docs/article-backlog.md`
under `## Results log` with date + n.

## §7 Run + notification

`article-engine-weekly` (Tue morning): signals → backlog rescore → write ≤2 →
stage drafts → one short push ONLY if new drafts await her publish (titles +
"publish from the author UI when ready") or the run was blocked. Otherwise
silent. Metric: GEO/organic acquisition (the lead-channel bet) + lane-1
affiliate clicks per article.
