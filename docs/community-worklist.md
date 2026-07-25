# Community & UGC worklist (live queue)

*Execution queue for the community/UGC revamp. Strategy + phases:
`docs/community-workstream.md`. Per `preferences.md` rule 9: pick the top ⬜, do
it, commit, mark ✅ with a one-line result + date, drop to the next. A fresh chat
resumes from here.*

Status key: ⬜ todo · 🔄 in progress · ✅ done · ⏸️ blocked (needs owner) · 🅿️ parked

---

## Phase 0 — Verify & unblock *(do first)*
- ⬜ **Probe prod for the 3 at-risk tables** — confirm `bag_axis_vote` (0012),
  `bag_wear` (0046), `bag_photo` (0016) + the `bag-photos` storage bucket exist
  and return rows via the anon key. If any 404s, the surface is DARK in prod.
  (Method: copy `.env.local` from the main tree per `[[land-from-fresh-worktree]]`,
  run a tsx probe against the REST API.)
- ⏸️ **Apply any missing migration** (owner action) — Actions → "Apply database
  migrations" → Run workflow. Only if the probe finds a table missing.

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
