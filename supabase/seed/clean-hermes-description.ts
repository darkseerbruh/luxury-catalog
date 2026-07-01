/**
 * One-off: replace the contaminated Hermès brand.description.
 *
 * The stored description had an internal engineering note leak into it ("...no
 * authentication detail is stored at brand level — it lives at variant and
 * production_record level only"), which also broke the no-em-dash voice rule.
 * This swaps in the sourced, voice-clean house narrative from
 * docs/research-drafts/hermes-house-story.md. The brand page renders authored
 * icon beats for Hermès, so this description is the stored SEO/meta + fallback.
 *
 * SAFETY: dry run by DEFAULT (prints old + new, writes nothing). Pass --confirm
 * to write. Reversible: the old value is printed so it can be restored.
 *
 * Usage:
 *   npx tsx supabase/seed/clean-hermes-description.ts            # dry run
 *   npx tsx supabase/seed/clean-hermes-description.ts --confirm  # write
 */
import { supabaseAdmin as db } from "./lib/client";

const BRAND = "Hermès";

const NEW_DESCRIPTION =
  "French luxury house founded in 1837 as a harness and saddlery workshop in " +
  "Paris, where Thierry Hermès made riding gear for European nobility. As cars " +
  "replaced carriages the family turned that saddle-stitching craft toward " +
  "luggage and handbags, and the equestrian roots still show, in the Bolide that " +
  "introduced the first zipper on a handbag in 1923 and in the blanket-stitch and " +
  "saddle leathers carried across the line today. Six generations on, the founding " +
  "family still controls the house, and each Birkin and Kelly is cut, stitched and " +
  "signed by a single artisan from start to finish, which is a large part of why " +
  "the waitlists and the resale premiums run the way they do. The bags are named " +
  "with the same quiet logic: the Kelly for the princess photographed carrying it, " +
  "the Birkin for the actress who sketched it, the Evelyne and Picotin straight " +
  "from the stable. It is the rare house where the most wanted handbag in the " +
  "world started as a tool for a horse.";

async function main() {
  const confirm = process.argv.includes("--confirm");

  const { data: brand, error } = await db
    .from("brand")
    .select("brand_id, name, description")
    .eq("name", BRAND)
    .single();

  if (error || !brand) {
    throw new Error(`Could not load brand "${BRAND}": ${error?.message ?? "not found"}`);
  }

  console.log(`\nBrand: ${brand.name} (id ${brand.brand_id})`);
  console.log(`\n--- OLD description (save this to restore) ---\n${brand.description ?? "(null)"}`);
  console.log(`\n--- NEW description ---\n${NEW_DESCRIPTION}`);

  if (!confirm) {
    console.log("\nDRY RUN (no write). Re-run with --confirm to apply.\n");
    return;
  }

  const { error: updErr } = await db
    .from("brand")
    .update({ description: NEW_DESCRIPTION })
    .eq("brand_id", brand.brand_id);

  if (updErr) throw new Error(`Update failed: ${updErr.message}`);
  console.log("\n✓ Updated. Hermès description replaced.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
