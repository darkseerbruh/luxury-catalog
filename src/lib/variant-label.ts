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

/** The one-line "size · colourway" descriptor used on cards, rows, and rails. */
export function variantShortLabel(
  sizeLabel: string | null | undefined,
  exteriorColorway: string | null | undefined,
): string {
  return (
    [displaySizeLabel(sizeLabel), exteriorColorway].filter(Boolean).join(" · ") || "Variant"
  );
}
