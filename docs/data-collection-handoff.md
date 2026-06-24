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

## 4. What's loaded right now

- **Retail MSRP (28 rows, confidence medium, cited):** Chanel Classic Flap Medium 2005→2025; Hermès Birkin 35 (2015/18/26), Birkin 30 (2025/26), Kelly 28 (2023/24/26); LV Neverfull MM 2007→2024 & PM (2007/2025); Gucci GG Marmont Small 2023/25.
- **Resale — Chanel Classic Flap Medium (variant 199): 116 live TheRealReal rows** (2026-06-22 capture, confidence high), each with **colour + leather + hardware + year + inclusions + per-listing URL**. Fair-market range $1,975–$11,000, median $5,700, retention 87.7%. Spec spread is real: Caviar/gold median ~$7,200 vs Lambskin/silver ~$4,700. *(Scaled from the original 13 via the §5 flow; per-listing fidelity restored once migrations 0024/0025 landed — see below.)*
- **Captured, ready to load — Hermès Birkin 30: 102 rows** (`data/ingest/_raw/hermes-birkin-30.json`), $8,500–$66,500, median ~$18k. Pending the multi-brand parser merge (branch `claude/multibrand-parser`) so colour/leather land — coverage after the fix: colour 74% · material 100% · hardware 100% · year 69%.

**New since the original brief (all on `main` unless noted):**
- **Per-listing fidelity** — migrations **0024** (adds `listing_ref` to the dedup unique index) + **0025** (backfills legacy NULL `listing_ref` = `source_url`). `load-prices.ts` now writes `listing_ref ?? source_url`, so distinct listings never collapse on a shared price. APPLIED to prod.
- **Reusable TRR adapter** — `supabase/ingest/sources/trr-jsonld.ts`: `npx tsx … <targetKey>` reads `data/ingest/_raw/<targetKey>.json` → landing. `TARGETS` has the proven Chanel entry + scaffolds for Birkin 25/30/35/40, Kelly 25/28/32, Neverfull PM/MM, GG Marmont Small/Medium.
- **Multi-brand parser vocab** (branch `claude/multibrand-parser`, awaiting merge) — Hermès leathers (Epsom/Togo/Clemence/Swift/Chevre), French colours (Noir/Craie/Blanc…), `-Plated` hardware, LV/Gucci canvases. Grounded in real Birkin captures.
- **Vestiaire + Fashionphile parsers + adapters** — `src/lib/ingest/{vestiaire,fashionphile}.ts` + `supabase/ingest/sources/{vestiaire,fashionphile}.ts`. Vestiaire carries region/country. Need browser/API captures to feed them (raw-dump shapes documented in each adapter header).
- **Enrichment armed** — `ANTHROPIC_API_KEY` is set in local `.env.local` (rotate it). The condition pass still needs `condition_detail` captured from TRR product pages (separate page section, not in JSON-LD).

The retail-price-history chart + the Chanel value module are **live on the hero bag pages**.

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

