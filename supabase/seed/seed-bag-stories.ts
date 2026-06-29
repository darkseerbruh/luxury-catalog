/**
 * Loads the code-defined "The Story" content (src/lib/bag-stories/data.ts) into
 * the `style_story` table (migration 0033) so it becomes editable without a
 * deploy. From then on getBagStory reads the DB first and falls back to the code
 * data, so the code stays the seed + safety net.
 *
 * HUMAN-GATED: needs .env.local with NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY, and migration 0033 applied first.
 *
 *   npx tsx supabase/seed/seed-bag-stories.ts
 *
 * Idempotent: upserts on story_key (the first match fragment), so re-running
 * updates rows in place and never duplicates. This loader does NOT invent any
 * data; it only serializes what is already in data.ts (every tidbit is cited).
 */
import { BAG_STORIES } from "../../src/lib/bag-stories/data";
import { supabaseAdmin } from "./lib/client";

async function main() {
  const rows = BAG_STORIES.map((s) => ({
    story_key: s.match[0],
    match: s.match,
    tagline: s.tagline,
    watch_query: s.watchQuery ?? null,
    tidbits: s.tidbits,
    people: s.people,
    videos: s.videos ?? [],
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin
    .from("style_story")
    .upsert(rows, { onConflict: "story_key" });

  if (error) {
    console.error("seed-bag-stories failed:", error.message);
    process.exit(1);
  }
  console.log(`Upserted ${rows.length} style_story rows.`);
}

main();
