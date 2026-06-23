# Review & axis data → leaderboards + the contribution flywheel

*Created 2026-06-23. How the structured review/vote data powers homepage and
bag-page leaderboards, data-viz, and a contribution loop. Pairs with
`docs/ux/homepage-experiments.md` and `docs/engagement-strategy.md`.*

## What we actually collect (ground truth)

**Reviews (`0003_reviews_notifications.sql`, live-ish):**
`rating` 1-5 · `worth_it` boolean · `occasion` *(free text)* · `durability_rating`
1-5 · `title`/`body` free text.

**Multi-axis votes (`0012_bag_axis_votes.sql`, HUMAN-GATED, not yet applied):**
Fragrantica-style 1-5 votes on a fixed enum, rendered as "character bars":
`build_quality, everyday_wearability, holds_value, roomy_vs_compact, comfort,
versatility, worth_the_price`.

## Correction to the 0012 axis vocabulary (decided 2026-06-23)

Owner caught that **`holds_value` is not an opinion — it's a market fact** we
already compute from `price_history` (e.g. 87.7% retention on the Classic Flap).
Voting on it would be noise or contradict the real data. Fix this **before** 0012
is applied (it's additive/editable until then):

- **Keep as voted OPINION axes:** `build_quality`, `comfort`,
  `everyday_wearability`, `versatility`, `roomy_vs_compact` (the last as *felt*
  roominess; dedupe against catalog capacity, don't double-count).
- **Remove `holds_value` from the vote enum.** DONE (2026-06-23) at the app layer:
  dropped from `AXES`/`AXIS_META` in `src/lib/votes.ts`, so the bar no longer
  renders, new votes are rejected by `isAxis()`, and any existing rows are ignored
  on read. No DB enum change needed. Surface value retention as a **data-derived**
  board from `price_history` instead (not yet built).
- **`worth_the_price` duplicates the review `worth_it` boolean** — keep one signal,
  not two. (Lean toward the review boolean; it's already live.) STILL PENDING:
  left in `AXES` for now, retire it the same app-layer way once confirmed.

Rule going forward: **a thing we can measure from data is never a subjective vote.**
Opinion axes capture only lived experience; facts come from the catalogue/price data.

## Leaderboard menu (each mapped to a real signal)

**Opinion-driven (from votes/ratings):**
- Most durable — `durability_rating` / `build_quality`
- Most comfortable — `comfort`
- Best everyday carry — `everyday_wearability`
- Most versatile — `versatility`
- Most "worth it" — review `worth_it`

**Data-derived (from price/catalog, NOT votes):**
- Best value retention — `price_history` retention %
- Biggest resale spread / best deals — price data

**Catalog × opinion combos ("best for X"):**
- Best laptop totes — catalog fit=laptop × rating
- Best crossbody for everyday — carry=crossbody × `everyday_wearability`
- Best night-out bag — *needs structured `occasion`* (see gap)

## Gap to close: structure `occasion` (DECIDED — do it)

`occasion` is free text today, so it can't rank cleanly. **Decision (2026-06-23):
migrate it to a closed enum** (evening / work / travel / everyday / special),
captured as low-effort taps, same pattern as the axis vocabulary. Additive,
human-gated migration; backfill/parse existing free-text values where possible.
Unlocks the night-out/work/travel boards.

## The flywheel (why this matters even though it isn't monetizable)

Direct monetization: none. But it is the **engagement flywheel** that feeds the
things that DO monetize / de-risk:
1. **UGC photos** — the contribution prompt ("add a photo") is the cheapest path
   to the licensed-image problem (`docs/image-strategy-research.md`).
2. **Better recommendations** — structured per-axis data sharpens content-based recs
   (the data moat) without ML infra.
3. **GEO** — "most durable bags," "best laptop totes" are exactly the fact-dense,
   citable list pages AI search rewards (`docs/marketing-plan.md`).
4. **Contributor tiers** — votes/photos/reviews are the value-producing UGC that XP
   and the Aficionado→Curator ladder reward (never vanity metrics).

## Homepage treatment (DECIDED — new section)

**Decision (2026-06-23): a dedicated "What the community knows" section** below the
6 goal tiles: 2-3 rotating leaderboards + a low-effort contribution driver (tap the
bars, worth-it toggle, add-a-photo, contributor-tier progress). Leaderboards degrade
gracefully: a board hides until it has enough ratings; never show a sparse or
invented ranking. All numbers labeled and dated.

## Build dependencies / sequence

1. **Fix the `0012` axis enum before applying it:** drop `holds_value`, dedupe
   `worth_the_price` vs review `worth_it`. (Edit the migration; it's not yet applied.)
2. **New migration:** convert `review.occasion` free text → enum (+ backfill).
3. **Leaderboard queries:** aggregate per board, resilient reads (empty until data),
   minimum-N threshold before a board renders.
4. **Homepage "What the community knows" section** + the contribution driver
   (axis bars, worth-it, add-a-photo, tier progress).
5. **Value-retention board** computed from `price_history` (data, not votes).
