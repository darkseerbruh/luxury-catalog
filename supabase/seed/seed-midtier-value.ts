/**
 * Seed "which accessible-luxury bags hold value" DRAFT (Data lane, 2026-06-26). Idempotent by slug.
 * Figures = our eBay sold capture, prod price_history 2026-06-26, with n. Chart: MidTierHoldsValueChart.
 * Status 'draft' — owner publishes.
 *   npx tsx supabase/seed/seed-midtier-value.ts
 */
import { supabaseAdmin as db } from "./lib/client";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864";

const body = `The fun of the hunt is finding a real designer bag for cheap. The smart part is knowing which ones are worth carrying home to resell and which ones barely move. We pulled the actual sold prices, not the hopeful listings, for the accessible-brand bags people thrift most.

The spread is wider than most people expect.

[diagram: midtier-holds-value]

At the top, a **Mulberry Bayswater** sells at a median around **$519** (n=93) and a **Coach Rogue** around **$645** (n=88). These are heritage leather bags, structured, made in real numbers but not endless ones, and the resale market rewards them.

At the bottom, the everyday logo and nylon bags sell for a fraction. A **Michael Kors Jet Set** tote lands near **$70** (n=55), a **Longchamp Le Pliage** near **$90** (n=69), a **Kate Spade Sam** near **$100** (n=50) and a **Kate Spade Knott** near **$114** (n=86). The **Coach Tabby**, the current logo darling, sits in the middle at about **$198** (n=177), well under what the Rogue brings from the same brand.

## The pattern: leather and restraint hold, logo and nylon do not

Two things separate the holders from the rest.

**Material.** The bags that keep value are structured leather. The ones that do not are coated canvas and nylon. Leather reads as an investment, nylon reads as a commuter bag, and the resale market prices that difference plainly.

**Volume and trend.** The Bayswater and the Rogue are heritage shapes made steadily over years. The Jet Set, the Le Pliage and the logo totes are produced in enormous numbers and sold new at frequent discounts, so the secondary market never gets tight. A bag that is always available new for $150 cannot hold $300 used.

## What to do with it at the thrift rack

- **Grab on sight:** Mulberry leather, the Coach Rogue and other structured leather satchels. These clear $400 and up when they are clean.
- **Only if it is cheap or you will carry it:** Michael Kors, Longchamp nylon, Kate Spade, and the canvas Coach Tabby. They are lovely bags, but the resale ceiling is low, so the margin has to come from a very low buy price.
- **Either way, condition is everything down here.** With sold prices this compressed, a stain or a worn corner is the difference between a flip and a wash.

> What these numbers are: median sold prices from recent eBay completed sales, captured June 2026, each with its sample size. Most sit below the $500 line, so they are peer-to-peer market prices, not authenticated-reseller comps. Read them as the center of gravity for each bag, an estimate, not an appraisal of any one piece.`;

async function main() {
  const slug = "which-accessible-bags-hold-value";
  const row = {
    author_user_id: AUTHOR, slug,
    title: "Which accessible-luxury bags actually hold their value",
    excerpt: "We pulled the real sold prices for the bags people thrift and flip. The gap is huge: a Mulberry Bayswater holds around $519, a Michael Kors Jet Set around $70. Here is what holds and what does not.",
    // Multi-brand thrift roundup (Mulberry, Coach, MK, Longchamp, Kate Spade) with no
    // single subject: no topic anchor (the old literal brand_id 2 was a drifted guess).
    body, status: "draft" as const, topic_brand_id: null as number | null, topic_style_id: null as number | null,
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
