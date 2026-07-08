import { NextResponse } from "next/server";
import { getFinderModels, getFinderColourways } from "@/lib/bag-finder";

export const dynamic = "force-dynamic";

/**
 * The bag finder behind the unified nav + closet search
 * (docs/ux/unified-search-and-review-spec.md).
 *
 * GET /api/bag-finder            → top popular models (populate on focus)
 * GET /api/bag-finder?q=lady     → matching models, model-level
 * GET /api/bag-finder?styleId=42 → that model's colourways (pick by sight)
 *
 * Read-only; degrades to empty arrays on any failure or missing env.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const styleIdRaw = url.searchParams.get("styleId");

  try {
    if (styleIdRaw) {
      const styleId = Number(styleIdRaw);
      if (!Number.isFinite(styleId)) return NextResponse.json({ colours: [] });
      return NextResponse.json({ colours: await getFinderColourways(styleId) });
    }
    const q = (url.searchParams.get("q") ?? "").trim();
    return NextResponse.json({ models: await getFinderModels(q) });
  } catch {
    return NextResponse.json({ models: [], colours: [] });
  }
}
