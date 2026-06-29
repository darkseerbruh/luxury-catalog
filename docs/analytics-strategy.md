# Luxury Catalog — Analytics strategy (persona → journey → instrumentation)

*Internal strategy deliverable. Last drafted 2026-06-28. Pairs with `personas.md`
(the who) and `analytics-setup.md` (the how-to-wire). This doc is the **why**: it
derives each measurable journey from a persona's desired outcome, checks whether
the flow that serves it exists, and only then says what to instrument.*

> **Order of operations (non-negotiable).** Personas → desired outcome → the
> customer journey that delivers it → does that flow exist → fix the flow gaps →
> **instrument last.** We never invent a journey to justify an event. If a journey
> has no flow, the answer is to build the flow, not to instrument a fiction.

---

## 1. Method

For each persona in `personas.md` §3 we take the **Success Factor** (their desired
outcome) and the **primary jobs**, lift the journey the doc already names, then
test each step against the actual routes/components on `main`. The output is a
small set of **flow gaps** (things that should exist and do not, or are
fragmented), ranked by the metric they move. Instrumentation is derived from the
journeys at the end, and is explicitly gated on the flows existing first.

Journeys are grounded in `personas.md`, not invented here. Flow status is grounded
in the codebase (route + component checks on `main`, 2026-06-28).

---

## 2. Persona → outcome → journey → flow status

| Persona | Desired outcome (Success Factor) | Journey that delivers it (personas.md §3) | Flow status on `main` |
|---|---|---|---|
| **Maya, Appreciator** | "Let into the club via real knowledge; daydream a grail." | quiz → matched bags → bag Story + value → save to `want` → later, price alert | **Built.** `/quiz`, recommendations, bag page Story + value, save heart, `cron/price-alerts`. |
| **Sofia, First-Buyer** | Confidence she chose well, was not scammed, did not overpay. | decide *which* bag (compare 2-3) → bag page: auth markers + value gauge together → buy hand-off → `have` + review | **Partial.** Bag page + buy hand-off built; **no side-by-side compare** for the 2-3-bag decision. |
| **Diane, Collector** | Collection value understood, organized, defensible. | closet/portfolio → spec-exact per-bag value → alerts as market-watch → sell from sold-history → collection report | **Built.** `/closet`, `lib/portfolio.ts`, value module, alerts, `WhereToSell`, `/closet/report`. |
| **Jordan, Reseller** | Buy low, confirm real, sell at/above comp, fast. | mobile identify/auth → comp + price-floor → sell/consign hand-off → sold-history | **Partial.** Pieces built (`/identify` with hand-off, auth guides, bag comps); the 60-second mobile "real **and** worth it" moment is **split** across `/identify` and the bag page. |
| **Cross-Shopper** (overlay) | Compare the market, hand off to the cheapest legit seller. | shop/compare → low/median/high → buy/sell/rent hand-off | **Partial.** `/shop` + per-bag low/median/high built; **compare happens across tabs**, no pinned compare. |

**Read:** most flows exist. The strategy's real findings are three flow gaps, plus
a foundational data-model gap that makes every journey above anonymous.

---

## 3. The flow gaps (ranked, with the metric each moves)

### G1 (foundational) — persona identity is broken at the data source
`onboarding/page.tsx` stores one old forced-choice `persona`; `profile-actions.ts`
saves a single enum; there is no Axis-B **motivation** multi-select and no
behavior-derived **maturity**. `personas.md` §4 already specs the fix (motivations
`text[]` + inferred `maturity_stage`). **Until this lands, no journey below can be
segmented by persona**, so the funnels are anonymous.
*Moves: all persona-segmented engagement + monetization measurement. Precondition
for everything else.* **Status: building now (this branch).**

### G2 — no side-by-side bag compare
Sofia's defining job ("decide which bag") and the Cross-Shopper's whole mode
("compare the market") have no dedicated compare surface; the decision happens
across browser tabs.
*Moves: engagement (decision confidence) and the affiliate buy-click that follows.
This is the conversion moment for the affiliate-backbone persona.* **Status: open.**

### G3 (minor) — Jordan's mobile moment is fragmented
Identify and comps live on separate pages, so the thrift-store "real and worth it
in 60 seconds" job needs two stops.
*Moves: engagement for the viral acquisition loop. Lowest priority.* **Status: open.**

---

## 4. Only then: instrument each journey's success signal

Derived from each persona's "How we'd recognize her in data" line. **Gated on G1**
(you need the persona dimension first) and, for the compare signal, on G2.

| Persona journey | Success signal (personas.md §3) | Instrument status |
|---|---|---|
| Maya: appreciate without buying | quiz complete (no signup) + multiple `want` + deep Story/article reads | `item_saved` fires; `style_viewed` + an `article_viewed` do **not** yet |
| Sofia: dual-anxiety resolved | auth-view **and** value-view, same session, same bag → buy-click | `value_module_viewed` fires; `auth_section_engaged` is **dead** (defined, never fired) |
| Diane: stewardship | repeat closet-value views + alerts-as-watch + sold-history adds | closet-value + alert-set events **not defined** |
| Jordan: flip | auth-guide + comp views on mid-tier → sell-click → sold-history | `outbound_consign_clicked` fires; `auth_section_engaged` dead |
| Cross-Shopper: convert | market-compare in session → outbound affiliate click | outbound fires; a compare event waits on **G2** existing |

**Dead events to fix when we instrument (defined in `events.ts`, fire nowhere):**
`style_viewed`, `auth_section_engaged`, `inquiry_submitted`, `monetization_interest`.
`/shop` filtering does not fire `catalog_filtered` (only `/search` does). The
object-oriented UX pages (`/leather /silhouette /hardware /era /color`) and article
reads emit only raw `$pageview`, so they are absent from journey funnels.

---

## 5. Build sequence

1. **G1 — persona/motivation model** (this branch `analytics/persona-model`):
   migration `0035_persona_model.sql` (motivations `text[]`, `maturity_stage text`),
   onboarding motivation multi-select, behavior-derived maturity, back-compat
   `persona` preserved. *Owner applies the migration + merges.*
2. **G2 — side-by-side bag compare** (decide scope, then build).
3. **G3 — unify Jordan's mobile auth + comp moment.**
4. **Instrument last** — wire the §4 success signals + revive the four dead events,
   now segmentable by persona because G1 exists.

---

## 6. Open validation notes

- Maturity inference (§G1) derives from closet state (`want`/`have`) today; the
  **reseller** stage needs sell-click / sold-history signals we do not capture yet,
  so it is left out rather than fabricated. Revisit once sell signals exist.
- All persona/journey hypotheses are provisional until PostHog usage validates them
  (per `personas.md` §5), which is the entire reason G1 comes before instrumentation.
