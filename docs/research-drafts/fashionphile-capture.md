# Fashionphile Capture Recipe

**Status:** Ready for operator execution. Code is on `claude/fashionphile-capture`.
**Run in:** a logged-in Fashionphile tab in Chrome.
**Prereq:** Claude-in-Chrome extension, or browser console (DevTools > Console).

---

## What Fashionphile uses under the hood

Fashionphile is a Shopify store. Two relevant APIs:

1. **Per-product JSON** — `https://www.fashionphile.com/products/<handle>.json`
   Returns `{ product: { title, handle, body_html, tags, variants:[{price,sku}], … } }`.
   This is the high-confidence path: one request per listing, full spec.

2. **Discovery** — Algolia search (NOT server-rendered search results).
   `/shop?q=…` shows generic recent arrivals; the real product index is queried via Algolia.
   - Algolia App ID (confirmed): `NSJAZ0QG7K`
   - Index names observed: `shopify_products_published_at_desc`, `shopify_products_pricedat_desc`
   - The search-only API key is a **client-side key** (not a secret) — read it from any
     search XHR in the Network tab.

---

## Step 1 — Obtain the Algolia key + exact index name

Open any Fashionphile page, then in DevTools:

1. Go to **Network** tab, filter by `algolia.net`.
2. Type any search term in the Fashionphile search box (e.g. "chanel flap").
3. Find the POST request to a URL like:
   `https://NSJAZ0QG7K-dsn.algolia.net/1/indexes/*/queries`
4. In the request **Headers**, copy the value of `x-algolia-api-key`
   (looks like a 32-character hex string). This is your `ALGOLIA_KEY`.
5. In the request **Payload** (request body), note the `indexName` value
   (e.g. `shopify_products_published_at_desc`). This is your `ALGOLIA_INDEX`.

> **Unverified:** the exact index name may differ. Common variants to try if the
> above doesn't surface results:
> - `shopify_products` (base index)
> - `shopify_products_recently_added_desc`
> - `shopify_products_published_at_desc` (seen in prior inspection)

---

## Step 2 — Algolia search for target handles

Run this in the console of ANY fashionphile.com tab (same-origin is not required
for Algolia — it's a cross-origin CDN API):

```js
// Fill these in from Step 1.
const ALGOLIA_KEY = "PASTE_KEY_HERE";
const ALGOLIA_INDEX = "shopify_products_published_at_desc"; // confirm from Step 1

// Target query — tune per bag. Examples below.
const QUERY = "chanel classic flap medium";
const HITS_PER_PAGE = 120;

// Optional facet filters — narrow by category/brand if the index supports them.
// Remove facetFilters if you get 0 results (the filter keys vary by Algolia config).
const FACET_FILTERS = [];  // e.g. [["brand:CHANEL"]] if supported

const body = JSON.stringify({
  params: [
    "&query=" + encodeURIComponent(QUERY) +
    "&hitsPerPage=" + HITS_PER_PAGE +
    (FACET_FILTERS.length ? "&facetFilters=" + encodeURIComponent(JSON.stringify(FACET_FILTERS)) : "")
  ].join("")
});

// NOTE: Algolia REST endpoint — no auth cookie needed.
const resp = await fetch(
  `https://NSJAZ0QG7K-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Algolia-Application-Id": "NSJAZ0QG7K",
      "X-Algolia-API-Key": ALGOLIA_KEY,
    },
    body: JSON.stringify({ params: `query=${encodeURIComponent(QUERY)}&hitsPerPage=${HITS_PER_PAGE}` }),
  }
);
const data = await resp.json();
console.log("Total hits:", data.nbHits);
// Each hit has: objectID, handle, title, price (or vendor_price), etc.
const handles = data.hits.map(h => h.handle);
console.log("Handles:", handles);
copy(handles);  // Copies to clipboard as JSON array.
```

> **Important:** review the handles before fetching. Filter out any that don't
> match your target bag (wrong size, wrong style). The Algolia results are broad.
>
> **Unverified:** the exact field names in hits may vary. Check `data.hits[0]` in
> the console to see what's returned. The `handle` field is standard on Shopify
> Algolia integrations but confirm it's present.

### Example queries for catalog targets

| Bag | Suggested query |
|---|---|
| Chanel Classic Flap Medium | `"chanel classic flap medium"` |
| Chanel Classic Flap Jumbo | `"chanel classic flap jumbo"` |
| LV Neverfull MM | `"louis vuitton neverfull mm"` |
| LV Neverfull PM | `"louis vuitton neverfull pm"` |
| Gucci GG Marmont Small | `"gucci marmont small"` |
| Hermès Birkin 30 | `"hermes birkin 30"` |
| Hermès Kelly 28 | `"hermes kelly 28"` |

---

## Step 3 — Fetch per-product JSON and build the raw dump

Once you have `handles` (from Step 2 or from a Shopify collection, see Step 5),
run this in the Fashionphile tab console. Chunk to ≤10 per call if it times out.

```js
// Paste handles from Step 2 here.
const handles = ["handle-1", "handle-2", /* ... */];

