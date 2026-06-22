# Data Sourcing Research — bag catalog & price acquisition

**Status:** living spec (created 2026-06-22). This is the source-of-truth the
ingestion adapters (`supabase/ingest/sources/*`) are built against. Update it as
access changes (affiliate approvals, eBay API grant, new sources).

Companion to the approved plan and to
[image-feed-procurement.md](image-feed-procurement.md) /
[image-strategy-research.md](image-strategy-research.md) (images are a separate,
more-gated track — this doc is **prices + variant attributes only**).

---

## 1. Legal / attribution posture (locked with owner)

Pragmatic, not paranoid. The reasoning the owner and I aligned on:

- **Prices and specs are facts.** Facts are not copyrightable. Reading a public
  listing page and displaying its price — attributed, with a link back, the way a
  search engine does — is the low-risk end of the spectrum.
- **Resale prices are real, not "asking."** Fashionphile (buyout), TheRealReal,
  Rebag and Vestiaire are fixed-price buy-it-now / consignment, not auctions, so a
  listed price *is* effectively the transaction price (barring a discount code).
- **Hard limits we keep:**
  1. Never ingest reseller **photos** or **verbatim descriptions** (those are
     copyrighted — images stay on the licensed/UGC track).
  2. Store a **`source_url` + observation date on every price row** for
     attribution, link-back, and audit.
  3. Be a polite client: descriptive User-Agent, per-source rate limit + backoff,
     honor `robots.txt`, cache responses.
  4. Honor the existing catalog rule — **never invent** auth markers, specs, or
     prices; unverifiable → leave null + `confidence_level: low`.
- **Prefer official channels where they exist** (affiliate datafeeds, eBay API) —
  cleaner data and contractually blessed — and fall back to reading public pages
  only where no feed exposes the field we need.

---

## 2. Source map (signal → source → method)

| Signal | Source(s) | Method | `price_type` | Confidence | Recency |
|---|---|---|---|---|---|
| Current resale price / platform | Fashionphile, TheRealReal, Vestiaire, Rebag | Affiliate datafeed where it carries price; else read public listing/search pages | `listed` | high | live, snapshot on schedule |
| Variant universe (color/hardware/size/material) | Same resellers' **filter taxonomies** | Enumerate filter menus → variant matrix | n/a (catalog) | high | one-time + periodic |
| Retail MSRP (current + history) | Brand sites; published price-history tables; Baghunter; Sotheby's/Rebag reports | Fetch + cite each source | `retail_msrp` | medium | backfill + on increase |
| Sold / realized (recent) | eBay sold listings | Marketplace Insights API (apply) or third-party sold scraper; Terapeak manual fallback | `sold` | high | ~90d–3yr |
| Sold / realized (historical, high-end) | Christie's, Sotheby's, Heritage auction archives | Fetch dated realized results | `auction` | high | 10–15+ yr |
| Historical asking (general) | Internet Archive / Wayback CDX over old reseller & brand pages | Recover snapshots → backdated rows | `listed` | medium | up to ~20 yr |

**20-year backfill is reconstructed, not live.** Live snapshotting only accrues
history going forward; auction archives + Wayback + published MSRP tables are what
give pages depth on day one.

---

## 3. Per-source access notes

