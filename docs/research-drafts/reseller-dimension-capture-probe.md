# Reseller dimension capture — technical probe

**Date:** 2026-07-26 · **Scope:** Fashionphile + TheRealReal product pages · **Status:** findings, no code changed

Answers the open question left by `694a2ac` ("revert the dimension backfill, harden the parser"),
which parked `DIMENSIONS_TRUSTED = false` pending *"a source that states axes in a known order."*

**Headline: both sites do. Both label every axis explicitly. Neither requires guessing order.**

Probed 30 live Fashionphile product pages and 16 live TheRealReal product pages, all sampled from
`price_history.source_url` in our own DB. Every URL below was actually fetched; nothing here is
inferred from documentation or memory.

---

## A) Per site

### Fashionphile — labelled, complete, free

| | |
|---|---|
| Exposes dimensions | Yes, **30 of 30** pages |
| Format | `Base length: 10 in` / `Height: 8 in` / `Width: 6 in` / `Drop: 3.5 in` |
| Unit | Inches, always, spelled `in`. Decimal, quarter-inch granularity. No cm anywhere. |
| **Axis labelling** | **Fully labelled.** Never a bare `10 x 8 x 6`. |
| Strap / handle drop | Yes, separate row(s). 29 of 30 carried at least one `Drop`. |
| Where it lives | **Raw server HTML.** Not JS-rendered, no API call needed. |
| Transport | **Plain `curl` with a browser UA. HTTP 200. No bot wall, no proxy, no Firecrawl.** |

The block is a Shopify metafield rendered inside the product accordion titled **"Size"**:

```html
<h2 class="accordion__title inline-richtext h6">Size</h2>
...
<p><span class="metafield-multi_line_text_field">Base length: 10 in<br />
Height: 8 in<br />
Width: 6 in<br />
Drop: 3.5 in</span></p>
```

Verified on `https://www.fashionphile.com/products/louis-vuitton-monogram-speedy-25-1803667`
and 29 others.

Note: Fashionphile is now on **Shopify** (`/cdn/shop/`, theme `t/6`). The Shopify product JSON
endpoints (`/products/<handle>.js`) return title, price, images and prose description but **no
measurements** — checked, they are absent. The metafield only renders into the HTML. Fetch the page.

**Observed variance across the 30 (all handled by keying on the label, none fatal):**

- First axis is labelled `Base length` on 21 pages and `Length` on 9. Same axis, two names.
- Row **order is not fixed**. 2 of 30 came back `Base length, Width, Drop, Drop, Height`. A
  positional parser would silently swap height and depth on ~7% of listings. Parse by label.
- 13 of 30 carried **two rows both labelled `Drop`** — handle drop and strap drop, indistinguishable
  by label (e.g. Hermès Mini Kelly 20: `Drop: 2 in` then `Drop: 18.75 in`). See the caveat below.
- 2 of 30 had a parenthetical artifact: `Drop: 12 (0.00) in`. Strip `\([\d.]+\)`.
- `Depth` as a label never appeared. Fashionphile's `Width` **is** the depth axis (see mapping).

### TheRealReal — labelled, machine-typed, but behind a bot wall

| | |
|---|---|
| Exposes dimensions | Yes, **16 of 16** pages |
| Format | Label/value rows: `Shoulder Strap Drop 15.75"` · `Height 7.5"` · `Width 9.25"` · `Depth 2.25"` |
| Unit | Inches, inch-mark `"`. Quarter-inch granularity. |
| **Axis labelling** | **Fully labelled, plus a machine `type` key** — strictly better than a text label. |
| Strap / handle drop | Yes, and **distinguished**: `shoulder-strap-drop` vs `handle-drop` are separate typed rows. 15 of 16 carried at least one. |
| Where it lives | **`<script id="__NEXT_DATA__">`, server-rendered.** Also in visible HTML, but with emotion-hashed classes (`css-ni3zxn`) — never anchor on those. |
| Transport | **Plain `curl` → HTTP 403, PerimeterX.** **Firecrawl default proxy → works, 16/16, zero failures.** Chrome MCP and Apify not needed. |

The section is headed **"Estimated item measurements"** — TRR's own hedge, worth preserving.

The `__NEXT_DATA__` payload:

```json
"props": { "pageProps": { "product": { "components": [ { "attributes": [
  { "label": "Shoulder Strap Drop", "measurement": true, "type": "shoulder-strap-drop", "values": ["11\""] },
  { "label": "Height",              "measurement": true, "type": "height",              "values": ["7.5\""] },
  { "label": "Width",               "measurement": true, "type": "width",               "values": ["11.5\""] },
  { "label": "Depth",               "measurement": true, "type": "depth",               "values": ["3.25\""] }
] } ] } } }
```

Verified on `.../shoulder-bags/saint-laurent-quilted-niki-vrc6q` and
`.../satchels/prada-bucket-bag-tp8sr` (both read straight out of raw HTML, not via LLM extraction).

**The 403 is real and total.** `curl` returns `server: Varnish`, `title: Access to this page has been
denied`, `_pxAppId: PXev56mY37`. Firecrawl's ordinary proxy got through every time — `stealth` was
never needed.

**TRR JSON-LD does NOT carry measurements.** The `application/ld+json` `Product` block has name,
images, description, brand, offer — no dimensions. This matters because `trr-jsonld.ts` already parses
that block; extending it will not get us dimensions. The data is only in `__NEXT_DATA__`.

**The Apify actor does not carry them either.** `apify-trr-refresh.ts` runs
`lulzasaur/therealreal-scraper` over category pages; `trr-apify.ts`'s record shape is
`{brand, title, price, originalPrice, msrp, size, condition, color, material, availability, sku, url}`.
`size` is a size *label*. No measurement field. TRR dimensions need a per-product-page fetch.

---

### The axis mapping — the thing that killed the last attempt

The two sites use the **same word for different axes**. Verified on the same model, Speedy 25:

| | Fashionphile | TheRealReal | LV published spec |
|---|---|---|---|
| Side-to-side | `Base length` 10" | `Width` 10.25" | 25 cm = 9.8" |
| Top-to-bottom | `Height` 8" | `Height` 7" | 19 cm = 7.5" |
| Front-to-back | **`Width` 6"** | **`Depth` 5.75"** | 15 cm = 5.9" |

**Fashionphile `Width` is TheRealReal `Depth`.** Read Fashionphile's `Width` as our `dimensions_w_cm`
and every bag in the catalogue gets a depth written into its width. That is the exact class of error
the myGemma revert was about, and it is now pinned down rather than assumed.

Canonical mapping into `0065_variant_dimensions.sql`:

| Our column | Fashionphile label | TRR `type` |
|---|---|---|
| `dimensions_w_cm` | `Base length` \| `Length` | `width` |
| `dimensions_h_cm` | `Height` | `height` |
| `dimensions_d_cm` | `Width` | `depth` |
| `strap_drop_cm` | `Drop` (larger of two — inferred) | `shoulder-strap-drop` |
| handle drop | `Drop` (smaller of two — inferred) | `handle-drop` |

All values × 2.54 → cm. Both sites are inches-only, so the unit-inference rule in
`parseMeasurements` is not exercised at all on this path.

---

## B) Extraction recipes

### Fashionphile

Plain `fetch` with a browser UA. **No new fetch is needed** —
`supabase/ingest/grade-condition-fashionphile.ts` already GETs this exact HTML for every
Fashionphile row (`fetchHtml`, daily via `.github/workflows/fashionphile-enrich.yml`). Add one parse
to the response already in hand.

```ts
// Pick the metafield span that looks like measurements; ignore the condition span,
// which uses the same class. Do NOT anchor on the accordion id — it is randomised
// per render (Details-collapsible_tab_jYVpDU-template--24380755706159__main).
const AXIS = /^(Base length|Length|Height|Width|Depth|Drop)\s*:/;

function parseFpSize(html: string) {
  const spans = [...html.matchAll(
    /class="metafield-multi_line_text_field"[^>]*>([\s\S]*?)<\/span>/g,
  )].map((m) => m[1]);
  const block = spans.find((s) => AXIS.test(s.trim()));
  if (!block) return null;
  const rows = block.split(/<br\s*\/?>/).map((r) => r.trim()).filter(Boolean);
  // "Drop: 12 (0.00) in" -> label "Drop", 12
  return rows
    .map((r) => /^([A-Za-z ]+):\s*(\d+(?:\.\d+)?)(?:\s*\([\d.]+\))?\s*in$/.exec(r))
    .filter(Boolean);
}
```