const results = [];
for (const handle of handles) {
  try {
    const r = await fetch(`/products/${handle}.json`, { credentials: "include" });
    if (!r.ok) { console.warn("skip:", handle, r.status); continue; }
    const j = await r.json();
    if (!j.product) { console.warn("no product in response for", handle); continue; }
    // Capture the condition grade from the listing page if you opened it.
    // For batch capture without visiting each page, leave conditionGrade out —
    // the parser will set condition: null and you can fill it in later.
    results.push({
      product: j.product,
      url: `https://www.fashionphile.com/products/${handle}`,
      // conditionGrade: "Excellent",  // uncomment and set if known
    });
    console.log(`✓ ${handle} — $${j.product.variants?.[0]?.price}`);
  } catch (e) {
    console.error("error:", handle, e);
  }
}
console.log(`Captured ${results.length} records.`);
copy(JSON.stringify(results, null, 2));
```

Paste the clipboard into `data/ingest/_raw/fashionphile.json` and save.

### Adding condition grades (optional but recommended)

If you want condition data, open each listing page and note the grade from the
product card (displayed as "Condition: Excellent" or similar). Then set
`conditionGrade` in the raw dump entry before saving.

Fashionphile grade ladder → SaleCondition enum mapping:

| Fashionphile grade | Mapped to |
|---|---|
| New | `new` |
| Giftable | `new` (like-new / store-transfer quality) |
| Excellent | `excellent` |
| Very Good | `very good` |
| Good | `good` |
| Fair / Pre-Owned Fair | `fair` |

---

## Step 4 — Load into the database

```bash
# Parse + validate (dry run — shows what would be written):
npm run ingest:fashionphile:raw

# Actually load:
npm run load:prices -- fashionphile --write

# Refresh the summary materialized view:
npm run summary:refresh
```

`ingest:fashionphile:raw` runs:
```
npx tsx supabase/ingest/sources/fashionphile.ts --raw
```

The adapter reads `data/ingest/_raw/fashionphile.json`, runs each record through
`parseFashionphileProduct(product, conditionGrade)`, matches to a catalog target
(currently: Chanel Classic Flap Medium), and validates price within bounds.

---

## Step 5 — Fallback: Shopify collection JSON (no Algolia key needed)

Shopify exposes collection endpoints that return product handles without needing
Algolia. Try these in the console of the Fashionphile tab:

```js
// Shopify collection JSON — returns up to 250 products per page.
// The collection handle must match Fashionphile's actual URL slug.
// Unverified: these slugs are guesses based on the site structure.

const COLLECTION = "chanel";  // try "chanel-classic-flap", "chanel-handbags", etc.
const PAGE = 1;  // increment for pagination

const r = await fetch(`/collections/${COLLECTION}/products.json?limit=250&page=${PAGE}`);
const data = await r.json();
console.log("Products:", data.products?.length);
console.log("Handles:", data.products?.map(p => p.handle));
```

> **Unverified:** collection slugs must match Fashionphile's actual slugs.
> Check the URLs on the site (e.g. `/shop/chanel` or `/collections/chanel`).
> If the slug is wrong the response will have `{ products: [] }`.
> The Algolia path (Steps 1-2) is more reliable for targeted style searches.

---

## Step 6 — Extending to other catalog targets

Add more entries to `TARGETS` in `supabase/ingest/sources/fashionphile.ts`:

```ts
{
  brand: "Louis Vuitton",
  style: "Neverfull",
  size_label: "MM",
  requireTokens: ["neverfull", "mm"],   // must ALL appear in handle or title
  minPrice: 800,
  maxPrice: 5000,
  searchUrl: "https://www.fashionphile.com/shop/louis-vuitton/neverfull",
},
```

Then capture handles for that bag via Algolia (Step 2) and re-run Steps 3-4.

---

## Appendix: raw dump entry shape

```json
[
  {
    "product": {
      "title": "Calfskin Archetype Small Shopping Tote Dark Burgundy",
      "handle": "chanel-calfskin-archetype-small-shopping-tote-dark-burgundy-1887484",
      "body_html": "<p>This is an authentic CHANEL Calfskin…gold-tone hardware…</p>",
      "tags": ["Cardi B"],
      "variants": [{ "price": "8075.00", "sku": "1887484" }]
    },
    "url": "https://www.fashionphile.com/products/chanel-calfskin-archetype-small-shopping-tote-dark-burgundy-1887484",
    "conditionGrade": "Excellent"
  }
]
```

Key lesson from live inspection (2026-06-22): `tags` held `["Cardi B"]` — a
celebrity endorsement, not spec. **Never rely on tags for colour/material/hardware.**
The parser extracts all spec from `title` + `body_html`.
