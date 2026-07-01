import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Lightweight autocomplete for the nav search. Cheap prefix/substring matches
 * across brands, styles, and published articles, so a user sees example options
 * as they type. Read-only; degrades to empty on any failure or missing env.
 *
 * GET /api/search-suggest?q=cha
 */
export type Suggestion = { label: string; sub: string; href: string };

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2 || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ suggestions: [] as Suggestion[] });
  }
  try {
    const db = getSupabase();
    const like = `%${q}%`;
    const [brands, styles, posts] = await Promise.all([
      db.from("brand").select("brand_id, name").ilike("name", like).limit(4),
      db.from("style").select("style_id, name").ilike("name", like).limit(5),
      db.from("post").select("slug, title").eq("status", "published").ilike("title", like).limit(3),
    ]);

    const suggestions: Suggestion[] = [];
    for (const b of brands.data ?? []) {
      suggestions.push({ label: b.name as string, sub: "Brand", href: `/brand/${b.brand_id}` });
    }
    for (const s of styles.data ?? []) {
      suggestions.push({ label: s.name as string, sub: "Bag", href: `/search?q=${encodeURIComponent(s.name as string)}` });
    }
    for (const p of posts.data ?? []) {
      suggestions.push({ label: p.title as string, sub: "Article", href: `/articles/${p.slug}` });
    }
    return NextResponse.json({ suggestions: suggestions.slice(0, 10) });
  } catch {
    return NextResponse.json({ suggestions: [] as Suggestion[] });
  }
}
