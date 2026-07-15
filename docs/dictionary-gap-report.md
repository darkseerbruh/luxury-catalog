# Dictionary-gap report — 2026-07-15

**What this is:** the handbag models that show up over and over in our banked listings but
have no page yet, because the model dictionary (`src/lib/ingest/model-normalize.ts`) doesn't
recognise them. Adding a recognised model is what turns those banked listings into real
catalog pages. **This report only names candidates — it changes nothing.** Adding a model is your call.

## The 5 worth adding first

| Model | Why it's the top pick |
|---|---|
| **Chanel Mademoiselle** | 100 listings, 3 sellers — the single biggest gap, the vintage Mademoiselle flap line. |
| **Chanel Cambon** | 79 listings, 3 sellers — iconic early-2000s line buyers search by name (repeat from last week). |
| **Chanel Bowling** | 75 listings, 3 sellers, ~$5,660 median — high-value Coco Beach / Preppy Coco bowling bags. |
| **Chanel Filigree** | 62 listings, 3 sellers — the Filigree family (repeat from last week; only the vanity variant is recognised today). |
| **Gucci Joy** | 51 listings, 3 sellers — the top non-Chanel add, a recognisable Gucci tote line (repeat from last week). |

Full ranked list of 25 below, then confidence flags and two cleanup notes.

## What changed since last week (2026-07-10)

- **The backlog more than doubled: ~41,300 → ~96,000 unpromoted listings.** More capture, more evidence, so counts are higher across the board.
- **None of last week's top picks have been added to the dictionary yet** (Chocolate Bar, Filigree, Joy, Cambon all still read as unrecognised). They resurface here, now with larger counts.
- **Saint Laurent Cassandre dropped off the ranked list.** It's still unrecognised, but this week its clean *bag* listings fell below the count floor — most current Cassandre rows are chain wallets (an accessory, filtered out). Worth keeping on the watch list, not promoting on this week's evidence alone.
- **The list is Chanel-heavy** because Chanel is a top-value house with the widest un-catalogued back catalogue. The best non-Chanel adds are **Gucci Joy, Bottega Veneta Nodini, Saint Laurent Y Cabas, Prada Vela**.

## Top 25 candidate models

Ranked by frequency × house value × source spread. Every row is backed by real listing titles.
Sources: FP = Fashionphile, TRR = TheRealReal, TLC = The Luxury Closet (+ eBay where it appears). Median = listed ask (fixed-price sellers, so ask ≈ realised).

