import { getUserTaste } from "@/lib/taste-data";
import {
  type TasteDimension,
  type TasteVector,
  nameTaste,
  dimensionsRemaining,
  topValuesWithShare,
} from "@/lib/taste";
import TasteMap, { type TasteRegion } from "./TasteMap";

/** Catalogued taste dimensions shown as Taste Map regions, in display order. */
const REGIONS: { dimension: TasteDimension; label: string }[] = [
  { dimension: "brand", label: "Brands" },
  { dimension: "silhouette", label: "Silhouettes" },
  { dimension: "carry", label: "Carry" },
  { dimension: "hardware", label: "Hardware" },
  { dimension: "material", label: "Materials" },
  { dimension: "size", label: "Size" },
  { dimension: "price_band", label: "Investment" },
  { dimension: "formality", label: "Occasion" },
];

function buildRegions(vec: TasteVector): TasteRegion[] {
  return REGIONS.map((r) => {
    const values = topValuesWithShare(vec, r.dimension, 3);
    return {
      dimension: r.dimension,
      label: r.label,
      values,
      filled: values.length > 0,
    };
  });
}

/**
 * Server wrapper for the Taste Map — fetches the user's blended taste and builds
 * the region grid. Renders nothing when signed out (caller gates on auth).
 */
export default async function TasteMapSection() {
  const taste = await getUserTaste();
  const named = nameTaste(taste.vector);
  const regions = buildRegions(taste.vector);

  // Endowed progress (goal-gradient): never display 0%. Having an account is the
  // first real step, so we floor the *presentation* at a small baseline. The honest
  // underlying completeness still drives the rest; we tell the user why it's not 0.
  const BASELINE = 10;
  const displayCompleteness = Math.max(BASELINE, taste.completeness);

  return (
    <TasteMap
      regions={regions}
      completeness={taste.completeness}
      displayCompleteness={displayCompleteness}
      baseline={BASELINE}
      remaining={dimensionsRemaining(taste.vector)}
      name={taste.completeness > 0 ? named.name : ""}
      tagline={taste.completeness > 0 ? named.tagline : "Take the quiz to start mapping your taste."}
    />
  );
}
