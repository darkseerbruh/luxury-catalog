/**
 * Bring the three legacy brand authentication guides (created via the admin UI,
 * not the seed) in line with the new per-house series:
 *  1. Retitle to the search-led "{House} authentication: The markers worth
 *     checking" format the homepage auth link lands on (the old "How to
 *     authenticate a … bag" / "How to spot a fake …" phrasings buried the brand).
 *  2. Tag each to its most-faked model's style so the post->bag money-moment CTA
 *     renders (Coach and LV were brand-only = monetary dead-ends; Gucci already
 *     points at the Marmont).
 *
 * Keyed by slug so URLs never change. Idempotent: a field already at its target
 * is skipped. The general "Red flags" umbrella piece is left alone (not brand-
 * specific). Style ids verified against price_history listed coverage 2026-06-30.
 *
 * SAFETY: dry run by DEFAULT (prints changes, writes nothing). Pass --confirm to
 * apply. Runs against whatever Supabase the env points at.
 *
 *   npx tsx supabase/seed/rename-auth-titles.ts            # preview
 *   npx tsx supabase/seed/rename-auth-titles.ts --confirm  # apply
 */
import { supabaseAdmin as db } from "./lib/client";
import { resolveTopic } from "./lib/topic";

// Target = the house's most-faked model, tagged by NAME so the style is resolved at
// runtime (never a hardcoded id: ids drift with migrations and would tag the wrong
// bag). brand candidates cover spelling variants.
const RENAMES: Record<string, { title: string; brand: string | string[]; style: string | string[] }> = {
  // LV -> Speedy (most-faked LV)
  "how-to-authenticate-a-louis-vuitton-bag": { title: "Louis Vuitton authentication: The markers worth checking", brand: "Louis Vuitton", style: "Speedy" },
  // Coach -> Tabby (the most-checked Coach)
  "how-to-authenticate-a-coach-bag": { title: "Coach authentication: The markers worth checking", brand: "Coach", style: "Tabby" },
  // Gucci -> Marmont (already tagged; kept for idempotence)
  "how-to-spot-a-fake-gucci-marmont": { title: "Gucci authentication: The markers worth checking", brand: "Gucci", style: ["GG Marmont", "Marmont"] },
};

async function main() {
  const confirm = process.argv.includes("--confirm");
  const slugs = Object.keys(RENAMES);
  const { data, error } = await db
    .from("post")
    .select("post_id, slug, title, topic_style_id")
    .in("slug", slugs);
  if (error) { console.error("ERR", error.message); process.exit(1); }
  const rows = data ?? [];

  for (const slug of slugs) {
    const row = rows.find((r) => r.slug === slug);
    const target = RENAMES[slug];
    if (!row) { console.log(`MISSING  ${slug} (no post; skipped)`); continue; }
    const { styleId } = await resolveTopic(target.brand, target.style);
    const patch: { title?: string; topic_style_id?: number; updated_at?: string } = {};
    if (row.title !== target.title) patch.title = target.title;
    // Only re-tag when the lookup resolved a style AND it differs. A miss (null) must
    // never overwrite an already-correct id with null.
    if (styleId != null && row.topic_style_id !== styleId) patch.topic_style_id = styleId;
    if (!patch.title && patch.topic_style_id === undefined) { console.log(`OK       #${row.post_id} ${slug} (already current)`); continue; }
    console.log(`${confirm ? "UPDATE " : "WOULD  "} #${row.post_id} ${slug}`);
    if (patch.title) console.log(`           title -> ${patch.title}`);
    if (patch.topic_style_id !== undefined) console.log(`           style -> ${patch.topic_style_id}`);
    if (confirm) {
      const { error: uerr } = await db
        .from("post")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("post_id", row.post_id);
      if (uerr) console.log(`           ERR ${uerr.message}`);
    }
  }
  if (!confirm) console.log("\nDry run only. Re-run with --confirm to apply.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
