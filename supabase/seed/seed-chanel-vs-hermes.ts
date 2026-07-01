/**
 * Seed the "Chanel vs Hermès: two opposite ways to hold value" article
 * (Content lane, 2026-06-30). Idempotent by slug (upsert). Owner asked to PUBLISH
 * this one, so it seeds as status 'published' with a published_at; re-running keeps
 * it published. Run against the REAL service-role key (.env.local), a prod write.
 *
 *   npx tsx supabase/seed/seed-chanel-vs-hermes.ts
 *
 * Topic tag (for the money-moment CTA + "shop this bag") = Chanel Classic Flap,
 * resolved by name at runtime so it is correct regardless of the row ids. If the
 * lookup misses, the tag falls back to null and the CTA simply doesn't render.
 *
 * Factuality (docs/preferences.md content protocol): retail figures are third-party
 * 2026 price trackers (Hermès prices in EUR → FX caveat); resale is our own June 2026
 * listing tracking (Birkin 30 n=121); the decade appreciation is Rebag's 2025 Clair
 * report. Everything framed as an estimate of the market, not a forecast or appraisal.
 * Sources named in-body: luxuryevermore + Sotheby's (Chanel history), awisee/XIAOMA
 * (Birkin YoY), Rebag Clair via Robb Report. Chart self-contained: [diagram: chanel-hermes-hold].
 */
import { supabaseAdmin as db } from "./lib/client";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const slug = "chanel-vs-hermes-two-ways-to-hold-value";

const title = "Chanel vs Hermès: two opposite ways to hold value";

const excerpt =
  "A used Chanel Flap costs less than a new one. A used Birkin costs more. Both houses hold value, but through opposite levers: Chanel raises retail, Hermès restricts the door. The math, dated and sourced.";

const body = `Buy almost anything secondhand and it costs less than new. That is the whole idea of used. Two of the most value-stable bags in the world break that rule, in opposite directions, and the split says a lot about how each house works.

A **Chanel Classic Flap** behaves the way you would expect. New, the medium retails around **$11,700** in 2026. On the resale market it trades around **$6,000**. Used is roughly half of new. Normal.

A **Hermès Birkin 30** does the reverse. New, retail is around **$14,900** in 2026. On resale it trades around **$18,000**. The used bag costs more than the new one. That is not a typo, and it is not a fluke: it is how the Birkin has worked for years.

[diagram: chanel-hermes-hold]

Both bags hold value. Both are the answer people reach for when they want a bag that will not crater. But they get there through opposite levers, and knowing which lever is which changes how you should buy each one.

## Chanel manufactures value with the price tag

Chanel's method is the price increase. The medium Classic Flap has climbed from about **$2,850 in 2010 to about $11,700 in 2026** (per luxuryevermore's price history and auction records at Sotheby's). That is roughly **9 to 10 percent a year**, and the bag has come close to doubling in some five-year stretches. Every retail hike drags the resale floor up with it, because a preowned Flap is priced against a boutique bag that keeps getting more expensive.

One thing keeps resale below retail. You can still walk into Chanel and buy a Flap. Supply is open, so a preowned one competes with a brand-new bag on the shelf, and it competes the only way it can, on price. That is why used sits **below** new. The Flap holds value because the anchor it is tied to, the retail price, keeps rising, not because the secondhand market is starved.

## Hermès manufactures value with the door

Hermès raises prices too, but more gently. The Birkin 30 went from about **$10,900 in 2018 to about $14,900 in 2026** (per awisee's and XIAOMA's year-over-year tracking), mostly single-digit yearly bumps, with one sharper jump of about **16 percent in 2024**. On retail alone, the Birkin has been the calmer of the two.

The lever is not the price. It is access. You generally cannot just buy a Birkin. Hermès sells them by allocation, which means the store decides who gets offered one, usually after a long relationship and spending across other categories first. The informal ceiling many clients describe is about **two quota bags a year**, a "quota bag" being one of the house's most sought-after styles that clients are limited on. The wait, the relationship, the spend: that is the door.

When the front door is that narrow, the resale market becomes the real market. A buyer who wants a Birkin now, without the years of courtship, pays whatever the secondhand price is, and that price sits **above** retail. Per Rebag's 2025 Clair report (covered by Robb Report), the Birkin appreciated roughly **92 percent over the last decade** on the resale market. Scarcity, not the price tag, did that work.

## Same reputation, opposite math

> Chanel raised its price faster and still sells used below retail. Hermès raised its price slower and sells used above retail. The difference is not how much each bag costs, it is whether you can buy one new. Price pulls the Flap up from below; scarcity pulls the Birkin up from above.

The "holds value" label hides two different machines. Chanel manufactures value with the price tag: Keep raising retail, and the whole market rises with it. Hermès manufactures value with the door: Keep access scarce, and the secondhand price becomes the only price that matters.

## What that means if you are buying

- **Want a Flap?** Buying used saves real money, usually close to half off retail, and you are not missing anything by skipping the boutique. The resale bag is the value play.
- **Want a Birkin?** Used is not a discount. It is the price of skipping the line. Paying above retail on resale is the normal cost of getting one without the multi-year relationship, and plenty of buyers decide that is worth it.
- **Either way,** the "investment" framing oversells it. These are two of the sturdier bags to own, but a resale price is a snapshot of today's market, not a promise about tomorrow.

## A note on these numbers

New retail figures come from third-party price trackers as of 2026, not from Chanel or Hermès directly. Hermès sets Birkin prices in euros, so the dollar figure moves with the exchange rate and should be read as an approximation. The used figures are our own tracking of live listings in June 2026 (the Birkin 30 resale figure rests on 121 listings). The decade appreciation figure is Rebag's, from its 2025 Clair report. Read all of it as an estimate of the market, not a forecast, and not an appraisal of any one bag.`;

async function resolveTopic(): Promise<{ brandId: number | null; styleId: number | null }> {
  const { data: brand } = await db
    .from("brand")
    .select("brand_id")
    .ilike("name", "Chanel")
    .maybeSingle();
  const brandId = brand?.brand_id ?? null;

  let styleId: number | null = null;
  if (brandId) {
    const { data: style } = await db
      .from("style")
      .select("style_id")
      .eq("brand_id", brandId)
      .ilike("name", "Classic Flap")
      .maybeSingle();
    styleId = style?.style_id ?? null;
  }
  return { brandId, styleId };
}

async function main() {
  const { brandId, styleId } = await resolveTopic();
  console.log(`topic → Chanel brand_id=${brandId ?? "null"}, Classic Flap style_id=${styleId ?? "null"}`);

  const { data: existing } = await db.from("post").select("post_id, published_at").eq("slug", slug).maybeSingle();
  const now = new Date().toISOString();
  const row = {
    author_user_id: AUTHOR,
    slug,
    title,
    excerpt,
    body,
    status: "published" as const,
    topic_brand_id: brandId,
    topic_style_id: styleId,
    published_at: existing?.published_at ?? now,
    updated_at: now,
  };

  if (existing) {
    const { error } = await db.from("post").update(row).eq("post_id", existing.post_id);
    console.log(error ? `UPDATE ${slug} ERR ${error.message}` : `updated + published #${existing.post_id} ${slug}`);
  } else {
    const { data, error } = await db.from("post").insert(row).select("post_id").single();
    console.log(error ? `INSERT ${slug} ERR ${error.message}` : `inserted + published #${data!.post_id} ${slug}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
