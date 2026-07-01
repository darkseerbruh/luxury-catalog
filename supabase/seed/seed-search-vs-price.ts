/**
 * Seed "most searched vs most expensive" DRAFT (Data lane, 2026-06-26). Idempotent by slug.
 * Search = Google Trends 12-mo US (trends-keyword-pull.md set 1). Price = our asking medians,
 * prod price_history 2026-06-26, n stated. Chart: SearchVsPriceChart. Status 'draft'.
 *   npx tsx supabase/seed/seed-search-vs-price.ts
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864";

const body = `It is tempting to assume the bag everyone searches for is the one that costs the most. We put the two side by side, Google search interest against our own resale pricing, for the five icons people ask about most. They do not line up the way you would expect.

[diagram: search-vs-price]

At the top, the assumption holds. The **Hermès Kelly** and **Birkin** are the most searched of the five over the last year, and they are also far and away the most expensive, with asking medians around **$18,000** (Kelly, n=289) and **$19,995** (Birkin, n=356). Most wanted, most expensive. No surprise there.

Then it breaks. The **Chanel Classic Flap** is the **least searched** of the five, yet it asks a median of about **$6,995** (n=556), more than four times the Neverfull and the Marmont. And those two, the **Louis Vuitton Neverfull** (about **$1,500**, n=336) and the **Gucci GG Marmont** (about **$1,095**, n=304), draw *more* search interest than the Flap while costing a fraction of it.

## Why search and price pull apart

Search interest measures how many people are **looking**, and most people look at what they might actually buy. The Neverfull and the Marmont are entry points to their houses, so a huge pool of shoppers researches them. Price measures something different: **exclusivity**. The Birkin and Kelly score high on both because they are the rare case where mass aspiration and genuine scarcity meet, everyone dreams about them and almost no one can get one at retail.

The Classic Flap is the interesting outlier. It is quietly expensive. Fewer people search it than search a Neverfull, partly because it is a known quantity to the people who buy it, but it still commands a premium price. Low noise, high value.

## What to take from it

- **A bag being everywhere in your feed does not make it expensive.** The most-searched accessible icons are the cheapest to buy preowned.
- **A quiet bag can still be a pricey one.** The Flap does not trend the way a Neverfull does, but it holds a much higher number.
- **Only the Birkin and Kelly are both,** which is exactly why they sit in their own tier.

> What these numbers are: search interest is Google Trends 12-month US data, which is relative (a 0 to 100 index), not search volume, so read it as ranking and direction only. Prices are median asking figures from our June 2026 capture of premium-reseller listings, each with its sample size, an estimate of the market, not an appraisal of any one bag.`;

async function main() {
  const slug = "most-searched-vs-most-expensive-bags";
  // Five-bag roundup; the narrative centerpiece is the Chanel Classic Flap (the
  // "quietly expensive" outlier), so the shop CTA anchors there. Resolved by name
  // so it's id-independent (the old literal 1/1 resolved to Chanel/Classic Flap by
  // luck, not intent). Change the names below to re-point the CTA at another bag.
  const { brandId, styleId } = await resolveTopic("Chanel", "Classic Flap");
  const row = {
    author_user_id: AUTHOR, slug,
    title: "The most-wanted bags are not the most expensive (mostly)",
    excerpt: "We put Google search interest next to our resale pricing for the five icons. The Kelly and Birkin top both lists, but the Classic Flap is the least searched and still one of the priciest. Here is why demand and price pull apart.",
    body, status: "draft" as const, topic_brand_id: brandId, topic_style_id: styleId,
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
