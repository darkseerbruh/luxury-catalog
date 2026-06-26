import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";

/**
 * Expert editorial post reads, built on the 0006 `post` table. Every query
 * degrades to empty/null when Supabase env or the migrations are absent, exactly
 * like getResourcesForStyle() / social.ts — the cloud build has no DB credentials.
 *
 * RLS (0006): anyone reads `published` rows; an author reads/writes their own.
 */

function hasSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export interface PostAuthor {
  userId: string;
  displayName: string | null;
  handle: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isExpert: boolean;
  isAuthenticator: boolean;
  isVerified: boolean;
}

export interface PostTopic {
  brandId: number | null;
  brandName: string | null;
  styleId: number | null;
  styleName: string | null;
}

export interface PostSummary {
  postId: number;
  slug: string;
  title: string;
  excerpt: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor | null;
  topic: PostTopic;
}

export interface PostDetail extends PostSummary {
  body: string | null;
}

type ProfileJoin = {
  id: string;
  display_name: string | null;
  handle: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_expert: boolean | null;
  is_authenticator: boolean | null;
  is_verified: boolean | null;
};

type BrandJoin = { brand_id: number; name: string };
type StyleJoin = { style_id: number; name: string };

type PostRow = {
  post_id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  body?: string | null;
  status: "draft" | "published" | "archived";
  topic_brand_id: number | null;
  topic_style_id: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author_user_id: string;
  author?: ProfileJoin | ProfileJoin[] | null;
  topic_brand?: BrandJoin | BrandJoin[] | null;
  topic_style?: StyleJoin | StyleJoin[] | null;
};

function one<T>(j: T | T[] | null | undefined): T | null {
  if (!j) return null;
  return Array.isArray(j) ? (j[0] ?? null) : j;
}

function mapAuthor(j: PostRow["author"]): PostAuthor | null {
  const a = one(j);
  if (!a) return null;
  return {
    userId: a.id,
    displayName: a.display_name,
    handle: a.handle,
    bio: a.bio,
    avatarUrl: a.avatar_url,
    isExpert: Boolean(a.is_expert),
    isAuthenticator: Boolean(a.is_authenticator),
    isVerified: Boolean(a.is_verified),
  };
}

function mapTopic(row: PostRow): PostTopic {
  const b = one(row.topic_brand);
  const s = one(row.topic_style);
  return {
    brandId: row.topic_brand_id,
    brandName: b?.name ?? null,
    styleId: row.topic_style_id,
    styleName: s?.name ?? null,
  };
}

// The author profile is fetched via a foreign-table embed. `post.author_user_id`
// references auth.users, but `profile.id` is the same uuid, so we embed `profile`
// explicitly by the relationship hint.
// NOTE: the author is NOT embedded. `post.author_user_id` FKs to auth.users, not
// profile, so PostgREST cannot embed `profile` through it ("could not find a
// relationship"). We select author_user_id and fetch the profile separately
// (attachAuthors) — robust and avoids the broken embed.
const SUMMARY_SELECT =
  "post_id, slug, title, excerpt, status, topic_brand_id, topic_style_id, published_at, created_at, updated_at, author_user_id, " +
  "topic_brand:brand!post_topic_brand_id_fkey(brand_id, name), " +
  "topic_style:style!post_topic_style_id_fkey(style_id, name)";

const DETAIL_SELECT = SUMMARY_SELECT.replace("post_id, slug", "post_id, slug, body");

function mapSummary(row: PostRow): PostSummary {
  return {
    postId: row.post_id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: mapAuthor(row.author),
    topic: mapTopic(row),
  };
}

/**
 * The author profile embed depends on a named FK relationship that may not exist
 * if the schema's been altered. Retry without the embed so the list still renders.
 */
const SUMMARY_SELECT_FALLBACK =
  "post_id, slug, title, excerpt, status, topic_brand_id, topic_style_id, published_at, created_at, updated_at, author_user_id";

/** Fetch author profiles by id and attach them to the rows (the FK embed can't,
 * see SUMMARY_SELECT). RLS still applies: public profiles (verified/expert/etc.)
 * resolve for anyone, an author's own profile resolves for the author. */
