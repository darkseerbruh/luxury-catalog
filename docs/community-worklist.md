# Community & UGC worklist (live queue)

*Execution queue for the community/UGC revamp. Strategy + phases:
`docs/community-workstream.md`. Per `preferences.md` rule 9: pick the top ⬜, do
it, commit, mark ✅ with a one-line result + date, drop to the next. A fresh chat
resumes from here.*

Status key: ⬜ todo · 🔄 in progress · ✅ done · ⏸️ blocked (needs owner) · 🅿️ parked

---

## ⚡ ACTIVE: bag-page community build (from `ux/bag-page-build-plan.md`)
*Owner said "do them all" then "Start. Keep going." on 2026-07-26. Autonomous run.
Commit after each unit. Resume from the first ⬜.*

- ✅ **Unit 1 — spec columns + promote spec facts** (`c8b4065`)
  Migration `0060` (weight_g, closure_type, pocket_count) + `promote-spec-facts.ts`.
  Dry-run yield: **closure 1,485 variants (~34%)**, dims 285 (~6.5%), 4,336 strings
  refused as unit-ambiguous. 13 new tests.
  ⏸️ **HER TURN: apply 0060, then run `npx tsx supabase/ingest/promote-spec-facts.ts --write`**
- ✅ **Unit 2 — shelf counts shown to everyone** (`9e90937`)
  `getShelfCounts` + `ShelfCountsPanel` under the save action. Counts public, action
  gated. Self-hides below 5 total. 5 new tests. Verified hidden on /bag/589 (prod
  closet is empty); populated state unverified for want of data.
- ✅ **Unit 3 — the six owner scales** (`cc0136c`)
  describe: structure · holds_up · dress_code · worth_it_where
  rate: access · price_value. `wears_well` merged into holds_up; Most-durable board
  now reads the axis. Verified all six render on /bag/589.
  ⏸️ **HER TURN: apply 0059** (rewritten to the six; still unapplied)
- ⬜ **Unit 4 — votable Reputation claims** (cold start + top engagement)
- ⬜ **Unit 5 — "reminds me of" three rails** (derived pass first)
- ⬜ **Unit 6 — shelf states + reasons** (add `tried`; `had` reason: sold/returned/
  gifted/rented/lost)
- ⬜ **Unit 7 — most-worn periodic check-in** (never a daily log)
- ⬜ **Unit 8 — one canvas + purchase context** (year/channel/price as a private note)
- ⬜ **Unit 9 — photo surfaces** (wear-and-tear timeline, what-fits)
- ⬜ **Unit 10 — age + trend scales** ⚠️ needs design + a copywriter pass first
  (ageism risk on youthful/grown-up; trend stored as a TIME SERIES)
- ⬜ **Unit 11 — repair referral surface** (no affiliate found; owner open to a
  custom partnership)

**Owner-held:** build quality (parked, has no derived source and was cut as an ask).

**Known gap, logged not hidden:** dimension coverage stays ~6.5% because only
myGemma's licensed feed states measurements. Full coverage needs a dedicated capture
pass against house or reseller product pages. Its own unit, not yet scheduled.

---

## Phase 0 — Verify & unblock ✅ CLEARED 2026-07-25
- ✅ **Prod probe: every UGC table is LIVE.** All 8 answered HTTP 200 via the anon
  key (`review`, `bag_axis_vote`, `bag_wear`, `bag_photo`, `correction`,
  `closet_favorite`, `post`, `closet_item`) and the `bag-photos` storage bucket
  lists 200. The human-gated migrations (0012, 0016, 0046) WERE applied. **Nothing
  is structurally dark; no migration needed.**
- ✅ **The real finding — the corpus is empty, not broken:**

  | Table | Rows | Gate |
  |---|---|---|
  | `review` | **0** | 0/25 → every review board hidden |
  | `closet_item` status=want | **0** | 0/25 → coveted rankings + nav hidden |
  | `bag_axis_vote` | 0 | owner bars render nothing |
  | `bag_wear` | 0 | carry/weight render nothing |
  | `bag_photo` | 1 | gallery ~empty |
  | `closet_favorite` | 0 | feed has no follow graph |
  | `post` (published) | **39** | ✅ the expert Journal IS populated |

  So the entire community layer is built, applied, and sitting at zero. This is
  purely a **cold-start/seeding problem**, which makes Phase 2 (Reputation +
  seeding) the whole game, not a supporting phase.
- 📌 Asset worth using: **39 published Journal posts** already exist. That is real
  expert content the community surfaces can lean on today.

## Phase 1 — Findability spine
*Reframed 2026-07-25 per the locked UX principle: reviews are reached THROUGH a bag,
so this is about making the owner-voice unmissable in context, NOT building a browse
destination. No "Reviews" nav item unless it earns one.*
- ⬜ Make the owner-voice unmissable ON the bag page (placement, prominence, value-prop line).
- ⬜ Reasons to reach bag pages: social-proof cues on cards/search results (once counts exist).
- ⬜ Clarify mislabeled surfaces (`/coveted-closets` titled "Leaderboards"; feed/closet buried).
- 🅿️ Community "pulse" hub — secondary showcase, NOT review-browse. Decide after the above.
- 🅿️ Primary-nav entry — parked pending the positioning decision.

## Phase 2 — Seed the cold start

