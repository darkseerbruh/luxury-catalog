# Chrome `.com` color capture — current official colors, 9 houses (2026-06-28)

These are **house-published, current-assortment color names** captured directly from each
house's own US website via the owner's logged-in Chrome browser on **2026-06-28**. The
brands' `.com` grids Akamai-block Firecrawl, so this is the browser path.

**Confidence: high** for every name here — it is the house's own published label, dated
today. Each color is the official name as shown either in the site's Colour filter facet,
on the product tile (`<Color> <Model>`), or in the product-URL slug (the cleanest source:
e.g. `mini-andiamo-fondant` proves "Fondant" is BV's own name).

**Scope honesty:** the brand PLPs lazy-load / virtualize / paginate, so a single pass
captures the colors on the **first page(s) of the current assortment**, not the entire
historic palette. This is a current-snapshot confirmation layer, not the full season
archive. Names not seen here are simply "not captured this pass," never "doesn't exist."
No color was invented; only names actually rendered on the site are logged. Where a site
bot-blocked or region-gated even in-browser, its section says so.

Companion normalized rows: `chrome-com-colors-2026.jsonl`.

---

## Bottega Veneta — bottegaveneta.com/en-us/women/bags

Source: https://www.bottegaveneta.com/en-us/women/bags · captured 2026-06-28 (Chrome)

BV's **Colour filter facet is family-only** (Beige, Black, Blue, Bordeaux, Brown, Green,
Grey, Orange, Pink, Purple, Red, White, Yellow — broad buckets, not house names). The
granular **official** color names live on the product tiles and, most cleanly, in the
**product-URL slug** (`small-barbara-tote-travertine-...html`, `mini-andiamo-fondant-...html`).
The PLP loads only ~16 products per pass, so this is a partial current snapshot.

| Official color (BV name) | Seen on | Source |
|---|---|---|
| Black | tile + slug (multiple models) | bottegaveneta.com PLP |
| Mineral | Madison, Barbara Tote tiles + slug | bottegaveneta.com PLP |
| Espresso | Madison, Barbara Tote tiles + slug | bottegaveneta.com PLP |
| Natural Espresso | Barbara Tote slug | bottegaveneta.com PLP |
| Ecru | Madison tile + slug | bottegaveneta.com PLP |
| Travertine | Small Barbara Tote tile + slug | bottegaveneta.com PLP |
| Deep Mahogany | Barbara Tote tile + slug | bottegaveneta.com PLP |
| Butter Yellow | Barbara Tote tile + slug | bottegaveneta.com PLP |
| Dark Olive | Maxi Barbara Tote tile + slug | bottegaveneta.com PLP |
| Gray Clay | Large Barbara Tote tile + slug | bottegaveneta.com PLP |
| Fondant | Mini Andiamo slug (`mini-andiamo-fondant`) | bottegaveneta.com PLP |
| Natural Green (tweed) | Knot Lock slug | bottegaveneta.com PLP |

**Confirms-as-official from the 49 reseller-descriptive BV colors** (previously logged
`descriptive` in `bottega-veneta.md`, now house-confirmed):
- **Travertine** — was reseller-descriptive; now confirmed BV official (Small Barbara Tote).
- **Fondant** — was reseller-descriptive (the big one in the trend chatter, "Sardine in
  fondant"); now confirmed BV official (Mini Andiamo slug).

New official colors captured that were NOT in the 49-color descriptive list (so these are
net-new confirmed BV names): Mineral, Espresso, Natural Espresso, Ecru, Deep Mahogany,
Butter Yellow, Dark Olive, Gray Clay, Natural Green. Black is generic.

Note: BV rotates colors fast and the PLP caps at one page; Porridge, Barolo, Parakeet etc.
were not on the current first page this pass (not disproven, just not in this snapshot).

---

## Celine — celine.com/en-us/women/handbags

Sources (captured 2026-06-28, Chrome):
- https://www.celine.com/en-us/women/handbags/ (note: `/celine-women/bags/` 404s; the live
  path is `/women/handbags/`)
- https://www.celine.com/en-us/women/handbags/triomphe/

