# Fendi Baguette — production canon (archivist, 2026-07-14)

House-documentation pull. Per ENFORCED #13: house documentation = the variant was made;
absence of a resale listing is never evidence it was not made. No negatives asserted beyond
what the record supports. Feeds the variant selector, Bag DNA, and the on-hover availability
grey-out (worklist #18). **DB load is owner-gated — no migration run here.**

## Was the Mini made in blue? YES (high confidence)
Fendi's own PDP: **Baguette Mini, blue-and-black FF sequin**, style `8BS017AVTAF0E2A`
(`fendi.com/us-en/woman/bags/baguette-mini-blue-and-black-ff-sequin-bag-8bs017avtaf0e2a`,
captured 2026-07-14). Corroborating resale-level: soft-blue leather Mini; electric-blue sequin
Mini ~18 cm. → grey-out must NOT strike blue on the Mini.

## Sizes — official vs reseller label
Key finding: the multi-size grid (Nano/Mini/Medium) is a **revival-era (2019+)** structure. The
1997–early-2000s bag ran as one standard shoulder size + a larger "Mamma"; the "1,000+
variations" lived in the *surface*, not the size grid.

| Size | Dimensions (published) | Official Fendi term? | Confidence |
|---|---|---|---|
| Baguette (Medium) — the 1997 original / SATC size | ~26–27 × 13–15 × 6 cm | **Official** | high |
| Mini | ~19 × 11.5 × 4 cm | **Official** | high |
| Nano | ~11 × 6.5 × 2.5 cm | **Official** | high |
| Baguette Chain Midi (format, not a body size) | H 14.5 cm, medium footprint | **Official format** | high |
| Chain / Chain Midi Soft (formats) | Mini/Medium footprint on chain | Official format | medium |
| Mamma / Mama Baguette | 3 sizes, soft nappa (SS2025 reissue) | **Official name, distinct silhouette** | medium |
| ~~Pico~~ | charm scale | **Reseller (Rebag)** | low / flag |
| ~~Large / Grande~~ | ~32 × 17 cm | **Reseller/editorial** (oversized runs exist, name isn't clean fendi.com) | low / flag |
| ~~Micro~~ | = Nano | **Reseller usage**, not a separate tier | low / flag |

Implication for our selector: **Micro, Small, Large, Maxi, Midi** are reseller/community labels →
alias layer (`source_type: community`), never promoted to official. Chain Midi / Mamma carry a
`format`/`line` tag, not a body size.

## Materials / lines (house-documented)
Leather (nappa/calf, colour-bearing) · Zucca/FF logo canvas + FF jacquard · FF 1974 embossed ·
Selleria (Cuoio Romano hand-stitch) · Sequins/beaded/crystal/embroidered (the signature) ·
Raffia/straw · Exotic (croc/python/ostrich/lizard) · Fur/shearling · Brocade/tapestry/denim
(artisan "Hand in Hand" editions).

## Colours
Fendi does NOT name its colours (descriptors, not a house lexicon — matches existing memory).
Documented descriptors: Black (anchor), Brown/Tobacco, Beige/Camelia, White/Cream, Pink, Red,
Blue (sequin + soft leather), Spring Turquoise (FF 1974), multicolour sequin/embroidered.

## THE SIZE × MATERIAL MATRIX (completed 2026-07-14, run 19)

Five OFFICIAL sizes × ten materials. Each cell is **documented (with source)** or **not-yet-sourced**
(never "not made" — ENFORCED #13). Machine-loadable rows: `seasonal-archive/fendi-baguette-matrix.json`.

Legend: ✅ = house-documented (fendi.com PDP unless noted, high) · 🟡 = reference/reseller-level
(medium) · ⬜ = not-yet-sourced (no primary this run; NOT a negative).

| Material \ Size | Nano (7AS413) | Mini (8BS017) | Medium (8BR600) | Chain Midi (8BR793) | Mamma/Soft (8BR833) |
|---|---|---|---|---|---|
| **Leather (nappa/calf)** | 🟡 charm calfskin trim | ✅ soft-blue Mini | ✅ base | 🟡 Chain Midi Soft | ✅ nappa (blk/purple/blue/brn) |
| **FF / Zucca Canvas** | ⬜ | 🟡 Poshmark/eBay | ✅ 1997 heritage | ⬜ | ⬜ |
| **FF Jacquard** | ⬜ | 🟡 unboxing video | ✅ 8BR600A6V5 (brown) | ✅ 8BR793 (H14.5) | ⬜ |
| **FF 1974 Embossed** | ⬜ | ⬜ | 🟡 Spring Turquoise (FP) | ⬜ | ⬜ |
| **Selleria** | ⬜ | ⬜ | ✅ 612 topstitches (2 PDPs) | ✅ Soft Trunk 7VA565 (253) | ⬜ |
| **Sequin/Beaded/Embroidered** | ✅ 7AS413 (murrine) | ✅ 8BS017AVTA (blue-blk FF) | ✅ 8BR600AMP (white) | ⬜ | ⬜ |
| **Raffia** | ⬜ | ⬜ | ✅ 8BR600AWQ6 + AY5G | ⬜ | ⬜ (lead only) |
| **Exotic (croc/python)** | ⬜ | ⬜ | ✅ 8BR600AS77 (croc $28.4k) | ⬜ | ⬜ |
| **Fur / Shearling** | ⬜ | ✅ 8BS017AW5R (teddy) | 🟡 fur category | ⬜ | ✅ 8BR833AYCU (beige) |
| **Denim/Brocade/Artisan** | ⬜ | ⬜ | ✅ Hand in Hand (WWD) | ⬜ | ⬜ |

**Reseller-label → official size map:** Micro = Nano · Small = Mini · Large/Grande/Maxi = oversized
Medium runs (not a clean current fendi.com tier) · Midi = Chain Midi · Pico (Rebag) = a charm below Nano.

**Style-code decoder (GEO-valuable):** the 4-char prefix keys the size/line — **8BR600** = Iconic/Medium
Baguette · **8BS017** = Mini · **8BR793** = Chain Midi · **8BR833** = Mamma / "Baguette Soft" Medium
(26.5 × 18 × 8.5 cm nappa) · **7AS413** = Nano Baguette Charm · **7VA565** = Selleria Baguette Soft Trunk.
The tail keys colour/material.

## Documented size × material × colour combos (positive only, sourced this run)

Fendi does NOT name colours — descriptors only. Every combo below is a fendi.com PDP unless noted:
- Nano × sequin/beaded × multicolor (murrine, neon-blue trim) — **7AS413B07LF0V2B** (high)
- Mini × sequin × blue-and-black FF — **8BS017AVTAF0E2A** (high)
- Mini × shearling × beige (teddy ears) — **8BS017AW5RF11WP** (high)
- Mini × leather × soft blue — IG (medium)
- Medium × FF jacquard × brown — **8BR600A6V5F17U4** (high)
- Medium × FF 1974 embossed × Spring Turquoise — Fashionphile (medium)
- Medium × Selleria × cappuccino brown — **8BR600ARBBF0EMR** (high) · × mercury blue — **8BR600AVQQF1USY** (high)
- Medium × sequin × white — **8BR600AMP0F0QVL** (high)
- Medium × raffia × natural/hazelnut — **8BR600AWQ6F1WGE** (high) · × multicolor ruffles — **8BR600AY5GF0Y7P** (high)
- Medium × crocodile × brown — **8BR600AS77F1PPN** (high)
- Medium × Zucca canvas × brown/tobacco — Fashionphile + eBay/Poshmark (medium)
- Chain Midi × FF jacquard × brown/multicolour — **8BR793** (high)
- Chain Midi (Soft Trunk) × Selleria × black — **7VA565ARM0F0QA1** (high)
- Mamma/Soft × nappa × black / anemone purple / blue / mahogany brown — **8BR833AQ0D·** (high, 4 PDPs)
- Mamma/Soft × shearling × beige — **8BR833AYCUF0NGA** (high)

Everything else in the grid = "not yet sourced", never "not made."

## Axes genuinely too thin to source (flagged, with best primary)

1. **Per-era size availability (1997–2010 vs 2019+)** — the multi-size grid is a revival-era (2019+)
   structure; the original run was ~one shoulder size + a larger Mamma. Best primary: the **Rizzoli
   *Fendi Baguette* book** plates + the **"Hand in Hand" book** (WWD, Nov 2022) + an owner-present
   fendi.com archive pass (Akamai-walled to Firecrawl → Chrome path).
2. **Nano beyond sequin/leather, and Chain Midi / Mamma beyond their core material** — the Nano charm
   and the Mamma soft line are documented in few materials; most of their cells are ⬜. Not thin because
   Fendi didn't make them, thin because the charm/soft lines are newer and less catalogued. Best primary:
   fendi.com live Baguette collection filter (Chrome) + PurseForum Fendi reference threads.
3. **Denim specifically** — folds under the Hand in Hand / artisan-editions cell; house-documented at the
   project level, denim-specific only at reseller level this run.

## Load policy note (for the seed)

`seasonal-archive/fendi-baguette-matrix.json` carries every cell with its evidence state so the owner
can pick a load policy per row. Recommended: **load the ✅ cells as real (size, material) production
options** and the specific documented colour combos as seeded variants; **stub the ⬜ cells as
"produced-but-unlisted / not yet sourced"** (per the production-driven-selector memory: grey-out = never
made, which we must NOT assert here — these are unknown, not never-made). The 10-way material split is
the fuller archive; for the live selector collapse to ~7-8 (see the JSON `selector_collapse_hint`).

Prior context: model + history in `seasonal-archive/fendi.md`; the existing selector rows are STYLE 4 of
`booktote-peekaboo-loulou-baguette-chanel22-diana-production-matrix.md` (style_id 204).
