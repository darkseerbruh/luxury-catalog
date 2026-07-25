# Community & UGC workstream — the reviews moat

*Created 2026-07-25. Canonical strategy + plan for revamping the community/UGC
experience. Grounds every move in the current-state audit below (two codebase
sweeps run 2026-07-25) and the existing canon it builds on: `engagement-strategy.md`
(the bounded-social frame), `ux/content-gating-strategy.md` (the reveal ladder),
`ux/ux-research-brief.md` Part 2/3 (the competitor swipe file), and
`ux/review-data-leaderboards.md`. Live execution queue: `community-worklist.md`.*

---

## 0. The one frame (why this is the workstream that matters)

Every price aggregator can scrape the same sold comps we do. **None of them can
copy what owners say.** Reviews, owner ratings, wear notes, and member photos are a
corpus that only accrues by people using the site, so it compounds into a moat a
competitor cannot buy or crawl.

> **North star:** become the place people go to find **what others say about a bag**,
> not just what it sold for.

**The moat is the review/knowledge corpus, not a social network.** We headline the
UGC as *reference data* and keep the social mechanics bounded exactly as
`engagement-strategy.md` locks them: no open DMs, no free-form posting, no vanity
metrics. Structured community, never PurseForum chaos.

**How it pays off (engagement → monetization):**
- UGC → return visits + session depth → **affiliate clicks (Rev #1)**
- UGC → deeper, unique data → **SEO/GEO → organic traffic → affiliate**
- Expert Journal posts → named-author E-E-A-T → **GEO surface area**
- Verified-owner reviews → trust → the return visit and the outbound click

---

## 1. Current state — audit (2026-07-25)

### What is already BUILT (real code, not mocked)

| Surface | Where | State |
|---|---|---|
| Reviews + rating + histogram + write form | `bag/[variantId]` → `Reviews.tsx`, `review` table (0003) | Live |
| Owner axis-votes ("How owners rate it") | `AxisVotes.tsx`, `bag_axis_vote` (0012) | **Verify — human-gated migration** |
| Wear notes ("How it carries") | `WearNotes.tsx`, `bag_wear` (0046) | **Verify — human-gated migration** |
| Photo contributions + moderation + XP | `PhotoContributions.tsx`, `bag_photo` (0016) + storage bucket | **Verify — human-gated migration** |
| Suggest-an-edit corrections | `SuggestEdit.tsx`, `correction` (0009) | Live |
| Closet follow / favorite | `social.ts`, `closet_favorite` (0006) | Live |
| Activity feed | `/feed`, `FeedItem.tsx` | Live (login-gated) |
| Expert Journal (long-form) | `/articles`, `post` (0006), `is_expert` gate | Live |
| Leaderboards (coveted closets + top reviewers) | `/coveted-closets` | Live |
| Verified-owner badge | `TrustBadges.tsx` (derive from have/had) | Live per-review |

### The three problems (what's actually wrong)

1. **Possibly dark in prod.** The most engaging bag-page UGC (axis-votes 0012,
   wear notes 0046, photos 0016) sits behind human-gated migrations. In code it
   is wired; if the tables/bucket were never applied it renders nothing. **Must
   verify before anything else.**

2. **The cold-start trap.** Community boards hide until 25 reviews; coveted
   rankings hide until 25 "want" rows (`content-gates.ts`). Pre-launch those are
   unmet, so the surfaces are invisible — *including the invitations to
   contribute*. The gate that protects credibility also suppresses the CTAs
   needed to escape the gate. Nobody is shown how to create review #1.

3. **No findability, no value prop.** UGC is scattered and mislabeled:
   - No `/community` or `/reviews` destination anywhere.
   - Leaderboards live at `/coveted-closets` titled "Leaderboards."
   - `/feed` and Closet hide in the signed-in account menu.
   - Nothing in the primary desktop nav points to any of it.
   - **Brand pages carry zero UGC**; there is no cross-catalog way to browse
     reviews or owner ratings — the aggregate voice is invisible until you land
     on one specific bag.
   - The "what others say" positioning is asserted on **no** page.

---

## 2. The unlock — split the lifecycle into two phases

Today the gates model one state (populated) and default to hidden. The revamp
adds the missing first state.

| Phase | Trigger | What shows | Goal | Moves |
|---|---|---|---|---|
| **Seed** | below threshold | Findable *invite* CTAs + founder-first reviews as the visible floor | manufacture the first N reviews/photos | UGC volume (the moat asset) |
| **Populated** | threshold met | Leaderboards/rankings auto-reveal (already wired) | credibility + return visits | return rate, session depth, affiliate |

The gates stay honest (no fabricated counts, no ghost-town boards). We only add
an **Invite** state where today there is a hard blank, per the modes already
defined in `content-gating-strategy.md`.

---

## 3. The plan — phased, each with the metric it moves

### Phase 0 — Verify & unblock *(do first; may need a migration = her action)*
Confirm `bag_axis_vote`, `bag_wear`, `bag_photo` + the `bag-photos` bucket exist
in prod. If dark, apply the migrations.
**Moves:** nothing until done, then unblocks UGC capture end to end. Zero point
building findability into surfaces that render nothing.

### Phase 1 — Findability spine *(the core of the ask)*
A single community destination + primary-nav entry + a value-prop line wherever
UGC lives. Rename/clarify the mislabeled surfaces.
**Moves:** UGC-surface impressions → contribution rate; return visits.

### Phase 2 — Seed the cold start
Build the Seed-phase invite states; found-first reviews as the visible floor
(owner reviews every bag she has carried, per `idea_founder_first_reviews`);
one-tap rating/status from any card.
**Moves:** reviews + photos created (the moat asset); escapes the 25-review gate.

### Phase 3 — Aggregate the voice
Brand-page "what owners say" block; a cross-catalog review / owner-rating browse;
promote "find what others say" to headline positioning.
**Moves:** SEO/GEO surface area + session depth → affiliate.

### Phase 4 — Deepen & make shareable
Crowd-upvoted lists (Listopia — evergreen SEO), "Year in Bags" recap,
screenshot-ready surfaces, weighted-rating framing.
**Moves:** viral acquisition (top of funnel) + SEO.

---

## 4. The swipe file → what we borrow (from `ux-research-brief.md` Part 2)

- **Goodreads** — rating decoupled from written review (captures the 90% who
  won't write); atomic feed events; Listopia upvoted lists.
- **Letterboxd** — one-tap Log sheet; screenshot-ready surfaces as the marketing
  asset; "Four Grails"; "Year in" recap; no downvotes (low posting floor).
- **StoryGraph** — structured survey over free text; taste stats from the same
  taxonomy.
- **Fragrantica** — multi-axis character bars (we already have the axes in
  `bag_axis_vote`); "good for what," not just good.
- **IMDb** — every attribute is a link; weighted ratings + distribution
  histogram (already built); moderated open contribution with a quality floor.

Anti-model: **PurseForum** (chaos, gatekeeping, off-platform leakage) — the thing
we replace.

---

## 5. Decisions the owner owns

1. **Positioning promotion.** Promote "what owners say / reviews" to a headline
   differentiator (top-nav destination + asserted sitewide), vs. keep it a
   bounded supporting layer. *Signaled yes on 2026-07-25; ratify into canon.*
2. **Seed phase.** Build the pre-gate invite states + founder-first seeding, vs.
   keep everything hard-gated until real users arrive.
3. **Hub shape.** One `/community` hub, distribute value-props across existing
   surfaces, or both.

---

## 6. Guardrails (do NOT drift)

- Keep the bounded-social canon: no open DMs, no free-form posting, no vanity
  likes (`engagement-strategy.md` §1).
- Never fabricate counts or ghost-town a board; reveal automatically
  (`content-gating-strategy.md`).
- A measurable fact is never a subjective vote (`review-data-leaderboards.md`).
- Every value/worth/authenticity claim stays evidence + opinion, never a verdict.
