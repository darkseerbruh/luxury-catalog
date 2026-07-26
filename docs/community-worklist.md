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
  ⏸️ **HER TURN: apply 0063** (rewritten to the six; still unapplied)
- ✅ **Unit 4 — votable Reputation claims** (`675800d`)
  Migration `0062` (reputation_claim + votes, RLS, trigger-kept tallies) +
  `claims.ts` / `claim-actions.ts` / `ReputationClaims.tsx` / `ClaimVote.tsx`.
  Honesty enforced in schema: sources NOT NULL and non-empty, community-vs-
  commercial counts stored and surfaced, every claim dated, stale votes retire a
  claim. Service-role write only. 9 new tests. Renders above the owner scales.
  ⏸️ **HER TURN: apply 0062.** Then the synthesis pipeline can seed claims.
  ⬜ **Next in this unit:** the seeding pipeline that turns a Reputation research
  pass (the Chanel 19 PoC shape) into claim rows.
- ⬜ **Unit 5 — "reminds me of" three rails** (derived pass first)
- ✅ **Unit 6 — shelf states + reasons** (`6c2398f`)
  Migration `0061` adds `tried` + optional `had_reason`. New shared
  `closet-states.ts` (the vocabulary was trapped in a use-server module, so
  components kept redefining it). `hasLivedWithIt()` marks who can speak to the
  longitudinal axes. 5 new tests.
  ⏸️ **HER TURN: apply 0061.**
- ⬜ **Unit 7 — most-worn periodic check-in** (never a daily log)
- ⬜ **Unit 8 — one canvas + purchase context** (year/channel/price as a private note)
- ⬜ **Unit 9 — photo surfaces** (wear-and-tear timeline, what-fits)
- ⬜ **Unit 10 — age + trend scales** ⚠️ needs design + a copywriter pass first
  (ageism risk on youthful/grown-up; trend stored as a TIME SERIES)
- ⬜ **Unit 11 — repair referral surface** (no affiliate found; owner open to a
  custom partnership)

### Owner decisions, 2026-07-26
- **Deploy:** HOLD until the units are finished, then one deploy.
- **Reputation scope:** icons first, ~25 bags.
- **Minimum sources per claim: 5. A community source is NOT required.** (I had
  recommended requiring one, since paid reviewers skew positive. Her call is
  coherent with what shipped: the claim block already DISCLOSES when sources lean
  commercial, so we surface the bias rather than gate on it.)
- **Dimensions:** chase reseller product pages (Fashionphile/TRR show structured
  measurements on the PAGE in a known order, unlike the feed text).
