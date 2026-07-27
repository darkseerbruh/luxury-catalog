/**
 * Seed two GEO reference DRAFT articles from the naming-quirks bank
 * (docs/naming-quirks.md, gathered 2026-07-26..27 across four archivist rounds).
 *
 * WHY THESE TWO: they are original research nobody else publishes, and both answer a
 * question a real shopper types. The material came out of building the ingest dictionary:
 * every word below is one our own matcher got wrong first, which is exactly why a new
 * collector gets it wrong too.
 *
 * Every claim traces to house documentation or consistent multi-reseller usage, verified
 * by the archivist before it entered the bank. Where the archivist hedged (Burberry's
 * check names, the Mahina reading), the article hedges in the same place. Row counts are
 * OUR data, dated inline.
 *
 * Renderer supports ## / - / > / paragraphs / **bold** only. No tables, no --- rules
 * (docs: article renderer tokens).
 *
 * IMPORTANT: status is set ONLY on INSERT. The update path never touches status, so
 * re-running this after she publishes can never flip a live article back to draft.
 *
 *   npx tsx supabase/seed/seed-naming-quirks-articles.ts
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const decoyBody = `You are scrolling resale and you see "Chanel Matelassé Flap Bag." You search Matelassé. You get thousands of results that have nothing in common.

That is because Matelassé is not a bag. It is the quilting.

This happens constantly, and it is not the seller being sloppy. Luxury listings are built from house vocabulary, and a lot of that vocabulary describes **how a bag is made or decorated**, not **which bag it is**. Learn to spot the difference and listings get much easier to read.

We learned this the hard way. Building the catalogue, our own system nearly turned nine of these words into bag models. Every word below is one we got wrong first.

## The quilts and the weaves

These describe a surface treatment. They tell you nothing about the shape.

- **Matelassé** (Chanel) is the diamond quilting. Nearly every Chanel is matelassé, so it narrows nothing.
- **Intrecciato** (Bottega Veneta) is the woven leather. It is the house signature, applied across dozens of shapes.
- **Cannage** (Dior) is the quilting, and it has the best origin story of the group. It is named for the caned seats of the Napoleon III chairs Christian Dior used at 30 Avenue Montaigne.
- **Malletage** (Louis Vuitton) is the diamond quilting on the GO-14, from **malle**, meaning trunk. LV frames it as the padded lining of its own luggage.

## The canvases and the leathers

These are materials. A bag can be any shape and still be one of these.

- **GG** and **GG Supreme** (Gucci) are the monogram coated canvas.
- **Tessuto** (Prada) is the nylon. Tessuto is simply Italian for fabric.
- **Vitello Daino** (Prada) is calfskin with a deer-like finish. Vitello is calf, daino is deer.
- **Grain de Poudre** (Saint Laurent) is an embossed pebble leather.
- **Trotter** and **Oblique** (Dior) are both printed canvases.
- **Signature** (Coach, and separately DKNY) is the logo coated canvas. In our data that one word sits on nearly 1,500 Coach listings.

## The motifs and the hardware

These are decorations or fittings that travel across the whole range.

- **Gancini** (Ferragamo) is the double-hook clasp, taken from the iron gates of the house's Florence headquarters.
- **Interlocking G** (Gucci) is the archive logo.
- **O'Lock** (Fendi) is the oval clasp.
- **Mizza** (Dior) is a leopard embroidery, named for Mitzah Bricard, Christian Dior's muse, who wore leopard constantly.

## The pumpkin problem

Fendi deserves its own section, because it has two words for one print and neither is a bag.

- **Zucca** is Italian for pumpkin. It is the **large** scale of the FF monogram.
- **Zucchino** is little pumpkin. It is the **small** scale, used on minis and small leather goods.

Fendi picks the scale by bag size. Between them, those two words sit on 1,686 listings in our data that look like models and are not.

One correction while we are here, because it circulates widely: the belief that Zucca means coated canvas and Zucchino means fabric is wrong. Both come in jacquard and in coated canvas.

## Burberry has seven names for one check

Nova, Supernova, House, Haymarket, Beat, Vintage, Mega.

Burberry's own corporate page calls the whole thing "The Burberry Check."

A couple of them do carry real information. **Haymarket** carries the equestrian knight. **Nova** is the diagonal. And **Horseferry** is not a check at all, it is a printed logo named for Horseferry Road, Burberry's London headquarters.

Our read is that these are era labels the market invented rather than an official house taxonomy. Burberry has not published one, so treat the distinctions as collector shorthand.

## The one that trips everyone

**TB** is both a Burberry bag and a Burberry wallpaper. The TB Bag launched in 2018. The Thomas Burberry monogram is a print. A "TB Monogram Nylon Backpack" is not a TB Bag.

## So what do you actually do with this

Read a listing title in two halves. One half tells you the **bag**. The other half tells you the **finish**.

> "Chanel Aged Calfskin Quilted Mini Reissue Wallet On Chain So Black"

The bag is a **Reissue Wallet on Chain**, in mini. Everything else is leather, quilting, size and hardware.

When you search, search the bag half. When you compare two listings, compare the finish half. And if a title contains **only** finish words, that seller has not told you what they are selling, which is worth knowing before you bid.

None of this tells you whether a bag is genuine. These are reading markers, not authentication markers. What they do is stop you searching for a bag that does not exist.`;

const pradaBody = `Prada mostly does not name its bags. That single fact explains why Prada is harder to shop than any other major house, and almost nobody says it out loud.

Take the most common Prada listing title you will see: "Prada Saffiano Lux Double Zip Tote."

Not one word of that is the bag's name.

- **Saffiano Lux** is the leather.
- **Double zip** is the closure.
- **Tote** is the shape.

The bag's actual name is the **Galleria**, after the Galleria Vittorio Emanuele II in Milan.

## Prada only started naming bags recently

For most of its handbag history, a Prada bag was **described**, not named. Material, then fitting, then silhouette.

The proper names are a modern habit:

- **Galleria**, 2011
- **Cahier**, 2016
- **Cleo**, 2020
- **Symbole**, 2022
- **Arqué**, 2023

Everything before that era is described rather than named, which is why the same bag turns up under four different titles across four resellers.

## Why this costs you money

If a bag has no name, sellers invent a description. Descriptions vary. Search does not match across them.

In our own data, Galleria listings split across "Galleria", "Saffiano Lux Double Zip", "Lux Double Zip Tote" and plain "Double Zip Tote". Someone searching only "Galleria" never sees most of the bags they are looking for.

Our take: this is where Prada gets interesting to shop. Bags listed under the older descriptive titles get less traffic, because fewer people find them. That is not a guarantee of a better price, but thinner competition tends to help the buyer.

## Half the mystique is Italian for the obvious

Prada's vocabulary sounds like a code. Mostly it is a translation.

- **Tessuto** is fabric. It is the nylon.
- **Vitello** is calf.
- **Daino** is deer, as a finish.
- **Cinghiale** is boar.
- **Cuir** is leather, in French.

And the best one: **Pattina** means the flap. So a "Pattina Flap Shoulder Bag" is a Flap Flap Shoulder Bag.

## The raffia bags are not raffia

Worth knowing before you pay a natural-material premium. Prada's own material string is "raffia-effect yarn": a synthetic yarn, crocheted to look like raffia.

That is Prada being accurate in its own copy. It is resale listings that shorten it to "raffia."

## How to actually search Prada

Search the description, not just the name.

- For the Galleria, also try **Saffiano Lux**, **double zip** and **double zip tote**.
- For the Prada Double, try **Cuir Double**.
- Ignore **Tessuto**, **Vitello Daino** and **Re-Nylon** as model words. They are materials, so they will not narrow you to a shape.
- Treat **Lux** as a leather grade, not a bag.

The general rule holds across the house: if the title is all material and fitting, you are looking at a bag from before Prada started naming things. Work out the shape from the photos, then compare it against listings using the modern name.

## Where this came from

We found all of this by building a catalogue. Our matching system kept failing on Prada, and the reason turned out not to be our code. There was frequently no name to match.

One honest limit: **Gardener's Tote** is the one common Prada name we could not source to a house page. It is consistent across resellers, so we use it, but we would call it market-canonical rather than official.`;

const POSTS = [
  {
    slug: "words-that-look-like-bag-models",
    title: "Matelassé, Intrecciato, Zucca: the words that look like bag models and aren't",
    excerpt:
      "Half the words in a luxury listing describe the finish, not the bag. Here is how to read a title in two halves, using the words our own catalogue got wrong first.",
    body: decoyBody,
    brand: ["Chanel", "Gucci", "Fendi"] as string | string[],
    style: null as string | string[] | null,
  },
  {
    slug: "prada-does-not-name-its-bags",
    title: "Prada barely names its bags, and it changes how you search",
    excerpt:
      "\"Saffiano Lux Double Zip Tote\" contains no bag name. It's the Galleria. Why most Prada is described rather than named, and how to search for it.",
    body: pradaBody,
    brand: "Prada" as string | string[],
    style: ["Galleria", "Re-Edition", "Cleo"] as string | string[] | null,
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

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
