/**
 * Seeds curated YouTube creators + embeddable video resources from
 * supabase/seed/research/creators.json into the 0004 `creator` / `resource`
 * tables. These light up the bag-page "Video reviews" section.
 *
 * HUMAN-GATED: needs .env.local with NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY. Run AFTER migration 0004 is applied and the hero
 * styles are seeded (resources link to a style by brand+name).
 *
 *   npx tsx supabase/seed/seed-creators.ts
 *
 * Idempotent:
 *  - creators upsert on a stable key (channel_handle if present, else name);
 *  - resources are matched by youtube_video_id (update in place, else insert),
 *    so re-running never duplicates rows.
 *
 * Sourcing: only real channels + real video IDs verified to appear in
 * web-search results were placed in creators.json (see its _meta). This seeder
 * does NOT invent any data — it only loads what's in that file.
 */
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./lib/client";

const FILE = path.resolve(__dirname, "research", "creators.json");

interface CreatorInput {
  name: string;
  platform?: string;
  channel_handle?: string | null;
  channel_url?: string | null;
  channel_id?: string | null;
  description?: string | null;
  is_trusted?: boolean;
  is_featured?: boolean;
}

interface ResourceInput {
  brand: string;
  style: string;
  title: string;
  youtube_video_id: string;
  creator_handle?: string | null;
  is_featured?: boolean;
  sort_order?: number;
  description?: string | null;
  source_note?: string | null;
}

interface CreatorsFile {
  creators: CreatorInput[];
  resources: ResourceInput[];
}

async function findExistingCreatorId(c: CreatorInput): Promise<number | null> {
  // Prefer matching by channel_handle (stable); fall back to name.
  if (c.channel_handle) {
    const { data } = await supabaseAdmin
      .from("creator")
      .select("creator_id")
      .eq("channel_handle", c.channel_handle)
      .maybeSingle();
    if (data) return (data as { creator_id: number }).creator_id;
  }
  const { data } = await supabaseAdmin
    .from("creator")
    .select("creator_id")
    .eq("name", c.name)
    .maybeSingle();
  return data ? (data as { creator_id: number }).creator_id : null;
}

async function upsertCreator(c: CreatorInput): Promise<number> {
  const row = {
    name: c.name,
    platform: c.platform ?? "youtube",
    channel_handle: c.channel_handle ?? null,
    channel_url: c.channel_url ?? null,
    channel_id: c.channel_id ?? null,
    description: c.description ?? null,
    is_trusted: c.is_trusted ?? false,
    is_featured: c.is_featured ?? false,
  };

  const existingId = await findExistingCreatorId(c);
  if (existingId) {
    const { error } = await supabaseAdmin
      .from("creator")
      .update(row)
      .eq("creator_id", existingId);
    if (error) throw new Error(`update creator ${c.name}: ${error.message}`);
    return existingId;
  }
  const { data, error } = await supabaseAdmin
    .from("creator")
    .insert(row)
    .select("creator_id")
    .single();
  if (error) throw new Error(`insert creator ${c.name}: ${error.message}`);
  return (data as { creator_id: number }).creator_id;
}

async function resolveStyleId(brand: string, style: string): Promise<number | null> {
  const { data: brandRow } = await supabaseAdmin
    .from("brand")
    .select("brand_id")
    .eq("name", brand)
    .maybeSingle();
  if (!brandRow) return null;
  const { data: styleRow } = await supabaseAdmin
    .from("style")
    .select("style_id")
    .eq("brand_id", (brandRow as { brand_id: number }).brand_id)
    .eq("name", style)
    .maybeSingle();
  return styleRow ? (styleRow as { style_id: number }).style_id : null;
}

async function upsertResource(
  r: ResourceInput,
  creatorIdByHandle: Map<string, number>
): Promise<"inserted" | "updated" | "skipped"> {
  const styleId = await resolveStyleId(r.brand, r.style);
  if (styleId == null) {
    console.warn(`  ! skipped "${r.title}" — style not found (${r.brand} ${r.style}). Seed hero styles first.`);
    return "skipped";
  }

  const creatorId =
    r.creator_handle && creatorIdByHandle.has(r.creator_handle)
      ? creatorIdByHandle.get(r.creator_handle)!
      : null;

  const row = {
    resource_type: "youtube" as const,
    title: r.title,
    url: `https://www.youtube.com/watch?v=${r.youtube_video_id}`,
    youtube_video_id: r.youtube_video_id,
    creator_id: creatorId,
    style_id: styleId,
    brand_id: null,
    variant_id: null,
    description: r.description ?? r.source_note ?? null,
    is_featured: r.is_featured ?? false,
    published: true,
    sort_order: r.sort_order ?? 0,
  };

  // Idempotency: match an existing row by youtube_video_id.
  const { data: existing } = await supabaseAdmin
    .from("resource")
    .select("resource_id")
    .eq("youtube_video_id", r.youtube_video_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin
      .from("resource")
      .update(row)
      .eq("resource_id", (existing as { resource_id: number }).resource_id);
    if (error) throw new Error(`update resource ${r.youtube_video_id}: ${error.message}`);
    return "updated";
  }

  const { error } = await supabaseAdmin.from("resource").insert(row);
  if (error) throw new Error(`insert resource ${r.youtube_video_id}: ${error.message}`);
  return "inserted";
}

async function main() {
  const file = JSON.parse(fs.readFileSync(FILE, "utf8")) as CreatorsFile;

  console.log(`Seeding ${file.creators.length} creators…`);
  const creatorIdByHandle = new Map<string, number>();
  for (const c of file.creators) {
    const id = await upsertCreator(c);
    if (c.channel_handle) creatorIdByHandle.set(c.channel_handle, id);
    console.log(`  ✓ ${c.name} (creator_id=${id})`);
  }

  console.log(`Seeding ${file.resources.length} resources…`);
  let inserted = 0,
    updated = 0,
    skipped = 0;
  for (const r of file.resources) {
    const result = await upsertResource(r, creatorIdByHandle);
    if (result === "inserted") inserted++;
    else if (result === "updated") updated++;
    else skipped++;
    if (result !== "skipped") console.log(`  ✓ ${result}: ${r.title}`);
  }

  console.log(`\nDone. resources inserted=${inserted}, updated=${updated}, skipped=${skipped}.`);
  if (skipped > 0) {
    console.log("Skipped resources couldn't find their style — apply 0004 + run seed-hero-styles.ts first, then re-run.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
