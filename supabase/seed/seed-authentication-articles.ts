/**
 * Per-house authentication guides for the Journal's Authentication department.
 * One guide per high-search house, titled "{House} authentication: The markers
 * worth checking" (the high-volume search term the homepage auth link lands on).
 *
 * Idempotent by slug (upsert). Status stays 'draft' — the owner publishes. Bodies
 * use the post renderer tokens: `## ` / paragraphs / `> ` / `[diagram: <id>]`.
 *
 * NEVER-INVENT: every marker is sourced (authentication services + reseller guides,
 * cited per article and in docs/research-drafts/authentication-markers-brief.md).
 * Framed as "markers to check, not a verdict"; no date-code/serial decoders (a wrong
 * call causes real harm). Diagrams are original schematics, never a real bag or a
 * redrawn logo.
 *
 *   npx tsx supabase/seed/seed-authentication-articles.ts
 */
import { supabaseAdmin as db } from "./lib/client";

const AUTHOR = "692fc426-735a-43a0-935c-796fc92cd864"; // Arielle, Founder and Editor

const chanelBody = `Chanel is one of the most faked bags in the world, and the Classic Flap most of all, so "is it real" is usually the first question. No checklist turns you into an authenticator, but a handful of markers catch most fakes, and one thing changed in 2021 that trips a lot of buyers up.

## The serial sticker became a chip
For decades Chanel placed a numbered hologram serial sticker inside the bag, usually on the lining near the top of the flap, and paired it with an authenticity card carrying the same number. Around 2021 the brand replaced the sticker with an embedded microchip. So a recent bag with no sticker is normal, not a red flag, and an older bag having a sticker proves nothing on its own, because counterfeiters copy them. Treat the number as a detail to note, never a verdict.

[diagram: chanel-authentication]

## The card should match, but a card is not proof
Unlike some houses, Chanel does include an authenticity card, and on a genuine bag its number matches the serial sticker exactly, same digits, same font weight. A mismatch is a real warning sign. The catch: cards and stickers are both faked, and a card can be swapped between bags, so a matching card is reassuring, not a seal. Many genuine bags also turn up with no card at all, which is not damning by itself.

## The CC lock and the hardware
On the front turn-lock the two C's interlock cleanly and evenly, with the right C over the left on top and the left over the right on the bottom. Loose, off-center, or rough-cast hardware is the tell. Real Chanel hardware feels substantial, the plating is even, and engraving is crisp. Light, hollow, or shallow-stamped metal points the other way.

## Quilting and stitching
The diamond quilt should line up across the seams and over the flap rather than jumping or breaking at the edge. The stitching runs high and even along each diamond. The exact stitch count varies by model and leather, so read it as even and consistent, not a number to count to. Good fakes now match the quilt alignment, so it is necessary, not sufficient.

## When to call in a pro
Run through these and you will catch a lot of obvious fakes. But a good counterfeit passes a visual check, the microchip is a closed book to you, and the markers shift across eras and leathers. So for a costly purchase, or before you sell or insure a bag, send it to a professional authenticator who can examine it in person. These are markers to check, the start of the story, not the end of it.

## Sources
The markers here are drawn from authentication services and reseller guides, including Real Authentication, Fashionphile, and the Chanel community on PurseForum, checked June 2026. We describe where to look and what tends to differ; we do not publish a serial-number decoder, because the formats vary by era and a wrong call causes real harm.`;

type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  topic_brand_id: number | null;
  topic_style_id: number | null;
};

const POSTS: SeedPost[] = [
  {
    slug: "chanel-authentication",
    title: "Chanel authentication: The markers worth checking",
    excerpt:
      "What changed when Chanel swapped its serial sticker for a hidden microchip in 2021, why the authenticity card matters but is not proof, and the CC-lock and quilt tells that catch most fakes.",
    body: chanelBody,
    topic_brand_id: 1,
    topic_style_id: 1, // Classic Flap, the most-faked model
  },
];

async function main() {
  for (const p of POSTS) {
    const { data: existing } = await db.from("post").select("post_id").eq("slug", p.slug).maybeSingle();
    const row = {
      author_user_id: AUTHOR,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      body: p.body,
      status: "draft" as const,
      topic_brand_id: p.topic_brand_id,
      topic_style_id: p.topic_style_id,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { error } = await db.from("post").update(row).eq("post_id", existing.post_id);
      console.log(error ? `UPDATE ${p.slug} ERR ${error.message}` : `updated #${existing.post_id} ${p.slug}`);
    } else {
      const { data, error } = await db.from("post").insert(row).select("post_id").single();
      console.log(error ? `INSERT ${p.slug} ERR ${error.message}` : `inserted #${data!.post_id} ${p.slug}`);
    }
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