### 2A. Reputation layer ("what's this bag's reputation?") — owner idea 2026-07-25
- ✅ 2026-07-25 **Proof of concept: Chanel 19** — CLEARED THE BAR. 11 sources
  (4 community, 3 commercial, 4 YouTube owner reviews) → a specific, honest,
  hedged ~250-word block. Full artifact + sourcing table:
  `research-drafts/reputation-poc-chanel-19.md`. Surfaced 3 pipeline requirements
  (commercial-vs-community source tagging; a mandatory "where owners disagree"
  beat; a recency stamp) and 2 transport facts (Reddit blocks Firecrawl → route via
  Apify; YouTube creator handles must be captured for attribution).
- ⏸️ **Owner judgement on the PoC** → then decide scope (icons-first vs. deeper tail),
  format (prose beats vs. character bars), refresh cadence, minimum-source bar.
- ✅ 2026-07-25 **AXES RE-DERIVED FROM EVIDENCE + SHIPPED TO THE BRANCH.**
  6 bags across tiers, ~100 sources → `research-drafts/axis-evidence-2026-07.md`.
  **OUT:** `versatility` (5 of 6 passes: ambiguous, means three different things),
  `roomy_vs_compact` (measures the variant, not the bag), plus `holds_value` and
  `worth_the_price` (already excluded in code; evidence confirms).
  **IN:** `structure`, `formality`, `access`, `upkeep`, `presence` — each in all
  six passes, each mapping to nothing in the old set.
  **The split:** 3 unipolar "rate" axes + 5 polar "describe" axes. Polar render as
  a marker on a track, never a fill bar (a fill would turn "slouchy" into a low
  score). Polar axes are also the ones web-consensus can honestly seed, which is
  what makes the Reputation layer share one scale with UGC.
  Files: migration `0059`, `src/lib/axes.ts`, `votes.ts`, `AxisVotes.tsx`,
  `ClosetAddFlow.tsx`, `contribution-slots.ts`. Gate green (tsc, lint 0 errors,
  898/898); verified rendering on `/bag/589`.
- ⏸️ **YOUR TURN: apply migration 0059** (Actions → "Apply database migrations" →
  Run workflow). Until then the app offers axis names the DB enum does not have,
  so a vote cast on a new axis would fail. Display is unaffected (0 votes).
- ⬜ **Follow-up surfaced:** `review.durability_rating` and a "how it ages" axis
  ask the same question. Kept durability_rating (it feeds the Most durable
  leaderboard) and did NOT add a duplicate axis. Unify the two into one system,
  or leave the split as build-quality-on-arrival + durability-over-time.
- 🅿️ **Also surfaced, not built:** capture ownership status + purchase year/channel
  (+ optionally height) alongside each vote, or aggregates are noise. Evidence: a
  vintage Flap buyer (~$2k) and a boutique-today buyer (~$10.8k) rate the same bag
  differently, and the two highest-engagement Birkin threads are from non-owners.
  Ownership can be DERIVED from `closet_item` at read time (no new column, no
  added friction) — that is the cheap first move.
- 🅿️ **Brand-level home needed** for acquisition friction, SA attitude, returns/
  duties, repairability, counterfeit density. Real decision drivers, but per-bag
  they would pollute every model a house makes.

### Superseded: the original axis-verification question
- ✅ **VERIFY THE AXES (owner challenge, 2026-07-25)** — are the 7 `bag_axis` values
  the RIGHT ones? They were an a-priori adaptation of Fragrantica's model (0012's own
  header cites `ux-research-brief.md` §F); nobody checked them against what handbag
  people actually compare on. **Now is the moment: `bag_axis_vote` has 0 rows, so
  changing the enum is free. Once votes exist, `alter type ... add value` is easy but
  removing/renaming an axis orphans data.**
  Running dimension-discovery across 6 bags spanning tiers (Birkin, Classic Flap,
  Neverfull, BV Jodie, Polène/Telfar mid-tier, Lady Dior) to derive the axes from
  evidence. Each pass classifies every dimension `SUBJECTIVE` (vote-able) vs
  `MEASURABLE` (catalog data, never a vote) vs `CATEGORICAL` (descriptor, not a scale)
  and flags polar vs unipolar.
  *Priors to test (recorded before results, 2026-07-25):* the Chanel 19 PoC alone
  suggested gaps in **structure/slouch over time**, **formality (casual↔dressy)**, and
  **vulnerability/colour transfer**; and the "vibe" dimension the owner cares about
  most is CATEGORICAL, so it may not belong on a 1-5 axis at all. Also suspect
  `worth_the_price` and `holds_value` partly collapse, and that `holds_value` may be
  near-meaningless in the mid-tier conversation.
- ⬜ Build the pipeline + storage if the PoC clears the bar (synthesis-only, sourced, dated).
- ⬜ Ship the per-bag Reputation block with attribution + "my experience differs" contribute prompt.

### 2B. First-party seeding
- ⬜ Split the gates: add a Seed-phase **Invite** state below threshold (keeps the honest reveal).
- ⬜ Founder-first reviews as the visible floor (owner reviews bags she has carried).
- ⬜ One-tap rating / status from any card (Goodreads/Letterboxd Log-sheet pattern).

## Phase 3 — Aggregate the voice
- ⬜ Brand-page "what owners say" block (`/brand/[brandId]` has zero UGC today).
- ⬜ Cross-catalog review / owner-rating browse (no way to see the aggregate voice today).
- ⬜ Promote "find what others say" to headline positioning sitewide.

## Phase 4 — Deepen & make shareable
- 🅿️ Crowd-upvoted lists (Listopia) — evergreen SEO.
- 🅿️ "Year in Bags" recap — screenshot-ready, viral.
- 🅿️ Screenshot-ready surface polish across community pages.

---

## Log
*(append ✅ lines here as units complete)*
- 2026-07-25 — workstream established: `community-workstream.md` + this worklist + handoff lane.