> 📋 **Full capture runbook: [`capture-runbook.md`](capture-runbook.md)** — turnkey, ordered commands to capture every size variant (165 across 46 groups; 6 loaded). Must run in a **Claude-in-Chrome** session (web sessions can't reach the resale domains — network policy blocks them, and TRR needs a logged-in browser). Per group: scaffold → TRR search → adapter → `load:prices --write` → `summary:refresh`.

0. **MERGE `claude/multibrand-parser`**, then **load Birkin 30**: `npx tsx supabase/ingest/sources/trr-jsonld.ts hermes-birkin-30` → `npm run load:prices -- therealreal --write` → `npm run summary:refresh`. (Raw already captured.)
1. **Scale TheRealReal** to the remaining heroes (Kelly 25/28/32, Neverfull PM/MM, GG Marmont S/M) via the §5 capture flow → the reusable `trr-jsonld.ts` adapter (one command per `targetKey`; tune each `TARGETS` predicate/bounds against the capture). *Chanel (116) + Birkin 30 (102, ready) done.* The older search-text adapter `trr-paste.ts` remains for the paste flow.
2. **Add Vestiaire** (region data) then **Fashionphile** as parser plug-ins.
3. **Capture `condition_detail`** from product-page condition sections → `npm run enrich:conditions --write` to fill the `enrichment` sub-signals (corner wear, full-set, etc.).
4. **eBay** once approved → automated live resale (cron-able).
5. Consider **first-seen / days-on-market** derivation off `listing_ref` across repeat snapshots.

## 9b. Capture backlog (prioritised 2026-06-23)

Order by value + whether a **retail MSRP anchor** is already loaded (so resale instantly yields retention %). Sources: TRR (proven), Vestiaire (region/cross-currency), Fashionphile (Shopify `/products/<handle>.json`, easy).

| # | Bag | Variant | Retail anchor? | Sources | Status |
|---|---|---|---|---|---|
| 0 | Hermès Birkin 30 | 210 | ✓ | TRR | ✅ **loaded (102)** · retention 155% |
| 1 | Hermès Kelly 28 | 214 | ✓ | TRR → Vestiaire | ✅ **loaded (91)** · retention 118% |
| 2 | Hermès Birkin 35 | 211 | ✓ | TRR → Vestiaire | ✅ **loaded (108)** · retention 106% |
| 3 | LV Neverfull MM | 218 | ✓ | TRR → Fashionphile | ✅ **loaded (105)** · retention 55% |
| 4 | Gucci GG Marmont Small | 207 | ✓ | TRR → Fashionphile | ✅ **loaded (102)** |
| 5 | Chanel Classic Flap Medium | 199 | ✓ (resale ✓ TRR) | **Vestiaire + Fashionphile** | next — validate new parsers + region/multi-site grid |
| 6 | Hermès Birkin 25 / 40 | 212 / 213 | partial | TRR | broaden |
| 7 | Hermès Kelly 25 / 32 | 215 / 216 | — | TRR | broaden |
| 8 | LV Neverfull PM | 217 | ✓ | TRR / Fashionphile | broaden |
| 9 | Gucci GG Marmont Medium | 208 | — | TRR / Fashionphile | broaden |

Also pending: **condition_detail** capture from TRR product pages (separate section, not in JSON-LD) → `enrich-conditions`/`enrich-specs` (ANTHROPIC_API_KEY set locally) → the era×**condition** matrix's second axis.

## 10. Gotchas
- Browser tool: chunk fetches ≤~8/call; page large returns; use top-level `await` (not an async IIFE — returns `{}`).
- `load:prices` is dry-run unless `--write`; idempotent (dedup index on variant+platform+price_type+observed_on+sale_price).
- After any load, run `summary:refresh` (or wait for the cron) so bag pages update.
- Don't commit `data/ingest/` (gitignored runtime landing zone).
- Temp probe scripts: write under `supabase/ingest/_*.ts`, run with `tsx`, then `rm`.

## 11. Affiliate program landscape (researched 2026-06-24)

Where each core resale partner's affiliate/consignor program actually lives, so we don't
re-derive it. **Verified the four priority partners are NOT on Awin's US network** (searched
Fashionphile, Rebag, The RealReal, Vestiaire + "Luxury Closet"/"preloved"/"StockX" — only
fuzzy/tiny unproven hits). Awin onboarding for our own publisher account (ID `2945769`,
"Luxury Catalog, LLC") **is complete** (profile + payout); keep it for future new-retail
partners but it does not carry the resale players.

| Partner | Network to join | Commission | Notes |
|---|---|---|---|
| **The RealReal** | **Direct** (`therealreal.com/affiliates` + `/real-partners`) | Buyer 5% (existing) / 7% (new) | ⭐ **Real Partners** consignor referral = the seller lever in `preferences.md`: ~$1,250 avg, up to $20k, earns on referred consignor's sales for first 120 days. "Real Friends" $125 promo through 2026-06. |
| **Rebag** | **CJ (Commission Junction)** | 7% (3% over $2,500), 30-day cookie, AOV ~$1,800 | product feed available |
| **Fashionphile** | **Impact** (confirmed 2026-06-24; older listings mention ShareASale — ignore) | 5% + $50/new buyer, 30-day, net-60 | no self-referred sales |
| **Vestiaire Collective** | **CJ** + **Skimlinks** (network 826) | ~5.7–6%, 15-day cookie, US ok | covered by Skimlinks catch-all |