async function attachAuthors(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  rows: PostRow[],
): Promise<void> {
  const ids = [...new Set(rows.map((r) => r.author_user_id).filter(Boolean))];
  if (ids.length === 0) return;
  const { data } = await supabase
    .from("profile")
    .select("id, display_name, handle, bio, avatar_url, is_expert, is_authenticator, is_verified")
    .in("id", ids);
  const byId = new Map<string, ProfileJoin>(((data ?? []) as ProfileJoin[]).map((p) => [p.id, p]));
  for (const r of rows) r.author = (r.author_user_id ? byId.get(r.author_user_id) : null) ?? null;
}
const DETAIL_SELECT_FALLBACK = SUMMARY_SELECT_FALLBACK.replace(
  "post_id, slug",
  "post_id, slug, body"
);

/** Published posts, newest first (by published_at). Empty when env/migrations absent. */
export async function listPublished(limit = 50): Promise<PostSummary[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();

  const primary = await supabase
    .from("post")
    .select(SUMMARY_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  let rows = primary.data as unknown as PostRow[] | null;
  if (primary.error) {
    const fb = await supabase
      .from("post")
      .select(SUMMARY_SELECT_FALLBACK)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (fb.error || !fb.data) return [];
    rows = fb.data as unknown as PostRow[];
  }
  if (!rows) return [];
  await attachAuthors(supabase, rows);
  return rows.map(mapSummary);
}

/**
 * One post by slug. Returns published posts to anyone; an author's own
 * draft/archived posts are returned to that author (RLS allows the read, so the
 * row is simply absent for everyone else). Null when missing.
 */
export async function getBySlug(slug: string): Promise<PostDetail | null> {
  if (!hasSupabase()) return null;
  const clean = slug.trim().toLowerCase();
  if (!clean) return null;
  const supabase = await createServerSupabase();

  const primary = await supabase
    .from("post")
    .select(DETAIL_SELECT)
    .eq("slug", clean)
    .maybeSingle();

  let row = primary.data as unknown as PostRow | null;
  if (primary.error) {
    const fb = await supabase
      .from("post")
      .select(DETAIL_SELECT_FALLBACK)
      .eq("slug", clean)
      .maybeSingle();
    if (fb.error || !fb.data) return null;
    row = fb.data as unknown as PostRow;
  }
  if (!row) return null;
  await attachAuthors(supabase, [row]);
  return { ...mapSummary(row), body: row.body ?? null };
}

/**
 * Posts authored by `userId`. With `publishedOnly`, only published ones (used on
 * the public /u/[handle] profile). Without it, all of the author's posts (used
 * in the author's own /profile/posts dashboard — RLS still scopes to own rows).
 */
export async function listByAuthor(
  userId: string,
  publishedOnly = true,
  limit = 50
): Promise<PostSummary[]> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();

  let query = supabase
    .from("post")
    .select(SUMMARY_SELECT)
    .eq("author_user_id", userId);
  if (publishedOnly) query = query.eq("status", "published");

  const primary = await query
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  let rows = primary.data as unknown as PostRow[] | null;
  if (primary.error) {
    let fb = supabase
      .from("post")
      .select(SUMMARY_SELECT_FALLBACK)
      .eq("author_user_id", userId);
    if (publishedOnly) fb = fb.eq("status", "published");
    const fbRes = await fb.order("updated_at", { ascending: false }).limit(limit);
    if (fbRes.error || !fbRes.data) return [];
    rows = fbRes.data as unknown as PostRow[];
  }
  if (!rows) return [];
  await attachAuthors(supabase, rows);
  return rows.map(mapSummary);
}

/** Slugs + last-modified of published posts, for the sitemap. Empty if absent. */
export async function getPublishedPostSitemapTargets(): Promise<
  { slug: string; updatedAt: string }[]
> {
  if (!hasSupabase()) return [];
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("post")
    .select("slug, updated_at")
    .eq("status", "published")
    .limit(5000);
  if (error || !data) return [];
  return (data as { slug: string; updated_at: string }[]).map((r) => ({
    slug: r.slug,
    updatedAt: r.updated_at,
  }));
}

/** The current user's own posts (all statuses) for the authoring dashboard. */
export async function listMyPosts(limit = 50): Promise<PostSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  return listByAuthor(user.id, false, limit);
}
