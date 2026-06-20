/**
 * Auth seam for the UGC layer (collection / wishlist / reviews).
 *
 * The app does NOT have Supabase Auth wired up yet (see docs/handoff.md →
 * "Next major workstream: the UGC layer"). Every user-scoped feature routes
 * through getCurrentUser() so that turning on real auth later is a single-file
 * change rather than a refactor across pages and actions.
 *
 * ── TO ENABLE REAL AUTH (the Step-0 prerequisite) ───────────────────────────
 *  1. Turn on Supabase Auth in the project dashboard.
 *  2. `npm i @supabase/ssr` and add a request-scoped server client that reads
 *     the auth cookies via the (modified) Next 16 `cookies()` API.
 *  3. Replace the body of getCurrentUser() to return the session user, AND
 *     route user-scoped DB writes through that authenticated client so Postgres
 *     RLS (`auth.uid()`) matches the row's user_id. Until that happens, the
 *     anon client is correctly blocked by RLS from touching user_bag/review.
 *
 * DEV_USER_ID is an escape hatch for exercising the UI locally before auth
 * exists; note that writes still require the authed client from step 3 to pass
 * RLS, so DEV_USER_ID alone only lights up the signed-in *layout*, not writes.
 */
export interface CurrentUser {
  id: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const devUser = process.env.DEV_USER_ID;
  if (devUser) return { id: devUser };
  return null;
}