| # | Brand | Candidate model | Rows | Sources | Where it's seen | Median ask | Evidence (sample listing titles) |
|---|---|---|---:|---:|---|---:|---|
| 1 | Chanel | Mademoiselle | 100 | 3 | TLC67, FP27, TRR6 | $3,349 | "Patent Quilted Small Just Mademoiselle Light Khaki"; "Caviar Quilted Mademoiselle Flap Bag Light Beige"; "Sheepskin Quilted Vintage Mademoiselle Flap Beige" |
| 2 | Chanel | Cambon | 79 | 3 | TLC48, FP27, TRR4 | $2,317 | "Calfskin Quilted Large Cambon Multipocket Reporter Black White"; "Calfskin Quilted Large Cambon Tote Black"; "Calfskin Quilted Small Cambon Multipocket Reporter Beige" |
| 3 | Chanel | Bowling | 75 | 3 | FP43, TLC29, TRR3 | $5,660 | "Nylon Striped Quilted Coco Beach Large Bowling Bag Black Coral"; "Shiny Caviar Preppy Coco Small Bowling Bag Light Blue"; "Shiny Caviar Preppy Coco Small Bowling Bag Light Pink" |
| 4 | Chanel | Filigree | 62 | 3 | FP33, TLC25, TRR4 | $2,938 | "Caviar Quilted Filigree Backpack Beige Black"; "Caviar Quilted Filigree Waist Bag Black"; "Caviar Quilted Round Filigree Crossbody Beige Black" |
| 5 | Chanel | Accordion | 55 | 3 | FP24, TLC22, TRR9 | $1,975 | "Calfskin Bubble Quilt Accordion Flap Red"; "Calfskin Quilted Istanbul Accordion Flap Black"; "Lambskin Quilted Accordion Shopping Tote Dark Pink" |
| 6 | Chanel | Chocolate Bar | 53 | 3 | FP30, TLC15, TRR8 | $2,275 | "Lambskin Calfskin Small Chocolate Bar Tote White Black"; "Patent Medium Chocolate Bar Flap Black"; "Lambskin East West Chocolate Bar Flap Black" |
| 7 | Chanel | Coco Preppy | 48 | 3 | FP44, TLC3, TRR1 | $5,695 | "Shiny Caviar Mini Preppy Coco Shoulder Bag Light Blue"; "Shiny Crumpled Lambskin Quilted Small Preppy Pocket Clutch With Chain Beige"; "Shiny Caviar Mini Preppy Coco Shoulder Bag Dark Blue" |
| 8 | Chanel | Wild Stitch | 44 | 3 | TLC35, FP6, TRR3 | $2,902 | "Calfskin Wild Stitch Top Handle Bag Black"; "Calfskin Quilted Wild Stitch Large Flap Light Blue"; "Wild Stitch Shoulder Bag" |
| 9 | Chanel | CC In Love | 53 | 2 | TLC27, FP26 | $5,791 | "Lambskin Quilted CC In Love Heart Bag Black"; "Lambskin Quilted CC In Love Heart Clutch With Chain Light Pink"; "Lambskin Quilted CC In Love Heart Clutch With Chain Purple" |
| 10 | Chanel | Coco Cocoon | 43 | 3 | TLC21, FP19, TRR3 | $1,370 | "Nylon Quilted Coco Cocoon Reversible Tote Grey"; "Nylon Quilted Small Coco Cocoon Tote Black"; "Lambskin Quilted Large Coco Cocoon Reversible Tote Black" |
| 11 | Chanel | Wavy CC | 39 | 3 | FP28, TLC10, TRR1 | $4,365 | "Shiny Crumpled Calfskin Quilted Small Wavy CC Hobo Black"; "Caviar Quilted Wavy CC Hobo Beige"; "Shiny Crumpled Calfskin Quilted Small Wavy CC Hobo White" |
| 12 | Gucci | Joy | 51 | 3 | FP23, TRR19, TLC9 | $525 | "GG Monogram Medium Joy Tote Peonia Flower"; "GG Plus Monogram Joy Vertical Tote Dark Brown"; "Imprime Monogram Medium Joy Tote Bordeaux" |
| 13 | Chanel | Paris-Biarritz | 32 | 3 | TLC14, FP9, TRR9 | $1,527 | "Coated Canvas Quilted Paris Biarritz Bowler Black"; "Coated Canvas Quilted Large Paris Biarritz Tote Black"; "Large Paris-Biarritz Tote" |
| 14 | Saint Laurent | Y Cabas | 43 | 3 | FP19, TRR15, TLC9 | $695 | "Leather Y Cabas Medium"; "Sheepskin Small Cabas ChYc Red"; "Calfskin Small Classic Y Cabas Black" |
| 15 | Bottega Veneta | Nodini | 40 | 3 | TLC30, FP6, TRR4 | $790 | "Nappa Intrecciato Nodini Crossbody Messenger Red"; "Nappa Intrecciato Nodini Crossbody Messenger Noce"; "Nappa Intrecciato Nodini Crossbody Messenger Green" |
| 16 | Louis Vuitton | Melrose Avenue | 34 | 3 | TLC30, TRR3, FP1 | $1,069 | "Monogram Vernis Melrose Avenue"; "Vernis Melrose Avenue Amarante" |
| 17 | Bottega Veneta | Roma | 33 | 4 | TLC22, FP8, TRR2, eBay1 | $1,095 | "Ostrich Small Roma Tote Limestone"; "Nappa Intrecciato Small Roma Tote Red"; "Light Calf Intrecciato Small Roma Tote Light Tourmaline" |
| 18 | Louis Vuitton | Bellevue | 29 | 3 | FP13, TLC9, TRR7 | $626 | "Vernis Bellevue PM Pomme D'Amour"; "Vernis Bellevue GM Violet"; "Vernis Bellevue PM Violet" |
| 19 | Bottega Veneta | Point (The Point) | 42 | 2 | TLC33, FP9 | $992 | "Calfskin Small The Point Triangle Bag Black"; "Calfskin Small The Point Triangle Bag Cinnabar"; "Calfskin Medium The Point Triangle Bag Almond" |
| 20 | Chanel | Funky Town | 27 | 2 | FP15, TLC12 | $5,030 | "Denim Quilted Medium Funky Town Flap Black"; "Lambskin Quilted Large CC Funky Town Flap Black"; "Lambskin Quilted Mini Funky Town Flap Pink" |
| 21 | Chanel | Chic Pearls | 27 | 2 | FP15, TLC12 | $2,754 | "Goatskin Quilted Chic Pearls Flap Black"; "Lambskin Quilted Chic Pearls Flap Black"; "Goatskin Quilted Chic Pearls Flap Dark Pink" |
| 22 | Chanel | Coco Base | 35 | 1 | FP35 | $9,735 | "Suede Calfskin Shiny Lambskin Quilted Small Coco Base Shopping Bag Beige Black"; "Suede Calfskin Shiny Lambskin Quilted Large Coco Base Shopping Bag Beige Black"; "Calfskin Quilted Small Coco Base Shopping Bag Khaki" |
| 23 | Chanel | Twist Your Buttons | 21 | 3 | FP11, TLC8, TRR2 | $4,289 | "Caviar Quilted Mini Twist Your Buttons Flap Black"; "Caviar Quilted Small Twist Your Buttons Flap Black"; "Caviar Quilted Twist Your Buttons Mini Bucket Bag White" |
| 24 | Prada | Vela | 39 | 2 | FP34, TRR5 | $665 | "Nylon Vela Saffiano Mini Bucket Crossbody Bag"; "Nylon Vela Saffiano Single Buckle Messenger Shoulder Bag Black"; "Nylon Vela Medium Backpack Black" |
| 25 | Louis Vuitton | Pleaty | 23 | 3 | FP16, TLC6, TRR1 | $2,560 | "Monogram Denim Mini Pleaty Blue"; "Monogram Denim Mini Pleaty Fuchsia"; "Monogram Denim Pleaty Blue" |

