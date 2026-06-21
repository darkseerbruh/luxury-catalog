"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser, getProfile } from "./auth";
import { uniqueSlug } from "./posts-core";

export interface PostActionResult {
  ok: boolean;
  error?: string;
  /** The post's slug on success — callers redirect to /posts/[slug] or its edit page. */
  slug?: string;
}

/**
 * Expert-author guard. Returns the user id only if they're allowed to author
 * posts (profile.is_expert). Enforced server-side in EVERY mutating action —
 * the UI hides authoring controls too, but server actions are reachable via
 * direct POST, so this is the real gate (Next 16 mutating-data security note).
 */
async function requireExpert(): Promise<{ userId: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in." };
  const profile = await getProfile();
  if (!profile?.isExpert) {
    return { error: "Only verified experts can write articles." };
  }
  return { userId: user.id };
}

function parseTopicId(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * Collect the slugs already in use (excluding `exceptPostId` when editing) so a
 * new/updated post slug can be de-duplicated. Best-effort: on error returns an
 * empty set (the DB unique constraint is the real backstop).
 */
async function takenSlugs(exceptPostId?: number): Promise<Set<string>> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("post").select("post_id, slug").limit(5000);
  const set = new Set<string>();
  for (const r of (data ?? []) as { post_id: number; slug: string }[]) {
    if (exceptPostId && r.post_id === exceptPostId) continue;
    set.add(r.slug);
  }
  return set;
}

interface PostInput {
  title: string;
  excerpt: string | null;
  body: string | null;
  topicBrandId: number | null;
  topicStyleId: number | null;
}

function readPostInput(formData: FormData): PostInput | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3) return { error: "Give your article a title (3+ characters)." };
  if (title.length > 200) return { error: "Title is too long (max 200 characters)." };
  return {
    title: title.slice(0, 200),
    excerpt: String(formData.get("excerpt") ?? "").trim().slice(0, 300) || null,
    body: String(formData.get("body") ?? "").trim().slice(0, 50000) || null,
    topicBrandId: parseTopicId(formData.get("topic_brand_id")),
    topicStyleId: parseTopicId(formData.get("topic_style_id")),
  };
}

/** Create a new post (draft by default; "publish" intent sets it published). */
export async function createPost(formData: FormData): Promise<PostActionResult> {
  const guard = await requireExpert();
  if ("error" in guard) return { ok: false, error: guard.error };

  const input = readPostInput(formData);
  if ("error" in input) return { ok: false, error: input.error };

  const publish = formData.get("intent") === "publish";
  const slug = uniqueSlug(input.title, await takenSlugs());

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("post")
    .insert({
      author_user_id: guard.userId,
      slug,
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      status: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
      topic_brand_id: input.topicBrandId,
      topic_style_id: input.topicStyleId,
    })
    .select("slug")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      // Slug raced to a duplicate — retry once with a fresh suffix.
      const retrySlug = uniqueSlug(input.title + "-" + Date.now(), new Set());
      const retry = await supabase
        .from("post")
        .insert({
          author_user_id: guard.userId,
          slug: retrySlug,
          title: input.title,
          excerpt: input.excerpt,
          body: input.body,
          status: publish ? "published" : "draft",
          published_at: publish ? new Date().toISOString() : null,
          topic_brand_id: input.topicBrandId,
          topic_style_id: input.topicStyleId,
        })
        .select("slug")
        .single();
      if (retry.error || !retry.data) {
        return { ok: false, error: "Could not create the article. Please try again." };
      }
      revalidatePath("/posts");
      return { ok: true, slug: retry.data.slug };
    }
    return { ok: false, error: "Could not create the article. Please try again." };
  }

  revalidatePath("/posts");
  return { ok: true, slug: data.slug };
}

/**
 * Update an existing post by id. The author guard + RLS (`post_write_own`)
 * together ensure only the author can edit. The slug is NOT changed on edit
 * (stable URLs / GEO), even if the title changes.
 */
export async function updatePost(
  postId: number,
  formData: FormData
): Promise<PostActionResult> {
  const guard = await requireExpert();
  if ("error" in guard) return { ok: false, error: guard.error };
  if (!Number.isInteger(postId) || postId <= 0) return { ok: false, error: "Invalid article." };

  const input = readPostInput(formData);
  if ("error" in input) return { ok: false, error: input.error };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("post")
    .update({
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      topic_brand_id: input.topicBrandId,
      topic_style_id: input.topicStyleId,
    })
    .eq("post_id", postId)
    .eq("author_user_id", guard.userId)
    .select("slug")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Could not save your changes. Please try again." };

  revalidatePath("/posts");
  revalidatePath(`/posts/${data.slug}`);
  revalidatePath("/profile/posts");
  return { ok: true, slug: data.slug };
}

/**
 * Publish a draft (sets status=published + published_at if not already set).
 * Returns the slug so the caller can link to the live post. Analytics:
 * fire `post_published` client-side after this resolves.
 */
export async function publishPost(postId: number): Promise<PostActionResult> {
  const guard = await requireExpert();
  if ("error" in guard) return { ok: false, error: guard.error };
  if (!Number.isInteger(postId) || postId <= 0) return { ok: false, error: "Invalid article." };

  const supabase = await createServerSupabase();
  // Preserve an existing published_at if re-publishing; otherwise stamp now.
  const { data: existing } = await supabase
    .from("post")
    .select("published_at")
    .eq("post_id", postId)
    .eq("author_user_id", guard.userId)
    .maybeSingle();
  const publishedAt =
    (existing as { published_at: string | null } | null)?.published_at ??
    new Date().toISOString();

  const { data, error } = await supabase
    .from("post")
    .update({ status: "published", published_at: publishedAt })
    .eq("post_id", postId)
    .eq("author_user_id", guard.userId)
    .select("slug")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Could not publish. Please try again." };

  revalidatePath("/posts");
  revalidatePath(`/posts/${data.slug}`);
  revalidatePath("/profile/posts");
  return { ok: true, slug: data.slug };
}

/** Move a published post back to draft (unpublish). Author-only. */
export async function unpublishPost(postId: number): Promise<PostActionResult> {
  const guard = await requireExpert();
  if ("error" in guard) return { ok: false, error: guard.error };
  if (!Number.isInteger(postId) || postId <= 0) return { ok: false, error: "Invalid article." };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("post")
    .update({ status: "draft" })
    .eq("post_id", postId)
    .eq("author_user_id", guard.userId)
    .select("slug")
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Could not unpublish. Please try again." };
  revalidatePath("/posts");
  revalidatePath(`/posts/${data.slug}`);
  revalidatePath("/profile/posts");
  return { ok: true, slug: data.slug };
}
