# Persona + flow UX review — 2026-07-05

*Owner-requested deep review, two lenses: (1) the site as each persona experiences it, (2) the canonical
journeys ranked by importance. Personas and journeys are the canon from `docs/personas.md` and
`docs/analytics-strategy.md` §2 (never invented here). Method: five parallel reviewers (one per persona)
walking a live render of `main` (commit `0e80fba`) plus the code for signed-in surfaces; the six most
serious findings were independently re-verified (live curl or file:line) before this doc was written.
Findings marked ✅ are re-verified; the rest carry the reviewer's file:line citation.*

## Verdict in one paragraph

Every canonical journey EXISTS end to end, and several surfaces are genuinely excellent (the value
module's honesty framing, the Where-to-buy trust labels, the /found flip moment, the quiz's no-gatekeeping).
The problems cluster at three altitudes: **(a) five correctness/trust bugs** that contradict locked rules
(wrong-house lore, a broken alert filter, a misleading price verdict, internal provenance leaking into
reader copy, a pre-approval rent CTA); **(b) the conversion spine leaks at its joints** (search buries the
matched bag, the compare tray is unusable on mobile, the highest-intent outbound click is untracked,
"cheapest" ignores landed cost, compare doesn't hand off); **(c) the steward/collector core values bags at
retail while a working resale engine sits unused one file away.** Also: `/compare` (G2) is HALF-SHIPPED but
`analytics-strategy.md` still records it as open; reconcile before another session rebuilds it.

---

## Lens 1 — persona-perspective review

### Maya, the Appreciator (largest segment, top of funnel)
**Verdict:** her journey exists and each surface serves her, but it snaps at the hand-off joints and the
lore layer has correctness cracks a lore-learner will catch.
1. ✅ **Quiz result evaporates on signup/save.** Result lives only in client state; the signup box promises
   "Matched bags saved for you" but nothing persists answers through auth (`TasteQuizClient.tsx:161`,
   `taste-result-actions.ts:30`, `QuickSaveHeart.tsx:40`). Her canonical journey's first joint is broken.
2. ✅ **Wrong-house lore.** LV brand page + Daily Pouch bag page tell Bottega's Daniel Lee Pouch story:
   `matchBagStory(styleName)` has no brand check (`brand/[brandId]/page.tsx:95`, `bag-stories/data.ts:1301`).
   Violates never-invent in reader-facing lore.
3. ✅ **"Around the middle" verdict is wrong.** Position buckets span low×1.04..high×0.96
   (`ValueModule.tsx:196-198`), so a $500 listing against a $406–$5,030 range reads "around the middle."
   Plain language that misleads. Fix: band against the median.
4. **Jargon undefined on first use** (Vachetta, heat stamp) on bag pages, against the stored gloss rule;
   the gloss pattern exists elsewhere (clochette, chèvre), so it's drift not absence.
5. **Signed-out save controls look live then bounce to /signup** with no explanation and (per 1) the intent
   is lost after auth (`WantBreadth.tsx:42`, `QuickSaveHeart.tsx:32-40`).
6. **Brand-page stats read broken:** "Avg resale $1,876.293", "$0 entry" retail ladder, near-empty
   signature tallies (`brand/[brandId]/page.tsx:283-300`).
7. **Article shop module interrupts one paragraph in** (before the first H2) plus repeats at the end;
   the early instance costs read-through for no coverage gain.
8. **Bag-page order puts the transact cluster above DNA/Story** for a GEO-landing appreciator; cheap fix
   is a story teaser near the value module, not reordering (money-above-fold is a locked design).
**Works well:** the quiz itself (light, never gatekept, feel-seen reads); the Story module + hedged value
voice; Journal departments teaching the hedge frames as navigation.

### Sofia, the First-Serious-Buyer (affiliate backbone)
**Verdict:** works end to end only if she lands directly on a rich bag page on desktop; the two ends
(search in, compare through) fail on mobile, her primary device.
1. ✅ **Search buries her bag.** "neverfull" renders the full 337-style LV brand card ABOVE the Neverfull
   style card (style link at DOM position ~171/172) (`SearchFilters.tsx:333` vs `:360`). Fix: styles
   before brands when a style matched.
2. ✅ **Compare tray occluded on mobile.** Tray and StickyActionBar are both `fixed inset-x-0 bottom-0
   z-40`; the bar renders later and paints over the tray's "Compare N bags →" link (`CompareControls.tsx:105`,
   `StickyActionBar.tsx:69`). Fix: `bottom-14 sm:bottom-0` on the tray or a compare chip in the bar.
3. ✅ **The headline price line cites an unlinked eBay price** and calls near-floor "around the middle"
   (same bucket bug as Maya-3). The persona who "distrusts a price with no evidence" gets exactly that.
