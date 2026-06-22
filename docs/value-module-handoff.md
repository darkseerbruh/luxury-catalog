# Value Module — Consolidated Handoff

*Self-contained brief for the "what it's worth" feature on the bag page. Paste/point a fresh chat at this file to continue with full context. Last updated 2026-06-22.*

> Sync `main` first (`git fetch origin && git checkout main && git pull`). Everything below labelled "shipped" is on `main`; "gated" work is on a branch or waiting on the operator.

---

## 1. The vision

Make each bag page tell **one easy, glanceable, comprehensive value story**: what the bag is worth, whether a given price is good, and whether now is a good time — without the user doing math. Synthesized from three references the owner pulled:

- **Google Shopping** — merchant rows + a "best price" marker, "Typically $X–$X."
- **Kelley Blue Book** — a "good price / great price" grade against a range.
- **Google Flights** — a *timing* verdict ("prices are high, usually cheaper earlier"), a Best-vs-Cheapest toggle, and the date-grid (flex one variable to save).

The throughline: **show evidence first, assert second** — the more the UI claims (grade, timing), the more it must be right, and the data is still thin, so assertion is dialed up only as data deepens.

---

## 2. Locked decisions (from the design session)

| Decision | Choice | Why |
|---|---|---|
| Who it serves | **All three users** (buyer / owner / collector) via one adaptive shell, reframed by closet state (want/have/had) | Owner can't yet tell which is most common/monetizable — so **instrument it and let usage data decide** |
| Thin-data posture | **Broaden scope, clearly labeled** (e.g. green → all colorways, "8 listings across colorways") | Keeps the viz useful without overclaiming; scope chip is the honesty surface |
| Asking vs sold | Build on **asking** prices now (labeled "listed"), upgrade to sold later | Sold prices are API-gated (eBay Marketplace Insights); don't hold the feature hostage |
| Assertion level | **Evidence-first at launch**, promote the verdict as M1+ signals harden | The verdict is weakest exactly where data is thinnest today |

