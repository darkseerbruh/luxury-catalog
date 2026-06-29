# Data Collection — Consolidated Handoff

**Purpose:** everything needed to run the bag price/data-acquisition workstream from
one chat. Companion to [data-sourcing-research.md](data-sourcing-research.md) (source
shapes + legal posture). Last updated 2026-06-22.

> ⚠️ **Run this workstream in ONE chat / its own git worktree.** Two chats sharing
> the same working tree both pushed to `main` and caused branch-switch churn + near
> clobbers. This is the **Data / capture** lane; the **UX / shop** lane owns the
> bag-page UI/visualizations. Keep them separate. Lane ownership + live status: the
> 🧭 Active-lanes registry at the top of [handoff.md](handoff.md) (this is its deep doc).

---

## 0. Capture standard (owner rule, 2026-06-28) — one complete pass, every surface

**Rule:** the moment we have a list of styles/bags we care about (e.g. a brand add, a
backbone expansion, a hero list), we do the FULL capture in one go — never stop at
names and "get prices later," never make her ask for a pass. "Get everything once so
queries stay minimal." A `price_history` row already holds price **+** colour, material,
hardware, year, condition, region, source URL, so one capture = all attributes.

**The one-pass sequence (do all four, in order, for the target list):**
1. **Scaffold variants** — `scaffold-variants.ts "<Brand>" "<Style>" <sizes…> --write`.
   *Required first:* `load:prices` DROPS any observation whose style has zero variants.
   New backbone styles land variant-less, so this step is what made the 2026-06-28
   brand add stop at names. Chain it, don't defer it.
2. **Capture across EVERY available source** into the landing zone (not one, then another
   later) — see the surface map below.
3. **`load:prices -- <source> --write`** for each source (resolves brand→style→variant,
   attaches per-listing specs; idempotent).
4. **`summary:refresh`** so bag pages update.

### 0a. STRATEGY (locked 2026-06-28): browser-gathering only, Firecrawl engine

The API/affiliate doors are shut, so capture leans **exclusively on browser gathering**:
- **eBay Developer Program — REJECTED.** No Browse API, no Marketplace Insights. Dead as a
  data source. (eBay sold *could* be browser-scraped but is counterfeit-noisy on Hermès; low priority.)
- **No affiliate program accepted** (Skimlinks/CJ/Impact/Awin all rejected or pending), so
  **no product datafeeds** — which also means **no licensed image pipeline** yet (prices/specs
  we can gather as facts; their photos we still cannot use — locked rule).
- **Firecrawl is the engine** (account added 2026-06-28). Verified 2026-06-28: a Firecrawl
  `scrape` with JSON schema defeated **TheRealReal's bot-block** (HTTP 200, 16 structured
  Goyard Saint Louis listings: price + size + year + URL) with **no logged-in session and no
  key** — so the sources that previously needed a babysat Claude-in-Chrome session are now
  **cron-able**. Firecrawl `monitor` (recurring scrape that diffs each run) is the native
  fit for our dual goal below.

**Dual purpose of the recurring capture:** (1) build the **price-over-time history** (a dated
snapshot each run) AND (2) **keep current listings fresh + accurate** — a listing whose
`listing_ref` stops appearing is sold/pulled (mark it; derive days-on-market), and prices
update in place. One job, both jobs.

### 0b. Source registry (comprehensive — keep this current)

*Tiering: prices are facts (store `source_url`, never their photos/descriptions); refer/feature
only behind the trust gate in `docs/trusted-resellers.md`. Capture is separate from referral.*

