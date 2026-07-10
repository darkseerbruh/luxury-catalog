# Dictionary-gap report — 2026-07-10

**What this is:** the handbag models that show up over and over in our banked listings but
have no page yet, because the model dictionary (`src/lib/ingest/model-normalize.ts`) doesn't
recognise them. Adding a recognised model is what lets those banked listings become real
catalog pages. **This report only names candidates — it changes nothing.** Adding a model is your call.

## The 5 worth adding first

| Model | Why it's the top pick |
|---|---|
| **Saint Laurent Cassandre** | 17 listings, 3 sellers, a core current YSL line we're missing entirely. |
| **Chanel Chocolate Bar** | 24 listings across all 3 sellers — the single most-seen missing model. |
| **Chanel Filigree** | 17 listings, 3 sellers — a real Chanel line (the Filigree vanity family). |
| **Gucci Joy** | 16 listings, 3 sellers — a recognisable Gucci tote line, none catalogued. |
| **Chanel Cambon** | 12 listings — an iconic early-2000s Chanel line buyers still search by name. |

Full ranked list of 25 below, then two cleanup notes (spelling variants to merge, and
descriptor words to *not* add).

## How this was built

- Read all **41,266** unpromoted `discovered_listing` rows (paged, dedup'd by `listing_ref`).
- Dropped rows we already recognise (a promotion backlog, not a gap) and accessories/apparel.
- Grouped the rest by house + the distinctive part of each title (material, size and colour
  words stripped), then ranked by how often it recurs, weighted up for higher-value houses.
- **Every candidate below is backed by real listing titles** (shown as evidence). Where the
  name might be a description rather than a true model, it's flagged LOW/MED — don't add those blind.
- Sources: FP = Fashionphile, TRR = TheRealReal, TLC = The Luxury Closet. Median = listed price.

## Top 25 candidate models

| # | House | Proposed model | Listings | Sources | Median | Real model? | Evidence (sample titles) |
|---|---|---|---|---|---|---|---|
| 1 | Chanel | Chocolate Bar | 24 | FP13, TRR8, TLC3 | $1,485 | **HIGH** — real horizontal-quilt line | "Small Chocolate Bar Tote", "Medium Chocolate Bar Flap", "East West Chocolate Bar Flap" |
| 2 | Saint Laurent | Cassandre | 17 | TRR15, TLC2 | $695 | **HIGH** — YSL Cassandre matelassé line | "Chevron Cassandre", "Patent Leather Cassandre", "Leather Cassandre 2025" |
| 3 | Chanel | Filigree | 17 | FP10, TLC6, TRR1 | $3,585 | **HIGH** — Filigree vanity family | "Filigree Backpack", "Filigree Waist Bag", "CC Filigree Clutch With Chain" |
| 4 | Gucci | Joy | 16 | TRR11, FP4, TLC1 | $410 | **HIGH** — Gucci Joy tote/messenger | "Monogram Joy Messenger", "GG Supreme Small Joy Tote", "Monogram Joy Messenger Black" |
| 5 | Chanel | Wavy CC | 16 | FP11, TLC4, TRR1 | $4,365 | **HIGH** — recent Wavy CC hobo | "Small Wavy CC Hobo Black", "Wavy CC Hobo Beige", "Small Wavy CC Hobo White" |
| 6 | Chanel | Coco Preppy | 16 | FP16 | $5,850 | **HIGH** — 2024 Coco Preppy line | "Mini Preppy Coco Shoulder Bag Light Blue" (×16, colour variants) |
| 7 | Chanel | Bowling | 16 | TLC7, FP7, TRR2 | $5,660 | **HIGH** — Chanel Bowling Bag | "Chain Bowling Bag", "Beige Leather Bowling Bag", "Mini Bowling Bag Black" |
| 8 | Saint Laurent | Cabas (Y Cabas) | 17 | TRR11, FP6 | $556 | **HIGH** — YSL Cabas / Y-line tote | "Y Cabas Medium", "Small Classic Y Cabas Black", "Small Classic Y Cabas Red" |
| 9 | Chanel | Mademoiselle | 14 | TLC11, FP2, TRR1 | $3,754 | **HIGH** — vintage Mademoiselle lock | "Mademoiselle Flap Light Beige", "East West Mademoiselle Flap", "Mademoiselle Red Lambskin" |
| 10 | Chanel | Coco Cocoon | 13 | FP6, TLC5, TRR2 | $1,327 | **HIGH** — Coco Cocoon line | "Large Coco Cocoon Tote", "Small Coco Cocoon Tote Black", "Coco Cocoon Bowler Black" |
| 11 | Chanel | Wild Stitch | 13 | TLC8, FP4, TRR1 | $2,709 | **HIGH** — Wild Stitch line | "Wild Stitch Top Handle Bag", "Wild Stitch Large Flap", "Wild Stitch Large Top Handle Flap" |
| 12 | Chanel | Cambon | 12 | FP12 | $1,895 | **HIGH** — iconic Cambon line | "Large Cambon Tote", "Small Cambon Bowler", "Cambon Large Bowler" |
| 13 | Chanel | Archetype | 12 | FP12 | $8,995 | **HIGH** — 2024 Archetype shopping tote | "Archetype Small Shopping Tote Brown / Burgundy / Dark Burgundy" |
| 14 | Chanel | Funky Town | 11 | FP8, TLC3 | $5,030 | **HIGH** — Funky Town flap line | "Medium Funky Town Flap", "Large CC Funky Town Flap", "Mini Funky Town Flap Pink" |
| 15 | Chloé | Elsie | 11 | TLC11 | $584 | **HIGH** — Chloé Elsie | "Large Elsie Shoulder Bag", "Medium Elsie Chain Shoulder Bag", "Elsie Small Python" |
| 16 | Chanel | Paris-Biarritz | 10 | TRR8, TLC2 | $800 | **HIGH** — Paris-Biarritz line | "Large Paris-Biarritz Tote", "Paris-Biarritz Bowler", "Paris-Biarritz Hobo" |
| 17 | Dior | Lady 95.22 | 12 | TLC7, FP5 | $3,284 | **HIGH** — the 2022 Lady 95.22 (distinct from Lady Dior) | "Cannage Small The Lady 95.22 Beige / Black", "Lambskin Cannage The Lady 95.22" |
| 18 | Louis Vuitton | Melrose Avenue | 10 | TLC6, TRR3, FP1 | $1,046 | **HIGH** — Vernis Melrose Avenue | "Monogram Vernis Melrose Avenue" (×10) |
| 19 | Louis Vuitton | Pleaty | 9 | FP8, TLC1 | $2,465 | **HIGH** — Monogram Denim Pleaty | "Monogram Denim Mini Pleaty Blue / Fuchsia" |
| 20 | Louis Vuitton | Wilshire | 9 | TRR7, FP1, TLC1 | $540 | **HIGH** — Vernis Wilshire | "Vernis Wilshire PM Amarante", "Monogram Vernis Wilshire PM / MM" |
| 21 | Bottega Veneta | Nodini | 9 | TLC5, TRR4 | $790 | **HIGH** — BV Nodini crossbody | "Nodini Light Beige Intrecciato", "Nodini Dark Brown Intrecciato", "Nodini Metallic Grey" |
| 22 | Bottega Veneta | Roma | 8 | TLC6, TRR2 | $1,145 | **HIGH** — BV Roma | "Mesh Roma Bag", "Roma Burgundy Intrecciato Tote", "Red Leather Mesh Roma Bag" |
| 23 | Gucci | Deco | 8 | TLC8 | $1,390 | **HIGH** — 2023 Gucci Deco | "Deco Mini Shoulder Bag", "Deco Small Brown Quilted Shoulder Bag" |
| 24 | Celine | Camille | 8 | FP7, TLC1 | $2,995 | **HIGH** — Celine Camille 16 Soft | "Medium Camille 16 Soft Bag Tan / Black", "Small Camille 16 Soft Bag Black" |
| 25 | Dior | Honeycomb | 13 | TRR13 | $283 | **MED** — vintage Dior Honeycomb/Trotter; TRR-only, verify before adding | "Honeycomb Vintage", "Canvas Honeycomb Vintage" |

**Runners-up (real, lower volume):** Chanel Accordion (9), Chanel In Love / CC-heart (18, seasonal novelty),
Gucci Eclipse (8), LV Houston (8), LV Bellevue (8), LV Flower Tote (8), BV Point (7), Celine Clasp (8),
Prada Vela (9), Chanel Retro Twist / Chic Pearls / Twist Your Buttons (8 each, runway one-offs).

## Cleanup note 1 — spelling variants to MERGE, not add

These aren't new models — they're a seller's spelling of a model we already have. Map them as aliases:

- **Celine "Triumph" (13, TLC) → Triomphe.** TLC mis-renders Triomphe as "Triumph"; 13 listings are landing as unmatched purely on spelling.

## Cleanup note 2 — descriptor words to IGNORE (not models)

These clustered high but are **materials, prints, or shapes**, not model names. Don't add them:

- **Chanel "round" / "square" / "rectangular" (24 / 16 / 11):** these are *shapes of the Classic Flap*, not separate models — route to Classic Flap sizing instead.
- **Chanel "coco mark" (22, TLC):** Japanese-reseller shorthand for the CC logo, applied to many models.
- **Chanel "matelasse":** French/JP for "quilted" — a finish, not a model.
- **Gucci "Web" (31), "Guccissima" (11), Fendi "Zucca" (9), Prada "Vitello Daino" (13), BV "Nappa" (10), Dior "Oblique" (13) / "Cannage" (10), Saint Laurent "Grain de Poudre" (8):** these are canvas prints or leather types spanning many shapes, not single bags.
- **"MICHAEL Michael Kors" parsed as model "michael" (26):** a parse artifact of the diffusion-line name.

## Finding for the pipeline (not a dictionary gap)

**The Luxury Closet rows store a placeholder in `raw_name`** ("unmatched-model … captured for triage") and put the real title in `style_guess`. The matcher reads `raw_name`, so **every TLC row misses the dictionary even for models we already have** (Duma, Kelly, Timeless all surfaced here as false gaps until I also tested `style_guess`). Worth fixing in the TLC ingest so promotion can catch known models automatically. ~2,700 rows were recovered just by testing both fields.

---

*n = 41,266 unpromoted `discovered_listing` rows as of 2026-07-10. Counts are distinct listings
(dedup'd by `listing_ref`). Ranking = distinct-listing count × house-value weight. Read-only run:
no dictionary edit, no promotion, no migration. Sources present in the backlog: Fashionphile,
TheRealReal, The Luxury Closet (Redeluxe / Couture USA / Anns / MyGemma / eBay carried no ≥3-listing
unmatched clusters this pass).*