Brittleness: **low-to-medium.** `metafield-multi_line_text_field` is a Shopify platform class, not a
build hash, so it survives theme edits. The real risk is Fashionphile re-platforming again — they
moved to Shopify recently. A coverage-rate alarm (below) catches that within a day.

### TheRealReal

Firecrawl `rawHtml`, then the JSON path. Do not use CSS selectors; they are emotion hashes.

```ts
const nd = JSON.parse(
  /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)![1],
);
const rows = (nd.props.pageProps.product.components ?? [])
  .flatMap((c: any) => c.attributes ?? [])
  .filter((a: any) => a.measurement === true)
  .map((a: any) => ({ axis: a.type, inches: parseFloat(a.values[0]) }));
// axis ∈ 'width' | 'height' | 'depth' | 'shoulder-strap-drop' | 'handle-drop'
```

Brittleness: **low for the JSON path, high for anything else.** `type` is a stable machine key and
`measurement: true` is an explicit flag — this is about as good as scraped data gets. The one
structural risk is TRR migrating off the Next.js pages router, which would remove `__NEXT_DATA__`
entirely; guard with a text fallback anchored on the literal string
`Estimated item measurements`, which appears in the rendered HTML too.

---

## C) Coverage

| | Sample | Has H/W/D | Has a drop |
|---|---|---|---|
| Fashionphile | 30 random live listings of 400 recent | **30/30 (100%)** | 29/30 |
| TheRealReal | 16 live listings across all 7 handbag categories + men's bags | **16/16 (100%)** | 15/16 |

Both samples were drawn from our own `price_history` rows, so they represent the listings we
actually ingest, not a curated set. The single FP miss on drop was a hobo *charm*; the single TRR
miss was a Speedy 30 that carried H/W/D but no drop rows at all.

Coverage of the three exterior axes is effectively total on both sites. Treat the practical ceiling
as **>95%** rather than 100% — 30 and 16 are small samples and neither can distinguish 100% from 96%.

For sizing the work: our DB currently holds ~591 unique live TRR handbag URLs.

---

## D) Recommendation

**Build it — but in two tiers, and do not write a single listing's numbers straight to `variant`.**

### Tier 1 — Fashionphile. Ship it. The cost is zero.

`fashionphile-enrich.yml` already fetches every one of these pages daily by plain GET for condition
grading. The dimension parse is a regex over a string we already have in memory. **No new HTTP
requests, no Firecrawl credits, no Apify spend, no new secret.** 100% coverage, explicit labels, and
the FP-`Width`-means-depth trap is now documented above.

There is no cost/brittleness tradeoff to weigh here. The only reason not to do it is the data-quality
caveat below, which applies equally to any source.

### Tier 2 — TheRealReal. Worth it, but it is real spend.

TRR is the only source that **distinguishes handle drop from strap drop** (`handle-drop` vs
`shoulder-strap-drop`). Per the 0065 migration comment, drop is *"the most-argued spec in the research
and answered authoritatively nowhere."* Fashionphile labels both rows `Drop` and leaves us inferring
which is which from magnitude. TRR removes that inference. That is the specific reason to pay.

Cost: neither existing TRR path carries the data, so this is a **new per-product-page fetch**.
Roughly 600 Firecrawl credits for a one-time backfill of our live TRR rows, then only new listings in
steady state. Bound it with `--limit` chunks like the FP grader already does.

Sequencing: **do Tier 1 first and leave Tier 2 until the FP data has been audited in production.**
If FP alone closes the drop question well enough via the magnitude rule, Tier 2 becomes optional.

### The gate on `DIMENSIONS_TRUSTED` — do not just flip it

`694a2ac` reverted 285 rows because a source was unreliable *in order and in meaning*. Both problems
are solved here: order is irrelevant (every axis is labelled) and meaning is pinned (the mapping table
above, verified against a published house spec). But a third problem is not solved, and it is the
honest reason to keep the guard rails on:

**These are measurements of one used bag, not the house spec.** Same model, Speedy 30:
Fashionphile says `Height 8.25"`, TheRealReal says `Height 10.75"`. Two and a half inches apart on the
same bag, because one measured a slumped canvas bag and one measured a stood-up one. TRR labels its
own numbers **"Estimated item measurements"** and we should not launder that hedge away.

And genuine garbage exists at source: `.../satchels/prada-bucket-bag-tp8sr` publishes
`Depth 0.25"` on a bucket bag. Confirmed in TRR's own `__NEXT_DATA__` — that is what TRR says, not an
extraction error. A single-listing write would put a quarter-inch-deep bucket bag on a bag page.

