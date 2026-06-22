# Data Collection — Consolidated Handoff

**Purpose:** everything needed to run the bag price/data-acquisition workstream from
one chat. Companion to [data-sourcing-research.md](data-sourcing-research.md) (source
shapes + legal posture). Last updated 2026-06-22.

> ⚠️ **Run this workstream in ONE chat / its own git worktree.** Two chats sharing
> the same working tree both pushed to `main` and caused branch-switch churn + near
> clobbers. The "value module" chat owns the **bag-page UI/visualizations**; this
> workstream owns the **data pipeline + loaded data**. Keep them separate.

---

## 1. What this is

Pull **real** bag + price data from the internet into the catalog. Resale value is
highly spec-specific (one colour can fetch 2× another in the same leather/season), so
we capture **per-listing spec** (colour/leather/hardware/year/condition), never blended.

**Legal posture (locked):** prices are *facts* — reading public listings and showing
them attributed with a link back is fine. Always store `source_url`. Never ingest
reseller **photos** or **verbatim descriptions**. Rate-limit politely. Never invent
specs — unverified → null.

---

## 2. Schema (all migrations APPLIED to prod)

All price data lives in **`price_history`**. Columns by migration:

- **0021** (provenance): `source_url`, `price_type` (enum: `listed|sold|auction|retail_msrp|estimate`), `observed_on` (date true at source, distinct from `date_recorded`=ingest date), `confidence_level`, `notes`. Plus **`variant_price_summary`** materialized view (per-variant retail_current, resale_low/median/high, last_sold, retention_pct, sample_size) + `refresh_variant_price_summary()` RPC + `/api/cron/price-summary` (Vercel cron).
- **0022** (trim/spec): `colorway`, `material`, `hardware_color`, `production_year`, `season` + spec index.
- **0023** (condition/provenance): `condition_detail`, `inclusions`, `region`, `listing_ref` (stable per-listing id/SKU → first-seen & days-on-market), `enrichment` (jsonb, for LLM sub-signals) + listing_ref index.

> Migrations are **human-gated**: apply via GitHub → Actions → **"Apply database
> migrations"** → Run workflow (blank input). `supabase db push` skips already-applied
> versions — **never edit an applied migration; add a new one** (that's why 0023 exists).

---

## 3. Hero variant IDs (for loading/verifying)

| Variant | id |
|---|---|
| Chanel Classic Flap Medium | **199** |
| Hermès Birkin 25 / 30 / 35 / 40 | 212 / **210** / **211** / 213 |
| Hermès Kelly 25 / 28 / 32 | 215 / **214** / 216 |
| LV Neverfull PM / MM (Monogram) | 217 / **218** |
| Gucci GG Marmont Small / Medium | **207** / 208 |

---

## 4. What's loaded right now (41 rows)

- **Retail MSRP (28 rows, confidence medium, cited):** Chanel Classic Flap Medium 2005→2025; Hermès Birkin 35 (2015/18/26), Birkin 30 (2025/26), Kelly 28 (2023/24/26); LV Neverfull MM 2007→2024 & PM (2007/2025); Gucci GG Marmont Small 2023/25.
- **Resale (13 rows, confidence high):** Chanel Classic Flap Medium from TheRealReal — each with **colour + leather + hardware + year + inclusions + per-item URL** (100% spec coverage). Shows the value spread, e.g. Caviar/gold ~$11k vs Caviar/silver ~$5.9k; Lambskin/gold ~$7.25k vs silver ~$4.4k.

The retail-price-history chart is **live on the hero bag pages**. Resale rows feed the
fair-market range / value module.

---

## 5. The capture technique (the key unlock)

Resale/auction sites are **bot-blocked or JS-rendered** to plain `fetch` (eBay API is
the only clean live source, and its *sold* prices are gated). **Claude in Chrome
defeats this** — it drives the real logged-in browser, so same-origin `fetch` returns
full pages.

**TheRealReal flow (proven):**
1. In Chrome, open `https://www.therealreal.com/products?keywords=<query>`.
2. Collect product URLs, then **fetch each same-origin** (`fetch(u,{credentials:'include'})`) and parse the **JSON-LD `Product`** block: `offers.price`, `offers.itemCondition`, `sku`, and a `description` of period-separated facts ("From the 2011-2012 Collection… Black Caviar Leather… Gold-Tone Hardware… Includes Dust Bag").
3. **Chunk fetches ≤8–10 per call** (the tool times out ~45s); accumulate into a `window.__CAPS` page variable; **page results out in slices** (tool truncates large returns).
4. Parse descriptions with the logic in [src/lib/ingest/trr.ts](../src/lib/ingest/trr.ts) (`parseTrrDescription`): colour is its **own segment** (scan known colours, exclude hardware/lining lines); material = first material keyword; hardware = `X-Tone Hardware`; year = `From the YYYY Collection`; inclusions = `Includes …`.
5. Write a landing file under `data/ingest/therealreal/*.json` (PriceObservation shape), then `npm run load:prices -- therealreal --write` → `npm run summary:refresh`.

Caveat: browser capture is **semi-manual** (needs the logged-in session) — good for
seeding; can't fully cron. `condition_detail` is **not** in the JSON-LD (separate page
section) — still to capture, then run the enrichment pass.