Celine puts the **official color name on the product tile after a semicolon** (`...; MIEL`,
`...; SYRAH`) and in the SKU. Clean, high-confidence. PLP caps ~8-16 tiles per pass, so this
is the current-arrivals subset across two listings.

| Official color (Celine name) | Seen on (line) | Source |
|---|---|---|
| Black | multiple | celine.com PLP |
| Miel | Small Square Cabas, Triomphe canvas | celine.com PLP |
| Rice | Small Hobo (smooth calfskin) | celine.com PLP |
| Syrah | handbags PLP | celine.com PLP |
| Tan | Luggage, Triomphe | celine.com PLP |
| Multicolor | Large Hobo (silk + calfskin) | celine.com PLP |
| White Cotton | handbags PLP | celine.com PLP |
| Bronze | Triomphe | celine.com Triomphe PLP |
| Safari | Triomphe | celine.com Triomphe PLP |
| Navy / Red | Triomphe (two-tone) | celine.com Triomphe PLP |
| Black / Ultra Blue | Triomphe (two-tone) | celine.com Triomphe PLP |
| Red / Off White | Triomphe (two-tone) | celine.com Triomphe PLP |

Reads cleanly. Miel ("honey"), Syrah, Safari, Bronze are Celine's own warm-neutral lexicon.
Two-tone canvas colorways are named as a pair (e.g. "Navy / Red").

---

## Louis Vuitton — us.louisvuitton.com (PARTIAL — site throttles, see note)

Source: https://us.louisvuitton.com/eng-us/women/handbags/all-handbags/_/N-tfr7qdp and
individual product pages · captured 2026-06-28 (Chrome).

**Workaround needed:** LV silently Akamai-blocks deep links (blank white page) on a cold
load. The fix that worked: load `/eng-us/homepage` first to seed the bot cookie, then
navigate to the all-handbags listing. The valid all-handbags facet code this run is
`N-tfr7qdp` (the older `N-1cb1l5j` 404s). The cookie banner re-appears on every navigation
and "Reject All" does not persist across nav in this session.

**LV does not expose color on the PLP** (tiles carry only the model name; no color data
attribute). LV's official color name lives **only on the product page**, in the
accessibility tree as a "Colors selector list" of `listitem`s. So `find`/`read_page` on a
product page reads LV's color names cleanly, but it is **one product at a time** — too slow
to sweep the whole assortment in one pass. This is therefore a confirmed-sample, not a full
LV palette.

| Official LV color | Line / material | Model(s) confirmed | Source |
|---|---|---|---|
| Ocean Blue | Epi leather | Alma BB, Speedy Soft 30 | us.louisvuitton.com product page a11y |
| Rose Miami | Epi leather | Alma BB, Speedy Soft 30 | us.louisvuitton.com product page a11y |
| Orange California | Epi leather | Alma BB | us.louisvuitton.com product page a11y |

