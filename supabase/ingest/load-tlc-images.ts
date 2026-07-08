/**
 * Load The Luxury Closet per-listing photos into `listing_image`, keyed by
 * (platform, listing_ref) so the bag-page "For sale right now" rail can show a
 * picture next to each live offer. Reads the file the adapter wrote
 * (data/ingest/_raw/tlc-images.json).
 *
 *   npm run load:tlc-images            # dry run (counts only)
 *   npm run load:tlc-images -- --write # upsert
 *
 * Graceful: if `listing_image` isn't migrated yet (0047), it logs and exits 0 so
 * merging this before the migration never breaks the ingest.
 *
 * Needs .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "../seed/lib/client";

const PLATFORM = "The Luxury Closet";
const FILE = path.resolve(process.cwd(), "data/ingest/_raw/tlc-images.json");

interface ImageRow { listing_ref: string; image_url: string }

async function main(): Promise<void> {
  const write = process.argv.includes("--write");
  if (!fs.existsSync(FILE)) {
    console.log(`[tlc-images] no file at ${FILE} — run the tlc adapter first. Skipping.`);
    return;
  }
  const parsed = JSON.parse(fs.readFileSync(FILE, "utf8")) as ImageRow[];
  const rows = (Array.isArray(parsed) ? parsed : [])
    .filter((r) => r && r.listing_ref && r.image_url)
    .map((r) => ({ platform: PLATFORM, listing_ref: r.listing_ref, image_url: r.image_url, updated_at: new Date().toISOString() }));

  console.log(`[tlc-images] ${rows.length} listing photo(s) ${write ? "to upsert" : "(DRY RUN)"}.`);
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
        console.log("[tlc-images] listing_image not migrated yet (0047) — skipping, no error.");
        return;
      }
      throw new Error(`listing_image upsert failed: ${error.message}`);
    }
    upserted += Math.min(CHUNK, rows.length - i);
  }
  console.log(`[tlc-images] upserted ${upserted} listing photo(s).`);
}

main().catch((e) => {
  console.error("[tlc-images] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