4. ✅ **"Snippet-sourced; needs verification." leaks into the auth checklist** at her highest-anxiety
   moment (`page.tsx:495-524` renders DB text raw). Translate provenance flags to reader language
   ("widely repeated detail, confirm in hand") or hold flagged markers back. Do NOT silently strip the
   hedge (that would overstate confidence).
5. **Value and auth sit ~13 sections apart** on the bag page; the strategy requires them answered
   together. Fix: a 3-marker auth digest directly under the value summary linking to the full checklist.
6. **Imported duplicate styles make compare columns empty** ("Damier Ebene Neverfull MM" thin twin of the
   curated variant shows "—" everywhere next to 426 prices).
7. **/compare true state: built, working, invisible.** Real table, tray, `bags_compared` event; linked
   from NOTHING; no authentication row; no buy hand-off. (G2 half-shipped; strategy doc stale.)
8. **have → review direction not wired** (review prompts closet-add, but marking `have` never prompts a
   review).
**Works well:** the buy hand-off trust labels (per-platform auth/returns + FTC line); the value module's
evidence-first framing.

### Diane, the Collector / Steward (highest LTV)
**Verdict:** skeleton complete and the bag-page value module is her best surface; but the closet/report
core answers "what is it worth" with RETAIL while the resale engine (`lib/portfolio.ts`) is used only by
the homepage tile, so the journey's first and last steps undercut the middle.
1. ✅ **Two different collection values.** Homepage tile = resale medians (`portfolio.ts` via
   `/api/home/me`); `/closet` + `/closet/report` = retail sums (`closet/page.tsx:37-40`,
   `report/page.tsx:45`); report gain/loss = retail minus paid, which can show a paper "gain" on a bag
   that resells at a loss. Fix: one resale-median engine everywhere, retail only as a labeled fallback.
2. **"This exact variant" pill overclaims** on leather/colour-blind blends (Kelly 28: croc + togo in one
   $6.5k–$400k range labeled exact) (`ValueModule.tsx:294`). Rename honestly until spec lenses exist.
3. ✅ **Alert cron bugs:** filters `price_type !== "retail"` but the canonical value is `"retail_msrp"`
   (retail rows inflate alert medians), and alerts can fire on `sold` rows she can't buy
   (`cron/price-alerts/route.ts:102,107,122`).
4. **Sold vs asking never labeled on the bag page** though the DB distinguishes them and article charts
   already split them. Badge rows/dots; annotate the range ("N sold + M asks").
5. **No value-over-time in the portfolio** (her named pain point). A monthly closet-value snapshot + a
   sparkline is enough to start.
6. **Mixed currencies summed under one symbol** in closet/report totals; condition-unknown coverage
   (335 of 490 Kelly rows) unacknowledged in the ladder caption.