So the promotion rule should mirror the consensus discipline that already protects `closure`:

1. Require **≥2 distinct listings** of the same variant before writing a dimension.
2. Require them to **agree within a tolerance** (±1 cm or ±10%, whichever is larger); disagreement
   beyond that writes nothing rather than picking a winner.
3. Write the **median**, not the first value seen.
4. Keep the existing sanity checks from the hardened parser (depth is the smallest axis; reject a
   large first figure beside small ones).
5. Add a **coverage-rate alarm** to the data-health scorecard: if the share of fetched FP pages
   yielding a `Size` block drops below ~90%, the site changed and the parser is stale. Same for the
   share of TRR pages yielding `measurement: true` attributes.

Under those rules coverage will be thinner than 100% and that is correct — it stays honest, per the
locked catalog rule that an unsourced dimension stays null and is never estimated.

### What I would not do

- **Do not parse Fashionphile positionally.** 2 of 30 pages came back in a non-canonical order.
- **Do not use CSS selectors on TheRealReal.** `css-ni3zxn` is a build hash and will rot.
- **Do not extend `trr-jsonld.ts` for this.** JSON-LD does not contain the measurements.
- **Do not expect the Apify TRR actor to deliver them.** Its record has no measurement field.
- **Do not reach for Chrome MCP or stealth proxies.** Firecrawl's ordinary proxy cleared PerimeterX
  on all 16 attempts.

---

## URLs actually fetched

**Fashionphile (30, plain curl, all HTTP 200, all yielded a labelled Size block).** Sample:
`louis-vuitton-monogram-speedy-25-1803667`, `hermes-epsom-mini-kelly-sellier-20-etoupe-1794345`,
`chanel-caviar-quilted-wallet-on-chain-woc-black-1873056`,
`celine-drummed-calfskin-micro-luggage-black-1786753`,
`bottega-veneta-nappa-maxi-intrecciato-medium-arco-tote-*`,
`fendi-vitello-grace-matte-nano-fendigraphy-hobo-charm-*`,
`louis-vuitton-monogram-roses-speedy-30-1827325`, `hermes-epsom-constance-24-gold-1796669`,
`chanel-aged-calfskin-quilted-255-reissue-225-flap-black-*`, `louis-vuitton-epi-saumur-bb-cognac-1728572`
(+20 more, all `https://www.fashionphile.com/products/<handle>`).

**TheRealReal (16, Firecrawl; plain curl 403s).** All under `https://www.therealreal.com/products/`:
`women/handbags/shoulder-bags/celine-leather-classic-medium-vq119`,
`women/handbags/shoulder-bags/saint-laurent-quilted-niki-vrc6q`,
`men/bags/messenger-bags/louis-vuitton-damier-ebene-naviglio-vq7kq`,
`women/handbags/clutches/louis-vuitton-lv-monogram-pochette-orsay-vn4ue`,
`women/handbags/crossbody-bags/chloe-embossed-leather-crossbody-bag-vsn4t`,
`women/handbags/mini-bags/louis-vuitton-lv-monogram-boite-chapeaux-vnems`,
`women/handbags/satchels/prada-bucket-bag-tp8sr`,
`women/handbags/shoulder-bags/jacquemus-suede-le-bambino-long-vftwa`,
`women/handbags/totes/saint-laurent-raffia-tote-vroph`,
`women/handbags/satchels/gucci-gg-supreme-boston-small-2025-vr6xg`,
`women/handbags/shoulder-bags/balenciaga-leather-shoulder-bag-venkb`,
`women/handbags/clutches/gucci-gg-signature-crossbody-bag-vsdvt`,
`women/handbags/satchels/louis-vuitton-lv-monogram-reporter-gm-u4jl9`,
`women/handbags/mini-bags/coach-leather-crossbody-bag-vt0lr`,
`women/handbags/satchels/louis-vuitton-coated-canvas-speedy-25-sy2b7`,
`women/handbags/totes/louis-vuitton-damier-azur-speedy-30-uhd1v`.

Two TRR pages (`saint-laurent-quilted-niki-vrc6q`, `prada-bucket-bag-tp8sr`) were read directly from
`__NEXT_DATA__` in raw HTML to confirm the structured-extraction results were faithful. They were,
value for value.
