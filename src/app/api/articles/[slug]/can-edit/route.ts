import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBySlug } from "@/lib/posts";

/**
 * Author-only "can I edit this article?" check, fetched by the article page's
 * client edit-link island AFTER the (now ISR-cached) page loads. Reads cookies,
 * so it's dynamic — but it never blocks the cached article HTML.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [user, post] = await Promise.all([getCurrentUser(), getBySlug(slug)]);
  const canEdit = !!user && !!post && user.id === post.author?.userId;
  return NextResponse.json({ canEdit });
}
