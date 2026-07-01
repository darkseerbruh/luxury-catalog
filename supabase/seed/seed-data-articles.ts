/**
 * Seed two data-driven DRAFT articles (Data lane, 2026-06-26). Idempotent by slug
 * (upsert). Bodies use the post renderer's tokens: `## ` / paragraphs / `- ` / `> ` /
 * `**bold**` / `[diagram: <id>]`. Charts: CoachResaleRealityChart + SizePriceCurveChart.
 * Every figure traces to our captured price_history (sold = eBay completed, asking =
 * TRR/Fashionphile), pulled 2026-06-26, with n. Status stays 'draft' — owner publishes.
 *
 *   npx tsx supabase/seed/seed-data-articles.ts
 */
import { supabaseAdmin as db } from "./lib/client";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const coachBody = `The Coach Tabby is everywhere right now, which makes it the bag people ask about most: is it worth buying preowned, and what should it actually cost? We pulled the real numbers. They are not the numbers on the listing.

Across eBay completed sales over roughly the last year, a **Tabby 26 sold at a median of about $198**. On the authenticated resellers, the same bag is **listed for around $365** (TheRealReal and Fashionphile asking). So the price tag you see when you start shopping is close to double what the bag is actually selling for somewhere else.

[diagram: coach-resale-reality]

> The gap between asking and selling is the most useful thing a Coach shopper can know. A listing price is a hope. A sold price is a fact. When the two are this far apart, the buyer has room and the seller is usually being optimistic.

The smaller and larger Tabbys tell the same story. The **Tabby 20 sold near $193** and the standard **Tabby 26 shoulder bag near $204**, all clustered around the $200 mark regardless of size. The Tabby is a roughly $200 bag on the resale market, full stop.

## The Rogue is a different animal

Put the Rogue next to it and the contrast is sharp. The **Rogue 25 sold at a median near $499** and the larger **standard Rogue near $645**. That is two and a half to three times what a Tabby brings, from the same brand.

Why the split? The Rogue is built from glovetanned leather with a structured frame and has stayed a lower-volume, leather-first design. The Tabby is largely a coated-canvas and lighter-leather bag produced in big numbers and tied to a fast trend cycle. Volume and trend pull resale down. Leather and scarcity hold it up.

## What this means if you are buying or selling

- **Buying a Tabby preowned:** treat about $200 as the real market, not the $365 ask. There is room to offer below a listing, and plenty of the bag at the lower number.
- **Buying a Rogue:** expect $500 and up for clean examples, and know you are buying the Coach that has held value best in our data.
- **Selling either:** price to the sold band, not the asking band, if you actually want it gone.

> One honest caveat on the cheapest sales: eBay only authenticates items at $500 and above through its Authenticity Guarantee, so a $130 Tabby is buyer-beware on its own. That is where knowing the markers matters.

These are realized eBay sold prices and reseller asking prices we captured in June 2026, filtered to genuine Tabby and Rogue bags and windowed to recent sales. Condition is not recorded on every listing, so treat each figure as a market estimate, a center of gravity for what these bags trade at, not an appraisal of any one bag.`;

const sizeBody = `Common sense says a bigger bag costs more. More leather, more bag, more money. For a lot of bags that holds. For some of the most coveted ones, it is backwards, and the smallest version is the most expensive thing on the rack.

Take the **Dior Lady Dior**. Our asking data has the **mini at a median of about $3,925** and the **small at $3,890**, while the **medium sits near $2,475** and the **large drops to about $1,750**. The bag gets cheaper as it gets bigger. The tiny one, the one that barely holds a phone and a card case, commands the top price.

[diagram: size-price-curve]

It is not a Dior quirk. The **Hermès Constance** runs the same way: the **18 centimeter is around $11,950** against the larger **24 centimeter near $9,995**. Smaller, pricier. The same small-size premium shows up on the Birkin and Kelly.

## Why the small ones win

These are desirability-driven bags. People buy a Lady Dior mini or a Constance 18 to wear as jewelry, not to haul a laptop. The smallest size is the most fashion-forward, the most photographed, and often the hardest to get, so demand concentrates there and pulls the price up. Scarcity and want, not materials, set the number.

## Where the rule flips back

Now look at a bag people actually carry to work. The **Celine Triomphe** prices the normal way: the **mini near $1,089**, the **small around $1,395**, the **medium up at $2,295**, the **teen at about $2,370**. Bigger costs more, because here size is utility and the larger bag does more.

That is the rule worth remembering. **When a bag is bought as an accessory, small carries a premium. When it is bought to use, size tracks function and the bigger one costs more.**

## What to do with this

- **If you want the look for less,** a Lady Dior medium or large is far cheaper than the mini for the same name on the bag.
- **If you are buying the small one,** know you are paying a want premium, not a materials premium.
- **For everyday bags like the Triomphe,** buy the size that fits your life.

> A note on what these numbers are: asking-price medians from listings we captured in June 2026, not records of completed sales, and condition varies listing to listing. Read them as the center of gravity for what each size is priced at, an estimate of the market, not an appraisal of one bag.`;

const POSTS = [
  {
    slug: "what-a-coach-tabby-actually-sells-for",
    title: "What a Coach Tabby actually sells for (and why the Rogue holds more)",
    excerpt: "Resale listings ask around $365 for a Coach Tabby 26. The bags actually change hands near $198. Here is what our sold data shows, and why the Rogue is the Coach that holds its value.",
    body: coachBody,
    topic_brand_id: 2,
    topic_style_id: 3,
  },
  {
    slug: "does-a-smaller-bag-cost-more",
    title: "Does a smaller bag cost more? What our pricing data says",
    excerpt: "A smaller bag should cost less... right? For some of the most wanted designs it costs more. Our pricing data shows which bags flip the rule, and why everyday bags do not.",
    body: sizeBody,
    topic_brand_id: 203,
    topic_style_id: null as number | null,
  },
];

async function main() {
  for (const p of POSTS) {
    const { data: existing } = await db.from("post").select("post_id").eq("slug", p.slug).maybeSingle();
    const row = {
      author_user_id: AUTHOR,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      body: p.body,
      status: "draft" as const,
      topic_brand_id: p.topic_brand_id,
      topic_style_id: p.topic_style_id,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { error } = await db.from("post").update(row).eq("post_id", existing.post_id);
      console.log(error ? `UPDATE ${p.slug} ERR ${error.message}` : `updated #${existing.post_id} ${p.slug}`);
    } else {
      const { data, error } = await db.from("post").insert(row).select("post_id").single();
      console.log(error ? `INSERT ${p.slug} ERR ${error.message}` : `inserted #${data!.post_id} ${p.slug}`);
    }
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
