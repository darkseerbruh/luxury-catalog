# How the houses actually name their bags (and what that means for our catalog)

*Researched 2026-06-24 to ground the model-categorizer in canonical evidence. Sources at the bottom.*

## The headline: two naming regimes

**Regime A — official model names (Hermès, Dior, Gucci, Louis Vuitton).**
The house assigns a permanent model name; that name IS the canonical key. This holds even for
vintage, collabs, and line/leather qualifiers. → We can map most listings deterministically by
expanding the dictionary from each house's official model list.

**Regime B — Chanel is split.**
- **Permanent icons ARE named/numbered** and canonical: 2.55 (Feb 1955), Classic Flap (style code
  **11.12** / A01112), Boy, **19** (2019), **22** (2022), **25** (2025), Gabrielle, Coco Handle, Deauville…
- **Seasonal & runway bags have NO official Chanel name.** Chanel identifies them only by a **style
  code (A#####)** plus the **series/season** encoded in the serial. The "names" in the market
  ("Coco Masters Tennis Bag", "Grocery Shopping Basket", "CC Unchained") are **reseller/PurseForum-coined
  descriptions, not official.** So for seasonal Chanel there is nothing canonical to map to — the
  canonical identity is *style code + season*, and the descriptive name is just a display label.

This is why your instinct was right: Chanel seasonal/runway is the genuinely hard case, and it's hard
because **the canonical name doesn't exist**, not because we haven't found it.

## Per-house canonical model lists (seed the dictionary from these)

**Hermès** (from hermes.com "Iconic bag lines" + Sotheby's): Birkin, Kelly, Constance, Evelyne,
Picotin, Bolide, Lindy, Garden Party, Herbag, Roulis, Jypsière, Halzan, Steeple, 24/24, Della
Cavalleria, Verrou, Geta, Picotin, Maximors, In-The-Loop, Toolbox, Bolide, Jige (clutch),
Bride-à-Brac, Kaba (tote), Kelly Pochette. → fully catalogable by model name.

**Dior**: Lady Dior (+ **Lady D-Lite**, **Lady D-Joy** = sub-lines of Lady Dior), Saddle, Book Tote,
30 Montaigne, Caro, Bobby, Toujours, Diorama, Dior Key. ("Cannage D-Lite" = Lady D-Lite; "Toile de
Jouy / Canvas Book" = Book Tote in a given canvas.)

**Gucci** (incl. vintage + collab): Dionysus, GG Marmont, Jackie 1961, Ophidia, Horsebit 1955,
Bamboo 1947, Diana, Blondie, Attaché, Soho, Boston, Princy, Jolie, Queen Margaret, Zumi, Sylvie,
Padlock, Bree, Aphrodite. Collab = **"The Hacker Project"** (Gucci × Balenciaga) on a base model
(Jackie 1961 / Hourglass). Other collabs: Gucci × Adidas, Gucci × Disney.

**Louis Vuitton** (model + line/leather qualifier): Neverfull, Speedy, Alma, Capucines, OnTheGo,
Pochette Métis, Twist, Coussin, Dauphine, Keepall, Bumbag, NéoNoé, Noé, Boulogne, **Bella** (Mahina
line), Montaigne, Favorite, Félicie, Graceful, Delightful, CarryAll, Petite Malle, Multi Pochette.
(LV names = `<Model> <Line>`, e.g. "Bella Mahina", "Alma BB", "Speedy Bandoulière".)

## What this means for the categorizer (actionable)

1. **Regimes A houses → expand the model dictionary** from the official lists above (+ vintage + collabs).
   Deterministic, should push coverage well past the current ~22%.
2. **Brand-alias map** (quick win): `Christian Dior / DIOR MEN / Dior Homme → Dior`; `Gucci × Adidas/
   Disney/Balenciaga → Gucci` (keep collab as a tag); `Chanel Pharrell → Chanel`.
3. **Chanel seasonal → do NOT invent a model name.** Map the permanent icons via dictionary; for the
   rest, classify by **silhouette/type** (flap / tote / clutch / minaudière / vanity / bucket /
   top-handle) and **flag `seasonal`**, storing the **style code** as the canonical id when we have it.
   The reseller description stays as the display label.
4. **Human review (your gallery) is highest-value exactly here** — the Chanel seasonal/runway pieces
   and any silhouette calls, because no official source can resolve them. Everything in Regimes A is
   mostly machine-resolvable.

## Chanel 3-tier taxonomy (implemented in `model-normalize.ts` → `bagTier()`)

Chanel doesn't formally label permanent vs seasonal; named designs recur by demand and some graduate
to permanent. So the meaningful split is **"does it have a stable recurring name?"**, not "icon or not":

| Tier | Definition | Examples | Handling |
|---|---|---|---|
| `icon` | permanent, universally known | Classic Flap, 2.55, Boy, 19, 22, 25, WOC | own style + comps |
| `named` | stable recurring name, not top-icon | Business Affinity, Trendy CC, Deauville, Coco Handle, Gabrielle, Urban Spirit, Vanity Case | own style + comps |
| `seasonal` | no canonical Chanel name (one-off/runway) | "Hula Hoop", "Milk Carton", "Gas Can", "Grocery Basket" | classify by silhouette + season + style code; community name as label |

Evidence: Business Affinity debuted SS2017 *seasonal* but recurs by demand; Trendy CC (2014) graduated
to *permanent*; Deauville re-issued yearly since SS2012; Gabrielle was permanent, discontinued 2023.
A name is "named/icon" if it's in the curated dictionary OR recurs across many listings; a one-off
descriptive name is `seasonal`.

## The alias model — one canonical name + tagged "also known as" set

Every bag = a **canonical name** (Chanel's official, or for unnamed seasonals the style code +
descriptor + season) plus an **aliases[]** set, each tagged by source. Three layers:

| Layer | `source_type` | Where it comes from |
|---|---|---|
| Official | `official` | Chanel/house + curated dictionary + research |
| Reseller | `reseller` | **auto-aggregated from our captured listing names per platform** — `aggregate-aliases.ts` (free; we already hold ~24k bag listings tagged by platform) |
| Community | `community` | `supabase/seed/research/community-bag-nicknames.json` — curated from forums/FB groups (owner-extended) |

**Why it's a moat (authority + GEO):** one place mapping nickname ↔ official ↔ each reseller's name —
Chanel's own SAs can't do this. Emit every alias as JSON-LD `alternateName` so answer engines resolve
nickname queries to our page. Real per-platform divergence we already see: Classic Flap is
"Classic Medium Double Flap Bag" (TRR) vs "Caviar Quilted Medium Double Flap" (Fashionphile); Lady Dior
is "Cannage Lady Dior" (TRR) vs "Patent Cannage Mini Lady Dior" (FP).

**Status:** reseller aggregation built + run (`npm run aggregate:aliases` → `data/ingest/_raw/reseller-aliases.json`,
9,507 bag listings → 150 canonical bags). Community seed started. **Next (human-gated migration):** an
`aliases` table/JSONB on `style` + the bag-page "Also known as" block + JSON-LD `alternateName`.

## Sources
- Chanel numbering & style codes: [Tatler Asia](https://www.tatlerasia.com/style/fashion/chanel-iconic-numbers-story-en), [Fashionphile flap guide](https://blog.fashionphile.com/the-ultimate-chanel-flap-guide/), [Coco Approved size guide](https://cocoapproved.com/blogs/style/19-22-31-chanel-handbag-size-guide)
- Chanel seasonal = serial/season, no official name: [Fashionphile serial codes](https://blog.fashionphile.com/chanel-serial-codes-decoded/), [PurseForum](https://forum.purseblog.com/threads/how-to-read-the-chanel-receipt-and-series-no.1026052/)
- Hermès iconic lines: [hermes.com](https://www.hermes.com/us/en/content/310339-hermes-iconic-bag-lines/), [Sotheby's top 10 Hermès](https://www.sothebys.com/en/articles/your-guide-to-the-top-10-hermes-bags)
- Gucci vintage + Hacker Project: [Yoogi's Closet](https://www.yoogiscloset.com/391663-gucci-beige-white-gg-supreme-coated-canvas-leather-queen-margaret-small-top-handle-bag.html), [StockX Hacker Project](https://stockx.com/gucci-x-balenciaga-the-hacker-project-small-jackie-1961-beige-ebony)
- Dior models: [WhoWhatWear best Dior bags](https://www.whowhatwear.com/fashion/luxury/best-dior-bags), [dior.com Lady Dior](https://www.dior.com/en_us/fashion/womens-fashion/bags/lady-dior)
- LV Bella Mahina (official): [louisvuitton.com](https://us.louisvuitton.com/eng-us/products/bella-mahina-nvprod2410007v/M57201)
