/**
 * The breadth of a saved want. Pure, shared by the bag-page control and the
 * want-list display. null = the exact variant (the default the heart saves).
 *  - { colorFamily: "Green" } → any green of this style
 *  - { anyColor: true }       → any colourway of this style
 * Full design: docs/ux/taste-quiz-spec.md (companion section).
 */
export type WantSpec = { colorFamily?: string; anyColor?: boolean } | null;

/** A short human label for a saved want at its breadth. */
export function wantSpecLabel(spec: WantSpec, styleName: string, variantLabel: string): string {
  if (!spec) return variantLabel;
  if (spec.colorFamily) return `Any ${spec.colorFamily.toLowerCase()} ${styleName}`;
  if (spec.anyColor) return `Any ${styleName}`;
  return variantLabel;
}
