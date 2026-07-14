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

## Documented size × material × colour (positive only)
- Mini × sequin × blue-and-black FF — fendi.com 8BS017 (high)
- Mini × leather × soft blue — IG (medium)
- Medium/Chain Midi × FF jacquard × brown/multicolour — fendi.com 8BR793 (high)
- Medium × Zucca canvas + Selleria (1997 originals) — Vogue Italia Vintage (high)
- Mini/Medium × sequin × multicolour editions (high that they exist; per-colourway per-listing)
Everything else = "not yet sourced", never "not made."

## Under-documented (flagged)
Per-era size availability (1997–2010 vs 2019+). Best primary: the Rizzoli *Fendi Baguette* book
plates + an owner-present fendi.com archive pass (Akamai-walled to Firecrawl → Chrome path).

Full machine-loadable `{axis,value,official,source,confidence}` rows: see the archivist run-18
checkpoint in `docs/seasonal-archive-worklist.md` and banked `docs/research-drafts/seasonal-archive/fendi.md`.
