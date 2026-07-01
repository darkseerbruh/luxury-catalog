/**
 * Resolve an article's topic tag (brand + optional style) by NAME at runtime.
 *
 * Why: seeds must never hardcode brand_id / style_id. Those ids have drifted with
 * migrations (e.g. brand_id 1 is now Chanel, not Louis Vuitton; LV is 15), so a
 * literal `topic_style_id: 1` silently points the in-article "shop this bag" CTA at
 * the wrong bag and sends affiliate clicks to the wrong listing. The CTA is driven
 * entirely by topic_style_id (see src/lib/article-shop.ts), so getting the STYLE
 * right is what matters for the money moment.
 *
 * Resolution is name-first and resilient: exact case-insensitive match on each
 * candidate, then a "contains" fallback (styles scoped to the resolved brand so
 * there is no cross-brand collision). Any miss falls back to null, so the CTA
 * simply doesn't render rather than misdirecting a buyer. Pass an array of name
 * candidates to cover spelling/accent variants (e.g. ["Céline", "Celine"]).
 */
import { supabaseAdmin as db } from "./client";

export interface Topic {
  brandId: number | null;
  styleId: number | null;
}

async function findId(
  table: "brand" | "style",
  col: "brand_id" | "style_id",
  candidates: string[],
  brandId?: number,
): Promise<number | null> {
  // 1) exact (case-insensitive) match on each candidate, in order
  for (const name of candidates) {
    let q = db.from(table).select(col).ilike("name", name);
    if (brandId != null) q = q.eq("brand_id", brandId);
    const { data } = await q.limit(1).maybeSingle();
    if (data) return (data as Record<string, number>)[col];
  }
  // 2) "contains" fallback on each candidate, in order (lowest id wins, deterministic)
  for (const name of candidates) {
    let q = db.from(table).select(col).ilike("name", `%${name}%`);
    if (brandId != null) q = q.eq("brand_id", brandId);
    const { data } = await q.order(col).limit(1);
    if (data && data.length) return (data[0] as Record<string, number>)[col];
  }
  return null;
}

/**
 * @param brand  brand name, or ordered candidates (first is the log label)
 * @param style  style name / candidates, or null/undefined for a brand-only tag
 */
export async function resolveTopic(
  brand: string | string[],
  style?: string | string[] | null,
): Promise<Topic> {
  const brandCands = Array.isArray(brand) ? brand : [brand];
  const brandId = await findId("brand", "brand_id", brandCands);

  let styleId: number | null = null;
  if (brandId != null && style) {
    const styleCands = Array.isArray(style) ? style : [style];
    styleId = await findId("style", "style_id", styleCands, brandId);
  }

  const bLabel = brandCands[0];
  const sLabel = style ? (Array.isArray(style) ? style[0] : style) : null;
  console.log(
    `topic → ${bLabel}${sLabel ? ` / ${sLabel}` : ""}: brand_id=${brandId ?? "null"}, style_id=${styleId ?? "null"}`,
  );
  return { brandId, styleId };
}
