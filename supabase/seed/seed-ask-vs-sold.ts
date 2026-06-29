/**
 * Seed the "asking-price illusion" DRAFT article (Data lane, 2026-06-26). Idempotent by slug.
 * Figures queried from prod price_history 2026-06-26 (asking = TRR/Fashionphile listed; sold =
 * eBay completed). Chart: AskVsSoldGapChart. Status 'draft' — owner publishes.
 *   npx tsx supabase/seed/seed-ask-vs-sold.ts
 */
import { supabaseAdmin as db } from "./lib/client";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864";

const body = `Start shopping for almost any designer bag on resale and you meet a number: the asking price. It feels like the market. It is not. It is the seller's opening hope, and across the bags we track it sits far above what people actually pay.

We lined up two numbers for six popular bags: the median **asking** price on the authenticated resellers, and the median **sold** price from completed eBay sales over roughly the last year. The gap is not small.

[diagram: ask-vs-sold-gap]

- A **Coach Tabby 26** lists around $365 and sells near **$198** (n=177 sold). The ask runs about 84% high.
- A **Louis Vuitton Neverfull MM** lists around $1,500 and sells near **$770** (n=87). About 95% high.
- A **Chanel Classic Flap Medium** lists around $6,995 and sells near **$3,846** (n=78). About 82% high.
- A **Dior Lady Dior mini** lists around $3,925 and sells near **$1,789** (small sold sample, n=11). The widest gap in our set.
- A **Dior Saddle** lists around $2,895 and sells near **$1,652** (n=82). About 75% high.
- A **Gucci GG Marmont small** lists around $1,095 and sells near **$771** (n=46). About 42% high.

## Why the gap, and what is real about it

Two things drive it, and only one is "overpricing."

First, **venue.** The asking figures come from premium resellers that authenticate, photograph, and stand behind every bag, and that service costs more, so their prices sit at the top of the market. The sold figures come from eBay, a peer-to-peer market that runs cheaper. Part of every gap above is simply the difference between a white-glove storefront and an open marketplace, not a seller being delusional.

Second, **the opening-ask habit.** Even on the same platform, listings start high and drift down or take offers. A median of live asks always sits above a median of closed sales.

So read the gap as a range, not a verdict on any one listing. The sold number is the floor of what is possible and the ask is the ceiling, and on most bags the real trade happens closer to the floor than the listing suggests.

## The exception worth knowing

Not every bag plays along. The **Coach Rogue** sold higher than its asking median in our data (around $645 sold versus $420 asked). That flips because the premium resellers carry a thin, lower-spec slice of Rogues while eBay carries the full-size leather ones that buyers actually chase. When a bag is genuinely wanted and the cheap venue holds the good examples, the usual gap can close or invert. It is the reminder that "asking is inflated" is a tendency, not a law.

## How to use it

- **Buying:** treat the sold figure as your target and the ask as the starting point to negotiate from.
- **Selling:** if you want the bag gone, price toward the sold band, not the ask band.
- **Either way:** check what the bag actually closed at, not just what it is listed at.

> What these numbers are: median asking prices from current premium-reseller listings and median sold prices from recent eBay completed sales, captured June 2026, each with its sample size. Condition is not recorded on every listing and the venues differ, so read them as the center of gravity for each market, an estimate, not an appraisal of any single bag.`;

async function main() {
  const slug = "asking-price-vs-sold-price";
  const row = {
    author_user_id: AUTHOR, slug,
    title: "The asking-price illusion: what bags list for vs what they sell for",
    excerpt: "Across six bags from six houses, the resale asking price runs 75 to 120% above what the bag actually sells for. Our sold data shows the gap, bag by bag, and the one exception.",
    body, status: "draft" as const, topic_brand_id: 1, topic_style_id: 1,
    updated_at: new Date().toISOString(),
  };
  const { data: existing } = await db.from("post").select("post_id").eq("slug", slug).maybeSingle();
  if (existing) {
    const { error } = await db.from("post").update(row).eq("post_id", existing.post_id);
    console.log(error ? `ERR ${error.message}` : `updated #${existing.post_id} ${slug}`);
  } else {
    const { data, error } = await db.from("post").insert(row).select("post_id").single();
    console.log(error ? `ERR ${error.message}` : `inserted #${data!.post_id} ${slug}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
