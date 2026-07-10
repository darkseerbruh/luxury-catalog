# Unified market spec — search + browse + everything-for-sale + deals as one page

*Owner-greenlit 2026-07-10 (the "all in one place, done well" thread). One surface: the
text box, the filters, the default grid, and one toggle, all composing. Model: StockX / GOAT /
Fashionphile. Mockup: the "One page: the market" artifact.*

## The idea in one line

`/shop` is the market. **Search** is the text box, **browse** is the filters, **everything for
sale** is the default grid, **deals** is a toggle. They stack instead of competing.

## URL scheme (one page, every state shareable + indexable)

All state lives on `/shop` as query params, so any state is a real URL:

| Param | Meaning | Status |
|-------|---------|--------|
| `q` | Free text: brand, style, or a description | NEW |
| `brand` `color` `material` `hardware` `condition` `feet` | Spec filters | exists |
| `min` `max` | Price range | exists |
| `deals=1` | Priced-low listings only | exists |
| `sort` | best-deal / price-asc / price-desc / newest | exists |
| `carry` | Shape / carry method | phase 2 (coverage-gated) |

## Behavior

- **Nothing typed** → the whole market (every bag for sale), cheapest first. This is today's `/shop`.
- **Type a query** → resolve it to matching styles (the existing search), narrow the grid to those
  styles. Filters + deals stay live on top.
- **Pick a filter** → that's browse. No query needed.
- **Flip Deals** → priced-low only, stacked on whatever else is set.
- **Matched but not for sale** → styles that match the query yet have no live listing show in a
  labeled strip below the grid ("In the catalog, not listed for sale right now"), linking to the bag
  page. Nothing becomes unfindable (StockX "no asks" model).
- **Zero catalog matches** → the request-a-bag path (ported from `/search`), so demand still logs.

## IA / redirects (old links keep working)

- `/search` → **redirects** to `/shop?q=…`. Its extras port onto `/shop`: interpreted chips, the
  "from articles" strip, the social/video pin, and request-a-bag on empty.
- `/deals` → `/shop?deals=1&sort=best-deal` (already a redirect today).
- `/browse` and `/browse/carry|fits/[slug]` → **kept** as indexable discovery doors. Each deep-links
  into `/shop` with a filter pre-applied, so the SEO pages stay while the experience is one place.

## Nav + footer

- The finding intents collapse to **one entry: Shop** → `/shop`. The dropdown may still list Search /
  Browse / Deals as deep-links into that one page for menu-scanners.
- Footer "Shop the market" group points all four labels at `/shop` variants.

## Integration (reuse, no new engine)

- `resolveMarketSearch(query, profile?)` wraps the existing `findPriorityStyles` + `searchCatalog`
  (+ `hybridSearch` when `VOYAGE_API_KEY`) and returns the matched `styleId` set + the matched styles
  (for the fallback strip) + interpreted chips.
- `getShopProducts` gains a `styleIds?: number[]` filter (in-memory, over the styleId each product
  already carries). The grid narrows to the matched set; every other filter composes unchanged.
- `ShopControls` already preserves existing params on every change, so a filter tweak keeps `q`.

## Data honesty / coverage

- **Search + Deals + spec facets:** full coverage. Ship now.
- **Shape / carry / fits:** stored variant-level in sparse tables. Ship as a filter that hides itself
  when empty (the protective-feet pattern). Real strength arrives with the attribute-capture pass
  (worklist). Do not over-promise shape filtering.

## Metric

Engagement + affiliate. The market grid is the primary outbound-buy-click path; collapsing four
half-used doors into one strong filterable surface is the biggest single lever on bag-page views and
affiliate click-through. Instrumented by the existing `catalog_filtered` + search events (source tag
`market`).

## Non-goals (this pass)

- Left-rail visual redesign (keep the existing `ShopControls`; rail is a later polish).
- Removing the browse SEO landing pages.
- Shape filter in the rail (deferred until attribute coverage supports it).