### 3.1 Reseller current prices + variant taxonomies
- **Fashionphile** — affiliate via **Impact (Impact Radius)**; ~5% commission,
  30-day cookie, $50 first-sale bonus
  ([influencer page](https://www.fashionphile.com/pages/influencer)). Buyout model;
  public catalog pages list price, brand, model, color, hardware, size, condition.
- **Rebag** — affiliate via **CJ Affiliate**; ~7% commission
  ([affiliate-toolkit](https://www.affiliate-toolkit.com/program/rebag/)). Also runs
  "Clair" valuation data (published market values — useful secondary MSRP/resale ref).
- **TheRealReal** — affiliate network unconfirmed (CJ or Impact) — **TODO: verify in
  CJ + Impact brand directories.** Already referenced in
  [src/lib/affiliate.ts](../src/lib/affiliate.ts).
- **Vestiaire Collective** — affiliate present (Awin/others) — **TODO: confirm feed
  fields.** Strong for EU + Asian-market variants.
- **Method:** prefer the affiliate **product datafeed** (CSV/XML) when it carries a
  price field — that's the cleanest, blessed path and dovetails with the existing
  affiliate wiring. Where a feed omits price, read the public listing page (polite,
  rate-limited). Mine the **filter sidebars** (color / hardware / size / material /
  leather) to enumerate the variant universe — the product brief's data-source #1.

### 3.2 eBay sold (recent realized)
- **Marketplace Insights API** gives sold/realized prices but is a **Limited
  Release** — must apply to eBay Developer Support and be approved
  ([docs](https://developer.ebay.com/api-docs/buy/static/api-insights.html)).
  **TODO (owner/operator): submit access request.**
- Until granted: **Terapeak Product Research** (Seller Hub, manual, ~last 2–3 yr) or
  a third-party sold-listings dataset as a stopgap. Browse API gives *active*
  listings only (→ `listed`, not `sold`).

### 3.3 Auction archives (historical realized, high-end)
- **Heritage Auctions** ([ha.com](https://www.ha.com)) — open, searchable past
  results with dates and realized prices; best free archive. Strong for Hermès.
- **Christie's / Sotheby's** — Handbags & Accessories sale results published per
  sale (dates + hammer/realized). Deep for Birkin/Kelly/rare exotics; thin for
  common bags (Neverfull, Marmont rarely hit auction).
- **Method:** per style, fetch result pages, parse lot title → variant attrs +
  realized price + sale date → `price_type='auction'`, `observed_on=sale date`.

### 3.4 Internet Archive / Wayback (historical asking)
- **CDX Server API**: `http://web.archive.org/cdx/search/cdx?url=<prefix>&matchType=prefix&output=json&collapse=timestamp:6&filter=statuscode:200`
  returns `[urlkey, timestamp, original, mimetype, statuscode, digest, length]`.
  Fetch a capture via `http://web.archive.org/web/<timestamp>id_/<original>`.
- **Method:** for a known reseller/brand URL pattern, list captures across years,
  fetch periodic snapshots, parse the then-current price → backdated `listed` row
  with `observed_on = capture date`, `confidence='medium'`. Collapse to ≤ a few
  snapshots/year to stay polite.

### 3.5 Published MSRP / market reports (retail timeline)
- Year-by-year retail tables exist and are well-documented (e.g. Chanel Medium
  Classic Flap 2005 $1,650 → 2025 $11,300). Sources: Baghunter studies, Sotheby's
  market articles, Rebag Clair, reputable resale blogs (BOPF, LuxuryEvermore).
- **Method:** transcribe each dated MSRP into `retail_msrp` rows with
  `observed_on = year`, `source_url` = the citing article, `confidence='medium'`
  (secondary source). Cross-check ≥2 sources where possible before trusting a figure.

---

## 4. Normalized output contract

Every adapter emits records in one shape (consumed by `load-prices.ts`):

```ts
type PriceObservation = {
  brand: string;            // "Chanel"
  style: string;            // "Classic Flap"
  attrs: {                  // best-effort, for variant resolution
    size_label?: string; size_category?: string;
    exterior_colorway?: string; hardware_color?: string;
    exterior_material?: string;
  };
  platform: string;         // "Fashionphile" | "eBay" | "Heritage Auctions" | ...
  price_type: 'listed' | 'sold' | 'auction' | 'retail_msrp' | 'estimate';
  sale_price: number;
  currency: string;         // ISO, default "USD"
  condition?: string;       // sale_condition enum value
  provenance_completeness?: string;
  observed_on: string;      // ISO date the price was true at source
  source_url: string;       // REQUIRED — attribution + dedup
  confidence: 'low' | 'medium' | 'high' | 'verified';
  notes?: string;           // free-text citation / lot id / discount caveat
};
```

Variant resolution reuses the token-overlap matcher in
[src/lib/image-import-core.ts](../src/lib/image-import-core.ts) (brand → style →
best variant by attrs). Ambiguous matches are **skipped, not guessed**.

---

## 5. Open TODOs (operator / human-gated)
- [ ] Verify TheRealReal + Vestiaire affiliate networks & whether feeds carry price.
- [ ] Apply for eBay Marketplace Insights API access (or pick a sold-data stopgap).
- [ ] Confirm each affiliate datafeed's exact columns once approved.
- [ ] Decide refresh cadence per source (resellers: weekly; auctions/MSRP: on event).
