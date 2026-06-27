/**
 * Launch articles live: flip DRAFT posts to 'published' in one command.
 *
 * Runs against whatever Supabase the env points at, so it must be run with the REAL
 * service-role key (your local .env.local), NOT a cloud-container stub. Owner-gated:
 * publishing is a prod write.
 *
 * SAFETY: dry run by DEFAULT (prints what it would do, writes nothing). Pass --confirm
 * to actually publish. Idempotent (already-published posts are skipped).
 *
 * Never-invent guard: by default it HOLDS any draft whose body still contains a figure
 * the freshness report (docs/article-freshness-report.md, 2026-06-26) flagged as stale,
 * so a wrong number does not go live. Fix the figure, then re-run. Override per-slug with
 * --force-stale, or hold extra slugs with --hold=slug-a,slug-b, or publish only a set with
 * --only=slug-a,slug-b.
 *
 *   npx tsx supabase/seed/launch-articles.ts            # dry run (safe preview)
 *   npx tsx supabase/seed/launch-articles.ts --confirm  # publish the clean drafts
 */
import { supabaseAdmin as db } from "./lib/client";

// Stale literals from docs/article-freshness-report.md. A draft whose body still contains
// one of these is held by default (the number drifted; the article states the old one).
const STALE_FIGURES: { literal: string; was: string; now: string }[] = [
  { literal: "$1,245", was: "Neverfull MM asking $1,245", now: "$1,500 (n=336)" },
  { literal: "$911", was: "Gucci GG Marmont asking $911", now: "$1,095 (n=304)" },
];

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function main() {
  const confirm = has("confirm");
  const forceStale = has("force-stale");
  const hold = new Set((arg("hold") ?? "").split(",").map((s) => s.trim()).filter(Boolean));
  const only = new Set((arg("only") ?? "").split(",").map((s) => s.trim()).filter(Boolean));

  const { data, error } = await db
    .from("post")
    .select("post_id, slug, title, status, body")
    .eq("status", "draft")
    .order("post_id");
  if (error) { console.error("ERR", error.message); process.exit(1); }
  const drafts = data ?? [];
  if (!drafts.length) { console.log("No drafts to publish."); return; }

  const toPublish: typeof drafts = [];
  const held: { slug: string; reason: string }[] = [];

  for (const p of drafts) {
    if (only.size && !only.has(p.slug)) { held.push({ slug: p.slug, reason: "not in --only set" }); continue; }
    if (hold.has(p.slug)) { held.push({ slug: p.slug, reason: "in --hold set" }); continue; }
    const stale = STALE_FIGURES.find((s) => (p.body ?? "").includes(s.literal));
    if (stale && !forceStale) {
      held.push({ slug: p.slug, reason: `stale figure ${stale.literal} (now ${stale.now}); fix then re-run, or --force-stale` });
      continue;
    }
    toPublish.push(p);
  }

  console.log(`\n${drafts.length} draft(s) found. ${confirm ? "PUBLISHING" : "DRY RUN (no writes; pass --confirm)"}\n`);
  console.log("WILL PUBLISH:");
  for (const p of toPublish) console.log(`  + #${p.post_id}  ${p.slug}  —  ${p.title}`);
  if (held.length) {
    console.log("\nHELD (not published):");
    for (const h of held) console.log(`  - ${h.slug}  —  ${h.reason}`);
  }

  if (!confirm) { console.log("\nRe-run with --confirm to publish the list above."); return; }

  let ok = 0;
  for (const p of toPublish) {
    const { error: e } = await db
      .from("post")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("post_id", p.post_id);
    if (e) console.error(`  ERR #${p.post_id} ${p.slug}: ${e.message}`);
    else { ok++; console.log(`  published #${p.post_id} ${p.slug}`); }
  }
  console.log(`\nDone. Published ${ok}/${toPublish.length}.`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e.message || e); process.exit(1); });
