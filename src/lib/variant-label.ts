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
 * Sourced base widths (cm) + boutique alias for the ambiguous Chanel flap sizes, so a size
 * word never stands alone and "Large" vs "M/L" is never guessable (owner 2026-07-11).
 * Archivist-sourced (Rebag, Xupes, SACLÀB, Luxury Evermore); resellers disagree on a cm or
 * two, so we print the safest single number. Micro is intentionally absent (no clean source
 * this pass) — it just shows its plain label. Extend as other lines get measured.
 */
const SIZE_MEASURE: Record<string, { cm: number; alias?: string }> = {
  Small: { cm: 23 },
  "Medium (M/L)": { cm: 25.5 },
  Jumbo: { cm: 30, alias: "Large" }, // Chanel's boutique word for the ~30cm is "Large"; resale says "Jumbo"
  Maxi: { cm: 33 },
  "Mini (Rectangular)": { cm: 20 },
  "Mini (Square)": { cm: 17 },
};

/**
 * A size label with its measurement (and boutique alias) appended so it's unambiguous, e.g.
 * "Jumbo (Large) · 30 cm", "Medium (M/L) · 25.5 cm". Falls back to the plain display label
 * when we have no sourced measurement. Never mutates the underlying size_label (that stays
 * the match key); this is display only.
 */
export function measuredSizeLabel(sizeLabel: string | null | undefined): string | null {
  const base = displaySizeLabel(sizeLabel);
  if (!base) return null;
  const m = SIZE_MEASURE[base];
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
