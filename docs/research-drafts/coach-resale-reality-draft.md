# DRAFT: What a Coach Tabby actually sells for (and why the Rogue holds more)

*Written 2026-06-26 (Data lane). Publish-ready draft for the Content lane to wire into the `post`
renderer + build the one chart + seed as a DRAFT post. Every number traces to our own capture of eBay
completed (sold) sales and TheRealReal/Fashionphile asking listings, pulled 2026-06-26, with n stated.
Voice-and-tone applied: third person, no em dashes, calibrated as estimates not appraisals.*

- **Suggested slug:** `what-a-coach-tabby-actually-sells-for`
- **Topic tags:** brand = Coach (so the buy/sell CTA renders). Style = Tabby.
- **Excerpt:** Resale listings ask around $365 for a Coach Tabby 26. The bags actually change hands near
  $198. Here is what our sold data shows, and why the Rogue is the Coach that holds its value.
- **One chart to build** `[diagram: coach-resale-reality]`: grouped bars, per model+size, **realized
  (sold) median vs asking median**, Tabby sizes next to Rogue sizes. Data table at the bottom of this doc.

---

## Body (post-renderer format: `##` / `-` / `>` / `**bold**` / `[diagram:]`)

The Coach Tabby is everywhere right now, which makes it the bag people ask about most: is it worth buying
preowned, and what should it actually cost? We pulled the real numbers. They are not the numbers on the
listing.

Across eBay completed sales over roughly the last year, a **Tabby 26 sold at a median of about $198**
(n=177, captured 2026-06-26). On the authenticated resellers, the same bag is **listed for around $365**
(TheRealReal and Fashionphile asking, n=43). So the price tag you see when you start shopping is close to
double what the bag is actually selling for somewhere else.

[diagram: coach-resale-reality]

> The gap between asking and selling is the most useful thing a Coach shopper can know. A listing price is
> a hope. A sold price is a fact. When the two are this far apart, the buyer has room and the seller is
> usually being optimistic.

The smaller and larger Tabbys tell the same story. The **Tabby 20 sold near $193** (n=25) and the standard
**Tabby 26 shoulder bag near $204** (n=73), all clustered around the $200 mark regardless of size. The
Tabby is a roughly $200 bag on the resale market, full stop.

## The Rogue is a different animal

Put the Rogue next to it and the contrast is sharp. The **Rogue 25 sold at a median near $499** (n=41) and
the larger **standard Rogue near $645** (n=88). That is two and a half to three times what a Tabby brings,
from the same brand.

Why the split? The Rogue is built from glovetanned leather with a structured frame and has stayed a
lower-volume, leather-first design. The Tabby is largely a coated-canvas and lighter-leather bag produced in
big numbers and tied to a fast trend cycle. Volume and trend pull resale down; leather and scarcity hold it
up. Our data is the receipt: the structured leather Coach keeps its value, the trendy logo Coach does not.

## What this means if you are buying or selling

- **Buying a Tabby preowned:** treat about $200 as the real market, not the $365 ask. There is room to
  offer below a listing, and plenty of the bag at the lower number.
- **Buying a Rogue:** expect $500 and up for clean examples, and know you are buying the Coach that has
  held value best in our data.
- **Selling either:** price to the sold band, not the asking band, if you actually want it gone.

> One honest caveat on the very cheapest sales: eBay only authenticates items at $500 and above through its
> Authenticity Guarantee, so a $130 Tabby is buyer-beware on its own. That is exactly where knowing the
> markers matters, and where our Coach authentication guide comes in.

## How we got these numbers

These are realized eBay sold prices and reseller asking prices we captured on 2026-06-26, filtered to
genuine Tabby and Rogue bags and windowed to recent sales so an old market does not skew a current read.
Condition is not recorded on every listing, so treat each figure as a market estimate, a center of gravity
for what these bags trade at, not an appraisal of any one bag. As more sold data lands, these update.

---

## Chart data (for `coach-resale-reality`) — our capture, 2026-06-26

| Model / size | Variant | Realized (sold) median | n (sold) | Asking median | n (ask) |
|---|---|---|---|---|---|
| Tabby 26 | v596 | $198 | 177 | $365 | 43 |
| Tabby 20 | v595 | $193 | 25 | $303 | 14 |
| Tabby (shoulder, std) | v597 | $204 | 73 | $309 | 27 |
| Rogue 25 | v602 | $499 | 41 | $356 | 11 |
| Rogue 30 | v603 | $632 | 9 | $395 | 5 |
| Rogue (std) | v605 | $645 | 88 | $420 | 16 |

*Source: eBay completed sales (sold) + TheRealReal/Fashionphile (asking), captured 2026-06-26. Sold values
are `price_type='sold'`, asking are `price_type='listed'`, both in prod `price_history`. Note Rogue sold
medians sit ABOVE the small TRR/FP asking sample because eBay carries the full-size leather Rogues; the
asking n is thin, so lead with the sold figure.*
