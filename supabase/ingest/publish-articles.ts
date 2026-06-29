/**
 * Publish data-articles by slug (admin one-shot). The author UI publishes one post at a
 * time via publishPost(); this is the batch equivalent for an operator with the service
 * role, used to take a vetted set of drafts live in one go.
 *
 * Safe by construction:
 *   - LIST mode (default, no --write): prints every draft (post_id, slug, title, status,
 *     topic_style_id) and writes NOTHING. Run this first to read the real slugs.
 *   - WRITE mode (--write --slugs=a,b,c): flips ONLY those exact slugs, and ONLY if they
 *     are currently 'draft' (idempotent; never touches an already-published or unlisted
 *     post). Stamps published_at = now when first published, preserves it on re-runs.
 * Reversible: a post can be moved back with the UI's unpublish (status='draft').
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (CI secret or .env.local).
 * Usage:
 *   npx tsx supabase/ingest/publish-articles.ts                          # list drafts
 *   npx tsx supabase/ingest/publish-articles.ts --slugs=a,b,c            # dry-run the set
 *   npx tsx supabase/ingest/publish-articles.ts --slugs=a,b,c --write    # publish the set
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

interface PostRow {
  post_id: number;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  topic_style_id: number | null;
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  const write = process.argv.includes("--write");
  const slugs = (arg("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Always show the current draft set first, so the operator can verify slugs from the log.
  const { data: drafts, error: dErr } = await sb
    .from("post")
    .select("post_id, slug, title, status, published_at, topic_style_id")
    .eq("status", "draft")
    .order("post_id", { ascending: true });
  if (dErr) {
    console.error("Failed to read drafts:", dErr.message);
    process.exit(1);
  }
  const draftRows = (drafts ?? []) as PostRow[];
  console.log(`\nDRAFTS (${draftRows.length}):`);
  for (const p of draftRows) {
    console.log(`  #${p.post_id}  ${p.slug}  |  ${p.title}  |  topic_style_id=${p.topic_style_id ?? "-"}`);
  }

  if (!slugs.length) {
    console.log("\nNo --slugs given: list-only, nothing changed. Re-run with --slugs=a,b,c [--write].");
    return;
  }

  // Resolve the requested slugs against the current drafts. Anything not found as a draft
  // is reported and skipped (never invented, never force-published).
  const bySlug = new Map(draftRows.map((p) => [p.slug, p]));
  const targets = slugs.map((s) => ({ slug: s, row: bySlug.get(s) }));

  console.log(`\nREQUESTED (${slugs.length}):`);
  for (const t of targets) {
    console.log(`  ${t.slug}  ->  ${t.row ? `#${t.row.post_id} DRAFT, will publish` : "NOT a current draft, SKIP"}`);
  }
  const toPublish = targets.filter((t) => t.row).map((t) => t.row!) as PostRow[];

  if (!write) {
    console.log(`\nDRY RUN: would publish ${toPublish.length} post(s). Re-run with --write to apply.`);
    return;
  }

  let ok = 0;
  for (const p of toPublish) {
    const publishedAt = p.published_at ?? new Date().toISOString();
    const { error } = await sb
      .from("post")
      .update({ status: "published", published_at: publishedAt })
      .eq("post_id", p.post_id)
      .eq("status", "draft");
    if (error) {
      console.error(`  FAILED #${p.post_id} ${p.slug}: ${error.message}`);
    } else {
      ok++;
      console.log(`  PUBLISHED #${p.post_id} ${p.slug} (published_at=${publishedAt})`);
    }
  }
  console.log(`\nDone: published ${ok}/${toPublish.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
