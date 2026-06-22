/**
 * Pure, no-DB core for the variant-image importer
 * (supabase/seed/import-variant-images.ts). Extracted so the matching/parsing
 * logic — the part most likely to be wrong — is unit-testable without Supabase.
 * No imports, no side effects.
 */

/** TheRealReal/TheLuxuryCloset export "Hermes" without the accent. */
export function normalizeDesigner(raw: string): string {
  return raw.trim() === "Hermes" ? "Hermès" : raw.trim();
}

/** Pull the first http(s) URL out of a Photos cell that may hold several. */
export function firstImageUrl(cell: string | undefined | null): string | null {
  if (!cell) return null;
  const m = cell.match(/https?:\/\/[^\s"',]+/);
  return m ? m[0] : null;
}

export function isHttpUrl(s: string | undefined | null): s is string {
  return !!s && /^https?:\/\/\S+$/i.test(s.trim());
}

/** Lowercase + collapse to alnum tokens for cheap fuzzy comparison. */
export function norm(s: string | undefined | null): string {
  return (s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Count tokens of `b` that also appear in `a`. */
export function tokenOverlap(a: string | undefined | null, b: string | undefined | null): number {
  const at = new Set(norm(a).split(" ").filter(Boolean));
  const bt = norm(b).split(" ").filter(Boolean);
  if (at.size === 0 || bt.length === 0) return 0;
  return bt.filter((t) => at.has(t)).length;
}

/**
 * Score how well a catalogued style name matches a noisy reseller "Bag name".
 * 100 = exact (normalized); 50+ = one contains the other; else token overlap.
 * 0 means no plausible relationship.
 */
export function scoreStyleMatch(styleName: string, bagName: string): number {
  const sn = norm(styleName);
  const target = norm(bagName);
  if (!sn || !target) return 0;
  if (sn === target) return 100;
  if (target.includes(sn) || sn.includes(target)) return 50 + Math.min(sn.length, target.length);
  return tokenOverlap(styleName, bagName) * 5;
}

export interface VariantAttrs {
  variant_id: number;
  size_label: string | null;
  exterior_colorway: string | null;
  hardware_color: string | null;
  hardware_type: string | null;
}

export interface FeedAttrs {
  size?: string | null;
  colors?: string | null;
  hardware?: string | null;
}

/** Weighted attribute-overlap score between a reseller row and a variant. */
export function scoreVariantMatch(v: VariantAttrs, row: FeedAttrs): number {
  return (
    tokenOverlap(v.size_label, row.size) * 3 +
    tokenOverlap(v.exterior_colorway, row.colors) * 2 +
    tokenOverlap(v.hardware_color, row.hardware) +
    tokenOverlap(v.hardware_type, row.hardware)
  );
}

/**
 * Choose the variant a reseller row best describes. One variant → that one.
 * Several → the highest attribute score (first wins ties). Empty → null.
 * With no signal, the highest score is 0 and the first variant is returned —
 * one photo for the style beats none.
 */
export function pickVariant<T extends VariantAttrs>(variants: T[], row: FeedAttrs): T | null {
  if (variants.length === 0) return null;
  if (variants.length === 1) return variants[0];
  let best: { v: T; score: number } | null = null;
  for (const v of variants) {
    const score = scoreVariantMatch(v, row);
    if (!best || score > best.score) best = { v, score };
  }
  return best ? best.v : variants[0];
}
