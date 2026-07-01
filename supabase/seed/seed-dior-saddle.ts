/**
 * Seed the "Dior Saddle is back" DRAFT article (Data lane, 2026-06-26). Idempotent by slug.
 * Figures from prod price_history 2026-06-26 + Trends set 4. Reuses the existing
 * ask-vs-sold-gap chart. Status 'draft' — owner publishes.
 *   npx tsx supabase/seed/seed-dior-saddle.ts
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864";

const body = `The Dior Saddle had a whole life before it had this one. It launched in 1999, became the bag of the early 2000s, disappeared, and came back in 2018 to a second act that has not slowed down. The search data says it is still climbing: among accessible-tier designer bags, Google interest over the last year puts the Saddle **second only to the Louis Vuitton Speedy**, ahead of both the Neverfull and the Gucci Marmont. That is demand, and demand is what holds a resale price up.

So what does it cost. On the premium resellers, a Saddle lists at a **median around $2,895** (n=254). On eBay, completed sales land at a **median near $1,652** (n=82). Both numbers are ours, captured June 2026.

[diagram: ask-vs-sold-gap]

The gap between the two is the usual asking-versus-sold spread, plus venue: the premium resellers authenticate and price at the top, eBay runs cheaper. For a buyer, that means the sold figure is the real target and the ask is where you start. For a seller, it means the Saddle moves, but price it toward what it closes at, not the top listing.

> Worth knowing: most of the volume is the medium Saddle in coated canvas or calfskin. The mini and the oblique-canvas versions trade in their own bands, and exotic or limited colorways sit well above these medians. Read $1,650 to $2,900 as the center of the everyday-Saddle market, an estimate, not an appraisal of any one bag.

## Is it worth buying now

Our take, not a directive: the Saddle is one of the safer accessible-luxury buys on the data we have. Demand is rising rather than fading, supply on the secondary market is healthy, and the sold prices have held in a tight band rather than sliding. If the shape is one you actually want to carry, the resale market is on your side. If you are buying purely as an investment, know that "holding value" is not the same as "appreciating," and a fashion bag is never a sure thing.`;

async function main() {
  const slug = "dior-saddle-resale-price";
  // Topic tag = Dior Saddle, resolved by name so the CTA is id-independent.
  const { brandId, styleId } = await resolveTopic(["Christian Dior", "Dior"], "Saddle");
  const row = {
    author_user_id: AUTHOR, slug,
    title: "The Dior Saddle is back. Here is what it costs now",
    excerpt: "Google searches put the Dior Saddle second only to the Speedy among accessible-tier bags right now. Our pricing data shows what it asks, what it sells for, and the gap between the two.",
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
