/**
 * Display boundary for variant labels. "Standard" is the ingest pipeline's
 * catch-all size for captures that don't state one (promote-safe.ts,
 * sweep targets) — it is NOT house vocabulary, so it must never reach a user,
 * a page title, or a GEO answer (owner rule 2026-07-02). The DB keeps the
 * value (it keys re-capture runs and anchors real price rows); every render
 * path strips it here.
 */
export function displaySizeLabel(sizeLabel: string | null | undefined): string | null {
  if (!sizeLabel || sizeLabel === "Standard") return null;
  return sizeLabel;
}

/**
 * Sourced base widths (cm) + boutique alias, keyed BY BRAND so one house's numbers never
 * print on another's bag. This started as a Chanel-flap table but was brand-agnostic, so
 * "Small · 23 cm" / "Maxi · 33 cm" (Chanel's widths) were rendering on the Fendi Baguette,
 * whose sizes are different (owner 2026-07-14). A measurement shows only when the bag's brand
 * has a sourced number for that exact size word; otherwise the size word stands alone.
 *
 * Chanel: archivist-sourced (Rebag, Xupes, SACLÀB, Luxury Evermore); resellers disagree by a
 * cm or two, so we print the safest single number. Extend per house as sizes get measured;
 * per-style dimensions ultimately belong in the production record, not this stopgap map.
 */
const SIZE_MEASURE: Record<string, Record<string, { cm: number; alias?: string }>> = {
  Chanel: {
    Small: { cm: 23 },
    "Medium (M/L)": { cm: 25.5 },
    Jumbo: { cm: 30, alias: "Large" }, // Chanel's boutique word for the ~30cm is "Large"; resale says "Jumbo"
    Maxi: { cm: 33 },
    "Mini (Rectangular)": { cm: 20 },
    "Mini (Square)": { cm: 17 },
  },
};

/**
 * A size label with its measurement (and boutique alias) appended so it's unambiguous, e.g.
 * "Jumbo (Large) · 30 cm". Applies only the measurement sourced for THIS bag's brand; falls
 * back to the plain display label otherwise. Never mutates the underlying size_label (that
 * stays the match key); this is display only.
 */
export function measuredSizeLabel(
  sizeLabel: string | null | undefined,
  brand?: string | null,
): string | null {
  const base = displaySizeLabel(sizeLabel);
  if (!base) return null;
  const m = brand ? SIZE_MEASURE[brand]?.[base] : undefined;
  if (!m) return base;
  const name = m.alias ? `${base} (${m.alias})` : base;
  return `${name} · ${m.cm} cm`;
}

/** The one-line "size · colourway" descriptor used on cards, rows, and rails. */
export function variantShortLabel(
  sizeLabel: string | null | undefined,
  exteriorColorway: string | null | undefined,
): string {
  return (
    [displaySizeLabel(sizeLabel), exteriorColorway].filter(Boolean).join(" · ") || "Variant"
  );
}