7. **Estimate/as-of frame doesn't travel:** `/closet` caveat renders only when items lack prices; the CSV
   export (the artifact she'd hand an insurer) carries no estimate-not-appraisal line.
8. **Her whole journey is analytically invisible:** no closet-value/alert-set/report events exist (the
   strategy doc admits this).
**Works well:** owner/collector value framing (peer-expert, dated, honest empty states); the report's tax
footer nails records-not-advice.

### Jordan, the Reseller / Flipper (viral loop)
**Verdict:** G3 is one tap from closed on the happy path (/identify already bundles ID + if-genuine value
+ links); every FALLBACK dead-ends on the "real" half.
1. **/identify has no non-photo fallback** (rate-limited/keyless/low-confidence → only a generic
   `/articles` link). Add "markers by house →" to `/authentication`, brand-deep-linked when known.
2. **Mid-tier bag pages dead-end on auth:** Coach Tabby has the price floor but "We haven't researched the
   authentication details…" with NO link to the existing Coach guide (`page.tsx:1306-1317`). Link brand
   guides from the auth empty state.
3. **The brand guide prices only its topic bag** (a Rogue find gets Tabby's floor). Add a "price your
   find" style lookup in the guide's shop module.
4. **/deals contains zero Coach/mid-tier** (10 bags, floor $608, ultra-luxury only) while Coach listing
   data exists on bag pages. Data-lane: extend deal capture to the Contemporary tier.
5. **Flip funnel unmeasurable:** `auth_section_engaged` can't fire on Coach variants (no auth section) and
   never fires on guide reads. Fire it from auth-guide article views.
6. **Identify shows the median, not the floor** a flipper decides on ("$264 typical" vs $103 floor).
7. **Auth escalation links target /articles instead of /authentication** (two places).
8. **Catalog-match fallback searches brand-only** (q=Coach → 700 styles) when style is known
   (`identify/page.tsx:114-119`).
**Works well:** /found post-submit ("Logged. Nice find." → consign links with `source: thrift_find`); the
Coach guide's one-way-logic voice + mobile StickyActionBar putting Sell in the thumb zone.

### The Cross-Shopper (conversion overlay)
**Verdict:** the one-journey architecture genuinely exists (deal is a filter at the route level; one
listings engine) but the money moment is half-blind and sticker-naive.
1. ✅ **Live-listing outbound clicks never tracked.** `ListingsForSale.tsx` renders plain `<a>`; the
   strongest conversion surface fires no `outbound_resale_clicked`.
2. **`estimateLandedCost` used by ZERO UI** (built + unit-tested). Lowest sticker impersonates best value
   (a Vestiaire +10%+$15 listing can sort above a cheaper-landed Fashionphile).
3. **/compare dead-ends** — no live-price row, no outbound links; decision ends in backtracking.
4. **No mode-neutral shop door:** the only persistent entrance is labeled Deals (nav + homepage). Propose
   (nav is owner-gated): "Shop the market" nav label landing /shop with Deals as the visible toggle.
5. **"Add to compare" only on bag pages** — set assembly still requires opening every candidate.
6. ✅ **"Rent it first" CTA is LIVE on articles** (`PostBagCTA.tsx:72-85`) despite the rule to ship only
   after rental-program approval (Vivrelle was Pending as of 2026-06-27). Verify approval status; if not
   approved, gate the block on the affiliate code env existing.
7. **Strategy doc stale:** G2 recorded open though /compare + tray + `bags_compared` exist;
   `catalog_filtered` DOES fire from /shop (`ShopControls.tsx:168`) contra the doc.
8. **`bags_compared` undercounts** (fires on tray click only, never on /compare views/shared URLs).
**Works well:** WhereToBuy is the model hand-off (trust labels + FTC + sponsored rels + tracking);
/deals → 307 → `/shop?deals=1` honors deal-is-a-filter.

---

## Lens 2 — flows ranked by importance, weakest link per flow

| Rank | Flow (canon §2) | Why it ranks here (metric) | Weakest links (from above) |
|---|---|---|---|
| 1 | Sofia: which bag → real+fair → buy | The affiliate backbone; every fix feeds `outbound_resale_clicked` | Search order (S1) · mobile compare tray (S2) · provenance leak (S4) · value/auth distance (S5) |
| 2 | Cross-Shopper: compare → hand off | Same conversion spine + its measurement | Untracked listing clicks (X1) · landed cost unused (X2) · compare dead-end (X3) |
| 3 | Maya: quiz → want → alert | Largest segment; feeds every later funnel (`quiz_completed`, `item_saved`, signup) | Result evaporates through signup (M1) · lore correctness (M2, M3) |
| 4 | Diane: closet → value → watch → sell | Highest LTV, retention engine | Retail-valued portfolio (D1) · alert cron bugs (D3) · invisible in analytics (D8) |
| 5 | Jordan: identify → comp → sell | Viral acquisition loop (`outbound_consign_clicked`) | Fallback dead-ends (J1, J2) · no mid-tier deals (J4) |

## Recommended fix order

- **P0 — correctness/trust, contradicts locked rules (small diffs, one session):** wrong-house story
  brand-guard (M2) · alert-cron retail literal + sold-row guard (D3) · median-based position verdict
  (M3/S3) · provenance-flag translation in auth checklist (S4) · rent-CTA approval gate pending owner
  confirmation (X6) · strategy-doc G2 reconcile (X7).
- **P1 — conversion spine (a focused build session):** search styles-before-brands (S1) · compare tray
  z/bottom fix + compare on shop/search cards + live-price/hand-off row on /compare (S2/X3/X5) ·
  ListingsForSale click tracking (X1) · landed-cost chip + sort (X2) · quiz-result persistence through
  signup + pending-save completion (M1/M5) · auth digest near value + brand-guide links from auth empty
  states and /identify fallback (S5/J1/J2).
- **P2 — LTV + polish:** resale-based closet/report + single value engine (D1) · sold-vs-asking labeling
  + honest scope pill (D4/D2) · portfolio value-over-time snapshot (D5) · currency grouping + CSV
  disclaimer (D6/D7) · Diane/compare/guide instrumentation batch (D8/X8/J5) · jargon gloss pass (M4) ·
  brand-stat formatting (M6) · article shop-module placement (M7) · guide price-your-find (J3) ·
  mid-tier deal capture (J4, data lane).

*Not itemized above: each persona reviewer also returned "works well" confirmations; the voice gate held
everywhere reviewed except the provenance leak (S4).*