| Source | Reach via | Specs | Notes |
|---|---|---|---|
| **Fashionphile** | Shopify `products.json` (server fetch, no Firecrawl) | full | already live; cheapest, keep direct |
| **TheRealReal** | Firecrawl scrape (JS, stealth) | richest (JSON-LD detail) | bot-blocked to plain fetch; proven 2026-06-28 |
| **Vestiaire Collective** | Firecrawl scrape (`__NEXT_DATA__`) | rich + **region/currency** | best cross-border signal |
| **Rebag** | Firecrawl scrape | full | large US |
| **The Luxury Closet** | Firecrawl scrape | full | Dubai, broad |
| **1stDibs** | Firecrawl scrape | vintage/high-end | uncovered by any affiliate |
| **StockX** | Firecrawl scrape | hyped/collab + sold | streetwear-luxe crossover |
| **myGemma** | Firecrawl scrape (Awin pending) | bags/jewelry/watches | |
| **Redeluxe** ⭐ | Shopify `products.json` | full | flagship reseller, creator partner (Georgia Swain); mid-tier coverage the giants miss |
| **Couture USA** | Shopify `products.json` | full | open feed verified; vet trust before *referral* |
| **Yoogi's Closet** | Firecrawl / site feed | full | trusted since 2008 |
| **Madison Avenue Couture** | Firecrawl scrape | Hermès/Chanel only | consignment; niche |
| **Sellier Knightsbridge** (UK) | Firecrawl scrape | full | UK pricing |
| **Luxe Collective / Luxe Du Jour** | Firecrawl scrape | full | UK / own programs |
| **Wayback (CDX)** | server fetch | historical asking | partial backfill of the *past* |
| **Auction archives** | server fetch | historical realized | high-end |
| **MSRP** | curated dataset | retail anchor | |

**Vet-before-referral (capture OK, do not link until trust-gated):** HER Authentic, The Luxury
Savvy, Handbag Sense, Mightychic, FashioNica, CODOGIRL, Dallas Designer Handbags.
**Never:** Julia Rose Boston (reputation red flags), replica programs, Privé Porter (IG-DM only,
no feed). **Defunct:** Cudoni.

### 0c. To automate on a schedule — what's needed (owner inputs)

1. **`FIRECRAWL_API_KEY` in Vercel env** (and locally for testing) — the only secret. Set via the
   Vercel UI (no .env editing). The in-session Firecrawl MCP can't run a deployed cron.
2. **A credit budget + cadence ceiling.** Firecrawl bills credits (the TRR search page = 5). Detail
   scrapes (for colour/material/condition) cost more per listing. The breadth × depth × frequency
   must fit her plan. Recommended default: **hero/T1 daily, the long tail weekly**, detail-scrape
   only top-N per style.
3. **Go-ahead to switch the recurring job on** (a standing external job that spends credits nightly —
   owner-gated like any standing/paid config). Mechanism: Firecrawl `monitor` per source, OR a Vercel
   Cron route (`/api/cron/capture`) → Firecrawl → parse → load → `summary:refresh` → reconcile freshness.

**Still true regardless of engine:** completeness is capped by what each page exposes (null where the
source is silent, never invented); search pages give price+size+year, detail pages give colour/material/
condition; run captures from the **Data lane**, not mixed into UX work.

### 0d. Firecrawl cost model (evidence 2026-06-28; re-confirm at signup)

**Credit cost (verified by observation):** a plain scrape (markdown/rawHtml) = **1 credit/page**;
a **`json`/LLM-extract scrape = 5 credits/page**. So the #1 cost lever: **scrape raw + parse with our
OWN adapters (trr.ts/vestiaire/fashionphile) = 1 credit**, never pay 5 for Firecrawl's LLM extract.
Monitor = 1 credit/page/check. Credits **don't roll over** (size to monthly need).
**Plans (firecrawl.dev/pricing + corroborated):** Free 1k/mo $0 · Hobby 5k/mo **$16** · Standard 100k/mo
**$83** · Growth 500k/mo **$333** · Scale 1M/mo **$749** ($599 billed yearly; ~17-20% off annual).

**Catalog scale (DB, 2026-06-28):** 27 brands · 431 styles · 366 with variants · 804 variants.
**Free sources (0 Firecrawl credits):** Fashionphile, Redeluxe, Couture USA (open Shopify feeds).

**Cost model** (1 search-page scrape per style×source returns many listings; detail-scrape only NEW
listings for colour/material; assume ~6 Firecrawl sources, parse-ourselves = 1 credit):

| Design | Recurrence | ~Credits/mo | Plan | $/mo |
|---|---|---|---|---|
| Pilot (≈25 hero styles, search-only) | daily | ~4.5k | Hobby | $16 |
| **Steady (≈60 hero+T1, search daily + new-listing detail weekly)** | daily+weekly | ~13k | Standard | **$83** |
| Broad (all ~366 styles search daily + detail weekly) | daily+weekly | ~70k | Standard | $83 |
| Aggressive (all styles × 8 srcs, per-listing detail DAILY) | daily | ~800k+ | Growth/Scale | $333+ |

