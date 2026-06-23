# Homepage experiments — the testable backlog

*Created 2026-06-23. The hypotheses behind the "show, don't tell" homepage rework
(the `PersonaRouter` "What brings you in?" section + the hero). Pairs with
`docs/ux/home-use-case-value-props.md` (the copy options) and the PostHog
flag/`ExperimentExposure` infra already wired into `src/app/page.tsx`.*

## Ground rules (locked)

1. **One variable per test.** Each experiment differs from its control by exactly
   one thing — copy, OR layout, OR a single mechanic — never several at once. If a
   variant changes the headline *and* the interaction, a win is uninterpretable.
   (Owner correction, 2026-06-23.)
2. **Frame as a hypothesis:** *We believe [change] will cause [behavior] because
   [reason], measured by [metric].*
3. **One primary metric per test**, decided up front. Secondary metrics are
   observed, not used to call the result.
4. **Sequence at low traffic.** Running Layer A and Layer B simultaneously needs
   enough traffic to power ~10 concurrent tests. Until then: settle the hero frame
   (Layer A) first, then optimize tiles (Layer B) within the winning frame.
5. **Voice gate.** All variant copy passes `docs/voice-and-tone.md` (no em dashes,
   specifics over hype, never invent). The tagline keeps its dash by exception.

## Decisions already made (not open for testing)

- **Search lives once, in the hero** (Option 1 of the search-IA review). The hero
  is the single search input; the high-intent / GEO visitor expects it there.
- **Tile 3 "What's it worth?" is a worth-demo, not a second search box** — it shows
  a real price range on a featured bag and links into that bag. This removes the
  duplicate search input and gives the "click into an individual bag" path.
- **Tiles SHOW value, they don't describe it** (the whole point of the rework).
- **Tile 4 = ephemeral quiz that feeds a persistent profile.** The homepage quiz is
  framed as "what do you want, and for what?" (momentary, occasion-aware, no
  commitment). Every answer quietly enriches the durable taste profile (`/taste`,
  the Taste Map) in the background. The quiz is today's input; the profile is the
  accumulation. Resolves the "one blended taste vs. different bags for different
  occasions" tension without dropping the data-moat profile.
- **Coveted bags vs. coveted closets are separate surfaces.** Tile 6 = **Most
  coveted bags** (ranked by want-count, links to bag pages — discovery + GEO).
  **Coveted closets** stays the social leaderboard on `/closets`. Cross-linked,
  never conflated.

## Build dependencies (these tiles need backing built first)

- **`/deals` page does not exist yet.** Tile 5 ("See today's deals") needs it.
  Derivable from existing price data: catalog listings priced under their variant's
  resale median. Until built, tile 5 is a fake-door ("Notify me") or links to a
  filtered view, never a dead link.
- **A global "most-wanted bags" ranking does not exist yet.** Tile 6 needs it
  (want-counts aggregated across closets). Only a per-user "My Four Grails" feature
  exists today. Until built, tile 6 is a fake-door or hidden.
- **Tile 4** needs the quiz answers to persist into the taste profile even when
  taken from the homepage card (the persistence path exists for `/quiz`; confirm it
  fires from the inline card too).

---

## Layer A — whole-homepage tests

| ID | Single variable | Control | Variant | Primary metric |
|----|-----------------|---------|---------|----------------|
| **A1** | The hero / top slot | Tagline + search bar | The goal tiles lead; search demoted to a slim bar inside the hero | % of new sessions that reach any feature destination |
| **A2** | Hero headline copy (layout frozen) | Value tagline: *"Know what it's worth, and what it's worth to you."* | Utility line: *"Look up any designer bag: real prices, authentication, history."* | Signup rate |
| **A3** | Tile order (same tiles, same hero) | Money-first (Best deals → What's it worth) | Identity-first (Find the bag → Collect) | Tile-click distribution by persona |
| **A4** | Sitemap position | Bottom of page | Directly under the goal tiles | Bag pages viewed per session |

**A1 hypothesis (example, full form):** We believe leading the homepage with the
goal-picker (vs. a search-bar hero) will increase the share of *new* visitors who
reach a feature, because strangers arriving from GEO/social don't yet have a
specific bag to search. Measured by % of new sessions reaching any tile destination.

---

## Layer B — per-tile tests (within the winning hero frame)

Each holds everything else constant and changes the one named variable.

| ID | Tile | Single variable | Control | Variant | Primary metric |
|----|------|-----------------|---------|---------|----------------|
| **B1** | Is it real? | Headline copy (same phone visual + CTA) | "Is it real? Photograph any bag. We check it against the markers fakes miss." | "Found one in the wild? Photograph any bag. We check it against the markers fakes miss." | Scan-flow starts (split by traffic source) |
| **B2** | Collect & invest | Visual (same headline + CTA) | Portfolio value ($14,300, ▲ this year) | Market value-over-time curve | "Track your closet" click → closet-add rate |
| **B3** | What's it worth? | Hook copy (same worth-demo format + CTA) | "Chanel Classic Flap. See its real resale range." | "Paid retail? See what it actually sells for." | Tile CTR → bag-page reach |
| **B4** | Find the bag for me | Mechanic only (headline + CTA identical both arms) | Click-through to the quiz | First question rendered inline in the tile | Quiz completion rate |
| **B5** | Best deals right now | Specificity (same title + CTA) | "Listings priced under the resale median." | "Chanel Classic Flap, 26% under median right now." | Deals-tile CTR |
| **B6** | Slot 6 identity | Which tile fills the 6th slot | Most coveted (want-counts) | Thrift Coach win (a real logged find) | 7-day return rate + share events |

**B4 note (the single-variable fix):** an earlier draft changed *both* the headline
and the inline-vs-click mechanic, so a result wouldn't be attributable. Corrected:
both arms use the same headline ("Find the bag for me") and CTA; the *only*
difference is whether the first question renders inline. A completion lift is then
cleanly attributable to the inline mechanic.

---

## Bench (ideas not yet slotted)

- Taste Map completeness meter (the data-moat hook) — candidate for a future tile slot.
- Price-drop watch toggle — show the alert mechanic instead of describing it.
- Authentication-depth teaser — 2–3 real markers for a hero bag, proving the
  reference is deep.

## Build notes

- Each test ships as a PostHog flag with a `control` + one `variant`; exposure is
  tracked via `ExperimentExposure` (already used for `personalized_home`).
- Tiles that need interactivity (B4 inline quiz, any toggle) become client
  components; the rest stay server-rendered.
- The value curve (B2 variant) needs the real `price_history` series wired in;
  until then label any figure as sample, never assert it.
