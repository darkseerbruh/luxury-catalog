/**
 * Author + publish the care companion article ("How to care for a designer bag
 * without ruining it") as a `post` row. Sibling to publish-articles.ts, but that
 * one only flips EXISTING drafts live; this article isn't in the DB yet (it was
 * written as a markdown draft at docs/research-drafts/how-to-care-for-a-designer-
 * bag-draft.md), so this script CREATES the row, formatted for the article
 * renderer's markup (## heading, - list, **bold**, paragraphs).
 *
 * Safe by construction:
 *   - LIST mode (default, no --write): prints the composed post (slug/title/
 *     excerpt + body preview), whether the slug already exists, and the candidate
 *     author profiles (so you can pick the right author_user_id). Writes NOTHING.
 *   - WRITE mode (--write --author=<uuid>): inserts the post as PUBLISHED, but
 *     ONLY if the slug does not already exist (idempotent; re-runs are no-ops).
 *     Reversible: unpublish from the author UI (status='draft'), or delete the row.
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (CI secret / .env.local).
 * Usage:
 *   npx tsx supabase/ingest/publish-care-article.ts                          # preview + list authors
 *   npx tsx supabase/ingest/publish-care-article.ts --author=<uuid>          # dry-run with an author
 *   npx tsx supabase/ingest/publish-care-article.ts --author=<uuid> --write  # publish it
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SLUG = "how-to-care-for-a-designer-bag";
const TITLE = "How to care for a designer bag without ruining it";
const EXCERPT =
  "Care goes by material, not by brand. What helps each finish, from lambskin to patent to suede, and what quietly wrecks it.";

// Body in the article renderer's markup vocabulary (## heading / - list / **bold**
// / paragraph). No raw HTML. The renderer supports **bold** but not markdown links,
// so surface routes read as bold text (the footer + bag-page modules link /care).
const BODY = `You bought the bag. Now you want to keep it looking like the day it arrived, without becoming the person who "conditioned" a lambskin into a dark stain.

One rule sits under all of this: care goes by material, not by brand. The same wipe that feeds a smooth calfskin can cloud patent and flatten suede. So two habits first, the ones that never hurt:

- 🧪 **Test any product on a hidden spot first** (inside the flap, under the base). Wait. Then look.
- **Go gentle.** A little product, more often, beats one heavy treatment.

Everything below is guidance and our take, not a guarantee. When a bag is valuable or the finish is fragile, a specialist is the safe call. Find your finish and skip to it. 👇

## Smooth leather (lambskin, calf)

The soft, buttery ones. Beautiful, and the ones that scratch if you look at them wrong.

- Wipe with a dry or barely-damp soft cloth after you carry it.
- Feed it now and then with a light conditioner made for fine leather. Apple Brand Leather Care, Chamberlain's Leather Milk, and Cadillac's leather conditioners are three we'd reach for. A pea-sized amount, buffed in.
- ⚠️ The catch: lambskin is delicate. Over-conditioning darkens it, and water spots it. Test on a hidden spot first, use the lightest touch, and let deep scratches or ink go to a pro.

## Grained leather (caviar, Togo, Epi)

The pebbled, hard-wearing ones. The easygoing members of the family, the texture hides small wear.

- A damp cloth handles most of it.
- Condition rarely, and lightly. These leathers run drier by design and do not want to be greased.
- ⚠️ Still test first, and wipe with the grain, not against it. Overdo the product and it pools in the low spots and dries blotchy.

## Patent leather

The high-shine, coated one. Gorgeous, and the diva of the group.

- Wipe with a soft, damp cloth. For haze or fingerprints, a dedicated patent cleaner.
- 🚫 The big danger: no conditioner, no leather cream, no solvents or alcohol wipes. Patent is a coated surface, and oils or solvents can cloud it or lift the shine. It also picks up color transfer from dark denim that is hard to reverse, so store it away from other colors.

## Suede and nubuck

The soft, napped ones. Zero tolerance for the wrong move.

- 🪥 Brush only. A suede brush (or a clean rubber or crepe suede eraser) lifts dirt and re-lifts the nap. Brush in one direction.
- A protectant spray before first wear helps it shrug off water. Collonil and Apple Brand both make ones we'd reach for.
- 🚫 Never oil it, never condition it, never soak it. Water and leather conditioner each flatten and darken the nap, sometimes for good. Real stains go to a suede specialist.

## Coated canvas (Monogram, Damier)

The printed, wipeable workhorses. The most forgiving thing you own.

- Wipe the canvas with a damp cloth, a mild one if it needs it.
- The catch is the trim: the natural vachetta leather (the tan handles and piping) is untreated and patinas. It darkens with oils and water-spots easily, so handle it with clean hands and keep it out of the rain early on.
- ⚠️ Don't put leather conditioner on the canvas itself, and test anything you use on the trim on a hidden spot first.

## A word on exotics (croc, lizard, ostrich, python)

These are their own world. The honest answer: leave real cleaning to a specialist who handles exotics, not a home remedy. Day to day, a dry soft cloth wiped with the scales, kept out of dry heat so the scales don't lift. When in doubt, that is the one finish where we'd always defer to a pro. 🐊

## Storage and shape 🧳

The quiet habits that keep a bag (and its resale value) while it sits in the closet.

- **Hold its shape.** A base shaper or a soft pillow of tissue keeps it from slumping and creasing. Custom felt organizers help too, Samorga is the one people mention, and they keep pens and lipstick off the lining.
- **Breathe.** A cotton dust bag only, or the one it came in. Never plastic, which traps humidity and can leave leather sticky or moldy.
- **Cool, dry, out of direct sun.** An anti-humidity (silica) pack nearby earns its keep in a damp climate.

## Hardware 🔩

- Buff plated hardware with a dry, soft cloth. That is genuinely it.
- No metal polish, no Brasso, no abrasive metal cleaners. They strip the thin plating, and once it wears through there is no putting it back. Leave the protective film on new hardware as long as you can stand to.

## Keep the good stuff close

Care is mostly small, dull habits done often. If you want the short version on a shelf, we pulled together the pieces we'd actually keep beside a collection: the gentle cleaners, the right brushes, breathable bags, and base shapers. It lives on **/care**.

