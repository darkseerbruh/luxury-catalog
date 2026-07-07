/**
 * Seed two GEO reference DRAFT articles from the seasonal naming archive
 * (article-engine-weekly run, 2026-07-07). Demand evidence: search "chanel 25"
 * x5 + "Chanel in 2026" top-viewed (Chanel decoder); Hermes #1 brand 30d n=15 +
 * "Hermes authentication" top-viewed x2 + "birkin" x2 (Hermes color codes).
 *
 * These are pure reference pieces: no OUR-data price stats, so nothing here is a
 * captured number. Every fact traces to the sourced archivist drafts under
 * docs/research-drafts/seasonal-archive/drafts/ (double-checked per chanel.md /
 * hermes.md). Idempotent by slug.
 *
 * IMPORTANT vs the older seed pattern: status is set ONLY on INSERT. The update
 * path never touches status (article-engine.md 4), so re-running this after she
 * publishes can NEVER flip a live article back to draft.
 *
 *   npx tsx supabase/seed/seed-archive-reference-articles.ts
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const chanelBody = `Most people call the number inside a Chanel a "date code" and stop there. The catch is that Chanel runs two separate dating systems, and the market constantly mixes them up.

- One is the serial **series number** on the interior sticker. It dates a bag to a year range.
- The other is the **season code** (the \`18C\`, \`23S\`, \`26A\` form) printed on the retail and garment tag. It names the exact collection.

They live in different places, and they tell you different things. Read this as a dating aid: It tells you how Chanel encodes time and gives you the markers to check, not a verdict on whether a specific bag is genuine.

One honest note up front, because it shapes everything below. Chanel has never officially published either system. Everything here is the consensus of resellers, authenticators, and collector forums, cross-checked across at least two independent references per claim. That is why the serial years stay as ranges, never a single false-precise year.

## The two systems, side by side

The serial series number:

- **Looks like:** A 6-to-8 digit number, for example \`23xxxxxx\`.
- **Where it lives:** The interior sticker or authenticity card (pre-2021).
- **What it tells you:** The production year, as a range.
- **What it does not tell you:** The collection. It cannot separate Cruise from Fall.
- **Era:** Mid-1980s to 2021.

The season code:

- **Looks like:** Two year digits plus a letter, for example \`18C\`, \`23S\`.
- **Where it lives:** The retail price tag or hangtag, and the garment (ready-to-wear) label.
- **What it tells you:** The exact collection, that is Cruise, Spring, Fall, and so on.
- **What it does not tell you:** Nothing finer. It is the collection name.
- **Era:** Still in use. It is the only on-item season source after 2021.

The key consequence: A serial sticker dates a bag to a year-ish, and the season code (when the tag survives) names the precise collection. After the 2021 microchip switch, the retail tag is the only place the season lives on the bag at all.

## The season code: What \`18C\` means

The season code is the deterministic part, and it is the system this catalog uses to say "Cruise 2018." The rule is mechanical. The two digits are the year, the letter is the collection.

- **C:** Cruise / Resort (Croisière), typically released in November of the **prior** year.
- **P:** Spring / Summer Act 1 (Printemps), typically January.
- **S:** Summer / Spring-Summer Act 2, typically March.
- **A:** Métiers d'Art on a modern tag (see the trap below), typically May.
- **B:** Fall / Winter Act 1, typically July.
- **K:** Fall / Winter Act 2, typically September.
- **M:** Coco Beach, a seasonal beach capsule, timing varies.

So \`18C\` is Cruise 2018, which showed and shipped in November 2017. \`23S\` is the 2023 Summer (Spring-Summer Act 2) collection. \`26A\` is Métiers d'Art 2026. Once the legend is fixed, every code resolves by formula. You do not need a separate source for each one.

The C quirk is the one to remember: A Cruise code always releases the prior November but carries the show year.

The letter legend is cross-checked across PurseForum, PurseBop, and Coco Approved, which all agree. The \`M\` (Coco Beach) row is a capsule rather than one of the six core runway collections, so it carries lower confidence. It is confirmed off \`24M\`-tagged items, but it is not a main-line collection.

## Trap 1: The vintage-A problem

This is the one that trips people up most. On a modern tag, \`A\` means Métiers d'Art. On an older tag, it does not.

- On vintage ready-to-wear labels, roughly the 1990s through the 2000s, **A meant Automne, that is Autumn or Fall**, the main Fall-Winter collection.
- A collector on PurseForum documented a 2005 Fall runway piece labeled \`05A\`.
- The modern \`B\` and \`K\` split (Fall Act 1 and Act 2) is the newer convention. Vintage Fall pieces were commonly just \`A\`.

So read \`A\` by era: **Fall on a vintage tag, Métiers d'Art on a modern one.**

Where does A flip from one meaning to the other? No source pins it to a single year. The working boundary is around 2012, and we hold that as an estimate, not a hard line. So if you are reading an \`05A\` or an \`08A\`, that is a Fall piece, not Métiers d'Art.

## Trap 2: The 2021 microchip cutover

In April 2021, Chanel moved from serial stickers plus authenticity cards to an NFC microchip, a small metal plate. Here is what changed for dating:

- The chip holds a random 8-character alphanumeric code with **no year and no series number**. It is readable only by Chanel's in-store NFC equipment.
- Authenticity cards were discontinued.
- 2021 is the overlap year. Depending on the production batch, a 2021 bag may carry either a final series-31 sticker or a microchip.

The practical takeaway: For a microchip-era bag, the **retail price tag with its QR code is the only on-item way to read the season.** No tag, no on-item season, and you fall back to the runway archive or a reseller listing to place the collection.

This is also why "why doesn't my new Chanel have a date code" is a question more people are asking as microchip bags reach resale. The answer is that the year simply is not on the chip.

## The serial series number: Dating by sticker (pre-2021)

For any bag from the sticker era, the serial series number dates it to a year range. These are ranges on purpose. Two independent reseller-authenticator references (Xupes and Couture USA) agree on the shape and most anchor points, and where they differ by about a year at a boundary, the range below spans both, which is the honest representation.

A quick digit-count tell before the list: Series 0 through 9 are 7-digit serials, and series 10 and up are 8-digit serials. The very earliest bags carry a 6-digit serial.

The series number (what the serial begins with), then its approximate year range:

- **1xxxxxx, early 6-digit:** 1984 to 1986.
- **0xxxxxx:** around 1986.
- **1xxxxxx (7-digit):** 1989 to 1991.
- **2xxxxxx:** 1991 to 1994.
- **3xxxxxx:** 1994 to 1996.
- **4xxxxxx:** 1996 to 1997.
- **5xxxxxx:** 1997 to 1999.
- **6xxxxxx:** 2000 to 2002.
- **7xxxxxx:** 2001 to 2002.
- **8xxxxxx:** 2003 to 2004.
- **9xxxxxx:** 2004 to 2005.
- **10xxxxxx:** around 2005.
- **11xxxxxx:** around 2006.
- **12xxxxxx:** around 2007 to 2008.
- **13xxxxxx:** around 2009.
- **14xxxxxx:** 2010 to 2011.
- **15xxxxxx:** around 2011.
- **16xxxxxx:** around 2012.
- **17xxxxxx:** 2012 to 2013.
- **18xxxxxx:** around 2013.
- **19xxxxxx:** around 2014.
- **20xxxxxx:** 2014 to 2015.
- **21xxxxxx:** around 2015.
- **22xxxxxx:** around 2016.
- **23xxxxxx:** 2016 to 2017.
- **24xxxxxx:** around 2017.
- **25xxxxxx:** around 2018.
- **26xxxxxx:** around 2019.
- **27xxxxxx:** around 2019.
- **28xxxxxx:** 2019 to 2020.
- **29xxxxxx:** around 2020.
- **30xxxxxx:** 2020 to 2021.
- **31xxxxxx:** around 2021, the final sticker series.

Do not over-read the series number as a collection. It dates the bag to a year-ish. It does not distinguish Cruise from Fall. For the collection you need the season code off the retail or ready-to-wear tag.

## What this does and does not tell you

This is a dating aid, the markers to check, not an authentication verdict.

- A code that resolves cleanly tells you when a bag was made and which collection it belongs to.
- It does not on its own confirm a bag is genuine. A code that looks right can sit on a fake.
- If you are confirming authenticity, treat the date logic as one consistency check among many, and leave the final call to a professional authenticator.

And remember the honest gap underneath all of it. No house-published reference exists, so every year here is a sourced consensus, cross-checked across resellers, authenticators, and collector forums, not Chanel's own word.`;

const hermesBody = `Hermès has the most official, stable color naming of any house. Every color carries a name and an official code, and that code is the anchor resellers, collectors, and authenticators use to name a specific shade without ambiguity. Noir is 89. Étoupe, the bestselling everyday taupe, is 18. Once you know a color has a code, the system stops feeling like gatekept vocabulary and starts being something you can actually read.

Here is what a code is, where it lives, the confirmed anchor set, and the part nobody else is honest about: Which colors are permanent and which come and go.

One note on how this is built. Where the code is confirmed across sources, we state it. Where it still lives in a swatch image nobody has transcribed, we say the code is not yet confirmed rather than guess a number. An invented code is worse than a missing one, so the honest gap is part of the guide.

## What a color code is, and where it lives

A Hermès color code is the house's own short identifier for a shade, paired with the color's French name. It is how a color is specified on a bag's documentation and how the trade references it precisely, so "Rouge H" and "46" point at the same exact red.

The leather naming sits right alongside it, so a full spec reads as leather plus color plus code:

- **Veau:** Calf leathers (for example Veau Togo, Veau Epsom).
- **Chèvre:** Goat leathers.
- **Vache:** Cowhide leathers.

One honest limit, carried straight from the research: Most codes live in swatch images that have not yet been transcribed, so the confirmed set below is the anchor, not the whole catalog. Where the code is not yet sourced, this guide says so.

## The permanent core: The confirmed codes

These are the staple colors with codes confirmed across at least two independent references. This is the anchor set, color, code, then what the shade actually looks like.

- **Noir (89):** Deep true black, the default neutral. One of the original five.
- **Gold / Or (06):** Warm camel-brown with a golden, caramel undertone, the iconic Birkin neutral.
- **Rouge H (46):** Deep dark red with a brown undertone, near-burgundy ("Rouge Hermès"), introduced 1925. One of the original five.
- **Étoupe (18):** Earthy grey-brown taupe, the bestselling everyday neutral. One of the original five.
- **Orange H / Feu (93):** Hermès' signature box orange, no direct Pantone equivalent. One of the original five, now harder to find.
- **Blanc (01):** True white. A recurring staple, harder to find lately.
- **Étain (8F):** Mid-dark cool pewter grey. A recurring staple.
- **Rouge Casaque (Q5):** Vibrant cool blue-based red with a slight pink undertone. A recurring staple.
- **Craie (10):** Soft off-white or chalk with a warm undertone, creamier than pure white. A recurring staple.
- **Bleu Nuit (2Z):** Deep night blue. A recurring staple.

The house began with five core shades (Noir, Gold, Rouge H, Étoupe, Orange H), and a wider permanent-or-near-permanent staple set grew around them over time.

## Staple colors where the code is not yet confirmed

These colors are well-sourced for their identity and their recurrence, but the official numeric code sits in a swatch image nobody has transcribed yet. So we name the color and the shade, and we flag the code honestly rather than guess.

- **Gris Tourterelle (code not yet confirmed):** Soft taupe-grey with a warm undertone ("turtledove"), a perennial collector neutral.
- **Gris Meyer (code not yet confirmed):** Warm velvety grey with a brown undertone.
- **Gris Asphalte (code not yet confirmed):** Cool dark slate grey.
- **Rouge Sellier (code not yet confirmed):** Deep red-brown-purple blend (saddle red).
- **Bleu Saphir (code not yet confirmed):** Deep sapphire blue.
- **Bleu de Malte (code not yet confirmed):** Dark teal-leaning navy.
- **Nata (code not yet confirmed):** Warm cream, a near-white neutral.
- **Béton (code not yet confirmed):** Cool light grey-beige stone neutral.
- **Vert Cyprès (code not yet confirmed):** Deep forest green.
- **Rose Confetti (code not yet confirmed):** Warm clear pink with a peach undertone, introduced 2014.
- **Gris Perle (code not yet confirmed):** Light pearl grey with a creamy undertone.
- **Gris Pâle (code not yet confirmed):** Pale warm grey, between New White and Mushroom.
- **Vert de Gris (code not yet confirmed):** Grey-undertoned neutral green.

The identity and the recurrence are sourced. The numeric code is the gap, and we will add these once they are transcribed from an authoritative swatch.

## Permanent vs seasonal: The part that is genuinely fuzzy

Here is the distinction worth understanding, with the honest caveat that comes with it. At Hermès, permanent versus seasonal is fuzzy, and colors recur. Many "permanent" colors drop out for years and return, and many "seasonal" colors come back. So treat the tiers above as a strong guide to what tends to be available year-round, not a fixed in-or-out list.

A practical read on the tiers:

- **Permanent core** recurs essentially every year. Étoupe, Noir, and Gold are the safe everyday neutrals you can generally expect to find.
- **Recurring staples** are long-standing favorites that come back most years but sit outside the original-five lineage. Common, not guaranteed every season.
- Even a permanent color can quietly get harder to find for a stretch. Orange H itself is flagged as a core color that is now harder to source, which is exactly why a clean in-or-out binary would mislead.

If you want certainty on whether a specific color is in production this season, the boutique or a current reseller listing is the real answer. This guide gives you the durable vocabulary and the codes, not a live availability feed.

Where a code is still missing, we have flagged it rather than filled the gap with a guess. Codes cross-checked across collector and authenticator references.`;

const POSTS = [
  {
    slug: "chanel-date-code-decoder",
    title: "The Chanel date-code decoder: How to read any Chanel's age and season",
    excerpt:
      "Chanel runs two dating systems, not one. Here is how to read both off the tag, as a dating aid to place the year and collection, not a verdict on whether a bag is real.",
    body: chanelBody,
    // House-wide reference; CTA weighted to the Chanel Flap value page (archivist).
    brand: "Chanel" as string | string[],
    style: ["Classic Flap", "Classic Double Flap", "11.12"] as string | string[] | null,
  },
  {
    slug: "hermes-color-codes",
    title: "Hermès color codes, decoded: What Noir 89 and Étoupe 18 mean",
    excerpt:
      "The French names and official codes behind Hermès shades, cross-checked and honestly flagged where a code is missing. Durable vocabulary, not a live availability feed.",
    body: hermesBody,
    // House-wide reference; CTA weighted to Birkin / Kelly (highest-AOV seller referral).
    brand: ["Hermès", "Hermes"],
    style: ["Birkin", "Kelly"],
  },
];

async function main() {
  for (const p of POSTS) {
    const { data: existing } = await db
      .from("post")
      .select("post_id")
      .eq("slug", p.slug)
      .maybeSingle();
    const { brandId, styleId } = await resolveTopic(p.brand, p.style);
    // Base row: everything EXCEPT status. status is INSERT-only (see header).
    const base = {
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
      const { error } = await db.from("post").update(base).eq("post_id", existing.post_id);
      console.log(
        error ? `UPDATE ${p.slug} ERR ${error.message}` : `updated #${existing.post_id} ${p.slug} (status untouched)`,
      );
    } else {
      const { data, error } = await db
        .from("post")
        .insert({ ...base, status: "draft" as const })
        .select("post_id")
        .single();
      console.log(error ? `INSERT ${p.slug} ERR ${error.message}` : `inserted #${data!.post_id} ${p.slug} (draft)`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
