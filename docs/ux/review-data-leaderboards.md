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
  not two. DONE (2026-06-23): retired from `AXES`/`AXIS_META` the same app-layer way
  as `holds_value`. The review `worth_it` boolean is the kept signal.

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

1. **Fix the `0012` axis enum before applying it:** drop `holds_value`, dedupe
   `worth_the_price` vs review `worth_it`. (Edit the migration; it's not yet applied.)
2. ~~**New migration:** convert `review.occasion` free text → enum (+ backfill).~~
   **DONE** — `0028_review_occasion_enum.sql` + `src/lib/occasions.ts`.
3. ~~**Leaderboard queries:** aggregate per board, resilient reads (empty until data),
   minimum-N threshold before a board renders.~~ **DONE** for the occasion boards
   (`byOccasion` in `leaderboards.ts`, gated by MIN_RATINGS).
4. **Homepage "What the community knows" section** + the contribution driver
   (axis bars, worth-it, add-a-photo, tier progress).
5. **Value-retention board** computed from `price_history` (data, not votes).

---

# In-hand capture + the "give us your stuff" contribution surface

*Added 2026-07-07. One shared slot schema, two fillers: Arielle captures every bag
she physically holds (first reviewer), the community fills the same open slots after.
Locked copy below. Design goal: make it trivially easy to contribute assets that come
back **formatted**, without adding conversion friction.*

## Principle: one schema, two fillers

- **Slots are shared.** A bag page shows named slots (interior photo, on-body shot,
  carry, weight feel, what fit, worth-it take). Arielle fills them first via the
  in-hand capture kit; the community fills whatever stays open. A bag stacks
  contributions over time.
- **Reuse the existing fields, never a parallel schema.** Map every slot onto the
  live review/vote fields below. New taps only where lived experience isn't already
  captured. **Locked rule still binds: anything we can measure from catalog/price
  data is data, not a vote** (weight-feel and roominess are captured as *felt*, deduped
  against the measured catalog value, same pattern as `roomy_vs_compact`).

## The in-hand capture kit (Arielle, internal)

Fires for **any bag she physically holds**: owned, rented (Vivrelle), borrowed, a
friend's, one handled in store. Not just rentals. One pass, because most bags leave
and can't be reshot. This is the exception window to the standing no-bag-footage rule
(she doesn't own most bags; in-hand is the one time real footage is hers to take).

- **Tag on capture:** `source` (owned / rented / borrowed / in-store) and
  `reshoot_window` (leaving-soon vs keep). The one-pass urgency only fires when the
  bag is leaving.
- **Capture list (per bag, ~20 min):**

| Asset | Grab | Feeds |
|---|---|---|
| Clean stills | front, back, sides, bottom, top, flat | detail page, slideshows |
| Macro stills | hardware, logo plate, feet, zip, stitching, grain, interior + pockets, date/heat stamp | detail page, "markers to check" |
| Scale + carry stills | on-body 3 ways, next to a phone | Signature posts, detail page |
| 360 turnaround video | slow rotate, good light | b-roll bank, detail page |
| What-fits video | load real daily items, show capacity | reviews, "does it work" |
| On-body walk | 5-10s each strap position | Keep-warm, Signature |
| Sound clips | clasp click, zip, opening | reel texture |
| Founder review (talking head) | honest take: comfort, weight, worth-it | Signature tier, review surface |
| Hard data | dimensions, empty weight, strap drop, what fit | detail page hard data |

Handling note: rentals/borrows return, so **no destructive or wear testing**, just
capture. Stills are detail-page/editorial assets, never framed as sellable (per the
still-library rule).

## The community contribution slots (external, UGC)

Same slots, mapped to live fields. Conversion rule: the **minimum unit is one slot**
(one tap or one photo).

| Slot | Input (controlled) | Maps to |
|---|---|---|
| Photo | one photo, tap which kind (interior / hardware / on-body) | existing add-a-photo UGC |
| Carry | chips: hand / shoulder / crossbody | *new lived tap* (dedupe vs catalog carry spec) |
| Weight feel | chips: light / just right / heavy | *new felt tap* (dedupe vs catalog weight) |
| What fit inside | short chips or one line | capacity content (felt, not measured) |
| Worth-it take | 1-5 + optional one line | existing review `worth_it` + `rating` |
| Occasion | existing taps: everyday / work / evening / travel / special | `src/lib/occasions.ts` |
| Real dimensions / weight | numbers, optional | catalog hard data (gap-fill only) |
| Character bars | existing 1-5 axis votes | `build_quality`, `comfort`, `everyday_wearability`, `versatility`, `roomy_vs_compact` |

## Friction rules (protect submission start → complete)

1. **Slots, not a form.** No blank-box wall as the primary ask. Blank boxes lower
   conversion and return unformatted mess.
2. **Only ask for the gap.** If a bag already has interior photos, don't ask for
   interior. Ask what's missing on *that* bag. Fewer asks per person; catalog fills
   evenly.
3. **Controlled inputs = formatted for free.** Taps, chips, single photo per slot,
   optional one-line caption. Never freeform as the required unit.
4. **Progressive + visible progress.** Required = which bag + one of {a photo *or* a
   tap rating}. Everything else optional, framed "add more if you have it," with a
   "3 of 8 filled" pull.

## Locked copy (2026-07-07, owner-approved)

- **Entry headline:** *Have this in hand? Show us how it really carries.*
- **Subline:** *Takes a second. Add what you've got. Skip the rest.*

Voice: question hook, feel-seen (they're the expert on their own bag), signals a
one-tap ask. No em dashes.

## Metric

Engagement (more reviews, contributor identity, return visits) plus indirect
monetization (richer detail pages help GEO/SEO and give the affiliate/resale surface
more to wrap). Direct monetization: none, this is the flywheel above. The metric to
protect is **submission start → complete**, which the slot model raises by shrinking
the minimum unit to one tap.

## Build status (2026-07-07)

**All three phases BUILT and landed on `main`.** Files: `ContributionSlots.tsx`
(+`SlotChip.tsx`), `WearNotes.tsx`/`WearTaps.tsx`, `contribution-slots.ts`, `wear.ts`
/`wear-options.ts`/`wear-actions.ts`, migration `0046_bag_wear.sql`.

- **Phase 1 (LIVE, no migration):** the "Have this in hand?" banner reads what the
  signed-in user has given (photo / review / axis bars), shows only open slots, an
  "added X of Y" pull, and a thank-you when complete. Anchors to the existing
  controls (`#photos`, `#reviews`, `#owner-ratings`).
- **Phase 2 + 3 (BUILT, dark until `0046` is applied):** carry + weight-feel taps
  and a short "what fits inside" note, all on the `bag_wear` table. `getWear` returns
  `available:false` when the table is absent, so the page is unchanged pre-migration
  and the slots + `#how-you-carry` section light up after. **OWNER applies `0046`
  via the db-migrate Action.** If another parallel session also created a `0046`,
  renumber the UNAPPLIED duplicate (never the recorded one).
- **Measured dimensions:** deliberately NOT a slot. It is catalog data, captured
  through the existing "Suggest an edit" widget, per "measurable = data, not a vote".
- **Instrumentation:** open-slot clicks fire `contribution_slot_clicked`
  (`slot` + `variant_id`) = the funnel-START signal. Completion is read from the
  review / vote / photo / `bag_wear` rows the slots lead to.