And if you're still deciding what to bring home, or thinking about letting one go, **/where-to-buy** and **/where-to-sell** are right next door.`;

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const write = process.argv.includes("--write");
  const author = arg("author");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Preview the composed post so you can eyeball it before writing.
  console.log(`\nCOMPOSED POST`);
  console.log(`  slug:    ${SLUG}`);
  console.log(`  title:   ${TITLE}`);
  console.log(`  excerpt: ${EXCERPT}`);
  console.log(`  body:    ${BODY.length} chars, ${BODY.split("\n\n").length} blocks`);
  console.log(`  ---- body preview ----`);
  console.log(BODY.split("\n").slice(0, 6).map((l) => `  | ${l}`).join("\n"));
  console.log(`  ...`);

  // Does the slug already exist? (idempotency guard)
  const { data: existing, error: exErr } = await sb
    .from("post")
    .select("post_id, slug, status")
    .eq("slug", SLUG)
    .maybeSingle();
  if (exErr) {
    console.error("Failed to check for an existing post:", exErr.message);
    process.exit(1);
  }
  if (existing) {
    console.log(`\n⚠️  A post with slug "${SLUG}" already exists (#${existing.post_id}, ${existing.status}). Nothing to do.`);
    console.log("    To take an existing draft live, use publish-articles.ts --slugs=" + SLUG + " --write.");
    return;
  }

  // List candidate authors so you can pick the right author_user_id.
  const { data: profiles } = await sb
    .from("profile")
    .select("user_id, username, display_name")
    .order("username", { ascending: true })
    .limit(25);
  console.log(`\nCANDIDATE AUTHORS (pass one as --author=<user_id>):`);
  for (const p of profiles ?? []) {
    console.log(`  ${p.user_id}  @${p.username ?? "-"}  ${p.display_name ?? ""}`);
  }

  if (!author) {
    console.log(`\nLIST MODE. Nothing written. Re-run with --author=<uuid> to dry-run, then add --write to publish.`);
    return;
  }
  if (!write) {
    console.log(`\nDRY RUN. Would INSERT the post as PUBLISHED with author_user_id=${author}. Add --write to do it.`);
    return;
  }

  const nowIso = new Date().toISOString();
  const { data: inserted, error: insErr } = await sb
    .from("post")
    .insert({
      slug: SLUG,
      title: TITLE,
      excerpt: EXCERPT,
      body: BODY,
      status: "published",
      author_user_id: author,
      topic_brand_id: null,
      topic_style_id: null,
      published_at: nowIso,
    })
    .select("post_id, slug, status, published_at")
    .single();
  if (insErr) {
    console.error("\nInsert failed:", insErr.message);
    process.exit(1);
  }
  console.log(`\n✅ Published post #${inserted.post_id} "${inserted.slug}" (${inserted.status}, ${inserted.published_at}).`);
  console.log(`   Live at /articles/${inserted.slug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
