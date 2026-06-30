/**
 * Retitle the brand authentication guides to the search-led format the homepage
 * authentication link lands on: "{House} authentication: The markers worth
 * checking". The old "How to authenticate a … bag" / "How to spot a fake …"
 * phrasings buried the brand and the high-volume search term.
 *
 * Keyed by slug so URLs never change. Idempotent: a row already at its target
 * title is skipped. The general "Red flags" umbrella piece is intentionally left
 * alone (it is not brand-specific).
 *
 * SAFETY: dry run by DEFAULT (prints the before/after, writes nothing). Pass
 * --confirm to apply. Runs against whatever Supabase the env points at.
 *
 *   npx tsx supabase/seed/rename-auth-titles.ts            # preview
 *   npx tsx supabase/seed/rename-auth-titles.ts --confirm  # apply
 */
import { supabaseAdmin as db } from "./lib/client";

const RENAMES: Record<string, string> = {
  "how-to-authenticate-a-louis-vuitton-bag": "Louis Vuitton authentication: The markers worth checking",
  "how-to-authenticate-a-coach-bag": "Coach authentication: The markers worth checking",
  "how-to-spot-a-fake-gucci-marmont": "Gucci authentication: The markers worth checking",
};

async function main() {
  const confirm = process.argv.includes("--confirm");
  const slugs = Object.keys(RENAMES);
  const { data, error } = await db
    .from("post")
    .select("post_id, slug, title")
    .in("slug", slugs);
  if (error) { console.error("ERR", error.message); process.exit(1); }
  const rows = data ?? [];

  for (const slug of slugs) {
    const row = rows.find((r) => r.slug === slug);
    const target = RENAMES[slug];
    if (!row) { console.log(`MISSING  ${slug} (no published post; skipped)`); continue; }
    if (row.title === target) { console.log(`OK       #${row.post_id} ${slug} (already retitled)`); continue; }
    console.log(`${confirm ? "RENAME " : "WOULD  "} #${row.post_id} ${slug}`);
    console.log(`           from: ${row.title}`);
    console.log(`           to:   ${target}`);
    if (confirm) {
      const { error: uerr } = await db
        .from("post")
        .update({ title: target, updated_at: new Date().toISOString() })
        .eq("post_id", row.post_id);
      if (uerr) console.log(`           ERR ${uerr.message}`);
    }
  }
  if (!confirm) console.log("\nDry run only. Re-run with --confirm to apply.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
