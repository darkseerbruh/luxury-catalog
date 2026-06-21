/**
 * Pure, no-DB helpers for the expert editorial post layer. Kept separate from
 * `posts.ts` so the slug logic can be unit-tested without Supabase (the cloud
 * build has no DB credentials), mirroring `taste-core.ts` / `recommendations-core.ts`.
 */

/**
 * Turn a post title into a URL slug: lowercase, ASCII-folded, hyphen-separated,
 * stripped of punctuation. Deterministic and idempotent. Falls back to "post"
 * for an empty/symbol-only title so a slug always exists.
 */
export function slugify(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .toLowerCase()
    .replace(/['']/g, "") // drop apostrophes so "hermes's" -> "hermess" not "hermes-s"
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics -> hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .slice(0, 80)
    .replace(/-+$/g, ""); // re-trim if slice cut mid-hyphen
  return base || "post";
}

/**
 * De-duplicate a base slug against a set of slugs already taken, appending
 * "-2", "-3", … until unique. `taken` is the set of existing slugs (excluding
 * the row being edited). Pure so it's unit-testable.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = slugify(base);
  if (!taken.has(root)) return root;
  let n = 2;
  // Cap the suffix so a pathological collision set can't loop unbounded.
  while (n < 10000) {
    const candidate = `${root}-${n}`;
    if (!taken.has(candidate)) return candidate;
    n += 1;
  }
  // Extremely unlikely fallback: timestamp suffix.
  return `${root}-${Date.now()}`;
}