**Takeaway:** even *broad* daily coverage fits the **$83 Standard** plan if we parse ourselves and
detail-scrape only new listings. Budget blows up only via LLM-extract (5×) or daily per-listing detail.

**MEASURED (live CI run 2026-06-28, TheRealReal):** the 1-credit ideal does NOT hold for TRR — its
product pages ERR_ABORT the cheap proxy ~half the time, so we retry on the stealth proxy, and a Goyard
Saint Louis run of 20 listings cost **57 credits (~2.85/listing)** + 1 for the search. Real TRR burn ≈
**3× the parse-ourselves ideal.** Revised: a daily pilot of even ~10 styles × ~20 listings ≈ ~17k
credits/mo, which **exceeds the free 1k tier** and points at **Standard ($83) sooner than the table
implies.** Free-tier validation must stay tiny (1 style/day, low `--limit`). Cost levers: detail-scrape
only NEW `listing_ref`s (not all, daily), cap `--limit`, lean on the 0-credit Shopify feeds (Fashionphile,
Redeluxe, Couture USA) for breadth and reserve Firecrawl for the bot-blocked sources.

**PROVEN LIVE 2026-06-28:** GitHub Actions `firecrawl-capture.yml` → `firecrawl-trr.ts` → `load:prices`
→ `summary:refresh` ran green in CI and wrote real multi-source asking data (Goyard Saint Louis PM:
Fashionphile n=89 $2,465 median + TheRealReal n=20 $2,065 median). Daily cron is live (`23 6 * * *`).

### 0e. Capture-completeness fix (2026-06-29) — condition/region/listed-date/was-price

**Problem found:** across 33,482 price rows, `condition` 0.1%, `condition_detail` 0%,
`region` 0%, `production_year`/`season`/`inclusions` ~8%, `hardware_color` 47%. Root
cause: the Fashionphile feed (bulk of the catalog) was the only thing crawled at scale,
and the crawler kept just 5 of the feed's 13 fields and never opened the product page
where the condition grade lives.

**Fixed (commit on `data/market-capture`):**
- Crawler retains `vendor`/`created_at`/`published_at`/`updated_at`/variant
  `compare_at_price`. Parser surfaces **region** (feed country tag, e.g. `US`),
  **listedAt** (first-published date), **compareAtPrice** (was-price) + a conditionDetail
  param. Condition ladder updated to FP's current tiers
  (New | Excellent | Shows Wear | Worn | Fair), mapped position-for-position.
- **`fashionphile-condition.ts`** — paced/capped/incremental enricher reads the grade off
  the product page (`Condition: <span>…</span>`), **0 Firecrawl credits**, ~99% hit rate.
- Adapter maps region→`attrs.region`, condition_detail→`attrs`, listed_at+compare_at_price
  →`enrichment` (curated + catch-all). `load-prices` `toDiscovered` carries them with a
  PGRST204/42703 strip-and-retry, safe before **migration 0038** applies.

