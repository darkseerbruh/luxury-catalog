# Monetization moments → features: placement audit

*2026-06-22. Maps each revenue stream to the in-app feature/moment that triggers it,
audits where that moment currently sits in the UX, and records the placement changes
made this session. Revenue model + unit economics live in `docs/monetization-projections.md`.*

> **⚠️ Economics update 2026-06-24:** the consignor-referral per-unit was cut from **$1,250 → ~$250**
> after TRR Real Partners was ruled out for a digital aggregator (call finding — see
> `docs/data-collection-handoff.md` §11; model down-weighted in `monetization-projections.md`).
> **The UX in this audit still stands** — surfacing "where to sell" at the `had`/`have`/thrift-find
> moments is good UX regardless — but stream #2 is **no longer the model's "biggest swing"**; buyer
> affiliate (traffic-bound) is now the backbone. Read the per-unit and "25–40×" framing below as
> historical.

## The map — revenue stream → triggering feature/moment

| Stream (per projections) | Per-unit value | Direct feature (the outbound moment) | Indirect signals that feed it |
|---|---|---|---|
| **1. Buyer affiliate** (floor) | ~$30–60/sale | `WhereToBuy` (resale links → `outbound_resale_clicked`) | closet **want**, **watch price** / price alerts |
| **2. Consignor referral** (ceiling — biggest swing) | **~$1,250/seller** | `WhereToSell` (buyout/consign → `outbound_consign_clicked`) | closet **had** (flipper) & **have** (owner), **thrift `/found`** log |
| **3. Auth marketplace** (M9) | ~$20 take | "Request authentication" on-ramp *(paused)* | "How to authenticate" module, contributor-tier ladder, `is_authenticator` |
| **4. Premium tools** (M9) | $40/yr | search-capability / alerts paywall | `monetization_interest`, watchlist depth |

**The strategic point:** stream #2 is worth ~25–40× a buyer click, and its triggers are
the **`had`/`have` closet states and the thrift-find log** — features that, before this
session, did nothing with that intent. The closet's `want/have/had` is therefore not just
organization; **`want` → buyer affiliate and `had`/`have` → consignor referral.** Placement
should weight the sell path at least as heavily as the buy path.

## Audit — where the moments sat (before) and the fix (after)

### Bag detail page (`/bag/[variantId]`) — the primary money surface
- **Before:** the whole top (hero, image, variant selector, GEO lead, "What it's worth"
  value card, jump-nav) was purely informational. The first monetization affordance was
  `WhereToBuy` ~600 rendered lines down, order **Buy → Sell → Save(want/have/had)**. The
  value moment offered no next action; want/have/had sat *below* buy/sell and was
  disconnected from them; `had` (the $1,250 signal) was a third equal chip with no bridge
  to selling. Desktop had no sticky bar (`StickyActionBar` is `sm:hidden`).
- **After:** `BagActions` was rebuilt into a **decision cluster placed directly under the
  "What it's worth" card** (above the fold). It now carries want/have/had + watch **and**
  the primary **Where-to-buy / Where-to-sell** CTAs, plus contextual bridges: **`had` →
  leads with the Sell CTA + "see where to sell it"**, **`want` → "watch the price"**. The
  detailed `WhereToBuy`/`WhereToSell` sections stay lower (next to price history) and are
  reachable via the cluster CTAs + jump-nav. Jump-nav Buy/Sell entries now gate on whether
  links actually resolve.

### Thrift log (`/found`) — the consignor on-ramp
- **Before:** the success screen ("Logged. Nice find.") did nothing with the strongest
  flipper signal in the app — a user who just logged a cheap find.
- **After:** the success screen surfaces a **"Flipping it?"** consignor CTA (buyout +
  consign links built from the logged brand/style, FTC affiliate disclosure inline,
  `outbound_consign_clicked` with `source: "thrift_find"`). This is the literal
  "$1,250 per referred seller" moment the model names as the dominant lever.

### Closet (`/closet`) — the owner/flipper cohort
- **Before:** `have`/`had` groups had no sell-routing.
- **After:** a light sell-routing nudge on the **have** group (current owners = consignor
  supply) pointing to each bag's "Where to sell". Kept as routing, not duplicated link
  logic.

## Not changed (deliberate)
- **Desktop sticky bar:** left mobile-only; the above-the-fold cluster covers desktop
  prominence without a heavier persistent bottom bar. Revisit if analytics show desktop
  buy/sell CTR lagging mobile.
- **Auth-marketplace on-ramp:** still paused per the handoff — no placement work until a
  fresh go-ahead.
- **Premium paywall:** no UI yet (M9 stream); `monetization_interest` event exists.

## How to validate after deploy
Watch in PostHog: `outbound_consign_clicked` (esp. `source: "thrift_find"`) and
`outbound_resale_clicked` rates, and `item_saved` by `status` (does `had` correlate with
consign clicks?). If desktop buy/sell CTR trails mobile materially, add a desktop sticky
bar. Recalibrate the consignor assumptions in `monetization-projections.md` once real
`outbound_consign_clicked` volume exists.
