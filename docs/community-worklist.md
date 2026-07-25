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
- ⬜ Decide + build the community destination (hub vs. distributed vs. both — owner decision #3).
- ⬜ Primary-nav entry to community/reviews (currently nothing in the desktop nav).
- ⬜ Value-prop line wherever UGC lives (bag page, brand page, hub) — no walls of text.
- ⬜ Clarify mislabeled surfaces (`/coveted-closets` titled "Leaderboards"; feed/closet buried).

## Phase 2 — Seed the cold start
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