**Proven live (today's FP rows in `price_history`):** region 0→**99.3%**, condition
mechanism verified, enrichment 0→**46%**.

**Backfill runbook (free, repeatable):** crawl → `fashionphile-condition.ts --limit=20000`
→ `fashionphile.ts --raw` + `load:prices -- fashionphile --write` → `fashionphile.ts
--catch-all` + `load:prices -- fashionphile --discovered-only --write` → `summary:refresh`.

**OWNER-GATED:** apply **migration 0038** (GitHub → Actions → "Apply database migrations")
so the discovered tier persists region/condition_detail/enrichment.

**Still-open backlog:**
- **condition_detail** + granular condition come from **TheRealReal**, not FP. Fix
  `firecrawl-trr.ts` (maps every used bag → null ~line 72; never captures the product-page
  condition section). Metered — fold into the next scheduled TRR run.
- **hardware_color** (47%) + **production_year** (~8%): parser-coverage, extend vocab/regex.
- **promote-safe.ts**: after 0038, carry region/condition_detail/enrichment on promotion.
- **days-on-market**: now have `enrichment.listed_at`; a column + derivation is a later migration.

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
| **Skimlinks** (auto-affiliate, revenue) | ❌ **REJECTED 2026-06-25** ("site not suitable at this time" — generic, no specific fault; they re-evaluate). Likely cause = thin PUBLISHED content + low traffic (17 articles still drafts). Reapply after publishing a content batch. Script still in layout but earns nothing until approved. | `NEXT_PUBLIC_SKIMLINKS_ID` (defaults to `305125X1793317`) + `NEXT_PUBLIC_AFFILIATE_WRAP_TEMPLATE` |
| **Fashionphile / Impact** (5% + datafeed) | applied, awaiting approval (same content gate likely applies) | `NEXT_PUBLIC_AFFILIATE_FASHIONPHILE` |
| **Rebag / CJ** (7%) | blocked — CJ signup flaky; retry after publishing (Skimlinks fallback is gone) | `NEXT_PUBLIC_AFFILIATE_THEREALREAL/…` |
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
| **The RealReal** | **Direct** (`therealreal.com/affiliates`) | Buyer 5% (existing) / 7% (new) | ✅ Buyer-side affiliate — keep. ❌ **Real Partners** consignor referral (`/real-partners`) is **NOT viable for this model** — see call finding below. |
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

**⚠️ TRR Real Partners — closed for this model (call with the program lead, 2026-06-24).** The
consignor-referral "Real Partners" program is **high-touch and relationship-based**, with **no
trackable codes or links** for consignor referrals (their words: "we can't be blasting out codes… it
would be untenable" — not offered even to influencers). There is therefore **no digital attribution
mechanism** to wire into a bag page. They also don't want a partner that shows users *competing*
consignment options (exactly what LC does), and prefer sole-recommendation organic relationships. The
offer to "circle back in 2 weeks" was a soft close. **Action:** drop TRR Real Partners as the
seller/consignor channel. **Keep** TRR's buyer-side affiliate (5%/7%, direct) — the lead confirmed it's
a separate program, unaffected. The `$1,250` seller lever in the model now needs re-sourcing (see
Madison Avenue Couture below; most other partners are buyer-side) or down-weighting — flag for
`docs/monetization-projections.md`.

**Additional appropriate brands (researched 2026-06-24):**
- **The Luxury Closet** (CJ advertiser 5312449) — pre-loved + new designer, **flat 7.69%** all sales,
  7-day cookie, 60-day lock (better structure than Rebag; low historical EPC though). ✅ Applied via CJ 2026-06-24.
- **eBay Partner Network (EPN)** — eBay is a major authenticated pre-owned luxury market; its own
  network. ✅ **APPROVED 2026-06-24** (eBay "accepted your proposed contract terms"; EPN accounts are
  Impact-hosted, which is why the approval email linked to app.impact.com — legit, not phishing).
  Registered the website property (luxurycatalog.com, business model Content/Reviews). Commission is
  modest (Sale 1-4% USD) but value = volume + huge authenticated-resale catalog.
  - **Affiliate LINKS: ✅ shipped in code** — `src/lib/affiliate.ts` `applyEbayAffiliate()` adds EPN
    params (campaign id `5339158071`, non-secret, defaulted in code so it monetizes on deploy with no
    env setup; commit f36d97f). eBay listing URLs auto-wrap via `affiliateListingUrl()`.
  - **Data PULL via Browse API: 🟡 MAYBE / FUTURE (deprioritized).** Needs `EBAY_APP_ID` + `EBAY_CERT_ID`
    from the eBay **Developer Program**, but **dev-program registration was REJECTED 2026-06-24**
    ("problems with the data provided or other irregularities"). Low value: eBay was always **data +
    links only, NO photos** (co-mingling ban in eBay's API License + seller-owned photos — see image
    note below). Fallbacks if ever wanted: appeal eBay dev support / retry, or use the §5 browser-capture
    method (no API keys). **Not blocking images** — those come from affiliate product feeds, not eBay.
  - **eBay images: ❌ do not use.** EPN requires image rights/permission (seller-owned photos), and the
    API License bans co-mingling eBay content with non-eBay listings — incompatible with our multi-platform
    comparison UI. Licensed product images come from the CJ/Awin/Impact **product feeds** instead (see
    "Product feeds = licensed images" below).
- **1stDibs** — vintage/high-end marketplace; was to be **covered by Skimlinks** (network 67427) — but Skimlinks declined (below), so 1stDibs is uncovered for now.
- **Skimlinks (catch-all) — ❌ REJECTED 2026-06-24.** "Your website is not suitable... at this time."
  Per their criteria, the cause is **insufficient original content** for reviewers to determine the
  site's purpose/value (NOT the fake-door/"coming soon" surfaces — those are fine, real sites use them;
  owner corrected this). **Re-appliable** ("we regularly re-evaluate") once the site has real editorial
  content (see Content plan in `docs/handoff.md`). **Impact:** **Vestiaire + 1stDibs are now uncovered**
  (they were Skimlinks-only); directly-joined programs (eBay, myGemma, Rebag/TLC/TRR/Fashionphile) are
  unaffected. Re-apply after the content batch ships.
- **myGemma** — luxury resale (bags/jewelry/watches), ~5%. **ShareASale is now Awin (merged), so
  myGemma is available directly in the existing Awin account** (ID 2945769) — no duplicate signup.
  Found in Awin Join Programs: conversion 3.11%, **100% approval rate** (auto-approves), product feed,
  EPC ~$1.74. ✅ **Applied 2026-06-24, pending** (verified in Awin → Advertisers → Pending tab).
  (Lesson: ShareASale signups now redirect to Awin; check the existing Awin account before creating
  anything new.)
- **Madison Avenue Couture** — high-end Hermès/Chanel reseller, **consignment-based affiliate**
  (seller-side lever, on-strategy but niche). ✅ **Applied 2026-06-24** via "The MadAve Collective"
  inquiry form (madisonavenuecouture.com/pages/affiliate); their client team follows up with next steps.
- **Avoid:** "replica handbag" affiliate programs (counterfeit — violates authenticity mission +
  trade-dress/legal risk). **Cudoni** is defunct (closed 2023).

**Product feeds = licensed images (the real photo pipeline; researched 2026-06-24).** This is how we
get **real product images compliantly** — the locked image rule's "licensed affiliate galleries." CJ,
Awin, and Impact all provide **product data feeds** (images + price + description + deep link, refreshed
daily) and merchants supply "approved images… so publishers showcasing your brand have high-quality
images" — i.e. **feed images are licensed for affiliate display** (verify each program's terms). This is
fundamentally different from scraping a reseller (no license) and from eBay (off-limits, above).
- **Awin** (myGemma): Toolbox → **Create-a-Feed** → "Enhanced (Google)" format → feed URL w/ a feed API
  key (`https://productdata.awin.com/datafeed/list/apikey/<key>`); has `image_link`.
- **CJ** (Rebag, The Luxury Closet): **Product Search API** (GraphQL, developers.cj.com) with CJ creds.
- **Impact** (TheRealReal, Fashionphile): download **Product Catalog** via the impact.com platform/FTP.
- **Gating:** each feed unlocks only once that program **approves** (all pending). **Build plan:** as each
  approval lands, build a per-network feed ingester (extend the existing adapter pattern) → images +
  prices + links land together, auto-refreshed. **UI:** show each listing with **loud origin-site
  attribution + an obvious external-purchase handoff** (owner's call) — satisfies FTC disclosure + eBay's
  "label clearly" rule + the compare-and-hand-off model, all at once.

**Rental partners — NEW stream (researched 2026-06-24).** Rental is a third transaction type (buy /
sell / **rent**) that maps onto the `want` intent ("not ready to buy? rent it first"). Both major
handbag-rental players are reachable through networks already held — no new approval gate. Modeled as
the 5th revenue stream in `monetization-projections.md`.

| Partner | Network | Commission | Notes |
|---|---|---|---|
| **Vivrelle** | **ShareASale = Awin** (existing acct 2945769) | **~20%/sale** | Membership rental ($139–339/mo; Privée $800/mo). High rate; recurring. ⭐ best rental fit. |
| **Rent the Runway** | **Skimlinks** (network 4419) + FlexOffers | **7%**, 30-day cookie | Covered by the Skimlinks catch-all. |

**Gating (owner's call, 2026-06-24):** **apply to and get approved for the rental programs BEFORE building the bag-page "Rent it first" CTA** — same "after approval, not before" pattern as the Skimlinks install. **Status: owner applied to Vivrelle (Awin) 2026-06-24, still PENDING as of 2026-06-27** (Awin dashboard shows Vivrelle with n/a Approval Rate / Conversion / EPC and a 29/07/25 launch date, i.e. a live-but-dormant, low-volume program, links healthy but no application/sales activity to compute from). **myGemma** (Approval 100%) + **BriteCo** (Approval 62.32%) are the actively-processing pending programs by comparison. **To unblock: founder sent a direct LinkedIn intro to Vivrelle VP of Marketing Sophie Krakowski (owns partnerships) on 2026-06-27** rather than wait on the dormant Awin queue; fallback contact Caroline Shasha (Content & Marketing Manager, influencer outreach). She also emailed the Vivrelle advertiser via Awin's contact-advertiser on 2026-06-27 (second parallel channel, in case the LinkedIn intro stalls). Also relevant leverage: she is a long-time Vivrelle member, currently paused (an authentic warm-customer angle for the pitch, not just a cold outreach). Rent the Runway rides the Skimlinks catch-all once Skimlinks approves. Only after a program approves: spec + build the rental CTA module (held until then).

**Consignor-affiliate dig — Fashionphile / Rebag / Luxury Closet all ❌ (researched 2026-06-24).**
Confirmed none has a consignor/seller-referral *affiliate* beyond its buyer-side program — **TRR Real
Partners was the only formal one, and it's ruled out (above).** Don't keep hunting for a consignor
affiliate at these:
- **Fashionphile** — affiliate is buyer-side (5% + $50). Its "Partners Program" is **tax-free shopping
  for resellers**, not a referral payout.
- **Rebag** — buyer affiliate (CJ 7%) + a refer-a-friend that pays **$100 in Rebag *credit*** on a
  *buyer's* purchase >$500. No consignor affiliate.
- **The Luxury Closet** — buyer affiliate only (7.69% CJ); notably **welcomes price-comparison/review
  sites** = clean buyer-side fit. No consignor affiliate.

**Refer-a-friend codes — NOT a usable revenue mechanism (researched 2026-06-24).** Asked: could the
owner paste a *personal* refer-a-friend code into LC outbound links? Verdict **no** — all pay store
credit/personal discount (not cash to the LLC), are capped, and undermine the neutral-authority brand
(coupon-farming look; the exact "blasting codes" vibe TRR's lead disliked). FTC disclosure would still
apply. Specifics: **Poshmark/eBay** prohibit public posting of personal codes (friends-only; ban risk);
**Vestiaire** allows public sharing but caps at 100 referees and pays a *discount code*; **Rebag** pays
$100 *store credit*. Use proper affiliate/publisher programs instead.

**Adjacent revenue streams (researched 2026-06-24)** — beyond buy/sell/rent, kept out of the model
until pursued; listed in `monetization-projections.md` "other streams":
- **Insurance lead-gen — BriteCo:** affiliate via **ShareASale (= Awin, existing acct)**, **$10 per
  *lead*** (CPL — pays on the lead, not a sale). Fits the `have` state (owners insure). On-brand
  (protection = trust). **Jewelers Mutual / Lavalier:** no public affiliate program (agent channel) —
  direct outreach only if pursued.
- **Amazon Associates — pursue (owner's call 2026-06-24):** two fits, not one. (a) **Care/accessories**
  — base shapers, organizers, leather cleaner/conditioner (low per-unit, evergreen, fits `have`); plus
  organizer brands (LUX LAIR, Handbag Social Club) run their own programs. (b) **Actual bags** — Amazon
  sells contemporary/accessible-luxury brands (Marc Jacobs, Coach, Michael Kors, etc.) and runs official
  **Amazon Luxury Stores**, so it's also a **buyer-affiliate channel**. ⚠️ **Authenticity guardrail:**
  only link **Amazon-fulfilled / brand-sold / Luxury Stores** items — avoid third-party marketplace
  "designer" listings (counterfeit risk → cuts against the authenticity mission). Apply directly at
  affiliate-program.amazon.com (list luxurycatalog.com; describe content/comparison model). Note Amazon's
  low, category-specific rates + short (24h) cookie.
  - **📋 BACKLOG — Amazon Associates signup (paused 2026-06-24).** Started the signup via the browser;
    **paused at the Amazon login gate** (Claude won't enter credentials). To resume: owner signs into the
    Amazon account tied to Luxury Catalog LLC → Claude fills the **Account Info → Website/App List →
    Profile** descriptive fields (website `luxurycatalog.com`; the "what's your site about" blurb + topics
    + traffic/link-building answers are drafted in the chat log). **Owner-only steps:** tax interview
    (SSN/EIN, W-9), payment/bank details, final accept+submit of the Operating Agreement. Reminder: Amazon
    needs **~3 qualifying sales within 180 days** of signup or it auto-closes — time it for when the site
    has live traffic.
- **Repair/restoration:** **no public affiliate programs** (Leather Spa, Leather Surgeons, The Handbag
  Spa/Clinic are direct/agent) — would need bespoke referral deals, not turnkey. Lower priority.
- **Later/at scale:** premium display ads (Raptive/Mediavine at ~50–100K sessions/mo; UX/trust tax),
  **B2B data/insights** from the per-spec price DB (the real moat — "WatchCharts for bags"), digital
  products/courses off the expert-contributor ladder.

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

## 12. Sold capture + discovered promotion (2026-06-26)

**Realized (sold) prices — browser pull.** eBay/Poshmark completed-sales are the only
peer-to-peer realized signal (Fashionphile reconcile-sold is premium fixed-price). Method
proven + documented in `docs/research-drafts/poshmark-ebay-sold-capture.md`. Loaded the first
421 p2p sold rows (Coach Tabby 20/26/Standard `v595/596/597`, Rogue all sizes `v601-605`) via
`load-sold.ts` (`price_type='sold'`). Recency-window every sold pull (date-confound rule).

**TRANSPORT REALITY (verified 2026-06-26) — use `get_page_text` body-transport.**
- The localhost sink (`scripts/capture-sink.mjs`) is **CSP-blocked on eBay, Poshmark, AND
  TheRealReal** (the POST hangs → CDP timeout). Don't rely on it for these origins.
- Blob-download works **once per origin**, then Chrome gates every subsequent auto-download
  (no fresh-nav reset). Fine for a single file; useless for a multi-model grind.
- **Working path:** capture in-page → `window.__CAPS = JSON.stringify(records)` →
  `document.body.innerHTML='<pre>CAPSTART'+window.__CAPS+'CAPEND</pre>'` → `get_page_text`
  returns the FULL JSON uncapped (the eval return truncates ~5KB; get_page_text does not).
  Author the captured JSON to `data/ingest/_raw/<key>.json`, then `load-sold.ts --write`.
- All three sources are live + logged-in in the local Chrome (TRR `__NEXT_DATA__`, Poshmark
  `__INITIAL_STATE__["$_search"].gridData`, eBay `.s-card` sold markup).

**SAFE promotion — `promote-safe.ts` (built 2026-06-26).** Rolls recurring `discovered_listing`
clusters into curated size-variants of **EXISTING clean styles only** (no new style rows = no
junk-style risk). Run: `npx tsx supabase/ingest/promote-safe.ts --min=20 [--write]`. First run
promoted 3,855 asking rows → 85 new variants (~15 brands' iconic models), deduped by listing_ref.
- **OWNER-GATED next:** `promote-safe --min=20` also reports the **28 promotable clusters that
  need a brand-NEW style** (e.g. models we don't carry yet). Creating those means new `style`
  rows on the live catalog — review the list and greenlight before running the mass
  `promote-discovered --write` (still the intentional stub).

**Coverage auditor — `audit-coverage.ts`.** `npx tsx supabase/ingest/audit-coverage.ts` prints
listed/sold totals + per-brand priced-variant counts (paginates, so counts don't cap at 1000).
2026-06-26 state: 750 priced variants / 23,096 listed / 12,636 sold (421 p2p + 12,215 FP).
**Still slim:** Coach asking (200, mid-tier lives on eBay/Poshmark not TRR/FP), and MK / Kate
Spade / Longchamp / Mulberry = absent (mid-tier capture queued).