**Honesty rails (non-negotiable, match the catalog's house rules):** every number is a real recorded price; copy is descriptive + dated, **never advice, never an appraisal**, never "investment/guaranteed" framing; grade *within* condition tier, never across; degrade to "no recorded resale data yet" when empty; **never invent** a year/condition/attribute — unstated stays `null`.

---

## 3. Architecture — one primitive, one adaptive shell

**Everything complex is one component.** `CompScale` = comparable prices on a shared price axis, optionally grouped into rows:

| View | = `CompScale` with… | Status |
|---|---|---|
| Value gauge | no grouping | shipped (M0) |
| Condition ladder | `rows` grouped by condition tier | shipped (M2) |
| Year lens | `rows` grouped by era | primitive ready; data gated |
| Flex grid / era×condition matrix | 2-axis grouping | designed; data gated |

`ValueModule` is **one skeleton, three framings** (buyer/owner/collector) — only the headline, verdict line, and contextual link change; the gauge/evidence is identical. It fires `value_module_viewed` (framing + comp counts + demand level) so the buy/sell click that follows reveals which user type converts.

**Files:**
- `src/app/bag/[variantId]/CompScale.tsx` — the price-axis primitive (gauge + ladder modes).
- `src/app/bag/[variantId]/ValueModule.tsx` — the adaptive shell + verdict + timing note + era chip.
- `src/app/bag/[variantId]/page.tsx` — computes framing, listed comps, condition rows, era; renders `<ValueModule>` (replaced the old "What it's worth" block ~line 506).
- `src/lib/analytics/events.ts` — `value_module_viewed` event.
- `src/lib/demand.ts` — `getVariantDemand` (wants/watchers → level + label), already on the page.

---

## 4. What's shipped (on `main`)

| Milestone | What | Commit |
|---|---|---|
| **M0** | `CompScale` gauge + adaptive `ValueModule` + instrumentation; plots live `listed` comps on the typical range, flags cheapest | merge `732f59c` |
| **M1** | Demand signal + retail-hike catalyst → a framing-aware **timing note** ("waiting hasn't paid off lately") — descriptive, never advice | merge `d9efdf2` |
| **M2** | **Condition ladder** — groups recorded resale into the canonical `sale_condition` tiers (enum already at DB; eBay normalizes on ingest via `normalizeEbayCondition`), grades *within* tier so a cheaper-but-worn bag can't pose as a deal. Shows at ≥2 populated tiers, else the gauge | merge `d9efdf2` |
| **Era context** | `Vintage`/`Discontinued` chip + neutral note from the variant's `year_start/year_end` — the honest year signal available today | merge `d9efdf2` |

All shipped from data already on the page — **no migration**. Verified green at each merge (`tsc`/`eslint`/`next build`/tests).

---

## 5. Built but gated

**Item-spec extraction pass** — ✅ **MERGED to `main`** (merge `925eb47`, 2026-06-22). The unlock for the era×condition matrix + attribute (inclusions/hardware/material) grading. Code is live in the repo; activation is still operator-gated (see chain below).
- `src/lib/ingest/spec-extract.ts` — pure prompt + validated parser (out-of-range years / junk → `null`).
- `supabase/ingest/enrich-specs.ts` — Claude Haiku runner, mirrors the proven `enrich-conditions.ts`; dry-run by default.
- 5 new parser tests. **Runtime-inert** (CLI tool — no app/migration change), zero live risk to merge.

**Activation chain (operator / human-gated):**
1. Apply migrations `0022` (spec columns) + `0023` (source-text columns: `notes`, `condition_detail`, `enrichment`).
2. Run a price capture (e.g. `npm run ingest:ebay`), load it.
3. `npx tsx supabase/ingest/enrich-specs.ts --write` — needs `ANTHROPIC_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Roadmap & data gaps

**Next UI mile (after extraction activates):** wire `production_year` into the bag-page read behind a **guarded/resilient select** (don't break the live page if `0022` isn't applied), then render the real **era×condition matrix**.

**M3 — ingestion breadth (highest leverage):** live `listed` rows from TRR / Fashionphile / Vestiaire (today only eBay produces live listings — the rest are search deep-links in `src/lib/affiliate.ts`). This is what makes the **merchant grid** and the **flex grid** genuinely multi-site.

**M4 — gated/premium:** realized **sold** prices (eBay Marketplace Insights API — gated), condition-adjusted "effective price," FX/region normalization.

**Data gaps, highest leverage first:**
1. **Live listings beyond eBay** — nothing in the merchant grid / flex grid is real until this exists.
2. **Per-listing structured attributes** via the extraction pass — inclusions / hardware / material / year. `ObservationAttrs` already has the fields; columns exist (0022/0023); the runner is built (§5).
3. **Sold prices** — for an honest "what it's worth" vs "what it's listed at."
4. **Internal demand already collected** (watchlist/closet/views) — cheapest win, partly wired via `getVariantDemand`.

(Full data-sourcing analysis: `docs/data-sourcing-research.md` and `docs/data-collection-handoff.md`.)

---

## 7. Honest caveats (so a fresh chat doesn't over-promise)

- **Listing dots only render where `price_type='listed'` rows exist** — today only eBay's 6 hero targets, and only once migration `0021` (the `price_type` column) is applied. Until then the range/verdict still render; dots are simply absent. Nothing 404s.
- **Per-listing year is empty** — `price_history.production_year` exists (0022) but no adapter populates it yet, so the era×condition matrix is deferred to the extraction pass. The variant-level era chip is the honest stand-in.
- **Condition ladder needs condition data + ≥2 tiers** — falls back to the single gauge otherwise.

---

## 8. Start here next session

1. Sync `main`. Read this doc + `docs/preferences.md`.
2. ~~Merge `claude/spec-extraction`~~ — **done** (merge `925eb47`). The extraction code is on `main`; the activation chain in §5 is still operator-gated.
3. Pick the lever: **M3 (broaden live listings)** is the compounding one; the **era×condition matrix wiring** is the quickest visible win *once the operator has run the extraction pass*.
4. Keep the build green (`tsc`/`eslint`/`next build`/`npm test`) and present finished work on a branch with git proof — **merge to `main` is the owner's deploy gate** (it ships live to luxurycatalog.com).
