# Vestiaire Collective — Browser Capture Recipe

**Status:** UNVERIFIED — the `__NEXT_DATA__` path and exact field names must be
confirmed on a live, logged-in Vestiaire page. The JSON-LD fallback is more stable.
Steps 1–4 are the proven pattern; step 5 (product node path) is the one to confirm.

**Platform context:** Vestiaire is a Next.js site. Product pages embed a
`<script id="__NEXT_DATA__" type="application/json">` blob that carries the full
product object (brand, colour, material, condition, country/region, price in
various currencies). This is richer than the JSON-LD `Product` block on the same
page and is the preferred source — it has cents-precise pricing, structured
country objects, and condition grade strings.

**Unlock:** Vestiaire blocks plain server-side fetch. Running a same-origin
`fetch(url, {credentials:'include'})` inside a logged-in browser tab defeats this.
Use Claude in Chrome with the browser extension.

---

## Prerequisites

- Active Vestiaire Collective account, logged in.
- Chrome with the Claude in Chrome extension connected.
- Claude Code session running (`npm run dev` is NOT required — this is a data step).
- Destination: `data/ingest/_raw/vestiaire.json` (gitignored, runtime landing zone).

---

## Step 1 — Open the search page

Navigate to a logged-in Vestiaire search in Chrome:

```
https://www.vestiairecollective.com/search/?q=chanel+classic+flap+medium
```

Other bag queries:
```
https://www.vestiairecollective.com/search/?q=hermes+birkin+30
https://www.vestiairecollective.com/search/?q=hermes+kelly+28
https://www.vestiairecollective.com/search/?q=louis+vuitton+neverfull+mm
```

Vestiaire also supports category + brand filters in the URL; the plain `?q=` search
is the most reliable starting point.

---

## Step 2 — Collect product URLs from the search page

In the browser console on the search page (top-level `await` — do NOT wrap in an
async IIFE, the tool returns `{}`):

```js
// Collect all product page links from the current search results page
const links = [...document.querySelectorAll('a[href]')]
  .map(a => a.href)
  .filter(h => /vestiairecollective\.com\/[a-z]+-bags\//.test(h))
  .map(h => h.split('?')[0])          // strip query params
  .filter((h, i, arr) => arr.indexOf(h) === i);  // dedupe

console.log(`Found ${links.length} product URLs`);
links.slice(0, 5).forEach(l => console.log(l));
links;   // return for inspection
```

Vestiaire product URLs look like:
```
https://www.vestiairecollective.com/women-bags/handbags/chanel/black-caviar-chanel-classic-flap-medium-42011234.shtml
```

The numeric suffix (e.g. `42011234`) is the stable listing ID — extract it as
`listing_ref`.

To paginate past page 1:
```
https://www.vestiairecollective.com/search/?q=chanel+classic+flap+medium&page=2
```

Repeat the collection per page, accumulate into a single de-duplicated array.

---

## Step 3 — Fetch each product page and extract `__NEXT_DATA__`

Chunk fetches in batches of 8 (the Claude in Chrome tool times out ~45s). Accumulate
results into `window.__VCAPS` so you can page the output in slices:

```js
// Run this once to initialise the accumulator
window.__VCAPS = window.__VCAPS || [];

// Then for each chunk of 8 URLs — replace the array with your collected links
const chunk = [
  "https://www.vestiairecollective.com/women-bags/handbags/chanel/...-42011234.shtml",
  // ... up to 7 more URLs
];

for (const url of chunk) {
  try {
    const html = await fetch(url, { credentials: 'include' }).then(r => r.text());

    // Extract __NEXT_DATA__ blob
    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
    if (!m) { console.warn('No __NEXT_DATA__ at', url); continue; }
    const data = JSON.parse(m[1]);

    // ⚠️ MUST CONFIRM LIVE: find the product node (see Step 4 for path candidates)
    const pp = data?.props?.pageProps;
    const node =
      pp?.product ||
      pp?.initialReduxState?.product ||
      pp?.initialState?.product ||
      pp?.data?.product ||
      pp?.productDetails ||
      pp?.item;

    if (!node) { console.warn('Product node not found at', url); continue; }

    window.__VCAPS.push({ node, url });
    console.log(`OK: ${url} → id=${node.id}, price=${JSON.stringify(node.price)}`);
  } catch (e) {
    console.error('FAIL', url, e.message);
  }
}

console.log(`Total accumulated: ${window.__VCAPS.length}`);
```

After all chunks, retrieve the accumulated data in slices (the tool truncates large
returns):

```js
// Page 1 of results
JSON.stringify(window.__VCAPS.slice(0, 20));
// Page 2
JSON.stringify(window.__VCAPS.slice(20, 40));
// etc.
```

---

## Step 4 — Confirm the `__NEXT_DATA__` product node path (REQUIRED — unverified)

**This is the single most important thing to confirm live.** Vestiaire's internal
Next.js page shape changes with deploys. On ONE product page, inspect the blob:

```js
const html = await fetch(location.href, { credentials: 'include' }).then(r => r.text());
const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
const data = JSON.parse(m[1]);

// Print the top-level keys inside pageProps so you can see what's there
const pp = data.props.pageProps;
console.log('pageProps keys:', Object.keys(pp));

// Try the candidates:
console.log('pp.product:', pp.product);
console.log('pp.initialReduxState?.product:', pp.initialReduxState?.product);
console.log('pp.initialState?.product:', pp.initialState?.product);
console.log('pp.data?.product:', pp.data?.product);
console.log('pp.productDetails:', pp.productDetails);
console.log('pp.item:', pp.item);
```

Alternatively, use the `findVestiaireProductNode` helper exported from
`src/lib/ingest/vestiaire.ts` (paste the compiled version or the helper inline):

