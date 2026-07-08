# Unified search + closet-add-is-review — build spec

*Created 2026-07-07. One search component serves the nav and the closet; adding a
bag you own IS reviewing it. Change spec against what already exists, not greenfield.
Pairs with `docs/ux/review-data-leaderboards.md` (the data → leaderboard flywheel),
`docs/ux/ux-research-brief.md` §B/C/F (StoryGraph / Letterboxd / Fragrantica), and the
`idea_founder_first_reviews` memory (founding-reviewer seeding plan).*

## The one idea

There is **one** bag-finder component. The nav search and the "add a bag to your
closet" identifier are the same experience. The only thing that differs is **what a
click does**, and that is set by where the finder was launched:

- launched from the **nav** → a click opens the bag's page (browsing)
- launched from **add to closet** → a click opens the Want / Have / Had fork (logging)

Adding a bag you *have* or *had* opens the review inline. Same sheet, not a second trip.
(This is Letterboxd's single "Log" sheet, already flagged best-in-class in the brief §C.)

## What already exists (ground truth — build on it, don't rebuild)

- **Nav search + dropdown:** `src/components/HeaderNav.tsx` (a `suggestions` dropdown
  that fetches `/api/search-suggest` on type).
- **Suggest API:** `src/app/api/search-suggest/route.ts` — text-only, gated at
  `q.length < 2`, returns `{label, sub, href}`. This is the main thing that must change.
- **Search page:** `src/app/search/page.tsx` (+ `SearchFilters.tsx`, `RequestBagForm.tsx`,
  `SearchTracker.tsx`) — hybrid search, priority pinning, `getVariantImages`.
- **Closet:** `src/app/closet/page.tsx` already has `want / have / had` (`getCloset`,
  `STATUS_LABELS`), variant images via `getVariantImages`.
- **Reviews (0003, live):** `rating` 1-5 · `worth_it` boolean · `occasion` (free text) ·
  `durability_rating` 1-5 · `title` / `body`. Profile view: `src/app/profile/reviews`.
- **Opinion axes (`src/lib/votes.ts`, 0012, human-gated):** `build_quality`,
  `everyday_wearability`, `roomy_vs_compact`, `comfort`, `versatility`.
- **Existing review mockups:** `docs/review/bag-identification-review.html`,
  `docs/review/chanel-flap-teaching.html`.

## Component behaviour

1. **Populate on focus.** Click the field and a grid of bags is already there
   ("Popular right now"), before any keystroke. Never a blank box, never a "start
   typing" empty state.
2. **In-bar hint.** The "start typing →" cue lives inside the field, after the example,
   in parentheses: `Chanel flap, black caviar   (start typing →)`. Not a line under the grid.
3. **Model-level by default.** Default and broad-query results show one tile **per
   model** (hero variant image + a "N colours" pill). Keeps the grid calm.
4. **Adaptive model → colour.** When the query resolves to ONE model (e.g. "Lady Dior",
   "flap"), OR the user taps a model tile, the grid becomes **that model in its
   colourways** (variant thumbnails). An owner who does not know the colour *name* picks
   the closest swatch by sight.
5. **Colour is captured, never required.** Every colourway grid ends with a **"Not sure"**
   tile. The record attaches to the MODEL; colour rides along as optional metadata.
6. **Photo fallback.** A "can't find it? add a photo" link inside the finder for the
   owner who cannot name the bag at all (maps later, nothing lost).
7. **Live narrow.** Typing filters the grid in place (matches name / brand / colour name).

## Data / API deltas (the real work)

Change `search-suggest` (or add a sibling `/api/bag-finder`) to return **visual, grouped**
results and to answer the empty query:

- `q` empty or 1 char → return the **top-N popular models** (not `[]`). Popularity source:
  closet-add counts / view counts / a curated pin list (reuse `findPriorityStyles` /
  `search-priority.ts` if it fits).
- Each result is a **model** with: `style_id`, `name`, `brand`, a hero variant image,
  and its `colours[]` (each `{variant_id, colour_name, image}` via `getVariantImages`).
- Keep it read-only and degrade to empty on missing env (mirror the current file).
- Tiles are **generic bag icon in the real leather colour, no brand logos** (see
  `feedback_no_logo_illustration`). Recognition = colour + name.

## Closet states + review — mapped to the REAL schema

Want / Have / Had already exist. The delta is that **Have / Had opens the review inline**
in the same sheet, and the fields map to what we already collect:

| Sheet element | Existing field | Notes |
|---|---|---|
| ⭐ Stars | `rating` 1-5 | The light-touch floor (see decision below). |
| In your words | `title` / `body` | Optional, no minimum. Long-form OR one-liner (brief §C). |
| Worth it? | `worth_it` boolean | ONE toggle. Do **not** add a "worth the price" tag. |
| Occasion / context chips | `occasion` | Office, going-out, travel, everyday. |
| Durability | `durability_rating` 1-5 | Optional. |
| Opinion axes | `votes.ts` (5 axes) | build_quality, everyday_wearability, roomy_vs_compact, comfort, versatility. |
| Photos | reviewer photo upload | Her first-party angle; the "first review" moment. |

**Correction to the mock's tag groups (must honour):** the mock showed "Holds value" and
"Worth the price" chips. Both are **banned as votes/tags** — `holds_value` is a market fact
computed from `price_history`, `worth_the_price` duplicates the `worth_it` boolean. Already
retired in `votes.ts`. Surface value retention as a **data-derived** board, never a chip.
Rule: *a thing we can measure from data is never a subjective vote.*

Auto-graduate: logging a **have** on a bag that was **want** moves it out of the wishlist.

## Open decision — how to capture the 5 opinion axes

The mock used binary tag chips (low friction). The live 0012 schema is 1-5 per axis.

| Option | Floor | Data richness | Fit |
|---|---|---|---|
| **A. Chips now, sliders later (Recommended)** — capture axes as optional one-tap chips at review time, keep the 1-5 column, store a tapped chip as a 4/5 | Lowest | Good | Best for seeding volume with founding reviewers |
| B. Full 1-5 sliders inline | Higher | Best | Better once there's momentum, worse for a low-floor beta |
| C. Axes off the review, votable only on the bag page | Lowest at review | Splits the moment | Rejected — recreates Fragrantica's rating-vs-review split |

**Recommended A:** rating required; words, occasion, durability, axes all optional and
one-tap. No hollow owned-bags (Have/Had always opens the sheet), but never a forced essay.

## Guardrails

- **No brand logos** anywhere in tiles or the sheet (`feedback_no_logo_illustration`).
- **Real colourways only** per style, from the catalogue / seasonal-archive naming
  (`seasonal_archive_archivist`), never invented.
- **Reviewer voice = experience + "my take," never a verdict.** Value / authenticity /
  fit stay framed as opinion + markers, per the ENFORCED hedging frames.
- **First-reviewer moment:** the confirmation nods to "you're the first review on this bag"
  only when true.

## Metric it moves

Completed reviews + clean structured metadata (every axis/occasion tag compounds into
filters, the Taste Map, and recs) + browse depth (one search that never dead-ends).
Downstream monetization: each reviewed bag page is the natural home for that bag's
affiliate link.

## Build checklist (touch points)

- [ ] `search-suggest` (or new endpoint): popular-on-empty + visual grouped-by-model payload.
- [ ] Shared `BagFinder` component: populate-on-focus grid, model→colour drill, in-bar
      hint, "Not sure" tile, photo-fallback link.
- [ ] `HeaderNav.tsx`: swap the text dropdown for `BagFinder` (nav intent → bag page).
- [ ] Closet-add entry mounts `BagFinder` (closet intent → Want/Have/Had fork).
- [ ] Review sheet inline in the Have/Had branch, fields mapped to the table above.
- [ ] Honour the axis decision (A) and the holds-value / worth-the-price ban.
