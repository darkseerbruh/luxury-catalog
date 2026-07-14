/**
 * Load per-listing photos into `listing_image`, keyed by (platform, listing_ref), so the
 * bag-page "For sale right now" rail can show a picture next to each live offer. Generic
 * over platform — the source adapter writes data/ingest/_raw/<file>.json = [{listing_ref,
 * image_url}]; this upserts it under the given platform.
 *
 *   npm run load:listing-images -- myGemma                                  # dry run (counts)
 *   npm run load:listing-images -- myGemma --write                          # upsert
 *   npm run load:listing-images -- myGemma --file data/ingest/_raw/x.json   # explicit file
 *
 * Graceful: if `listing_image` isn't migrated yet (0047), it logs and exits 0. Photos are
 * DISPLAY + LINK-BACK licensed while the listing is live, so this is refreshed every ingest
 * and a sold listing's photo stops being shown.
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "../seed/lib/client";

interface ImageRow { listing_ref: string; image_url: string }

// Default raw-file name per platform (matches each adapter's output). Add a line when a new
// platform starts emitting images.
const DEFAULT_FILE: Record<string, string> = {
  mygemma: "data/ingest/_raw/mygemma-images.json",
  "the luxury closet": "data/ingest/_raw/tlc-images.json",
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const platform = args.find((a) => !a.startsWith("--") && a !== path.basename(process.argv[1]));
  if (!platform) {
    console.error("usage: load-listing-images.ts <platform> [--file <path>] [--write]");
    process.exit(1);
  }
  const fileArg = args.indexOf("--file");
  const rel = fileArg !== -1 ? args[fileArg + 1] : DEFAULT_FILE[platform.toLowerCase()];
  if (!rel) {
    console.error(`no default file for platform "${platform}" — pass --file <path>.`);
    process.exit(1);
  }
  const file = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(file)) {
    console.log(`[listing-images] no file at ${file} — run the ${platform} adapter first. Skipping.`);
    return;
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as ImageRow[];
  // Dedupe by listing_ref — Postgres rejects an upsert that hits the same
  // (platform, listing_ref) conflict key twice in one statement.
  const byRef = new Map<string, string>();
  for (const r of Array.isArray(parsed) ? parsed : []) {
    if (r && r.listing_ref && r.image_url) byRef.set(r.listing_ref, r.image_url);
  }
  const now = new Date().toISOString();
  const rows = [...byRef.entries()].map(([listing_ref, image_url]) => ({ platform, listing_ref, image_url, updated_at: now }));

  console.log(`[listing-images] ${platform}: ${rows.length} listing photo(s) ${write ? "to upsert" : "(DRY RUN)"}.`);
  if (!write || rows.length === 0) {
    if (!write) console.log("  pass --write to apply.");
    return;
  }

  let upserted = 0;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabaseAdmin.from("listing_image").upsert(rows.slice(i, i + CHUNK), { onConflict: "platform,listing_ref" });
    if (error) {
      if (/relation .*listing_image.* does not exist|schema cache/i.test(error.message)) {
        console.log("[listing-images] listing_image not migrated yet (0047) — skipping, no error.");
        return;
      }
      throw new Error(`listing_image upsert failed: ${error.message}`);
    }
    upserted += Math.min(CHUNK, rows.length - i);
  }
  console.log(`[listing-images] upserted ${upserted} ${platform} listing photo(s).`);
}

main().catch((e) => {
  console.error("[listing-images] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
