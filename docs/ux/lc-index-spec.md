# The LC Index — where a bag stands in the market

*Build spec. Created 2026-07-08. Owner brief: help a layperson understand, at a glance, where
a bag ranks (Marc Jacobs vs Louis Vuitton, Coach vs Dunhill) without knowing brand tiers.
Design converged over 5 rounds in chat; owner locked the "why-meter" 2026-07-08. Reference
mockup: session artifact "Bag ranking concepts, round 5". Not yet built.*

## The idea, in one line

One objective number, **the LC Index**, for where a bag stands in the whole market, computed
from data we already hold, framed as **our index, not a verdict**.

Separate from **Most Wanted** (the community's ranking, by reviews). This is the *market's*.

## The formula (v1)

Rank blends four measured signals into one score, then sorts all styles by it.

| Signal | Source (today) | Weight | Direction |
|---|---|---|---|
| **Price standing** | `variant_price_summary` resale median, rolled to style | 40% | higher price → higher |
| **Trade volume** | count of `price_history` observations for the style | 25% | more traded → higher |
| **Scarcity** | count of *live* listings (`price_history` where `listing_status != 'sold'`) | 20% | fewer live → higher |
| **House standing** | `brand.tier` (ultra-luxury / luxury / premium / thrift) | 15% | higher tier → higher |

Rules that keep it honest:
- Each signal becomes a **percentile across all styles** first, so they combine on one 0–100 scale.
- **n-gate:** a style needs a minimum recorded-price count to be ranked (draft: n ≥ 8, tune on real data). Below that it shows "not enough data to rank yet," never a fake rank.
- **Price is weighted heaviest,** so the Price bar is the one to read first in the why-meter. This is what makes the order legible (Birkin over Kelly on price; Hermès pair over Classic Flap on price despite the Flap's higher trade volume).
- **v1 popularity = trade volume,** a market fact. True demand signals (searches, saves, views) are thin pre-launch; fold them in later, do not fake them now.
- **Recompute monthly.** Store the prior rank so the **movement pill** ("▲ 2 this month", "Held #1 all year") is real. Until two cycles exist, the pill does not render, never invent motion.

## The components (build once, reuse everywhere)

Two pieces sharing the same four-signal engine:

- **StandingCard** — the full module: big rank + explainer panel on the left, the three
  measures as side-by-side mini-leaderboards on the right, receipts line (n + date) at the
  bottom. House standing lives in the header line ("Chanel · Ultra-luxury house"), so the
  three boards stay parallel (all "of 761").
- **StandingGlyph** — the compact **why-meter**: three tiny bars (Price / Trade / Scarcity)
  showing this bag's profile, leading bar brightened. This is the piece that makes a list row
  self-explain.

### Reuse map

| Surface | Piece | Notes |
|---|---|---|
| Bag detail page | StandingCard | Home. By the value module, at the decision point. |
| The LC Index page | StandingGlyph per row; StandingCard on expand | The destination list. |
| Compare page | StandingCard ×N | Where the dot-on-a-spectrum finally earns its place (multiple bags, one axis). |
| Identify result | StandingGlyph | "Ranks #X" the moment a scan matches a catalog bag. |
| Search & closet | inline rank link | Lightest reuse: "Jackie 1961 · #27 in the Index". |
| It bags, homepage | StandingGlyph | Canon module gains a real rank vs a curated order. |

## The Index page row (locked: the why-meter)

Each row = rank · affiliate photo · name + house + movement pill · **why-meter** · resale median (fixed right column, labeled once).

The why-meter is the answer to "why is it here": three bars, same three measures as the card,
so scanning down the column shows the profile rise and fall. A one-line plain-words note sits
under the name as the meter's caption ("Lower price than the Hermès pair, but changes hands far
more"). Photo comes free from the existing `getVariantImages` resolver. Hover a bar → exact percentile.

Bags / Houses toggle: same layout at brand level (a house's rank blends its styles).

## Copy (locked)
- Module label over the boards: **"The three measures behind #N"**.
- Hedge line: **"Our index, not a verdict."** + a **"How we rank"** methodology-page link.
- Never a verdict word ("best", "worth it"). Frame = standing/estimate, per the calibrated-hedge rules.

## Open, before build
- **Validate the formula against real data:** compute the true top ~20 and eyeball the order vs
  gut before shipping. Needs DB access this build container lacks (no anon key + proxy-blocked);
  run where creds exist, or owner pastes a key.
- **Nav placement for the Index page** (owner call, nav is protected): its own top-level door vs
  under an existing one.
- **"How we rank" page:** publish the recipe + weights so the index is defensible and citable (GEO).

## Metrics it moves
- StandingCard + glyph cross-links → **pages per session**, taps into bag pages (buy/sell moment).
- The Index page (dated, n-carrying, cited) → **GEO** entry pages + AI-search citations.
