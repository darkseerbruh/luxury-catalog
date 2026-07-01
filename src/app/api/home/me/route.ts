import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCloset } from "@/lib/collections";
import { getFeed } from "@/lib/feed";
import { getSavedTasteIdentity } from "@/lib/taste-data";
import { getVariantImages } from "@/lib/queries";
import { getClosetValue } from "@/lib/portfolio";

/**
 * Signed-in homepage personalization (style read, closet preview, activity feed)
 * fetched by the client after the static home shell loads. Reads cookies, so
 * it's dynamic — but it runs only for the signed-in slice and never blocks the
 * (now static, CDN-served) homepage itself.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ signedIn: false });
  }

  const [closet, feed, taste, closetValue] = await Promise.all([
    getCloset(),
    getFeed(8),
    getSavedTasteIdentity(),
    getClosetValue(),
  ]);

  const images = await getVariantImages(
    closet.map((c) => c.variantId).filter((n): n is number => n != null)
  );

  return NextResponse.json({ signedIn: true, closet, feed, taste, images, closetValue });
}
