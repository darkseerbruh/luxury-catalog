/**
 * Nightly cron: embed un-embedded catalog variants with Voyage.
 *
 * Processes variants where `embedding IS NULL` (or force=true re-embeds all).
 * No-ops when VOYAGE_API_KEY or SUPABASE_SERVICE_ROLE_KEY is unset.
 * Gate: CRON_SECRET bearer token (same as other cron routes).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { embedDocuments, variantToEmbedText } from "@/lib/voyage";

const BATCH = 200; // variants per DB read page

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min (Vercel Pro max for cron)

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.VOYAGE_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ skipped: true, reason: "missing env" });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";
  const admin = getSupabaseAdmin();

  let offset = 0;
  let total = 0;
  let embedded = 0;
  let errors = 0;

  while (true) {
    const query = admin
      .from("variant")
      .select(
        "variant_id, size_category, size_label, hardware_color, exterior_colorway, style:style_id(name, silhouette, brand:brand_id(name)), exterior_material:exterior_material_id(material_type)"
      )
      .range(offset, offset + BATCH - 1);

    if (!force) {
      query.is("embedding", null);
    }

    const { data, error } = await query;
    if (error) {
      console.error("embed-catalog fetch error:", error);
      break;
    }
    if (!data || data.length === 0) break;

    total += data.length;

    // Build text representations.
    const texts = data.map((row) => {
      const style = Array.isArray(row.style) ? row.style[0] : row.style;
      const rawBrand = style ? (style as { brand: unknown }).brand : null;
      const brand = rawBrand
        ? Array.isArray(rawBrand)
          ? ((rawBrand as { name: string }[])[0]?.name ?? null)
          : ((rawBrand as unknown as { name: string } | null)?.name ?? null)
        : null;
      const material = Array.isArray(row.exterior_material)
        ? (row.exterior_material[0] as { material_type: string } | null)?.material_type ?? null
        : (row.exterior_material as { material_type: string } | null)?.material_type ?? null;
      return variantToEmbedText({
        brand,
        styleName: (style as { name?: string } | null)?.name ?? null,
        silhouette: (style as { silhouette?: string | null } | null)?.silhouette ?? null,
        sizeCategory: row.size_category as string | null,
        sizeLabel: row.size_label as string | null,
        exteriorColorway: row.exterior_colorway as string | null,
        hardwareColor: row.hardware_color as string | null,
        materialType: material,
      });
    });

    const embeddings = await embedDocuments(texts);
    const now = new Date().toISOString();

    // Update each variant with its embedding.
    await Promise.all(
      data.map(async (row, i) => {
        const emb = embeddings[i];
        if (!emb) { errors++; return; }
        const { error: upErr } = await admin
          .from("variant")
          .update({ embedding: JSON.stringify(emb) as unknown as number[], embedded_at: now })
          .eq("variant_id", row.variant_id as number);
        if (upErr) { errors++; console.error("embed update error:", upErr); }
        else embedded++;
      })
    );

    offset += BATCH;
    if (data.length < BATCH) break;
  }

  return NextResponse.json({ total, embedded, errors });
}
