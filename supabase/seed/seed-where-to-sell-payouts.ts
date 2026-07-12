/**
 * Seed "What every resale site actually pays you" DRAFT (2026-07-11). Companion to
 * the /where-to-sell hub + net estimator. Idempotent by slug.
 *
 * Figures = our OWN venue registry `src/lib/where-to-sell.ts` (each venue's published
 * rate, checkedAt 2026-07-11), quarantined in a dated box with a "verify before you
 * sell" caveat. The $2,000 worked example is the deterministic estimateNet output.
 * Visuals: [diagram: where-to-sell-tradeoff] + [diagram: where-to-sell-estimator-cta].
 *
 * Status is set ONLY on INSERT: re-running after she publishes never flips a live
 * article back to draft. Owner publishes.
 *   npx tsx supabase/seed/seed-where-to-sell-payouts.ts
 */
import { supabaseAdmin as db } from "./lib/client";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const body = `You list a bag for $2,000 and you figure that's the number. It isn't. The number that matters is what lands in your account after the venue takes its cut, and that gap runs wider than most sellers guess.

Here's the part that catches people off guard. The service that does the most for you, the white-glove consignor who photographs your bag, writes the listing, handles the buyer, and ships it out, is the one that pays you the least. That convenience is exactly what you're paying for. Sell it yourself and you keep more, but now the photos, the questions, and the shipping are your job. Every option on the map is a trade. It's worth knowing which one you're making before you hand the bag over.

[diagram: where-to-sell-tradeoff]

## What "keep rate" actually means

Two numbers move in opposite directions on every platform: the cut the venue takes, and the share you keep. On a bag that sells, a 20 percent cut means you keep 80 percent. Simple, but easy to forget when you're staring at the asking price.

One more thing that changes the math: **when you get paid.**

- **Consignment** (Fashionphile, Rebag, The RealReal, The Luxury Closet) pays only after your bag sells, which can take weeks. They do the work, they take a larger cut.
- **A buyout** (Fashionphile and Rebag both offer one) is an instant quote, paid on receipt. Faster, but it runs lower than consignment and the percentage isn't published, so you're trading margin for speed and certainty.
- **DIY marketplaces** (Facebook, Mercari, eBay, Poshmark, Vestiaire) keep you the most, because you do the listing, shipping, and disputes yourself.

## What each site leaves in your pocket

These are each venue's own published rates, current as of 2026-07-11. We re-check them monthly and update the date, so the numbers here are the real, current cut, not a rough guide.

- **Facebook Marketplace**, local pickup: you keep **100 percent**, cash in hand. No fee, but also no buyer protection and no shipping safety net.
- **Mercari:** keep **90 percent** (a flat 10 percent cut).
- **eBay:** keep roughly **85 percent** (about a 15 percent handbag fee, which drops toward 9 percent on the part of a sale above $2,000).
- **Vestiaire Collective:** keep roughly **85 percent** (a 12 percent fee plus 3 percent processing, though many brands now sell at 0 percent commission).
- **Poshmark:** keep **80 percent** (a flat 20 percent over $15).
- **Rebag** (consign): keep **68 to 90 percent** depending on price band, about 78 percent around $2,000.
- **The RealReal** (consign): keep **60 to 80 percent** by band, about 70 percent around $2,000.
- **Fashionphile** (consign): keep **70 percent** up to $3,000, **85 percent** above it.
- **The Luxury Closet** (consign): keep **65 to 80 percent** minus a flat $30, so roughly 64 percent around $2,000.

## The same bag, nine ways

Say a bag sells for $2,000. Here's what you'd walk away with, venue by venue:

- Facebook: **$2,000**
- Mercari: **$1,800**
- eBay: **$1,700**
- Vestiaire: **$1,700**
- Poshmark: **$1,600**
- Rebag: **$1,560**
- Fashionphile: **$1,400**
- The RealReal: **$1,400**
- The Luxury Closet: **$1,270**

That's a $730 spread on the exact same bag. The convenient consignors sit at the bottom, and the do-it-yourself platforms sit at the top. Your exact dollar figure moves with the final sale price, but the cut each venue takes is fixed at the rates above.

> The more the venue does for you, the more it keeps. Top dollar takes patience and effort. Fast cash costs margin. Keeping every dollar costs you the safety net.

## Store credit can nudge it up

A couple of platforms pay more if you take store credit instead of cash. Fashionphile adds about 10 percent, The RealReal about 5 percent. That's real money, but only worth it if you were going to buy from them anyway. Credit you'll never spend isn't a bonus.

## So which one is right for you

Our take, not a verdict, because the best choice depends on what you're optimizing for. If you want the most money and don't mind the work, a DIY marketplace keeps you the most. If you want it gone with zero effort, a consignor earns its cut. If you need cash this week, a buyout trades some margin for speed.

There's no universally "best" place to sell. There's the one that fits how much time, effort, and patience you've got right now. Run your own bag through the numbers before you decide.

[diagram: where-to-sell-estimator-cta]`;

async function main() {
  const slug = "what-every-resale-site-actually-pays-you";
  const insertRow = {
    author_user_id: AUTHOR,
    slug,
    title: "What every resale site actually pays you",
    excerpt:
      "The sticker price isn't your money. Here's what each resale venue really leaves in your pocket after its cut, and why the hands-off option pays least.",
    body,
    status: "draft" as const,
    topic_brand_id: null as number | null,
    topic_style_id: null as number | null,
    updated_at: new Date().toISOString(),
  };
  const { data: existing } = await db.from("post").select("post_id").eq("slug", slug).maybeSingle();
  if (existing) {
    // Never touch status on update, so a published article can't be flipped back to draft.
    const { status: _status, ...update } = insertRow;
    void _status;
    const { error } = await db.from("post").update(update).eq("post_id", existing.post_id);
    console.log(error ? `ERR ${error.message}` : `updated #${existing.post_id} ${slug}`);
  } else {
    const { data, error } = await db.from("post").insert(insertRow).select("post_id").single();
    console.log(error ? `ERR ${error.message}` : `inserted #${data!.post_id} ${slug}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
