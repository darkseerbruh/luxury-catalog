import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Lazily creates the Supabase client on first use rather than at module
 * load. Next.js evaluates route modules during the build's page-data
 * collection step even for `force-dynamic` routes, which would otherwise
 * crash the build in environments without NEXT_PUBLIC_SUPABASE_* set
 * (e.g. this sandbox, which has no .env.local).
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

/** PostgREST caps every response at 1000 rows regardless of `.limit()`. */
export const PAGE_SIZE = 1000;

/**
 * Read an entire result set past the 1000-row cap by paging with `.range()`.
 * `build(query)` receives a fresh base query (e.g. supabase.from("x").select(...))
 * and must apply all filters/order; this helper only adds the range window and
 * loops until a short page (or `max`) is reached. Returns [] on any error.
 */
export async function fetchAllRows<T>(
  build: () => {
    range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
  },
  max = 60000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += PAGE_SIZE) {
    const { data, error } = await build().range(from, from + PAGE_SIZE - 1);
    if (error || !data) break;
    out.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return out;
}