**Application status (2026-06-24):** ✅ **Applied & pending approval — The RealReal** (direct),
**Fashionphile** (Impact), **Skimlinks** (catch-all; ≤3 working days). ✅ **CJ publisher account
ACTIVE** (account ID `7997608`, property = luxurycatalog.com, primary model = Product
Comparison/Discovery). ✅ **Inside CJ: Rebag applied** (advertiser 5749848, manual review pending). Rebag terms worth
noting: 7% commission but **new (first-time) customers only**, tiered down to **3% on orders >$2,500**
(flat $423 over $14,124), **0% on return customers**, 30-day cookie — so a buyer-side, new-customer
program, not a seller lever. ❌ **Vestiaire Collective is NOT available on CJ for the US account**
(only an unrelated French "En Selle Marcel" matches; VC's CJ program is EU-region-gated) — **covered
by Skimlinks instead**, so no gap. CJ "handbags" keyword (66 results) is otherwise dominated by
new-retail apparel, not resale, so Rebag is the one relevant CJ fit. Once programs approve, swap raw
outbound links for tracking links on bag/deal pages. Direct-where-it-works + Skimlinks-to-fill-gaps
matches the locked monetization strategy.

**Additional appropriate brands (researched 2026-06-24):**
- **The Luxury Closet** (CJ advertiser 5312449) — pre-loved + new designer, **flat 7.69%** all sales,
  7-day cookie, 60-day lock (better structure than Rebag; low historical EPC though). ✅ Applied via CJ 2026-06-24.
- **eBay Partner Network (EPN)** — eBay is a major authenticated pre-owned luxury market; its own
  network. ✅ **Applied 2026-06-24, under review** (≤24h). Registered the website property
  (luxurycatalog.com, business model Content/Reviews). Commission is modest (Sale 1-4% USD) but value
  = volume + a huge authenticated-resale price source for comparison pages.
- **1stDibs** — vintage/high-end marketplace; **covered by Skimlinks** (network 67427), no separate app.
- **myGemma** — luxury resale (bags/jewelry/watches), ~5%. **ShareASale is now Awin (merged), so
  myGemma is available directly in the existing Awin account** (ID 2945769) — no duplicate signup.
  Found in Awin Join Programs: conversion 3.11%, **100% approval rate** (auto-approves), product feed,
  EPC ~$1.74. Join via Awin's "+ Join". (Lesson: ShareASale signups now redirect to Awin; check the
  existing Awin account before creating anything new.)
- **Madison Avenue Couture** — high-end Hermès/Chanel reseller, **consignment-based affiliate**
  (seller-side lever, on-strategy but niche): madisonavenuecouture.com/pages/affiliate.
- **Avoid:** "replica handbag" affiliate programs (counterfeit — violates authenticity mission +
  trade-dress/legal risk). **Cudoni** is defunct (closed 2023).

**Skimlinks site install (dev task — owner's call: do AFTER approval, not before):** Skimlinks gave a JS snippet to drop just
before `</body>`, scoped to `luxurycatalog.com` (publisher JS id `305125X1793317` — public, ships
client-side, safe to commit). Once added, Skimlinks auto-rewrites outbound merchant links to
affiliate links (no per-link work). It's inert until the account is approved. Placement in our
Next.js app = root layout (see the modified Next.js docs in `node_modules/next/dist/docs/` re: the
`Script` component before writing it). AMP/WordPress/Squarespace install guides exist but N/A — we're
a custom Next.js site, so the JS snippet route applies.

**TODO — privacy policy + cookie consent (dev task, required by CJ §2(e)/§6, also good practice for
Skimlinks/Awin tracking):** `luxurycatalog.com` must conspicuously post a privacy policy that
discloses third-party affiliate tracking cookies (CJ, Skimlinks, etc.) and provide a cookie-consent
mechanism (GDPR/ePrivacy for any EU visitors; US state-privacy disclosure). Needed before running
CJ links in production. Scope: privacy-policy page + consent banner gating non-essential/tracking
cookies. Not yet built.