---

## 6. Pipeline code map

**Pure, tested logic** — `src/lib/ingest/`: `types.ts` (PriceObservation + validation), `price-extract.ts`, `wayback.ts` (CDX), `html.ts`, `msrp-data.ts` (cited retail history dataset), `ebay.ts` (Browse), `trr.ts` (TRR description parser), `enrich.ts` (LLM condition prompt+parser). Tests: `src/lib/__tests__/ingest.test.ts` (+ demand/platforms tests).

**IO orchestration** — `supabase/ingest/`: `lib/fetch.ts` (polite client), `lib/landing.ts` (validated JSON landing; each run replaces its source's files), `sources/{msrp,wayback,fashionphile,auction,ebay}.ts`, `load-prices.ts` (resolves brand→style→variant via `src/lib/image-import-core.ts` matcher; dry-run default, `--write`; idempotent on dedup index), `refresh-summary.ts`, `enrich-conditions.ts`.

**npm scripts:** `ingest:msrp` · `ingest:wayback` · `ingest:fashionphile` · `ingest:auction` · `ingest:ebay` · `load:prices [source] [--write]` · `summary:refresh [variantId]` · `enrich:conditions [--write]`.

**Derivation features (already built, no sourcing needed):**
- Demand signal — `src/lib/demand.ts` (privacy-safe counts of closet 'want' + watchlist; on bag page).
- Platform trust + landed cost — `src/lib/platforms.ts` (auth/returns/fees + `estimateLandedCost`; trust shown in `WhereToBuy`).
- LLM enrichment — `src/lib/ingest/enrich.ts` + `supabase/ingest/enrich-conditions.ts` (Haiku; reads condition_detail → enrichment jsonb).

---

## 7. Reseller recon (so adding sources is scoped)

- **TheRealReal** — JSON-LD `Product` + description. **Built.**
- **Fashionphile** — Shopify + Algolia; same-origin `/products/<handle>.json` → price, sku, body_html, tags (colour/hardware in tags + description + on-page spec). **TRR-easy.**
- **Vestiaire** — Next.js; search page embeds `__NEXT_DATA__` + JSON-LD with brand/colour/material/condition/**country/region**/price. **Moderate, richest** (best for region). Prioritise for cross-currency data.

Each new source = a parser to the shared `PriceObservation` contract + a target list.

---

## 8. Integrations status (env vars)

| Thing | Status | Env var |
|---|---|---|
| **Skimlinks** (auto-affiliate, revenue) | ✅ live (script in layout) | `NEXT_PUBLIC_SKIMLINKS_ID` (defaults to `305125X1793317`) + `NEXT_PUBLIC_AFFILIATE_WRAP_TEMPLATE` |
| **Fashionphile / Impact** (5% + datafeed) | applied, awaiting approval | `NEXT_PUBLIC_AFFILIATE_FASHIONPHILE` |
| **Rebag / CJ** (7%) | blocked — CJ signup flaky; retry or use Skimlinks | `NEXT_PUBLIC_AFFILIATE_THEREALREAL/…` |
| **eBay Browse API** (current resale) | dev account pending (~1 day) | `EBAY_APP_ID`, `EBAY_CERT_ID` |
| **eBay Marketplace Insights** (sold) | gated — Application Growth Check | — |
| **LLM enrichment** | ready | `ANTHROPIC_API_KEY` |

When eBay keys land: add them, `npm run ingest:ebay` → `load:prices -- ebay --write` →
`summary:refresh`. Resale Fair-Market Range + retention % then populate automatically.

---

## 9. Open items / recommended next steps

1. **Scale TheRealReal** for Chanel flap medium (search has ~120 listings; we loaded 13) and other hero variants (Birkin/Kelly/Neverfull/Marmont) via the §5 flow.
2. **Add Vestiaire** (region data) then **Fashionphile** as parser plug-ins.
3. **Capture `condition_detail`** from product-page condition sections → `npm run enrich:conditions --write` to fill the `enrichment` sub-signals (corner wear, full-set, etc.).
4. **eBay** once approved → automated live resale (cron-able).
5. Consider **first-seen / days-on-market** derivation off `listing_ref` across repeat snapshots.

## 10. Gotchas
- Browser tool: chunk fetches ≤~8/call; page large returns; use top-level `await` (not an async IIFE — returns `{}`).
- `load:prices` is dry-run unless `--write`; idempotent (dedup index on variant+platform+price_type+observed_on+sale_price).
- After any load, run `summary:refresh` (or wait for the cron) so bag pages update.
- Don't commit `data/ingest/` (gitignored runtime landing zone).
- Temp probe scripts: write under `supabase/ingest/_*.ts`, run with `tsx`, then `rm`.
