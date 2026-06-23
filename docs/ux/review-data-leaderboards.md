# Review & axis data → leaderboards + the contribution flywheel

*Created 2026-06-23. How the structured review/vote data powers homepage and
bag-page leaderboards, data-viz, and a contribution loop. Pairs with
`docs/ux/homepage-experiments.md` and `docs/engagement-strategy.md`.*

## What we actually collect (ground truth)

**Reviews (`0003_reviews_notifications.sql`, live-ish):**
`rating` 1-5 · `worth_it` boolean · `occasion` *(free text)* · `durability_rating`
1-5 · `title`/`body` free text.

**Multi-axis votes (`0012_bag_axis_votes.sql`, APPLIED to prod):**
Fragrantica-style 1-5 votes on a fixed enum, rendered as "character bars". The
`bag_axis` enum was applied with 7 values, but only the **5 kept opinion axes** are
votable (see correction below): `build_quality, everyday_wearability,
roomy_vs_compact, comfort, versatility`. `holds_value` and `worth_the_price` are
dormant labels in the enum, retired at the app layer.

## Correction to the 0012 axis vocabulary (decided 2026-06-23)

Owner caught that **`holds_value` is not an opinion — it's a market fact** we
already compute from `price_history` (e.g. 87.7% retention on the Classic Flap).
Voting on it would be noise or contradict the real data.

**Status (verified 2026-06-23 via `pg_enum`): the `bag_axis` enum was ALREADY
APPLIED to prod with all 7 original values.** Postgres can't cleanly drop an enum
value once applied, and editing the applied migration changes nothing in prod
(db push skips applied versions). So the retirement is enforced at the **app
layer**, which is sufficient — no one can vote on the retired axes:

- **Keep as voted OPINION axes:** `build_quality`, `comfort`,
  `everyday_wearability`, `versatility`, `roomy_vs_compact` (the last as *felt*
  roominess; dedupe against catalog capacity, don't double-count).
- **`holds_value` retired** at the app layer in `src/lib/votes.ts`: dropped from
  `AXES`/`AXIS_META`, so the bar never renders, new votes are rejected by
  `isAxis()`, and any existing rows are ignored on read. Value retention is surfaced
  instead as a **data-derived** board from `price_history` (`getValueRetentionLeaders`,
  built). The dormant enum label is harmless.
- **`worth_the_price` retired** the same way — it duplicates the live review
  `worth_it` boolean; keep one signal, not two.
- **OPTIONAL future cleanup:** to physically remove the two dormant labels, a new
  migration would rebuild the type (create `bag_axis_v2` with the 5 values, `alter
  table bag_axis_vote alter column axis type bag_axis_v2 using axis::text::bag_axis_v2`
  after deleting any rows on the retired axes, drop the old type, rename). Cosmetic
  only — deferred unless we want the schema spotless.

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

## Gap to close: structure `occasion` (DONE 2026-06-23)

`occasion` was free text, so it couldn't rank cleanly. **Now structured** into a
closed set captured as low-effort taps: `everyday / work / evening / travel /
special`. Canonical source of truth: `src/lib/occasions.ts` (shared by the review
form, the write-validation, the review display, and the leaderboards). The DB
column stays `text`; **migration `0028_review_occasion_enum.sql`** best-effort
backfills legacy free text into the buckets, nulls anything ambiguous (never
invent a category), and adds a CHECK constraint. **HUMAN-GATED** but the app
enforces the set immediately, so the feature is correct before the migration runs
(it just adds DB-level enforcement + cleans up old rows). The homepage "What the
community knows" section now renders **Best for evening / work / travel** boards
(`getReviewLeaderboards().byOccasion`), each hidden until it clears the same
MIN_RATINGS honesty gate. `everyday`/`special` are captured too (feed recs +
future boards) but not surfaced as boards yet.

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

1. ~~**Fix the `0012` axis enum before applying it:** drop `holds_value`, dedupe
   `worth_the_price`.~~ **Resolved at the app layer** — the enum was already
   applied to prod (can't be edited retroactively), so the two retired axes are
   enforced out via `src/lib/votes.ts`. See the correction section above.
2. ~~**New migration:** convert `review.occasion` free text → enum (+ backfill).~~
   **DONE** — `0028_review_occasion_enum.sql` + `src/lib/occasions.ts`.
3. ~~**Leaderboard queries:** aggregate per board, resilient reads (empty until data),
   minimum-N threshold before a board renders.~~ **DONE** for the occasion boards
   (`byOccasion` in `leaderboards.ts`, gated by MIN_RATINGS).
4. **Homepage "What the community knows" section** + the contribution driver
   (axis bars, worth-it, add-a-photo, tier progress).
5. **Value-retention board** computed from `price_history` (data, not votes).