```js
function isLikelyProductNode(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const hits = ['brand','price','condition','id','color','material'].filter(k => k in obj);
  return hits.length >= 2;
}
function deepFind(obj, depth) {
  if (depth > 6 || !obj || typeof obj !== 'object') return null;
  if (isLikelyProductNode(obj)) return obj;
  for (const v of Object.values(obj)) { const f = deepFind(v, depth+1); if (f) return f; }
  return null;
}

const data = JSON.parse(document.getElementById('__NEXT_DATA__').textContent);
const node = deepFind(data, 0);
console.log(JSON.stringify(node, null, 2));
```

**Expected product node fields** (cross-check that your node has these):

| Field | Expected type | Example |
|---|---|---|
| `id` | string or number | `"42011234"` |
| `brand` | `{ name: string }` | `{ name: "Chanel" }` |
| `color` or `colors[0]` | `{ name: string }` or string | `{ name: "Black" }` |
| `material` or `materials[0]` | `{ name: string }` or string | `{ name: "Caviar Leather" }` |
| `condition` | string | `"Very good condition"` |
| `price` | `{ cents: number, currency: string }` | `{ cents: 875000, currency: "EUR" }` |
| `country` | `{ name: string, code: string }` | `{ name: "France", code: "FR" }` |

**JSON-LD fallback** — if `__NEXT_DATA__` shape is unclear or the product node is
absent, extract the JSON-LD `Product` block instead:

```js
const lds = [...document.querySelectorAll('script[type="application/ld+json"]')]
  .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
  .filter(Boolean);
const product = lds.find(d => d['@type'] === 'Product');
console.log(JSON.stringify(product, null, 2));
```

JSON-LD Product fields: `offers.price`, `offers.priceCurrency`, `color` (string),
`material` (string), `itemCondition` (schema.org URL), `brand.name`, `name`.
Condition granularity is lower (schema.org has only NewCondition / LikeNewCondition /
UsedCondition) — prefer `__NEXT_DATA__` when possible.

---

## Step 5 — Save the raw dump

After accumulating all records, copy the `window.__VCAPS` JSON and save it as:

```
data/ingest/_raw/vestiaire.json
```

Format: `[{ "node": { ...product fields... }, "url": "https://..." }, ...]`

The `url` field is required for attribution (every row must carry `source_url`).

---

## Step 6 — Ingest

```bash
# Process the raw dump through parseVestiaireProduct → PriceObservation landing file
npm run ingest:vestiaire

# Dry-run load (check what would be inserted — no writes)
npm run load:prices -- vestiaire

# Write to Supabase
npm run load:prices -- vestiaire --write

# Refresh the materialized price summary so bag pages update
npm run summary:refresh
```

`ingest:vestiaire` reads `data/ingest/_raw/vestiaire.json`, maps each entry through
`parseVestiaireProduct()`, filters by price bounds and the `TARGETS` list in
`supabase/ingest/sources/vestiaire.ts`, and writes a landing JSON file.

---

## Capture checklist

- [ ] Logged in to Vestiaire before fetching (credentials required — bot-block bypass)
- [ ] Confirmed the `__NEXT_DATA__` product node path on ONE live page (Step 4)
- [ ] Each entry in `vestiaire.json` has both `node` and `url` fields
- [ ] `node.id` is present (used as `listing_ref`)
- [ ] `node.price` has `cents` or `amount` + `currency`
- [ ] `node.country` has `name` (or `code`) — needed for region data
- [ ] `node.condition` is a Vestiaire grade string (NOT a schema.org URL) for best granularity
- [ ] Chunk size ≤ 8 fetches per tool call (timeout ~45s)
- [ ] `npm run ingest:vestiaire` exits cleanly (check kept/dropped counts)
- [ ] `npm run load:prices -- vestiaire` dry-run shows expected rows before `--write`

---

## TARGETS configured in the adapter

`supabase/ingest/sources/vestiaire.ts` has one target pre-configured:

| Brand | Style | Size | Tokens | Price range |
|---|---|---|---|---|
| Chanel | Classic Flap | Medium | chanel + flap | $1,500–$25,000 |

Add more entries to `TARGETS` before capturing other bags. The token filter
(`requireTokens`) is applied against `node.name` and `node.brand.name` to reject
off-target listings that appear in broad search results.

---

## Pricing quirks

- Price is usually in EUR (default for European sellers) but USD, GBP, etc. are common
  for sellers in other regions — always capture and store the original currency.
- `price.cents` is the most precise field (divide by 100). If absent, `price.amount`
  may be a string like `"9800"` — strip non-numeric chars before parsing.
- `offers.price` in JSON-LD is always a decimal (no cents).
- The materialized `variant_price_summary` view stores `sale_price` as-captured — cross-
  currency comparisons need an FX layer (not yet implemented; mark as future work).

---

## Known unknowns (confirm live)

1. **`__NEXT_DATA__` path** — `data.props.pageProps.product` is the most common Vestiaire
   shape as of early 2025, but Vestiaire has migrated between Redux (`initialReduxState`)
   and direct pageProps before. Run the path confirmation step on ONE page first.
2. **`colors[]` vs `color`** — some Vestiaire API versions return an array
   (`colors: [{ name: "Black" }]`) rather than a single object. The parser handles both;
   the raw dump should show which shape is live.
3. **`materials[]` vs `material`** — same as colours — array vs object.
4. **`hardware` field** — Vestiaire may not surface this as a dedicated field in
   `__NEXT_DATA__`; it may be embedded in `name` or absent. If absent, hardwareColor
   will be null (acceptable — hardware is not always searchable on Vestiaire).
5. **Pagination** — Vestiaire's search may require scrolling or clicking "Load more"
   before all results appear in the DOM. If link collection yields < 20 results on a
   busy search term, scroll to the bottom first.
