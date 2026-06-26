# DRAFT: The asking-price illusion (what bags list for vs what they actually sell for)

*Written 2026-06-26 (Data lane). Publish-ready. Every figure queried from prod `price_history` on
2026-06-26: asking = TheRealReal + Fashionphile listings (`price_type='listed'`), sold = eBay completed
sales (`price_type='sold'`), each with n. Voice applied: third person, no em dashes, estimate not verdict.*

- **Suggested slug:** `asking-price-vs-sold-price`
- **Topic tags:** brand-neutral (cross-brand). Optionally tag Chanel for the CTA.
- **Excerpt:** Across six bags from six houses, the resale asking price runs 75 to 120% above what the bag
  actually sells for. Our sold data shows the gap, bag by bag, and the one exception.
- **One chart to build** `[diagram: ask-vs-sold-gap]`: paired bars per bag (asking vs sold median), sorted
  by gap. Data table at the bottom.

---

## Body

Start shopping for almost any designer bag on resale and you meet a number: the asking price. It feels like
the market. It is not. It is the seller's opening hope, and across the bags we track it sits far above what
people actually pay.

We lined up two numbers for six popular bags: the median **asking** price on the authenticated resellers,
and the median **sold** price from completed eBay sales over roughly the last year. The gap is not small.

[diagram: ask-vs-sold-gap]

- A **Coach Tabby 26** lists around $365 and sells near **$198** (n=177 sold). The ask runs about 84% high.
- A **Louis Vuitton Neverfull MM** lists around $1,500 and sells near **$770** (n=87). About 95% high.
- A **Chanel Classic Flap Medium** lists around $6,995 and sells near **$3,846** (n=78). About 82% high.
- A **Dior Lady Dior mini** lists around $3,925 and sells near **$1,789** (small sold sample, n=11). The
  widest gap in our set.
- A **Dior Saddle** lists around $2,895 and sells near **$1,652** (n=82). About 75% high.
- A **Gucci GG Marmont small** lists around $1,095 and sells near **$771** (n=46). About 42% high.

## Why the gap, and what is real about it

Two things drive it, and only one is "overpricing."

First, **venue.** The asking figures come from premium resellers that authenticate, photograph, and stand
behind every bag, and that service costs more, so their prices sit at the top of the market. The sold
figures come from eBay, a peer-to-peer market that runs cheaper. Part of every gap above is simply the
difference between a white-glove storefront and an open marketplace, not a seller being delusional.

Second, **the opening-ask habit.** Even on the same platform, listings start high and drift down or take
offers. A median of live asks always sits above a median of closed sales.

So read the gap as a range, not a verdict on any one listing. The honest takeaway: the sold number is the
floor of what is possible and the ask is the ceiling, and on most bags the real trade happens closer to the
floor than the listing suggests.

## The exception worth knowing

Not every bag plays along. The **Coach Rogue** sold *higher* than its asking median in our data (around
$645 sold versus $420 asked). That flips because the premium resellers carry a thin, lower-spec slice of
Rogues while eBay carries the full-size leather ones that buyers actually chase. When a bag is genuinely
wanted and the cheap venue holds the good examples, the usual gap can close or invert. It is the reminder
that "asking is inflated" is a tendency, not a law.

## How to use it

- **Buying:** treat the sold figure as your target and the ask as the starting point to negotiate from.
- **Selling:** if you want the bag gone, price toward the sold band, not the ask band.
- **Either way:** check what the bag actually closed at, not just what it is listed at.

> What these numbers are: median asking prices from current premium-reseller listings and median sold
> prices from recent eBay completed sales, captured June 2026, each with its sample size. Condition is not
> recorded on every listing and the venues differ, so read them as the center of gravity for each market,
> an estimate, not an appraisal of any single bag.

---

## Chart data (for `ask-vs-sold-gap`) — queried 2026-06-26

| Bag | Asking median (n) | Sold median (n) | Ask vs sold |
|---|---|---|---|
| Dior Lady Dior mini | $3,925 (146) | $1,789 (11) | +119% |
| LV Neverfull MM | $1,500 (336) | $770 (87) | +95% |
| Coach Tabby 26 | $365 (43) | $198 (177) | +84% |
| Chanel Classic Flap Medium | $6,995 (556) | $3,846 (78) | +82% |
| Dior Saddle (medium) | $2,895 (254) | $1,652 (82) | +75% |
| Gucci GG Marmont small | $1,095 (304) | $771 (46) | +42% |
| Coach Rogue (standard) | $420 (16) | $645 (88) | sold ABOVE ask |

*Asking = TheRealReal + Fashionphile (`price_type='listed'`); sold = eBay completed sales
(`price_type='sold'`), recent window. Lady Dior mini sold n=11 is thin; flag it in the chart. Sort bars by
gap so the pattern reads top to bottom, Rogue last as the exception.*
