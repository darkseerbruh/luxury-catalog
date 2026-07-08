# House Standing — our own brand-tier formula

*Build spec. Created 2026-07-08. Owner brief: define brand tiers by OUR formula, not
industry convention, the same way the LC Index defines a bag's rank. Revisit the tier
NAMES, which brands sit where, and the WHY, all from one transparent rule. Sibling of
[the LC Index](lc-index-spec.md); reuses its methodology. Data below pulled from prod
2026-07-08. Not yet built. Tier names + band count are OPEN owner decisions (see end).*

## The idea, in one line

One measured score per house, **House Standing**, for where a brand sits in the resale
market, cut into named bands. Framed as **our standing, not a verdict** (houses shift; we
show the market, we don't judge the brand).

## Why we don't inherit industry tiers

- Industry "luxury / premium / contemporary" labels are undifferentiated and inconsistent (today Dior sits "mid" below Gucci "premium"; Burberry sits "thrift").
- A stated formula is a moat and matches the [LC Index](lc-index-spec.md): inputs, weights, cutoffs, published on a "how we tier houses" page.

## The formula (v1 draft)

House Standing blends measured resale signals, each turned into a **percentile across all
scored houses** first (so they share one 0-100 scale), then weighted:

| Signal | Source | Weight | Direction |
|---|---|---|---|
| **Price standing** | brand resale **median** across its variants (`price_history`, retail/boutique rows excluded) | 55% | higher → higher |
| **Ceiling** | brand resale **p90** (its hero pieces) | 25% | higher → higher |
| **Trade volume** | count of recorded resale prices for the brand | 20% | more → higher |

Honesty rules (mirroring the LC Index):
- **n-gate:** a house needs a minimum recorded-price count to be scored (draft n >= 30). Below that it shows "not enough data to place yet", never a guessed tier. (Today all 30 brands clear n >= 30.)
- **Scarcity is deliberately excluded** at the house level; it's a per-bag signal in the LC Index, not a brand trait.
- **Retention (price hold) deferred:** the sold-vs-listed signal is noisy pre-launch; fold in later, don't fake it now.
- **Editorial override lane:** a house can be nudged one band with a written, dated reason (e.g. a data-thin heritage house), so a gap can't misplace it. The override is logged, never silent.
- **Recompute on a schedule** so tiers move with the market; store the prior placement so a house's tier change is real, not invented.

## Where the houses land today (real data, 2026-07-08)

Draft weights (55 / 25 / 20) produce this order. Bands are the recommended v1 cutoffs.

| Band (draft cutoff) | Houses |
|---|---|
| **>= 90** | Hermès (98.7), Chanel (96.7) |
| **75-90** | Dior (86.7), Goyard (84.2), Louis Vuitton (82.2), The Row (80.2), Loewe (78.3), Bottega Veneta (76.3) |
| **55-75** | Fendi (72.5), Miu Miu (67.7), Saint Laurent (67.5), Celine (63.8), Balenciaga (63.8), Gucci (62.3), Prada (59.0) |
| **30-55** | Valentino (48.0), Givenchy (45.5), Chloé (42.3), Alexander McQueen (38.3), Dolce & Gabbana (32.3), Burberry (31.8), Mulberry (31.7), Coach (30.0) |
| **< 30** | Jacquemus (27.7), Off-White (20.2), Michael Kors (18.8), Tory Burch (16.7), Telfar (12.5), Kate Spade (12.0), Longchamp (6.7) |

Five natural clusters fall out of the data (clean gaps at ~90, ~75, Prada 59 -> Valentino 48,
Coach 30 -> Jacquemus 27.7). A 4-band scheme is possible by merging the bottom two.

## Tier names (OPEN — user-facing copy, voice-gated)

Current DB values (`thrift / mid / premium / ultra-luxury`) are industry-borrowed and
"thrift" reads as a knock. Replace with our own spectrum language, non-pejorative at the
low end. Candidate sets (apex -> accessible), to finalise via the brand-voice canon:

- **A. Canon:** Icon · Heritage · Signature · Contemporary · Everyday
- **B. Standing:** Grail · Blue Chip · Established · Rising · Accessible
- **C. Plain:** Apex · Prestige · Core · Approachable · Entry

## Rollout (owner-gated)

1. Land this spec + a pure `computeHouseStanding()` (unit-tested, no I/O), like the LC Index core.
2. Show the re-tiered distribution as a dry-run (done above).
3. On approval: migration to rename the `brand_tier` enum values + backfill each brand's tier from its band, plus the "how we tier houses" page copy. Migration + site copy = owner-gated.

## Open decisions for the owner

1. Band count: **5** (recommended, matches the natural gaps) or 4.
2. Tier name set: A / B / C / other.
3. Weights: keep 55 / 25 / 20 or adjust (e.g. raise trade volume).
