/**
 * Seed the "Neverfull vs Speedy" DRAFT comparison article (Content/Data lane, 2026-06-27).
 * Idempotent by slug. Figures from our prod price_history (asking = TheRealReal +
 * Fashionphile 'listed', sold = eBay completed 'sold'), captured June 2026 with n, plus the
 * Google Trends pull in docs/research-drafts/trends-keyword-pull.md (sets 3 and 5). The chart
 * [diagram: neverfull-speedy-chart] self-updates from prod; prose figures are kept honest by
 * the drift check (docs/article-freshness-report.md).
 *
 * This article is already LIVE (post_id 10, slug louis-vuitton-neverfull-vs-speedy), so this
 * seed is idempotent AGAINST that row: on an existing row it patches only the topic tag +
 * updated_at (never the status or body), so re-running can't unpublish or clobber live content.
 * A fresh insert (no row yet) goes in as a draft for the owner to publish.
 *   npx tsx supabase/seed/seed-neverfull-speedy.ts
 */
import { supabaseAdmin as db } from "./lib/client";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const body = `The Neverfull and the Speedy are the two Louis Vuitton bags most people start with. Both are everyday totes in the house's coated canvas, both sit at the accessible end of the brand, and shoppers almost always cross-shop them. So which one actually holds up better on the resale market? We pulled the search data and our pricing data, and the answer is not the one the listings suggest.

Start with attention, because attention is what props a resale price up. Over the last year, Google search interest in the United States puts the **Speedy well ahead of the Neverfull** (an index of about 27.8 against 17.9 on Google Trends, June 2026). Stretch the window to five years and the gap matters more: the Speedy is rising while the **Neverfull is the one Louis Vuitton icon fading** over that span. On demand alone, the Speedy looks like the stronger bag right now.

## What they ask vs what they sell for

Now the prices. On the premium resellers the two ask in much the same band: the **Speedy 30 lists at a median around $1,623** (n=82, June 2026), a touch above the **Neverfull MM at about $1,500** (n=336). So on attention and on the asking tag, the Speedy is at least the Neverfull's equal.

But a listing price is a hope, not a sale. Look at what each bag actually closes at on eBay completed sales, and the order reverses:

[diagram: neverfull-speedy-chart]

The **Neverfull MM sells at a median near $770** (n=87). The **Speedy 30 sells near $566** (n=93). The bag that lists higher sells for less. Across all its sizes the Speedy realizes about $593 (n=146), still under the Neverfull. The Neverfull is the better value holder of the two, even as it loses the search race.

> The useful takeaway sits in the gap between the two bars. Both bags ask far above what they fetch: the Neverfull MM lists around $1,500 and sells near $770, the Speedy 30 lists around $1,623 and sells near $566. The asking price is where a seller starts. The sold price is the market.

Part of that ask-to-sold spread is venue. The premium resellers authenticate and price at the top; eBay's peer-to-peer sales run cheaper. But the spread is wide enough on both bags that a buyer has real room below any listing.

## Why the Neverfull holds better

The Neverfull is an open, unstructured tote that buyers treat as a daily workhorse, and the secondhand market for it is deep and steady. The Speedy's resale is softer despite the search heat: more of its volume is the smaller, more fashion-led sizes and a wider range of conditions, which drags the realized median down. High search interest signals desire, but desire only holds a price when supply does not flood past it.

## What to do with this

- **Buying either preowned:** treat the sold band as the real market. Around $770 is the Neverfull MM, around $566 the Speedy 30. There is room to offer below the listing.
- **Buying for value retention:** between these two, the Neverfull MM holds a higher resale floor in our data.
- **Selling either:** price toward what it closes at, not the top listing, if you want it to move.

These are realized eBay sold prices and premium-reseller asking prices we captured in June 2026, each with its sample size. Condition is not recorded on every listing, so read each figure as a center of gravity for what the bag trades at, an estimate, not an appraisal of any one bag. Demand can shift, and a popular bag today is not a guaranteed value tomorrow.`;

/**
 * Resolve the topic tag by NAME at runtime so it is correct regardless of row ids
 * (in prod, hardcoded brand_id 1 / style_id 1 are actually Chanel / Classic Flap,
 * not LV / Neverfull, which mis-routed the money-moment CTA). Falls back to null so
 * the CTA degrades gracefully if the lookup misses.
 */
async function resolveTopic(): Promise<{ brandId: number | null; styleId: number | null }> {
  const { data: brand } = await db.from("brand").select("brand_id").ilike("name", "Louis Vuitton").maybeSingle();
  const brandId = brand?.brand_id ?? null;
  let styleId: number | null = null;
  if (brandId) {
    const { data: style } = await db
      .from("style")
      .select("style_id")
      .eq("brand_id", brandId)
      .ilike("name", "Neverfull")
      .maybeSingle();
    styleId = style?.style_id ?? null;
  }
  return { brandId, styleId };
}

async function main() {
  const slug = "louis-vuitton-neverfull-vs-speedy"; // the live article's slug (post_id 10)
  const { brandId, styleId } = await resolveTopic();
  console.log(`topic → Louis Vuitton brand_id=${brandId ?? "null"}, Neverfull style_id=${styleId ?? "null"}`);
  const now = new Date().toISOString();
  const { data: existing } = await db.from("post").select("post_id").eq("slug", slug).maybeSingle();
  if (existing) {
    // Live row: patch ONLY the topic tag (the fix) + updated_at. Never touch status or
    // body, so this can't unpublish or overwrite hand-edited live content.
    const { error } = await db
      .from("post")
      .update({ topic_brand_id: brandId, topic_style_id: styleId, updated_at: now })
      .eq("post_id", existing.post_id);
    console.log(error ? `ERR ${error.message}` : `retagged #${existing.post_id} ${slug} → brand ${brandId}/style ${styleId}`);
  } else {
    // Fresh insert only when the article does not exist yet: full content, as a draft.
    const { data, error } = await db.from("post").insert({
      author_user_id: AUTHOR,
      slug,
      title: "Neverfull vs Speedy: which Louis Vuitton holds value better?",
      excerpt:
        "The Speedy is searched more and lists higher. The Neverfull sells for more. We pulled the search data and our pricing data to show which Louis Vuitton tote actually holds up, and what each really costs.",
      body,
      status: "draft" as const,
      topic_brand_id: brandId,
      topic_style_id: styleId,
      updated_at: now,
    }).select("post_id").single();
    console.log(error ? `ERR ${error.message}` : `inserted #${data!.post_id} ${slug} (draft)`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
