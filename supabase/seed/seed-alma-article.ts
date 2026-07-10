/**
 * LV Alma value article (2026-07-10). Owner said "just post it" → PUBLISHED on insert.
 *
 * NEVER-INVENT: every price is an asking-price median from our own price_history
 * (pulled 2026-07-10, deduped by listing_ref; n + as-of date inline). Alma origin
 * (1934, Place de l'Alma, Gaston-Louis Vuitton) is the article-#34-verified heritage
 * anchor; materials + size ladder are well-established; nothing else asserted. Value
 * framing: estimate from dated comps, asking not sold, never an appraisal.
 *
 * Idempotent by slug. Status is set on INSERT only (published); re-runs refresh copy
 * WITHOUT touching status, and leave the body untouched unless --force-body (the DB is
 * canon once the owner edits on-site).
 *
 *   npx tsx supabase/seed/seed-alma-article.ts [--force-body]
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const body = `The Louis Vuitton Alma is the structured, dome-shaped one. Rounded silhouette, a top handle, a zip that runs the curve of the top. If you have seen a Louis Vuitton bag that looks a little like a small doctor's bag standing upright, that is usually the Alma.

It is one of the house's oldest designs. It traces back to 1934, shaped under Gaston-Louis Vuitton and named for the Place de l'Alma in Paris. Nearly a century later it is still in production, which tells you most of what you need to know about whether the shape dates.

## What the Alma actually is

A few things stay true across every version:

- **The silhouette:** A firm, rounded dome with a flat base, a short top handle, and a top zip. It holds its shape whether it is full or empty.
- **The materials:** It is made across Epi leather, Monogram canvas, Damier, and the glossy Monogram Vernis. The Epi leather version is the heritage one, the original material the shape launched on.
- **The size ladder:** Nano and BB at the small end, up through PM, MM, and GM. That range is why one "Alma" can ask four figures at the low end and several thousand at the top.

## How to read the numbers below

Before the prices, the honest caveat. These are **asking prices**, what the resale market is listing the Alma for right now, not a record of what each one sold for. Most of our sources here are fixed-price (Fashionphile, The Luxury Closet, The RealReal), so asking sits close to what changes hands, but it is still an ask, not a sold receipt.

Two more things. We deduped by listing, so the same bag showing up twice is not counted twice. And the median is the honest middle of the range, not a floor and not a ceiling. The ranges below are wide because material and condition swing hard: a well-loved vintage Monogram, a crisp Epi, and a pristine exotic-look Vernis are three very different bags wearing the same name.

Read this as an estimate of where the market is pricing each size, not an appraisal of any one bag.

## The Alma on resale, by size

Median asking price by size, deduped by listing, our catalog as of 2026-07-10 (asking, not sold):

[diagram: alma-size-chart]

Here is the shape of it. The **BB** and the smaller sizes sit at the top of the asking range, the small, most-photographed shapes carry the want premium. The **PM** and **MM** are the value sizes, the everyday shapes asking the least per bag. And the big vintage totes, the **GM** and **MM**, ask surprisingly little, often less than the palm-sized BB above them.

> The smallest Alma is not the cheapest. The BB asks nearly double the PM, and the tote-sized GM asks less than the little BB. Size tracks desire here, not leather.

## Which size is the value play

This is our take, not a verdict on what you should carry.

If you want the most bag for the least money, the **PM** is the quiet answer. At a median around $895 it is the lowest ask on the ladder, and it is a genuinely usable size, a true handbag rather than a going-out mini. The **MM** and **GM** sit close behind if you want more room, and those larger vintage totes are where the market is arguably underpricing the bag.

If the small, structured look is the whole point, the **BB** is the one people reach for, and the ask reflects that. You are paying for the shape everyone photographs, not for more materials. That is a fair trade if it is the version you actually love, just go in knowing that is what the premium buys.

The Alma is one of those designs where the number you pay depends far more on size and material than on the name. Know which size you are really after, check the condition against the ask, and the rest is taste.`;

const POST = {
  slug: "louis-vuitton-alma-what-its-worth",
  title: "The Louis Vuitton Alma: What it is, and what it costs on resale",
  excerpt:
    "The structured LV icon, size by size. What the Alma asks on resale from the value PM to the premium BB, with the median and n for each, framed as asking, not sold.",
  body,
  brand: "Louis Vuitton",
  style: "Alma",
};

async function main() {
  const { data: existing } = await db.from("post").select("post_id").eq("slug", POST.slug).maybeSingle();
  const { brandId, styleId } = await resolveTopic(POST.brand, POST.style);
  const content: Record<string, unknown> = {
    author_user_id: AUTHOR,
    slug: POST.slug,
    title: POST.title,
    excerpt: POST.excerpt,
    body: POST.body,
    topic_brand_id: brandId,
    topic_style_id: styleId,
    updated_at: new Date().toISOString(),
  };
  if (existing) {
    if (!process.argv.includes("--force-body")) {
      delete content.body;
      console.log("(body left untouched — DB is canon; pass --force-body to overwrite)");
    }
    const { error } = await db.from("post").update(content).eq("post_id", existing.post_id);
    console.log(error ? `UPDATE ERR ${error.message}` : `updated #${existing.post_id} ${POST.slug} (status preserved)`);
  } else {
    const { data, error } = await db
      .from("post")
      .insert({ ...content, status: "published" as const, published_at: new Date().toISOString() })
      .select("post_id")
      .single();
    console.log(error ? `INSERT ERR ${error.message}` : `published #${data!.post_id} ${POST.slug}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
