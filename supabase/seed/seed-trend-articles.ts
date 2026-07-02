/**
 * Day-one trend articles (2026-07-02): the two pieces behind the first video
 * kits, published per the search-key routing standard (docs/social-routing.md).
 * Slugs MUST match src/lib/social-search-keys.ts (chanel 2026 / lv nine pin here).
 *
 * NEVER-INVENT: every price is an asking-price median from our own price_history
 * (pulled 2026-07-02; ns and as-of dates inline). Release facts verified
 * 2026-07-02 against primary or corroborated sources (chanel.com 1910 + Boy pages,
 * louisvuitton.com heritage for the Alma's 1934 origin); anything unconfirmed is
 * spoken as reported, or omitted. Value framing: estimate from dated comps, never
 * an appraisal.
 *
 * Idempotent by slug. Status is set on INSERT only (published: owner said
 * "publish" 2026-07-02); re-runs refresh copy without touching status.
 *
 *   npx tsx supabase/seed/seed-trend-articles.ts
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const chanelBody = `Chanel renamed half its lineup after numbers, TikTok is searching "chanel 25" nearly three million times a month, and the comment sections are a mess of people correcting each other. This is the clean version: what is actually new, what everything is called, and what the names mean.

## The Chanel 25, in plain terms

The Chanel 25 is the new everyday line the house introduced in 2025, and it is the bag behind the search spike. Think of it as the softer, lighter alternative to the Classic Flap: less structure, a relaxed body, built to be carried daily rather than babied. The line runs from a mini up to a large, plus a backpack.

Why it took off:

- It reads as Chanel without the stiffness of the Classic Flap, in the same everyday-soft lane the Chanel 22 opened in 2022.
- The search behind it is enormous: nearly three million monthly TikTok searches (TikTok Creative Center, pulled July 1, 2026).
- Preloved, the 25 asks a median around **$8,095**, ranging $6,295 to $9,995 (n=99, June 2026). New lines start with thin preloved supply, which tends to keep early asking prices firm.

## The maxi flap moment

The other new-season search is the oversized flap from Matthieu Blazy's first Chanel collection. Blazy, who previously ran Bottega Veneta, showed it for spring 2026, and creators report a Paris launch in early March with a worldwide release around March 13. We are treating those dates as reported until we can pin them down. Per TikTok, it has been carried by Dua Lipa, Hailey Bieber, Kendall Jenner, and Jennie, and people frame it as the end of the micro-bag era.

What the resale side shows so far:

- Maxi-size Classic Flaps ask a median around **$5,825**, under the medium's $7,156, but that read comes from just nine maxi listings against a thousand mediums (June 2026), so hold it loosely. Our estimate from dated comps, not an appraisal.

## Types of Chanel bags

The taxonomy people are actually searching for. Every one of these is a distinct line, not a size of the same bag. Asking medians below are from listings we tracked in late June 2026.

- **Classic Flap.** The quilted flap with the leather-woven chain and CC turn-lock. Sizes run mini (square and rectangular), small, medium (the default people mean), jumbo, and maxi. Medium asks around **$7,156** (n=1,018); small $7,595 (n=111); jumbo $6,620 (n=86).
- **Mini Classic.** Not a separate line, the smallest Classic Flap sizes. The rectangular mini is the one all over TikTok; the square mini is shorter and boxier. The rectangular mini read is thin, around $4,240 from four listings, so treat it as a sketch.
- **2.55.** The original, launched February 1955, which is where the name comes from. The tells versus a Classic Flap: a rectangular Mademoiselle turn-lock instead of the CC clasp, and a chain with no leather woven through. Asks around **$4,175** (n=494).
- **Boy.** The boxier, harder-edged flap from 2011, named for Arthur "Boy" Capel, Gabrielle Chanel's great love. Chunkier chain, masculine hardware plate. Asks around **$3,915** (n=2,122).
- **WOC.** Wallet on chain: a flat quilted wallet on a long chain, the price entry to the flap family. Asks around **$3,285** (n=877).
- **Chanel 22.** The soft, slouchy hobo launched in 2022, the line that started the number-names era. Asks around **$4,840** (n=87).
- **Chanel 25.** The 2025 everyday line covered above.
- **Totes.** The open-top side of the house, led today by the Deauville, which asks around **$3,320** (n=313). The old-guard GST is discontinued and lives preloved-only.

> If you remember one thing: since 2022 Chanel names new lines after the year they arrive. The 22, the 25. Birth years, not sizes.

## What "Chanel" actually means

Chanel is a surname. Gabrielle Chanel, nicknamed "Coco," opened her first shop in 1910, the "Chanel Modes" millinery on rue Cambon in Paris, and the house still lives on that street. The interlocked CC logo is her initials. No hidden meaning, no acronym, and honestly the real story is better: a woman's own name, still on the door a century later.

## What this does to resale

New lines pull attention, and attention moves the secondary market in both directions. Our read from the comps: the 25 currently asks above the medium Classic Flap preloved ($8,095 vs $7,156, June 2026), which is what thin new-line supply usually does. Whether it holds there once supply fills in is the question the next year answers, and anyone claiming to know already is guessing. Treat every number here as an estimate from dated comps within a condition tier, never a promise of what your bag is worth.

## Where to buy preloved

Preloved is where most of these bags actually change hands, and it is the only place to get a discontinued size or an early 22. Live listings and current asking prices for the bags in this article are linked below, and they update as the market moves.

> Every price above is an asking-price median from listings we tracked on the major resale sites, dated as shown. Condition, colour, and leather move any individual bag well off its median.`;

const lvBody = `There is a strange gap on TikTok right now. Nine Louis Vuitton models keep surfacing in search, seven of them with six-figure monthly volumes (TikTok Creative Center, pulled July 1, 2026), and almost nobody is making videos about them. Every one of the nine has fewer than 200 creators covering it.

That gap is this article. Nine bags, what each one actually is, who it suits, and what the preloved market says. All prices are our asking-price estimates from dated comps, not appraisals, with the sample size and date sitting next to every number.

## Liv Pochette

When TikTok searches "lv pochette," the bag people increasingly mean is the Liv Pochette, one of LV's newer named models. It sits in the pochette family next to the Accessoires, the Metis, and the Eva. Suits anyone who wants a compact, current entry into monogram.

- **Preloved read:** thin so far, median around **$1,895**, ranging $1,795 to $2,995 (n=5, July 2026). Hold it loosely until supply builds.

## Pochette Accessoires

The little monogram pouch on a strap that the 90s carried and the 2020s brought back. It fits a phone, a cardholder, and lip balm, and that is the whole job. It also doubles as a pouch inside a bigger tote.

- **Preloved read:** median around **$675** (n=53, June 2026), the cheapest true-bag entry into monogram on this list.

## Boulogne

A rounded-shoulder monogram bag with a braided-detail strap on the current version, quietly one of LV's best everyday shapes. It sits close to the body and zips fully shut, which anyone who has ridden a subway with a flap bag will appreciate. Vintage 30 and 35 sizes from the 90s circulate too.

- **Preloved read:** the current version asks around **$2,263** (n=10, July 2026); across all versions about $2,230 (n=24). The one vintage 35 we tracked asked $750, the budget door into the shape.

## Montsouris backpack

The monogram drawstring backpack from the 90s, reissued in modern sizes. Hands-free, holds a water bottle and a light layer, which is why the TikTok on it is all commuters and moms. The quiet money angle our data confirms: the vintage sizes still ask well under the modern ones. Inspect condition on a decades-old bag.

- **Modern PM:** around **$1,995** (n=11, July 2026).
- **Vintage MM:** around **$995** (n=12); vintage GM around $1,195 (n=7). Roughly half the modern ask for the same silhouette.

## Slouchy

Exactly what the name says: a soft, unstructured monogram hobo that collapses against your side instead of holding a shape. If you love the Chanel 22 but live in the LV universe, this is your lane. It is a newer line, and preloved supply is genuinely thin, with the MM the size that actually surfaces.

- **Preloved read:** the MM asks around **$2,410** (n=10, July 2026); the PM barely surfaces, one listing at $2,570.

## CarryAll

The curved-top monogram tote that zips closed, which the Neverfull famously does not. It is the do-everything bag in the current lineup: work, weekend, the gym you keep meaning to go to. Sizes and closure details vary by version, so confirm the exact one in your listing.

- **Preloved read:** the PM asks around **$3,065** from a thin twenty listings (July 2026), so hold that number loosely.

## Cosmetic pouch

The round-topped little monogram pouch sold as a makeup bag, famous on TikTok for the conversion: add an aftermarket chain and it becomes a mini bag for a fraction of a mini bag's price. Two honest notes: it was never built to be worn, so the leather trim takes strap stress it was not designed for, and a modification can affect resale. Know both tradeoffs and want it anyway? We don't judge.

- **The math, from our comps:** the classic pouch asks around **$495** (n=27) and the larger GM around $805 (n=20, July 2026), against roughly **$2,195** for the Speedy Nano, the closest purpose-built monogram mini (n=72, June 2026). That is the fraction everyone is talking about.

## Lineup BB and MM

The current everyday monogram line people keep cross-shopping against the Speedy 20, and the headline is simple: the MM fits a laptop, which almost nothing in classic monogram does gracefully. The BB is the pick if the Speedy's hand-carry shape never worked for you.

- **Preloved read:** too new for a fair read. The two listings we tracked asked $2,195 and $2,295 (July 2026); for scale, the Speedy 20 asks around $2,335 (n=339, June 2026).

## Neverfull PM

The smallest Neverfull, and the one nobody covers because everyone defaults to the MM. The PM is a genuinely compact tote: everyday cargo yes, laptop no. Suits petite frames the MM overwhelms. Worth checking current production status before you hunt boutiques; preloved is where it reliably lives.

- **The finding:** in monogram canvas the PM and the MM ask the same median, about **$1,450** each (PM n=153, MM n=491, June 2026). Preloved does not discount the small one, so buy the size that fits your frame, not the one that looks like a deal.

## Alma

The structured dome bag whose design Louis Vuitton traces to 1934, when it began as the Squire Bag, and the most underrated classic on this list. It stands up on its own, holds its shape, and in Epi, the ridged leather, it shrugs off rain and skips the pale vachetta problem entirely. Classic monogram versions come with the vachetta that Epi avoids.

- **Preloved read:** monogram canvas Almas ask around **$995** (n=215, June 2026); across all materials about $1,227 (n=878). Our Epi sample is still too thin to quote a fair split, so we will hold that number until it is not.

## The pattern across all nine

Huge search, few creators, steady preloved supply. That combination usually means the market knows something the algorithm has not caught up to yet.

> Our take, and it is a take, not a directive: these are the bags to shop before the videos arrive, not after.

Live listings and current asking prices for the models here are linked below, and they update as the market moves.

> Every price above is an asking-price median from listings we tracked on the major resale sites, dated as shown. Condition, spec, and hardware move any individual bag well off its median.`;

type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  brand: string | string[];
  style: string | string[] | null;
};

const POSTS: SeedPost[] = [
  {
    slug: "chanel-in-2026-explained",
    title: "Chanel in 2026, explained",
    excerpt:
      "The 25, the 22, the maxi flap, and why the numbers are birth years, not sizes. Every current Chanel line decoded, with the preloved asking median for each.",
    body: chanelBody,
    brand: "Chanel",
    style: "Chanel 25",
  },
  {
    slug: "lv-bags-nobody-talks-about",
    title: "The LV bags the algorithm forgot",
    excerpt:
      "Nine Louis Vuitton bags pull huge TikTok search with almost nobody covering them. What each one is, who it suits, and what it asks preloved, from dated comps.",
    body: lvBody,
    brand: "Louis Vuitton",
    style: "Alma",
  },
];

async function main() {
  for (const p of POSTS) {
    const { data: existing } = await db.from("post").select("post_id").eq("slug", p.slug).maybeSingle();
    const { brandId, styleId } = await resolveTopic(p.brand, p.style);
    const content = {
      author_user_id: AUTHOR,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      body: p.body,
      topic_brand_id: brandId,
      topic_style_id: styleId,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { error } = await db.from("post").update(content).eq("post_id", existing.post_id);
      console.log(error ? `UPDATE ${p.slug} ERR ${error.message}` : `updated #${existing.post_id} ${p.slug} (status preserved)`);
    } else {
      const { data, error } = await db
        .from("post")
        .insert({ ...content, status: "published" as const, published_at: new Date().toISOString() })
        .select("post_id")
        .single();
      console.log(error ? `INSERT ${p.slug} ERR ${error.message}` : `published #${data!.post_id} ${p.slug}`);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