Read: these are the **current Epi colorway names** (the bright-leather line). "Rose Miami,"
"Ocean Blue," "Orange California" are place-evocative LV seasonal names sitting on the Epi
texture, confirmed across two models. Monogram/Empreinte/Damier products tend to be single
colorway (e.g. Alma BB Empreinte = Black only this pass). To extend LV, the next run should
read the Colors-selector a11y list on Capucines / Coussin / OnTheGo Empreinte product pages
(the lines that carry LV's richest seasonal color names), one product at a time.

---

## Dior — dior.com/en_us/fashion/womens-fashion/bags/all-the-bags

Source: https://www.dior.com/en_us/fashion/womens-fashion/bags/all-the-bags · captured
2026-06-28 (Chrome). **Workaround:** load `dior.com/en_us` first to seed the bot cookie
(deep link cold-loads blank), dismiss the cookie banner with "Close" (rejects non-essential),
then navigate to all-the-bags. The "/all-bags" path redirects to "/all-the-bags".

**Important correction to the prior archive note:** Dior **does** name its seasonal colors.
Earlier notes (in `bottega-veneta.md`'s cross-house section) put Dior in the "doesn't name
its colors" camp. This Chrome pass disproves that — Dior tiles carry full official color
names: `Rose Tendre`, `Garance Red`, `Gris Flanelle`, `Craie`, `Trench`, etc. Dior belongs
with the houses that name colors, not Chanel's unnamed-seasonal camp. **Flag for the
copywriter / cross-house content idea: the "who names their colors" map needs Dior moved.**

Dior tiles render as `<Size> <Model> <Color> <Material> $price`, so the color is the phrase
between model and material (`...Médaillon Flap Bag Rose Tendre Grained Calfskin`). PLP is a
very long lazy-load (~64,000px); this is the first ~33 tiles.

| Official Dior color | Seen on (model / material) | Source |
|---|---|---|
| Rose Tendre | Small Dior Médaillon Flap, grained calfskin | dior.com PLP |
| Garance Red | Médaillon Bucket, Saddle, grained calfskin | dior.com PLP |
| Gris Flanelle | Dior Toujours Vertical Tote, macrocannage calfskin | dior.com PLP |
| Craie | Dior Toujours, macrocannage calfskin | dior.com PLP |
| Trench | Médaillon Flap / Bucket, grained calfskin | dior.com PLP |
| Khaki | Médaillon Bucket, grained calfskin | dior.com PLP |
| Powder Beige | Dior bags, grained calfskin | dior.com PLP |
| Marron (Bobby) | Saddle two-tone (Trench + Marron) | dior.com PLP |
| Beige | multiple | dior.com PLP |
| Black | multiple | dior.com PLP |
| Blue (Dior Oblique) | jacquard pieces | dior.com PLP |

Note: "Trench" and "Craie" (chalk) and "Gris Flanelle" (flannel grey) and "Garance" (madder
red) are Dior's house neutral lexicon, reused season to season. Two-tone Saddles are named
as a pair ("Trench and Marron"). This is a partial top-of-grid snapshot of a very long PLP.

---

## Gucci — gucci.com/us/en/ca/women/handbags (CONFIRMS: Gucci does NOT name colors)

Source: https://www.gucci.com/us/en/ca/women/handbags-c-women-handbags + product pages ·
captured 2026-06-28 (Chrome). Loaded cleanly without a homepage-seed workaround.

**This pass confirms the existing `gucci.md` finding:** Gucci does **not** give its colors
house names. Every signal is a plain descriptor:
- **Color filter facet = family buckets only:** Beige, Black, Blue, Brown, Gold, Green,
  Grey, Pink, Red, Silver, White, Yellow.
- **Product pages label the variant descriptively + material, never a color name:** e.g.
  "Variation: black GG leather", "sand and brown GG canvas". The page's only "Color: Gold"
  is hardware, not a colorway name.

So there is **no Gucci named-color lexicon to capture** — that is itself the (negative)
finding, and it is high-confidence house-published. Gucci sits with Chanel-seasonal and
opposite Hermès/BV/Celine/Dior. Gucci's identifiers are the **model name + material/canvas**
(GG Supreme, GG canvas, GG leather), which is the layer worth archiving for Gucci, not color.

| "Color" as Gucci states it | Type | Source |
|---|---|---|
| black GG leather | descriptor + material (not a named color) | gucci.com product page |
| sand and brown GG canvas | descriptor + material (not a named color) | gucci.com product page |
| Beige / Black / Blue / Brown / Green / Grey / Pink / Red / White / Yellow | filter families only | gucci.com filter |

No color names invented or implied; the absence of a named-color layer is the captured fact.

---

## Saint Laurent (YSL) — ysl.com/en-us/shop-women/handbags

Source: https://www.ysl.com/en-us/shop-women/handbags + product pages · captured 2026-06-28
(Chrome). **Workaround:** same as LV/Dior — load `ysl.com/en-us` homepage first (deep link
cold-loads blank), confirm cookie choices (non-essential off), then navigate to handbags.

**YSL names its colors — but hides the name behind a generic in the title/filter.** The PLP
tile and the page `<title>` only give a family word ("Brown", "Bordeaux", "Black"). The real
house color name renders **on the product page, as the caps token right after the price**
(e.g. `$3,450 / SANTAL`). So YSL is a name-its-colors house; you just have to read the PDP,
not the title. Color names are client-rendered (not in static HTML), so this is one product
at a time.

| Official YSL color | Generic family (title/filter) | Model confirmed | Source |
|---|---|---|---|
| Santal | Brown | Mombasa Small (leather) | ysl.com PDP (post-price token) |
| Rouge Cabernet | Bordeaux | Mombasa Medium (leather) | ysl.com PDP (post-price token) |
| Dark Oak | Brown | Mombasa Medium (vintage leather) | ysl.com PDP (post-price token) |
| (Black) | Black | Mombasa | ysl.com PDP |

Read: "Santal" (sandalwood), "Rouge Cabernet", "Dark Oak" are YSL's own warm lexicon, sitting
under family buckets in the filter. This is a small confirmed sample (Mombasa line) proving
the naming pattern; the full YSL palette would need a per-PDP sweep. Cross-references the
existing `saint-laurent.md` model archive.

---

## Fendi — fendi.com/us-en/woman/bags (descriptive colors, like Gucci)

Source: https://www.fendi.com/us-en/woman/bags + product pages · captured 2026-06-28 (Chrome).
**Workaround:** load `fendi.com/us-en/` homepage first to seed the cookie, then navigate to
bags; on the bags page click "Reject all cookies" to clear the dialog over the grid.

**Fendi does NOT use poetic house color names** — it labels colors with plain family
descriptors, same camp as Gucci:
- **Colour filter = families only:** Beige, Black, Blue, Brown, Gray, Green, Orange, Pink,
  Purple, Red, White, Yellow ("Refine by Colour: ...").
- **Product titles/slugs use descriptive color + material:** "Fendigraphy Mini - Light blue",
  `...light-blue-ff-denim...`, `...hazelnut-...-raffia...`, `...multicolor...`. "Hazelnut" and
  "Light blue" are descriptive, not a coded seasonal lexicon.

So there is **no Fendi named-color lexicon to capture** (the negative finding). Fendi's
archive value is the **model + material** layer (Peekaboo, Baguette, Mamma Baguette, By The
Way, Fendigraphy, Origami; FF denim, raffia-effect, selleria leather), not color.

| "Color" as Fendi states it | Type | Source |
|---|---|---|
| Light blue (FF denim) | descriptor + material | fendi.com PDP title |
| Hazelnut (raffia-effect) | descriptor + material | fendi.com slug |
| Multicolor | descriptor | fendi.com filter/slug |
| Beige / Black / Blue / Brown / Gray / Green / Orange / Pink / Purple / Red / White / Yellow | filter families only | fendi.com filter |

No color names invented; the absence of a poetic named-color layer is the captured fact.

---

## Prada — prada.com/us/en/womens/bags (named colors + a stable F-code system)

Source: https://www.prada.com/us/en/womens/bags/shoulder-bags/c/10066US + product pages ·
captured 2026-06-28 (Chrome). **Workaround:** the bags category code in the brief (`10049US`)
redirects to `/womens.html`; the live shoulder-bags code is `10066US`. Reject cookies on the
landing page ("Reject all"); the notice re-appears per navigation.

**Prada names its colors in specific English, and maps each to a stable F-code in the SKU.**
The filter is family-only (Black, Blue, Brown, Green, Grey, Neutral, Pink, Red, White,
Yellow), but the **product title carries the real colorway name** ("Baltic Blue", "Camel
Brown", "Cord/Brandy"). The SKU's `F####` segment is the color code and it is **consistent
across models** (e.g. `F0002` = Black on both the Route bag and the Route mini-bucket;
`F0134` = Brandy). This is exactly the **Prada color-code decoder** content idea already in
`content-ideas.md` — confirmed live: the F-code is a house color index.

| Official Prada color | Color code (F-seg) | Model / material | Source |
|---|---|---|---|
| Black | F0002 | Route (leather), Route mini-bucket | prada.com PDP title + SKU |
| Camel Brown | F0040 | Mariner Large (Re-Nylon) | prada.com PDP title + SKU |
| Baltic Blue | F0216 | Mariner Large (Re-Nylon) | prada.com PDP title + SKU |
| Brandy | F0134 | Mariner Small (Re-Nylon) | prada.com PDP title + SKU |
| Cord / Brandy | F041I | Noué Medium (cotton macramé, two-tone) | prada.com PDP title + SKU |

Read: Prada is its own camp — colors are **named but descriptive-specific** (not poetic like
Hermès, not bare families like Gucci) AND **code-keyed**. The F-code stability is the
archival win: it lets you map a color name to a code that survives across seasons and models.
Next run can build the full F-code -> color-name table by sweeping more SKUs.

---

## Loewe — loewe.com/usa/en/women/bags (names its colors; code-keyed in the SKU)

Source: https://www.loewe.com/usa/en/women/bags + product pages · captured 2026-06-28
(Chrome). Loaded directly, **no workaround needed** (Loewe did not bot-block in-browser).

**Loewe names its colors poetically and code-keys them.** The PDP `<title>` genericizes to a
family ("Brown", "Yellow"), but the product page shows the real name under a "Colour" label
and in the **swatch a11y list** ("Color swatch options selector list"), which reads cleanly
via `find`/`read_page`. The SKU's trailing 4 digits are the color code (e.g. `-8240` = Lemon,
`-4927` = Squirrel), consistent across models.

| Official Loewe color | Color code (SKU tail) | Model confirmed | Source |
|---|---|---|---|
| Squirrel | 4927 | Medium Scarf bag (smooth calfskin) | loewe.com PDP "Colour" + swatch a11y |
| Soft White | (1100/0018 family) | Scarf bag, Featherlight Puzzle | loewe.com swatch a11y |
| Black | — | Medium Scarf bag | loewe.com swatch a11y |
| Lemon | 8240 | Small Featherlight Puzzle (nappa) | loewe.com PDP + swatch a11y |
| Dark Chestnut | — | Small Featherlight Puzzle | loewe.com swatch a11y |

Read: "Squirrel," "Dark Chestnut," "Soft White," "Lemon" are Loewe's own descriptive-poetic
names, code-keyed like Prada. Loewe sits in the "names its colors" camp (Hermès / BV /
Celine / Dior / YSL / Prada / Loewe), opposite Gucci and Fendi. Small confirmed sample
(Scarf + Puzzle); the swatch-a11y method makes a fuller Loewe sweep straightforward next run.

---

## Summary — the "who names their colors" map, corrected this run

A house-published, dated-today read of the naming question that runs through the whole
archive. **Captured fact, not opinion:**

| House | Names its colors? | How it surfaces | Note |
|---|---|---|---|
| Bottega Veneta | **Yes** | tile + URL slug | Travertine, Fondant confirmed official |
| Celine | **Yes** | tile (after `;`) + SKU | Miel, Syrah, Safari, Bronze |
| Louis Vuitton | **Yes** | PDP a11y "Colors selector" | Rose Miami, Ocean Blue (Epi line) |
| Dior | **Yes (correction)** | tile (model→color→material) | Rose Tendre, Garance, Craie, Gris Flanelle |
| Saint Laurent | **Yes** | PDP post-price token | Santal, Rouge Cabernet, Dark Oak |
| Prada | **Yes, + F-code** | PDP title + SKU F-code | Baltic Blue, Camel Brown; code-keyed |
| Loewe | **Yes, + code** | PDP "Colour" + swatch a11y | Squirrel, Lemon, Dark Chestnut; code-keyed |
| Gucci | **No** | descriptor + material only | "black GG leather"; families only |
| Fendi | **No** | descriptor + material only | "Light blue"; families only |

**Biggest correction:** Dior names its colors (Rose Tendre, Garance Red, Gris Flanelle,
Craie). The prior cross-house note in `bottega-veneta.md` that put Dior in the "doesn't name
colors" camp is wrong and should be revised. Gucci and Fendi are the genuine no-name camp.

**Method note for next run:** the cleanest sources by house — BV/Celine: product slug/tile;
Dior: tile; LV/Loewe: PDP color-selector a11y list; YSL: PDP post-price token; Prada:
PDP title + SKU F-code. Avoid the family-only color *filter* facets (BV, Gucci, Fendi,
Prada, LV all bucket to families) — they are not the house lexicon.
