# Where to Sell — payout + effort hub spec

*Owner-greenlit 2026-07-11 ("set up a where to sell my bag experience"). Sister feature to
`/where-to-buy` (2026-07-09), scoped there as the planned "where-to-SELL sister section
(consignor payout terms)". Same pattern: a data-backed destination page + per-venue pages,
GEO-first, every factual cell sourced + dated.*

## What it is

One place that answers "where should I sell my bag, and what will I actually walk away
with?" The queries behind it — "how much does the realreal pay", "fashionphile vs rebag
payout", "best place to sell a louis vuitton", "does poshmark take a fee" — are
high-intent moments no one answers with sourced, side-by-side numbers.

**Positioning (inherits where-to-buy's stance):** we don't judge, we equip. The hub never
says "sell here." It shows what each venue takes, how fast it pays, how much work it is,
and who sets the price — facts, dated — plus **our take** (explicitly an opinion). The
signature section is the net-payout estimator that uses OUR resale-median data.

## The one axis buying didn't have: the money is a spectrum, not a checkmark

Buying was about protection (a ✓/✗ per safeguard). Selling is a **trade-off curve**:

- **Most money, most patience** — consignment/marketplace. You keep the largest share but
  wait weeks for it to sell, and the venue (or you) does the work.
- **Instant, less money** — buyout. A quote today, paid on receipt, but you take a haircut
  for the certainty.
- **Keep it all, on your own** — person-to-person. No fee, but no infrastructure, no
  authentication, no safety net.

The tiers are framed as that trade, never a verdict:
**Top dollar · Fast cash · Hands-off · You keep the most** (see copy skeleton).

## Metrics it moves

- **GEO/SEO capture**: each venue page is the direct answer to a "how much does X pay /
  what fee does X take" query. FAQ + ItemList JSON-LD + sitemap, like `/where-to-buy`.
- **Affiliate / referral**: NO sell-side affiliate program exists today (confirmed
  2026-07-11: these resellers do not pay for referring sellers). The outbound sell links
  earn nothing and are kept as honest utility; the affiliate plumbing is dormant (see
  `sellLinksAffiliated` in affiliate.ts) so it can activate if a program ever lands. Do
  not frame the sell side as a revenue stream. Engagement + GEO below are the real metrics.
- **Habit loop (the strategic core)**: the net-payout estimator seeds off the bag's live
  resale median. Every estimate links to `/search` → *know what it's worth before you
  consign.* This is the differentiator no reseller can copy: our own market data.

## Surfaces

1. **`/where-to-sell`** — the hub.
   - **Payout matrix**: venues × (what they take · how fast · effort · who prices it).
   - **Net-payout estimator (signature move)**: TWO ways in, both on the page — (a) search
     your bag (reuses the site-wide `BagFinder`; picking a style resolves a typical resale
     value server-side via `getStyleResaleEstimate`, deduped by listing_ref, framed as an
     asking-price estimate with its n), or (b) type a dollar value. Either fills the fee math;
     each consignment/marketplace venue shows *what you'd net* after its published commission,
     ranked. Buyout venues show "instant quote" and route to the median rather than a fabricated
     multiple (see factuality note). Nobody surfaces this.
   - **Matrix "what they take" column** states the venue's cut (commission %), e.g. "They take
     ~30%", not the inverse keep %. The estimator table keeps the "you keep" framing.
   - Venue cards grouped by sell model: **They sell it for you** (consignment/buyout) ·
     **You list it yourself** (marketplaces) · **You sell it direct** (p2p).
   - "Our take" tier per venue, framed as the trade it makes, never a verdict.
2. **`/where-to-sell/[slug]`** — one page per venue.
   - Fact table: every claim with its **source link + date checked**.
   - **"The math on a $X bag"** — worked net-payout example off the estimator input.
   - **"Selling here anyway?"** — the tips section, assembled from the venue's weak cells
     (slow payout → how to speed it; you-do-all → listing checklist; venue-sets-price →
     how to floor your payout).
3. **Cross-links**: `/where-to-buy` ↔ `/where-to-sell` sister links; the bag page's resale
   median is the estimator's natural entry point.

## Data model (pure lib, no IO — the `where-to-buy.ts` / `platforms.ts` pattern)

`src/lib/where-to-sell.ts` — pure, tested. Mirrors the Fact/sourcing discipline exactly.

```
SellVenueProfile {
  slug, label, category: sells-for-you | marketplace | p2p
  models: ("consignment" | "buyout" | "marketplace" | "p2p")[]
  // What the seller KEEPS. Two shapes:
  //  - commissionTiers: [{ minUsd, maxUsd|null, sellerKeepPct }]  (consignment / marketplace %)
  //  - flatFee: { pctOfSale, fixedUsd, minUsd? }                  (Poshmark/eBay style)
  //  - buyout: no schedule — instant quote, routed to median (never a fabricated %)
  payout: CommissionTiers | FlatFee | { kind: "buyout-quote" }
  payoutSpeed:   { instant: boolean, detail, fact }
  payoutMethods: { methods[], storeCreditBonusPct|null, fact }
  acceptance:    { floorUsd|null, detail, fact }
  effort:        { level: white-glove | you-ship-only | full-diy, detail, fact }
  priceControl:  { who: venue-sets | seller-sets, detail, fact }
  sellerAuth:    { detail, fact }                 // what happens if it fails their check
  ourTake:       { tier, blurb }                  // the trade, opinion-framed
  tips:          TipKey[]                          // composed on the profile page
}
Fact { claim, sourceUrl, checkedAt }               // EVERY factual cell carries both
```

**Net-payout estimator (pure fn):** `estimateNet(venue, saleUsd)` →
`{ net, feeTaken, kind }`. For commission tiers, find the band and return
`saleUsd × sellerKeepPct`. For flat fees, `saleUsd − max(fixedUsd, saleUsd × pctOfSale)`.
For buyout, return `{ kind: "quote" }` (no number — honest).

**Sourcing bar (non-negotiable, inherited):** a cell renders only with `sourceUrl +
checkedAt`; unverified = "not yet verified", never a guess. Monthly re-verify sweep.

**Factuality note on buyout:** consignment/marketplace commissions are *published
schedules* (sourceable, datable). Buyout amounts are *per-item quotes* Fashionphile/Rebag
do NOT publish as a % of resale. We must NOT invent a buyout multiple. Buyout venues show
their published facts (instant quote, paid on receipt) and route the seller to the live
median to compare their quote against — the honest hedge.

## Launch venue set (v1) — verified 2026-07-11, each venue's own published policy

**They sell it for you** (consignment / buyout, white-glove):
Fashionphile (buyout + consignment) · The RealReal (consignment) · Rebag (buyout +
consignment) · The Luxury Closet (consignment/buyout).
**You list it yourself** (marketplaces, you ship, tiered fee):
eBay · Poshmark · Mercari · Vestiaire Collective.
**You sell it direct** (p2p, keep it all, no net): Facebook Marketplace.

## Voice + compliance

Full `docs/voice-and-tone.md` gate. No em dashes. No walls (≥5 sentences never ship);
beats + non-logo iconography. Canonical hedges: payout math = "our estimate off recorded
market prices," never "you'll get $X"; the net figure is *before* the item selling at all
(consignment pays nothing until it sells — state it). Tier labels are the trade, not a
verdict. Value figures trace to the bag's median with n + date.

## Copy skeleton (voice-gated at build)

- Hub H1: "Where to sell, and what you'll actually keep." Sub: "What each place takes, how
  fast it pays, and how much of the work is yours. Sourced, dated, no judgment."
- Tier labels (our take): **Top dollar · slow** · **Fast cash · less of it** ·
  **Hands-off** · **Keep it all · on your own**.
- Estimator: "What's your bag worth?" → "Here's what you'd keep at each."
- Tips section H2: "Selling here anyway?" Sub: "Fair. Here's how to keep more of it."

## Build order

1. `where-to-sell.ts` + `estimateNet` + tips library + tests (pure).
2. Hub page (matrix + estimator + cards) — server-rendered, URL-driven value param.
3. Profile template + venue pages; JSON-LD (FAQ per profile, ItemList on hub) + sitemap.
4. Nav entry + `/where-to-buy` ↔ `/where-to-sell` cross-links.
5. Later (not v1): consignor referral links once Awin advertiser programs approve;
   payout-speed "get paid now" comparisons; named-indie buyer profiles.
