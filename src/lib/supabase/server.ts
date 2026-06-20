import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Auth-aware Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads and writes the session from the request cookies so RLS
 * policies keyed on `auth.uid()` (closet, watchlist, profile) work per-user.
 *
 * `cookies()` is async in Next.js 16 (synchronous access was removed), so this
 * is an async factory. Cookie writes from a Server Component render are not
 * allowed by Next; the surrounding try/catch makes that a no-op there and
 * relies on `proxy.ts` to refresh the session instead.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render — ignore; proxy.ts refreshes
            // the session cookie on the next request.
          }
        },
      },
    }
  );
}