## Confidence flags — read before adding blind

Every candidate above is a real, verifiable model in the sample titles. A few need a judgment call:

- **Bowling (#3)** is a bag *shape* Chanel uses across sub-lines (Coco Beach, Preppy Coco). Adding it catalogues those bags, but decide whether you want one "Bowling" page or want it nested under the parent lines.
- **Coco Preppy (#7)** overlaps **Bowling** and **Coco Beach** — the "Preppy Coco" listings appear under both. Add them together and decide the parent so the same bag doesn't land on two pages.
- **Coco Base (#22)** is single-source (Fashionphile only) but the three titles are unambiguous, a real recent Chanel line. Fine to add; just note the one-seller evidence.
- **CC In Love (#9)** and **Chic Pearls (#21)** include heart-shaped clutches-with-chain — bags, not accessories, but confirm you want the clutch variants catalogued.

## Two cleanup notes (spelling variants to merge, words NOT to add)

- **Merge, don't double-add:** "Funky Town" and "Funky Town Flap" are the same model (~45 rows combined), add one "Funky Town". Same for "Paris-Biarritz" / "Paris Biarritz" (hyphen vs space) and "Coco Base" / "Coco Base Shopping Bag".
- **Do NOT add as models:** shape/material descriptors that cluster on their own, such as "Clutch with Chain", "Shopping Bag", "Reporter", "Triangle Bag". They're bag *types*, not model names; adding them would mis-file real bags.

## How this was built

- Read all **~96,000** unpromoted `discovered_listing` rows (keyset-paged by id, retried through the DB statement timeout).
- Dropped rows the dictionary already recognises (a promotion backlog, not a gap) and dropped accessories/apparel (wallets, belts, card holders, clothing).
- Grouped the rest by house + the clean short model name in each listing, ranked by how often it recurs, weighted up for higher-value houses and wider source spread.
- **Every candidate is backed by real listing titles** (shown as evidence). Where the name might be a shape/sub-line rather than a true model, it's flagged above, don't add those blind.
- Report only. It does not edit the dictionary, promote, or migrate. Adding a model is the owner's call.
