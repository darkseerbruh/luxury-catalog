import { createServerSupabase } from "./supabase/server";

/**
 * Correction reads for the admin review queue. The `correction_select_admin`
 * RLS policy (0009) lets an admin-flagged user read all rows with the normal
 * server client, so no service-role key is required here. Degrades to [] when
 * env/migration are absent.
 */

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export interface CorrectionEntry {
  correctionId: number;
  variantId: number | null;
  styleId: number | null;
  brandId: number | null;
  fieldPath: string;
  currentValue: string | null;
  suggestedValue: string;
  note: string | null;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  reviewedAt: string | null;
  /** Best-effort target label (brand/style names) for display. */
  brandName: string | null;
  styleName: string | null;
}

type CorrectionRow = {
  correction_id: number;
  variant_id: number | null;
  style_id: number | null;
  brand_id: number | null;
  field_path: string;
  current_value: string | null;
  suggested_value: string;
  note: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  variant?: { style?: { name?: string | null; brand?: { name?: string | null } | { name?: string | null }[] | null } | { name?: string | null; brand?: unknown }[] | null } | unknown;
  brand?: { name?: string | null } | { name?: string | null }[] | null;
  style?: { name?: string | null; brand?: { name?: string | null } | { name?: string | null }[] | null } | unknown;
};

function nameOf(rel: unknown): string | null {
  const r = Array.isArray(rel) ? rel[0] : rel;
  return (r as { name?: string | null } | null | undefined)?.name ?? null;
}

/**
 * Corrections for the admin queue. `status` filters by lifecycle (default:
 * pending). Returns newest first.
 */
export async function getCorrections(
  status: "pending" | "accepted" | "rejected" | "all" = "pending",
  limit = 200
): Promise<CorrectionEntry[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();

  let query = supabase
    .from("correction")
    .select(
      "correction_id, variant_id, style_id, brand_id, field_path, current_value, suggested_value, note, status, created_at, reviewed_at, " +
        "variant:variant_id(style:style_id(name, brand:brand_id(name))), " +
        "brand:brand_id(name), " +
        "style:style_id(name, brand:brand_id(name))"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") query = query.eq("status", status);

  const primary = await query;
  let rows = primary.data as unknown as CorrectionRow[] | null;

  if (primary.error) {
    // Embeds may be unavailable; fall back to flat columns.
    let fb = supabase
      .from("correction")
      .select(
        "correction_id, variant_id, style_id, brand_id, field_path, current_value, suggested_value, note, status, created_at, reviewed_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status !== "all") fb = fb.eq("status", status);
    const fbRes = await fb;
    if (fbRes.error || !fbRes.data) return [];
    rows = fbRes.data as unknown as CorrectionRow[];
  }
  if (!rows) return [];

  return rows.map((r) => {
    const variantStyle = (() => {
      const v = Array.isArray(r.variant) ? r.variant[0] : r.variant;
      const s = (v as { style?: unknown } | null)?.style;
      const so = Array.isArray(s) ? s[0] : s;
      return so as { name?: string | null; brand?: unknown } | null | undefined;
    })();
    const directStyle = (() => {
      const s = Array.isArray(r.style) ? r.style[0] : r.style;
      return s as { name?: string | null; brand?: unknown } | null | undefined;
    })();
    const styleObj = variantStyle ?? directStyle ?? null;

    return {
      correctionId: r.correction_id,
      variantId: r.variant_id,
      styleId: r.style_id,
      brandId: r.brand_id,
      fieldPath: r.field_path,
      currentValue: r.current_value,
      suggestedValue: r.suggested_value,
      note: r.note,
      status: r.status,
      createdAt: r.created_at,
      reviewedAt: r.reviewed_at,
      brandName: nameOf(r.brand) ?? nameOf(styleObj?.brand) ?? null,
      styleName: styleObj?.name ?? null,
    };
  });
}