- **Build quality: DROPPED, not parked** (owner: "a nice to have, not required right
  now, or even not valuable to add"). It ceilings out at the top tier and partly
  measures price resentment, so there is no strong case to revisit.
- **Re-run the spec promote pass at the end:** approved.

### 🔖 DO NOT LOSE — explicitly deferred, owner asked to be reminded
- **"Who clocks it" (quiet ↔ recognisable).** Owner: *"We can do who clocks it later,
  but don't let me forget."* NOT a review ask, because the answer barely varies by
  owner, so asking every reviewer collects the same value repeatedly. Build it as a
  DERIVED display: logo prominence + icon status are catalog facts, and ubiquity is
  computable from our own listing and closet volume. Her framing to preserve: Hermès
  has a tiny logo yet everyone clocks the bag (the orange box is the mass-market
  signal), Chanel stacks CCs, LV's monogram is loudest, Bottega has none. Do NOT call
  either end "loud" — that reads as an insult. Use IYKYK ↔ recognisable.
- **Age + trend scales (unit 10).** Needs a copywriter pass first: real ageism risk in
  youthful ↔ grown-up, and the owner flagged that trendy ↔ timeless "needs more work"
  because reputation heats and cools (Celine Luggage, Boy). Store trend as a TIME
  SERIES, never a static average.

### 🔬 Archivist findings on size eras (2026-07-26) — `research-drafts/chanel-flap-size-eras.md`
The pull answered the question and then reframed it. **The ambiguity is roughly 30%
era and 70% naming plus measurement convention**, and both of those are fixable
without new data.
- 🏷️ **"Large" and "Jumbo" are Chanel's word and the collector's word for ONE bag.**
  Checked against our catalog: the Classic Flap (style 1) is clean, it only uses
  Jumbo. But **3 styles carry both labels** and need a look:
  `[423] Chanel 2.55 Reissue` (likely a genuine double-count, same house convention),
  `[448] Gucci Ophidia` and `[1047] Gucci Belt Bag` (Gucci does not use Jumbo
  officially, so these smell like seller-title contamination).
  ⚠️ NOT fixed here: merging variants is destructive and lands in the same table the
  identification lane is working in. Flagged for that lane or for an owner call.
- 🚪 **The era gate is FLAP COUNT, not a dimension.** Jumbo and Maxi were
  single-flap until 2010 and double-flap after, alongside a grommet-layout change.
  Binary, sourced, visible in listing photos, and already written into most reseller
  titles. That is a far better disambiguator than millimetres, and it wants to be an
  axis in the production matrix.
- 📏 **Only the Jumbo (~2cm height) and Maxi (~2-3cm width) are era-resolvable by
  measurement at all.** Medium and Small sit at 25-26cm wide from 1996 to 2026 with
  no trend; lot-to-lot variation within one year matches the variation between
  decades. The vintage Maxi is wider AND flatter, effectively a different silhouette.
- ⚠️ **This independently confirms why the myGemma dimension write had to be
  reverted.** Sources use different conventions: Rebag publishes BASE length,
  Christie's uses W x H x D, Miss Bugis uses L x H x W. Ingest a size string without
  knowing the axis order and you swap height and depth on roughly a third of rows.
- 📐 **Schema recommendation from the pull:** store a RANGE plus a convention tag
  (`overall` / `base` / `unknown`) plus a `measured` vs `guide` flag. Never a point
  value. Our 0065 columns are point values, so they need extending before any
  dimension load. Decide once the reseller capture probe reports.
- 🕳️ Documented gaps kept honest: 1983-1989 blank entirely, Jumbo 1998-2009 and Maxi
  1995-2009 blank. Chanel publishes no historical spec archive. A June 2020 drop of
  ~0.5cm in chanel.com's PUBLISHED figures is a spec-sheet change, not a bag change,
  and must never be written up as "the bag got smaller".

### Dimensions: the design changed (owner insight, 2026-07-26)
Brand specs are CURRENT-SEASON, so they cannot tell a 2005 "Large" Classic Flap from a
2024 "Large". **Seller-measured dimensions are the disambiguator**, so the two sources
do different jobs:
- **Archivist / house documentation** = per-ERA canon, including historical.
  ⚠️ I earlier wrote that an archivist pull "can only get current season". **That was
  wrong**, and the owner corrected it: I was describing brand.com, not archivist
  research. The archivist's remit is the seasonal archive going back ~30 years
  (house documentation, press material, lookbooks, archive references), which is
  precisely the historical-disambiguation capability. The real caveat is COVERAGE,
  not capability: houses did not always publish dimensions historically and
  measurement conventions shifted, so expect some eras to resolve and others to
  come up empty.
- **Seller listing** = measured evidence for that specific bag.
Cluster the seller measurements and the clusters REVEAL the size eras; anchor those
clusters to archivist canon. That means storing dimensions **per listing**, not only
per variant. Capture target: Fashionphile + TRR product PAGES (structured
measurements in a known order; the feed text has none).

**Coordination (another lane is identifying unmapped rows):** next free migration is
**0066** and the collision failure is SILENT, so re-check `origin/main` immediately
before dispatching. My closure values are grouped by `variant_id`, so a listing
remap makes them stale (not wrong); re-run `promote-spec-facts.ts` once at the end
to repair. Code-only units run now; DB-heavy passes wait.

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
  Files: migration `0063`, `src/lib/axes.ts`, `votes.ts`, `AxisVotes.tsx`,
  `ClosetAddFlow.tsx`, `contribution-slots.ts`. Gate green (tsc, lint 0 errors,
  898/898); verified rendering on `/bag/589`.
- ⏸️ **YOUR TURN: apply migration 0063** (Actions → "Apply database migrations" →
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
