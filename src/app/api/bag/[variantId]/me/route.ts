import { NextResponse } from "next/server";
import { getVariantUserState } from "@/lib/collections";

/**
 * Per-variant signed-in state (closet want/have/had + price watch) fetched by the
 * bag page's client islands AFTER the static shell loads. Reads cookies, so it's
 * dynamic — but it runs only for the signed-in slice and never blocks the (now
 * ISR-cached) bag page itself. Twin of /api/home/me for the bag surface.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await params;
  const id = Number.parseInt(variantId, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ signedIn: false, closetStatus: null, watching: false });
  }
  const state = await getVariantUserState(id);
  return NextResponse.json(state);
}
