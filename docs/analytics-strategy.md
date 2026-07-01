# Luxury Catalog — Analytics strategy (persona → journey → instrumentation)

*Internal strategy deliverable. Drafted 2026-06-28, refreshed 2026-06-30. This doc is
the **why**: it derives each measurable journey from a persona's desired outcome, checks
whether the flow that serves it exists, and only then says what to instrument. It owns
the persona journeys and flow gaps; it does not restate what lives elsewhere. Pairs with:*
- *`personas.md` — the who.*
- *`analyst-standard.md` §1 — the metric tree + funnel (single home; do not re-list here).*
- *`analytics-setup.md` — how the pipe is wired.*
- *`npm run analytics:pulse` (readiness block) — the **live** firing state of every event.
  This is the single source of truth for "does event X fire," so this doc names journeys,
  never a static event-status list that would drift.*

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

### G1 (foundational) — persona identity at the data source — **SHIPPED**
The old single forced-choice `persona` is replaced by an Axis-B **motivation**
multi-select (`motivations text[]`) plus a behavior-derived **maturity** stage, per
`personas.md` §4. Landed in `0037_persona_model.sql` (additive; the legacy `persona`
enum is kept and still populated) with `lib/maturity.ts`, the onboarding multi-select,
and `profile-actions.ts`. Journeys below can now be segmented by persona.
*Moved: all persona-segmented engagement + monetization measurement. Was the
precondition for everything else.* **Status: DONE (migration 0037, on `main`).**

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

| Persona journey | Success signal (personas.md §3) | Signal to watch |
|---|---|---|
| Maya: appreciate without buying | quiz complete (no signup) + multiple `want` + deep Story/article reads | `quiz_completed`, `item_saved`, `article_viewed` |
| Sofia: dual-anxiety resolved | auth-view **and** value-view, same session, same bag → buy-click | `value_module_viewed` + `auth_section_engaged` → `outbound_resale_clicked` |
| Diane: stewardship | repeat closet-value views + alerts-as-watch + sold-history adds | closet-value + alert-set events (**not defined yet** — real taxonomy gap) |
| Jordan: flip | auth-guide + comp views on mid-tier → sell-click → sold-history | `auth_section_engaged` → `outbound_consign_clicked` |
| Cross-Shopper: convert | market-compare in session → outbound affiliate click | `bags_compared` (waits on **G2**) → `outbound_resale_clicked` |

**Which of these fire today is not tracked here — run `npm run analytics:pulse` and read
the `instrumentation_readiness` block.** It lists every event in `events.ts` and whether it
has ever fired, so it never drifts. Two standing taxonomy gaps it will not catch, because
the events are not defined at all: **closet-value / alert-set** events for Diane, and a
**rental** value event (monetization lane 2). `/shop` filtering also does not emit
`catalog_filtered` (only `/search` does).

---

## 5. Build sequence

1. **G1 — persona/motivation model — DONE.** Migration `0037_persona_model.sql`
   (motivations `text[]`, `maturity_stage text`), onboarding motivation multi-select,
   behavior-derived maturity, back-compat `persona` preserved. On `main`.
2. **G2 — side-by-side bag compare** (decide scope, then build). *Next.*
3. **G3 — unify Jordan's mobile auth + comp moment.**
4. **Instrument last** — wire the §4 success signals + the never-fired value events,
   now segmentable by persona because G1 exists. Verify each with the pulse
   readiness block before trusting it.

---

## 6. Open validation notes

- Maturity inference (§G1) derives from closet state (`want`/`have`) today; the
  **reseller** stage needs sell-click / sold-history signals we do not capture yet,
  so it is left out rather than fabricated. Revisit once sell signals exist.
- All persona/journey hypotheses are provisional until PostHog usage validates them
  (per `personas.md` §5), which is the entire reason G1 comes before instrumentation.
