# Poshmark + eBay sold-price capture (method + first pulls)

*Started 2026-06-26. How we pull authenticated SOLD prices from Poshmark and eBay, which
neither Fashionphile nor TheRealReal give us (those are asking only). Both platforms
authenticate every item sold at $500+ (eBay Authenticity Guarantee, Posh Authenticate), so
sold listings above that line are third-party verified.*

## Poshmark — working browser pull (proven 2026-06-26)
No public API. Capture runs same-origin in the owner's logged-in Chrome (Claude-in-Chrome):

1. Navigate to a search, e.g. `https://poshmark.com/search?query=<q>&type=listings&availability=sold_out`
   (`availability=sold_out` = completed sales; drop it for active/asking).
2. The server-rendered results live at `window.__INITIAL_STATE__["$_search"].gridData.data`
   (48/page, fully structured: `title`, `price_amount`, `original_price_amount`, `size_obj`,
   `condition`, `inventory.status`, `colors`, `first_published_at`, `status_changed_at`).
   The cursor is `gridData.more.next_max_id`; results are capped at 5,000 per query.
3. **Paginate by scrolling**: each scroll-to-bottom appends the next page into
   `gridData.data` (48 → 96 → …). Scroll N times, then read the array. (The load-more XHR
   uses a cached client, so request interception misses it; reading the accumulated store is
   the reliable path.)
4. Filter to genuine target bags before any stat: title must contain `flap`, exclude
   accessories (`wallet`, `WOC`, `card holder`, `dust bag`, `box`, `charm`, `strap`, etc.)
   and other sizes (`jumbo`, `mini`, `small`), price band $1,500–$60,000. **Poshmark only
   authenticates $500+**, so sub-$500 rows are unverified and must be dropped anyway.

### First pull — Chanel Medium Classic Flap, SOLD (2026-06-26)
Query `chanel classic flap medium`, `availability=sold_out`. 96 raw → **78 kept bags**.
- **Median sold $4,292**, IQR $3,300–$6,550, range $1,741–$14,335.
- Leather parsed from title where stated: caviar 13, lambskin 10 (rest unspecified).
- Corroborates the eBay sold capture ($4,225 lambskin to $5,500 caviar) and sits below the
  ~$6,000 asking median on the authenticated resellers. Used in the Flap "is it worth it"
  article (post_id 1).

## eBay — browser pull (the dev API is out)
**The owner was rejected from the eBay Developers Program (2026-06-26)**, so the Browse API
path is unavailable. That is fine: the Browse API only returned *asking* prices (which we
already have from TheRealReal/Fashionphile/Vestiaire), and eBay *sold* prices were always
browser-only (the realized-price Marketplace Insights API is access-gated). So eBay becomes a
browser pull like Poshmark:
- Capture the completed-sales search same-origin in the logged-in browser, e.g.
  `https://www.ebay.com/sch/i.html?_nkw=chanel+classic+flap+medium&_sacat=169291&LH_Sold=1&LH_Complete=1`.
- Extract sold price + title + condition from the rendered results, filter the same way
  (genuine flap bags, $500+ so authenticated, exclude accessories/other sizes).
- **eBay rate-limits harder than Poshmark** (~120 fetches then 403, ~10-min cooldown): pace
  gently, never burst. The built `ebay.ts` Browse adapter is now dormant; the live path is the
  browser. (If the owner's eBay account matures, re-applying to the dev program may unlock the
  asking-side API later, but it is not needed for the sold signal.)

## Build status / next steps
- [x] Poshmark browser paginator mechanism proven; first hero-bag sold pull done.
- [ ] **Loader into prod is deliberate, not a dump.** Sold rows must load with
  `price_type='sold'` + `listing_status='sold'`, and the app's value reads must filter by
  `price_type` so sold prices do NOT pollute the asking-based "listing for" medians. Wire the
  read filter first, then load. Catch-all/unmatched rows go to `discovered_listing`, never
  auto-onto curated variants (existing integrity rule).
- [ ] eBay developer keys (owner action) → run the Browse crawler for market-wide asking.
- [ ] Scale Poshmark depth-first across the hero bags, then brands (repeat the query loop).
