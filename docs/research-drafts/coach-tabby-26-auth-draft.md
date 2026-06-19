# DRAFT — Coach Tabby 26 authentication & spec research (for review)

**Status:** Draft proposal. **Nothing here has been written to `supabase/seed/research/coach-tabby.json` yet.**
Review, correct, and approve before I apply it to the seed file.

**Date:** 2026-06-19 · **Method:** deep-research workflow (5 parallel search agents → verify → synthesize).

## ⚠️ Read this first — confidence is capped at "medium"

In this environment **`WebFetch` returned HTTP 403 on every retail/primary site** (coach.com, Macy's, Nordstrom, Dillard's, Amazon, StockX, SEC.gov, authentication blogs). Every value below was extracted from **search-engine result snippets** that quote those pages — not from rendered page bodies. Therefore:

- **No field reaches `verified`.** Best achievable confidence is `medium`.
- Each item lists its sources and any source conflicts.
- Anything not corroborated is marked **NOT FOUND → leave null** (per the brief's "never invent" rule).
- **Recommended before publishing:** one human open of coach.com `CH857` (leather) and `CI032` (canvas) to resolve the height/price/hardware conflicts and upgrade these to `verified`.

This draft targets the two fully-NULL sections (`production_records`, `known_color_combinations`) plus enrichment of `serial_tags` and `fits`, and flags one possible correction to an existing value.

---

## 1. `production_records` (currently NULL → propose adding)

Two records — one per existing variant (leather idx 0, Signature Canvas idx 1).

### Record for variant 0 — standard leather "Tabby Shoulder Bag 26"
| Field | Proposed value | Confidence | Notes / sources |
|---|---|---|---|
| `country_of_manufacture` | **null** | — | Coach makes the Tabby in several countries; cannot pin one per bag. Documented modern countries: **Vietnam, Cambodia, Philippines, India** (Tapestry FY2025 10-K), + China in FY2019/earlier. Country must be read off the individual creed; it is *not* an authenticity signal. Recorded in `known_authentication_markers` instead. |
| `dimensions_w_cm` | **26.04** (10¼″) | medium | Agrees across coach.com, Macy's, Nordstrom; corroborated by the "26" = ~26 cm naming convention. |
| `dimensions_d_cm` | **8.26** (3¼″) | medium | Agrees across all sources. |
| `dimensions_h_cm` | **null** | low | **CONFLICT:** coach.com says 6″ (15.24 cm); Macy's/Nordstrom say 5½″ (13.97 cm). Left null pending human check; conflict noted. |
| `opening_width_cm` | **null** | — | NOT FOUND. Closure is a snap; no opening dimension published. |
| `date_code_format` | "Modern Coach (post-2014) generally does **not** print a decodable month/year date code. The Tabby's interior creed carries a **style number**, not a date code — letter+digits (e.g. CH857) or legacy 5-digit numeric (e.g. 73995). Suffix letters after a hyphen: **F**=factory/outlet, **M**=Macy's, **N**=Nordstrom exclusive." | medium | curatedfindsco, shopgoodwill, essexfashionhouse, purseblog (snippets). |
| `stamp_placement` | "Style number stamped at the bottom of a **square leather creed patch**, stitched inside the **main interior compartment**. Unlike softer modern Coach styles (which moved the number to a sewn-in white fabric tag ~2014), the structured Tabby retains a stamped leather creed." | medium | poizon, legitique (Tabby-specific snippets). |
| `known_authentication_markers` | "Turn-lock 'C' engraving should be clean, thick, and deeply etched — shallow/messy = replica. Back of the C-closure is a heavy gold-tone plate held by real screws with an engraved hardware batch code partly tucked under the leather. Hardware should feel substantial (heft test); brassy gold tone. Stitching even and secure; creed must be **stitched, not glued**; font crisp and evenly spaced. **Known fake tell: a creed reading `CR652`** — that code belongs to the Coach Juliet, not the Tabby. Verified real Tabby 26 codes from coach.com URLs: CH857, CCC02, CP150, 73995, 76105 (colorblock), C0772 (Pillow Tabby 26). Documented countries of manufacture: Vietnam, Cambodia, Philippines, India (+China pre-2020); country alone does not authenticate." | medium | poizon, legitique, aliceelizabethluxury, coach.com URLs, Tapestry 10-K (all via snippets). |
| `confidence_level` | **medium** | | |
| `sources` | see source list at end | | |

### Record for variant 1 — "Tabby Shoulder Bag 26 in Signature Canvas" (CI032)
| Field | Proposed value | Confidence | Notes |
|---|---|---|---|
| `dimensions_h_cm` | **15.24** (6″) | medium | CI032 snippets were internally consistent at 10.25 / 6.0 / 3.25″ (no height conflict for the canvas SKU). |
| `dimensions_w_cm` | **26.04** (10¼″) | medium | |
| `dimensions_d_cm` | **8.26** (3¼″) | medium | |
| `country_of_manufacture` | **null** | — | Same as above. |
| `date_code_format` / `stamp_placement` / `known_authentication_markers` | same as leather record | medium | Same creed system. |
| `confidence_level` | **medium** | | |

---

## 2. `known_color_combinations` (currently NULL → propose adding)

All confirmed as **produced** via coach.com / StockX / retailer listings. **Interior lining color was never stated in any accessible source → `interior_color: null` for every row.** Hardware-tone-by-color is a plausible pattern (gold/brass with warm/neutral, silver with cool/fashion shades) but unconfirmed as a rule — *not* encoded as fact.

| exterior_color | material | hardware_color | produced | year_range | confidence | source / conflict |
|---|---|---|---|---|---|---|
| Chalk (cream) | polished pebble leather | gold-tone / brass | yes | ~2023–2026 | medium | StockX, AOL ("Brass/Chalk"), Macy's |
| Black | polished pebble leather | **disputed** | yes | current (CH857) | low–medium | eBay says gold; one summary says silver/nickel — **CONFLICT**, both may exist. |
| Signature coated canvas (khaki/brown) + leather trim | coated canvas | brass / gold-tone | yes | current (CI032) | medium | coach.com, Haute24, Dillard's |
| Aquamarine | leather | null (unstated) | yes | current | medium | Amazon listing |
| Bold Red / Red Apple | leather | brass / gold-tone | yes | current | medium | Amazon, StockX |
| Vivid Pink / Flower Pink | leather | silver-tone | yes | current | medium | StockX |
| Brass / Dark Stone | leather | gold-tone | yes | current | medium | StockX |
| Denim | leather | silver-tone | yes | current | medium | StockX |

---

## 3. `fits` (currently all 3 rows null → propose filling + adding)

Now source-backed from owner/reviewer reports (Emtalks, Ella Pretty Blog, BrandsShoppe, Aglaia, An Indigo Day, Amaboxly). `verified: false` (these are reviews, not first-party measurement).

| item_name | fits | confidence | source / note |
|---|---|---|---|
| iPhone (modern, 15/16 Pro/Pro Max) | **yes** | high | Emtalks, Ella Pretty Blog both carry a Pro Max. (Existing row currently null → set to yes.) |
| Compact wallet (and even a long wallet) | **yes** | high | BrandsShoppe ("large enough to fit a long wallet"), Aglaia. (New row.) |
| AirPods case | **yes** | medium | Emtalks. Conflict: a YouTube "what fits" implies AirPods+full load is the 36's territory — so yes alone, tight when combined. (New row.) |
| Sunglasses | **tight** | medium | Fits but "starts to get a little snug" with a full load (An Indigo Day, Emtalks, BrandsShoppe). (New row.) |
| Water bottle | **no** | low | Only one aggregated source ("not a tablet or water bottle", Amaboxly). Consistent with 8 cm depth. (New row.) |
| iPad Mini / tablet | **no** | low | Amaboxly "not a tablet"; iPad Mini not named specifically. (Existing row currently null → set to no, low confidence.) |
| Kindle Paperwhite | **null** | — | NOT FOUND — keep null (existing row). |

General capacity note (could go in a variant note): rigid, structured, internally divided — good for daily essentials, **not** a high-capacity bag.

---

## 4. `serial_tags` (enrich existing "creed stamp" row)

The existing row is solid; propose adding to `authentication_notes` / `how_to_read`: the Tabby keeps a **stamped leather creed inside the main compartment** (not the fabric-tag pattern of softer styles); the **`CR652` fake tell**; and the list of **verified real codes** (CH857, CCC02, CP150, 73995, 76105, C0772). Bump `confidence_level` to `medium` (Tabby-specific corroboration now exists).

---

## 5. Possible correction to an EXISTING value (needs your call)

- **Leather Tabby 26 `retail_price_original` is currently `475` USD.** Research found **$450** better corroborated (AOL editorial "Brass/Chalk … $450.00", Macy's, eBay NWT $450), with **$475** appearing in only one unverified summary. Quilted/Pillow variants run higher ($495–$575) and may be the source of the $475 figure.
  - **Proposed:** change to `450`, confidence medium, with a note; **or** leave `475` and flag for human verification on live coach.com. Your call — I didn't change it.

---

## Source URLs (all reached via WebSearch snippets; WebFetch 403 on every one)

**Coach official (style codes verified via URL/title):**
coach.com/products/tabby-shoulder-bag-26/CH857.html · /CCC02.html · /73995.html · /tabby-shoulder-bag-26-in-colorblock/76105.html · /tabby-shoulder-bag-26-with-pillow-quilting/CP150.html · /pillow-tabby-shoulder-bag-26/C0772.html · /tabby-shoulder-bag-26-in-signature-canvas/CI032.html

**Specs / retail:** macys.com (ID=17453857, ID=15668717, ID=18563896) · nordstrom.com/s/coach-tabby-26-leather-shoulder-bag/7313563 · dillards.com/p/.../515965734 · amazon.com/dp/B0DS6NDSPS, /dp/B0D14J9TSN · aol.com/articles/under-500-coach-bag-going-213200020.html · haute24.com/products/coach-tabby-shoulder-bag-26-in-signature-canvas-... · stockx.com (beadchain-chalk, flower-pink, brass-dark-stone, denim, red-apple)

**Manufacturing:** Tapestry FY2019/FY2024/FY2025 10-K (SEC, via snippets) · hisourcing.com/where-are-coach-bags-made · lasevgi.com · gionar.com

**Authentication:** poizon.com (coach-tabby-bag-26-legit-check, coach-tabby-26-legit-check, tabby-bag-coach-legit-check) · legitique.com/blogs/coach/how-to-authenticate-coach-tabby-guide · aliceelizabethluxury.com/blog/how-to-spot-a-fake-coach-tabby-25-pillow · curatedfindsco.com · blog.shopgoodwill.com · essexfashionhouse.com · lovetoknow.com · forum.purseblog.com

**Fits (reviews):** emtalks.co.uk/2024/04/coach-tabby-shoulder-bag-review-coach.html · ellaprettyblog.com/my-bag-review-coach-tabby-26 · brandsshoppe.com/coach-tabby-shoulder-bag-26-accurate-review · aglaiamagazine.com/coach-tabby-shoulder-bag-26-review · anindigoday.com/coach-pillow-tabby-bag-review · amaboxly.com/coach-tabby-bag-review-2026-...

---

## Open questions for you
1. **Apply this to `coach-tabby.json`?** (I'll only do so on your OK.)
2. **Leather price:** change `475` → `450`, or leave and flag?
3. **Height conflict (leather):** keep null, or accept coach.com's 6″ / Macy's 5½″?
4. **Do the same pass for the other 4 hero styles** (the Hermès/Chanel files have more lore to verify; the biggest remaining NULLs are Hermès Kelly `known_color_combinations` = 0 rows)?
