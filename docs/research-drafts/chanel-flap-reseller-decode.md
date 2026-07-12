# Chanel flap — reseller decode ruleset

*Archivist-sourced 2026-07-12. How each reseller we scrape labels the Chanel flaps, so the
ingest classifier routes a listing to the right MODEL (Classic Flap 11.12 vs 2.55 Reissue vs
Coco Handle vs Boy) instead of lumping look-alikes into the Classic Flap. Owner mandate: "listings
being wrong sometimes is not acceptable." Implemented in `src/lib/ingest/chanel-flap-classify.ts`.*

## The single cleanest discriminator
**Classic Flap uses size WORDS (Small / Medium / Jumbo / Maxi). 2.55 Reissue uses NUMBERS (224–227).**
"Turn-lock" alone is NOT diagnostic (Classic + Boy both say it); only TLC/VC write "Mademoiselle"
(= Reissue) explicitly.

## Classification ruleset (apply in order)
1. Title/model has **"Boy"** → **Boy**.
2. Title has **"Coco Handle"**, OR "top handle" + flap (not Boy), OR TRR "Handle Bags" category → **Coco Handle**.
3. Title/model has **"Reissue"**, **"2.55"**, a bare **224/225/226/227**, OR (TLC/VC) desc "Mademoiselle" → **2.55 Reissue**.
4. Title has **"Classic" + "Double/Single Flap"** (TRR/FP/Rebag/Yoogi's/TLC) OR model = **"Timeless/Classique"** (VC) → **Classic Flap 11.12**.
5. Else → seasonal flap; classify by silhouette + flag `seasonal`.

## Per-reseller title conventions
| Reseller | Classic Flap title | 2.55 Reissue | Coco Handle / Boy | Notes |
|---|---|---|---|---|
| **TheRealReal** (HIGH, 720 mined) | `Classic <Size> Double Flap Bag` (± material prefix) | `<224-227> Reissue …` / `2.55 Reissue …` | Boy: `<Size> Boy Bag`; Coco Handle under "Handle Bags" / "Top Handle" | never writes "Mademoiselle"; season/leather/quilt in `desc` |
| **Fashionphile** | `<Material> <Quilt> Quilted <Size> Classic <Single/Double> Flap <Color>` | "2.55 Reissue" spelled out | "…Mini Coco Handle Flap…" | model spelled out in title |
| **Rebag** | `Classic Double Flap Bag Quilted <Leather> <Size>` | "Reissue 2.55" | category taxonomy: Classic Flap / Boy / Reissue 2.55 | editorial uses "11.12", titles don't |
| **Yoogi's Closet** | `<Color> Quilted <Leather> Classic <Size> Double Flap Bag` | `2.55 Reissue … <225-227> Flap Bag` | "Coco Handle" / "Boy Bag" spelled out | color-first |
| **Vestiaire (VC)** | model = **"Timeless/Classique"** (NOT "Classic Flap") | title/model "2.55" | "Coco Handle"; "Timeless/Classique Top Handle" | titles template-generated → parse the MODEL attribute, not free text |
| **The Luxury Closet** | `Chanel <Size/Color> <Material> Classic Double Flap Bag` | `Reissue 2.55 <224-227> …` (very consistent) | "Coco Handle" | desc writes **"Mademoiselle turn-lock"** on Reissues; season codes ("25A") in titles |
| **Rebelle** | GAP — not sourced | GAP | GAP | German UGC titles; queue a Chrome/scrape capture before writing a rule |

## Gaps to close
- TRR exact Coco Handle title string (absent from the pull).
- Rebelle conventions (unsourced).

## Downstream
These map into `bag_alias` as `source_type: reseller` per platform (per brand-naming-research.md
alias model). The classifier is the ingest gate; a sweep can re-point already-mislabeled rows.
