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

### Locked UX principle (owner, 2026-07-25)

**Reviews are an attribute of a bag, accessed contextually THROUGH the bag, not a
standalone browse destination.** You reach owner intelligence by looking up a
specific bag (the IMDb / Fragrantica model), not by navigating to "Reviews." So:

- **The bag page is the primary review surface.** Findability = making the
  owner-voice unmissable there + giving people reasons to reach bag pages.
- **The moat can be the headline without being a nav tab.** "The place to find
  what others say" is asserted ON bag pages, BETWEEN bags (brand-level aggregate,
  social-proof cues on cards), and in marketing/GEO — not via a "Reviews" nav item.
- **A community hub, if built, is a "pulse" showcase** (leaderboards, activity,
  most-reviewed) that signals liveness + trust and aids discovery. It is NOT where
  you read reviews, and it is secondary.

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

#### 2A. The Reputation layer — "what's this bag's reputation?" *(owner idea, 2026-07-25)*

**The single highest-leverage seed asset.** Synthesize the *general consensus* on
each bag from publicly-posted opinion across the open web, and render it as a
per-bag **Reputation** block.

**Why it matters:** it answers the question people actually have and no price
aggregator touches. Prices say what a bag costs. Reputation says what carrying it
means and whether it works in real life. Owner examples: the Chanel 19 reads edgy
and modern, a mix of workhorse and fashion; the Classic Flap is the "clean girl"
bag, the mother of luxury bags; the Birkin is members-only, Soho House.

**What it solves:** founder-first reviews are n=1. This puts a populated, genuinely
useful owner-voice block on **every** bag page on day one, with zero fabrication,
which is what escapes the cold-start trap. It also gives a visitor the strongest
possible prompt to contribute: "my experience differs."

**Dimensions to synthesize per bag:**
- **Vibe / reputation** — how people characterize the look and what it signals.
- **Who it's for** — the persona and use case described.
- **How it carries** — lived-experience function: capacity, everyday wearability,
  comfort, wear and durability.
- **What owners love** / **common gripes** — including honest negatives.
- **Comparisons** — only where sources actually make them.

**Sources (prioritize first-hand owner content):** YouTube owner reviews,
"what's in my bag," collection videos, and "one year later" wear reviews;
Reddit threads; PurseForum/PurseBlog; handbag blogs; publicly accessible
Instagram; and where they exist, reviews on purchase channels (e.g. Amazon for
affiliated mid-tier brands).

**Guardrails (non-negotiable):**
1. **Synthesis, never republication.** Express consensus in our own words. No
   verbatim copying. Attribute and link out to sources.
2. **Every theme traces to named sources** with rough counts, so it is
   defensible. Where opinion is genuinely **divided, say so** rather than
   smoothing it into a false consensus.
3. **Hedged, never verdict.** "Owners commonly describe it as," "the consensus
   leans," never "this bag is." Reputation is taste and opinion.
4. **Date it.** Reputation shifts. Stamp the synthesis and note where chatter
   has moved since launch.
5. **Complementary to UGC, not a substitute.** This is the seed layer; our own
   reviews remain the moat and should visibly stack on top of it.

**Moves:** session depth + the reason-to-visit on every bag page (SEO/GEO gold,
since this is unique text no aggregator has) → affiliate; and it is the strongest
prompt to contribute a first-party review.

**Open questions:** build order vs. the rest of Phase 2; how far down the catalog
tail it can run (icons first, clearly); refresh cadence; whether it renders as
prose beats or Fragrantica-style character bars (or prose now, bars once our own
axis-votes populate).

#### 2B. First-party seeding
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

## 5. Decisions — status

**DECIDED (owner, 2026-07-25):**
- ✅ **Seed phase: BUILD IT.** Add the pre-threshold Invite state + seeding, so
  the contribute-CTAs stop being hidden by the same gate they need to clear.
- ✅ **Reputation layer (§2A): pursue.** Synthesized public consensus per bag as
  the day-one seed asset.
- 🟡 **Hub: open to it, not convinced.** "Doesn't hurt to have one, but it feels
  counterintuitive." Resolution: the hub is NOT a review-browse destination. If
  built, it is a secondary **community pulse** surface (leaderboards, activity,
  most-reviewed) that signals liveness and aids discovery. Decide after Phase 1.

**STILL OPEN:**
1. **Positioning.** Not ready to call. Her objection is well-founded: reviews are
   reached THROUGH a bag, so a "Reviews" nav item may be wrong. See the locked UX
   principle in §0 — the moat can headline without a nav tab. Revisit once the
   bag-page owner-voice surface is real and we can see what it deserves.
2. **Reputation build order + scope** — where it slots in Phase 2, how far down
   the catalog tail, refresh cadence, prose vs. character bars (§2A open questions).

---

## 6. Guardrails (do NOT drift)

- Keep the bounded-social canon: no open DMs, no free-form posting, no vanity
  likes (`engagement-strategy.md` §1).
- Never fabricate counts or ghost-town a board; reveal automatically
  (`content-gating-strategy.md`).
- A measurable fact is never a subjective vote (`review-data-leaderboards.md`).
- Every value/worth/authenticity claim stays evidence + opinion, never a verdict.
