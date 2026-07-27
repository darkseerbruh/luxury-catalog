# Reframing the index: from market composite to collector regard

*Created 2026-07-27. Owner's challenge: SecondSense built an index styled after
stock and portfolio tracking, and ours is built on the same thesis. Hers is not
about finances. It is "ranking all the bags ever by what handbag collectors and
lovers think is important" — reputation, demand, exclusivity, availability.*

---

## 1. The critique is correct, and the weights prove it

`LC_INDEX_WEIGHTS` in `src/lib/lc-index.ts`:

| Signal | Weight | What it is |
|---|---|---|
| price | **0.47** | resale median |
| trade | 0.29 | how many listings we have recorded |
| scarcity | 0.24 | how few are live right now |

**All three are market signals. One hundred percent of the rank is market-derived,
and none of it is what collectors think.** Nearly half is price alone, so a bag
ranks highly because it is expensive, whether or not a single person loves it.
That is a fund manager's thesis.

## 2. What that produces today (computed 2026-07-27, 931 ranked styles)

| Rank | Bag | Observations |
|---|---|---|
| 1 | Chanel Souplissimo | **24** |
| 2 | Chanel Coco Base Shopping Bag | 38 |
| 3 | Chanel Coco Preppy | 22 |
| 4 | Hermès Roulis | 87 |
| 5 | Hermès Kelly | 1,529 |
| 6 | Hermès Birkin | 1,529 |

**The most important bag in the world is sixth, behind three Chanels most
collectors could not name.** The Classic Flap does not appear in the top fifteen
at all. A ranking of "the best bags ever" that omits the Classic Flap and leads
with the Souplissimo is not describing the thing it claims to describe.

The mechanism is simple: price is a percentile, and a rare expensive bag with 24
recorded observations scores the same percentile as an icon with 1,529. Volume
earns a bag no standing and buys it no confidence.

## 3. The honest blocker: the collector signals are empty

Measured in prod, 2026-07-27:

| Signal | Rows | Usable as an index input? |
|---|---|---|
| Want signals (`closet_item` want) | **0** | No |
| Owner scale votes (`bag_axis_vote`) | **0** | No |
| Written reviews | **0** | No |
| Word-of-mouth claims | 154 | Only 13 bags of 931 |
| Claim votes | 0 | No |

**A collector-weighted index cannot be computed today.** Anything built on want
signals or owner votes would rank 931 bags on zero data. Saying so is more useful
than shipping a formula that looks collector-native and is actually still price.

### Attention: viable, but small and it must be curated

Wikipedia pageviews is a free official API and it works (Birkin averages ~42,100
views a month over the year to 2026-06; Kelly ~9,100).

⚠️ **But naive title resolution silently returns the wrong article.** Searching
Wikipedia for our bag names gave: "Louis Vuitton Speedy" → the *Louis Vuitton*
brand article, "Mulberry Alexa" → *Alexa Chung* the person, and "Hermès
Constance" → *Children's Literature Fest*. Each of those would have produced
confident, completely wrong attention numbers. Titles must be hand-verified per
bag, never derived.

Coverage is also thin: only bags notable enough for their own article qualify,
which is dozens, not 931. **Attention is a good per-bag fact and a bad index
input.**

---

## 4. What to do, in the order it can actually be done

### Now, with no new data: fix the confidence problem

The Souplissimo result is not really a weighting bug, it is a **confidence** bug.
Two changes need nothing we do not already hold:

1. **Weight by evidence.** Shrink a bag's score toward the middle when it rests on
   few observations, the same way a weighted rating stops a film with 4 votes
   topping IMDb. A bag with 1,529 observations should beat one with 24 unless the
   24 are overwhelming.
2. **Move weight off price and onto trade volume.** How many people actually buy
   and sell a bag is much closer to "does anyone care about this" than its price
   is. Price says what it costs; volume says how many hands want it.

My estimate, not a promise: those two alone would put the icons back on top and
drop the expensive obscurities, without a single new signal.

### Next, as users arrive: add the collector signals

Want-per-owner (the covet ratio, already computed in `demand.ts`), claim
agreement, and owner scale coverage. Each becomes usable the moment it has rows,
and the gate pattern already used across the site can reveal them automatically.

### Naming

"Index" is the finance word and the giveaway. Three directions:

| Name | Reads as | Risk |
|---|---|---|
| **The Canon** | The bags that matter, culturally. Closest to "best of all time". | Collides with our internal "catalog canon" term, which is not user-facing |
| **Standing** | Where a bag stands among its peers. Warm, no finance echo. | Quieter, less of a destination |
| **Regard** | How a bag is regarded. Entirely about opinion. | Slightly literary, may want a subtitle |

**Not recommended:** anything with Index, Score, Rating, Market or Value in it.
Those are the words that put us on SecondSense's turf, where the comparison
flatters them rather than us.

---

## 5. The strategic point

A price-weighted index is the one ranking a competitor with the same price data
can reproduce exactly. **The ranking nobody can copy is the one built on what
owners say and want**, which is the same asset as the rest of this workstream.
Re-weighting is not a cosmetic change; it is pointing the flagship ranking at the
moat instead of at the commodity.
