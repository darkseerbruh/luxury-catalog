/**
 * "Luxury diaper bags, honestly ranked" (2026-07-02): the diaper-kit article,
 * published so the kit's search key can pin it (key "luxury diaper bags" in
 * src/lib/social-search-keys.ts; owner cleared recording, article was the last
 * DRAFT blocker flagged by the pipeline session).
 *
 * NEVER-INVENT: body from docs/research-drafts/trend-articles/
 * luxury-diaper-bags-honestly-ranked.md with numbers refreshed against prod
 * 2026-07-02 (post-sweep samples; ns and as-of dates inline). Both [VERIFY]
 * brackets resolved to buyer-side advice ("check the exact listing"), no claim
 * invented. Ophidia Medium keeps the late-June family read ($1,250, n=155); the
 * July tote-only sample (n=7) is too thin to supersede it.
 *
 *   npx tsx supabase/seed/seed-diaper-article.ts
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const body = `TikTok is full of push-present energy right now, and underneath it the same four questions keep coming up. Does it fit bottles and a changing mat. Does it wipe clean. Will the canvas survive daycare drop-off. And what does it sell for when the diaper years end.

Nobody hands you a bag with those answers attached, so here they are. Ranked, with a quick verdict per bag, prices as our dated estimates from resale comps, never an appraisal.

**How we ranked:** Capacity for actual baby cargo, cleanability, durability under daily abuse, and what it holds on resale. Looks were the tiebreaker, not the test.

## 1. Goyard Saint Louis

> Quick verdict: The status pick, and lighter than it looks. Buy it knowing the care question is real.

The Saint Louis is the bag driving the "goyard diaper bag" search: an open-top canvas tote in the house's chevron-print Goyardine, famously light on the shoulder even loaded. The GM is the bigger of the two everyday sizes and swallows bottles, a changing mat, and a wubby with room left over.

The honest part TikTok keeps asking about:

- **The care question, answered.** The Goyardine canvas itself is resin-coated linen and cotton, waterproof by design per Maison Goyard. The part that ages is the trim and handles: Natural leather that marks and darkens with handling. Spills wipe off the body; hand cream and rain live on in the handles.
- **No zip, minimal structure.** It slouches open. Great for one-handed grabs, less great for a bag that tips over in the stroller basket.
- **What the market asks:** Our read from dated comps, preloved asking medians of about **$2,465** for the PM (n=189) and **$2,495** for the GM (n=90), observed through July 2, 2026. Asking, not realized, so treat it as the ceiling, not the check. Strongest name recognition on this list, which matters when you sell.

## 2. Louis Vuitton Neverfull

> Quick verdict: The practical default. Coated canvas that shrugs off spills, with one weak point to know about.

The Neverfull is the workhorse behind the "louis vuitton diaper bag" search. The Monogram coated canvas wipes clean with a damp cloth, the side laces cinch it shut-ish, and the MM comfortably takes bottles, a mat, and a snack bag.

Know this before daycare: The handles and trim on the classic Monogram version are vachetta, the pale natural leather that water-spots and darkens. Hand sanitizer and rain are its enemies, not the baby. Trim varies by colorway and season, so check the exact listing you're buying.

- **The number nobody says out loud:** Preloved Monogram MMs ask a median of about **$1,565** (n=913, July 2, 2026), but the realized eBay sales we track landed at a median of about **$770** (n=87, observed through late June 2026). Both are our estimates from dated comps, not appraisals. The gap is the negotiating room. The Neverfull is one of the most liquid bags on the secondary market, so exiting after the toddler years is easy; just anchor on the sold number, not the sticker.

## 3. Louis Vuitton OnTheGo

> Quick verdict: The bigger, more structured sibling. Better as a bag that stands up and stays organized.

The OnTheGo GM is roomier and more architectural than the Neverfull, with double handles so it works on the shoulder or in hand. In Monogram Empreinte, the embossed leather version, there is no vachetta to baby, which quietly solves the Neverfull's weak point. Material varies by size and season, so confirm what your exact listing is cut from.

The tradeoff is weight. Empreinte leather is heavier than canvas before you add a single bottle.

- **A quiet market quirk:** In our dated comps the biggest size asks the least. GM median about **$2,350** (n=263), MM about **$2,541** (n=261), both July 2, 2026; PM about $2,695 (n=115, late June). Estimates from asking prices, not appraisals, and good news if the GM is the size the diaper years actually need.

## 4. The Gucci route

> Quick verdict: Not a product line. A regular Gucci tote doing diaper duty, and that's the point.

"Gucci baby bag" on TikTok mostly does not mean a Gucci-made diaper bag, even though one exists: Gucci does sell an official GG Supreme baby changing bag with a padded mat (confirmed at retailers, July 2026). What the videos actually show is moms carrying an Ophidia tote or a large GG canvas tote as the diaper bag, which is a genuinely smart move: The GG Supreme canvas is coated, so it wipes clean, and a Medium or Large Ophidia holds real cargo.

Why people do it instead of buying the dedicated changing bag:

- The tote outlives the diaper years. No changing-pad pockets to feel silly about later.
- Preloved Ophidia totes run under the Goyard and LV asking prices above: Medium at a median of about **$1,250** (n=155) in our dated comps, observed late June 2026. The Large asks about $1,883 but on a thin n=16, so read that one loosely. Estimates from asking prices, not appraisals.

## When a real diaper bag wins

Fashion is subjective and we don't judge, so this is our take, not a rule. A purpose-built diaper bag is the better call if any of these describe you:

- You want **insulated bottle pockets** and a **changing pad included**, not improvised.
- You need **stroller clips** and a bag that clips on securely.
- You want to **machine-wash the whole thing** after a blowout, no leather anxiety.

The luxury tote wins when the bag needs to keep being your bag at pickup, at brunch, and after the kid starts school. Both are valid. Buy the one that removes stress, not the one that adds it.

## What they're worth when the diaper years end

Every figure here is an estimate from dated resale comps, not an appraisal. The short version, from our comps observed late June through July 2, 2026: The Saint Louis holds the highest preloved asking prices of this list (about $2,465 to $2,495 across sizes), the OnTheGo sits in the mid $2,000s with the odd twist that bigger asks less, the Neverfull MM asks about $1,565 but actually sells closer to $770 in the realized sales we track, and the Ophidia Medium is the value entry at about $1,250. Asking prices are ceilings; the Neverfull is the only one here where we hold realized sold data, and the gap it shows is worth remembering when you read the others.

Condition drives the number. A tote that spent two years as a diaper bag usually grades a tier or two below closet-kept, so read the comps for your bag's actual condition, not the pristine one in the listing photos.

## Where to buy one preloved

Buying preloved is the smart-money move here twice over: You pay under retail going in, and you already know the resale exit because you just shopped it. Check the live listings and current asking prices for each of these bags through the links below this article. Prices there update as the market moves.`;

async function main() {
  const slug = "luxury-diaper-bags-honestly-ranked";
  const { data: existing } = await db.from("post").select("post_id").eq("slug", slug).maybeSingle();
  const { brandId, styleId } = await resolveTopic("Louis Vuitton", "Neverfull");
  const content = {
    author_user_id: AUTHOR,
    slug,
    title: "Luxury diaper bags, honestly ranked",
    excerpt:
      "The four luxury totes moms actually use as diaper bags, ranked for baby cargo, cleanability, and what they hold on resale, with dated asking and sold medians for each.",
    body,
    topic_brand_id: brandId,
    topic_style_id: styleId,
    updated_at: new Date().toISOString(),
  };
  if (existing) {
    const { error } = await db.from("post").update(content).eq("post_id", existing.post_id);
    console.log(error ? `UPDATE ERR ${error.message}` : `updated #${existing.post_id} ${slug} (status preserved)`);
  } else {
    const { data, error } = await db
      .from("post")
      .insert({ ...content, status: "published" as const, published_at: new Date().toISOString() })
      .select("post_id")
      .single();
    console.log(error ? `INSERT ERR ${error.message}` : `published #${data!.post_id} ${slug}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
