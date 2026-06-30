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

/** How many `.range()` pages to fetch concurrently per batch (see fetchAllRows). */
export const PAGE_CONCURRENCY = 8;

/**
 * Read an entire result set past the 1000-row cap by paging with `.range()`.
 * `build(query)` receives a fresh base query (e.g. supabase.from("x").select(...))
 * and must apply all filters/order; this helper only adds the range window.
 *
 * Pages are fetched in PARALLEL batches (PAGE_CONCURRENCY at a time) instead of
 * one-after-another: a 42k-row table is ~43 pages, and serial paging meant ~43
 * sequential round trips (multiple seconds) on every uncached call. We fire a
 * batch at once, stop as soon as a page comes back short (the end) or errors,
 * and preserve row order. Returns [] on the first page's error.
 */
export async function fetchAllRows<T>(
  build: () => {
    range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
  },
  max = 60000,
): Promise<T[]> {
  const out: T[] = [];
  for (let start = 0; start < max; start += PAGE_SIZE * PAGE_CONCURRENCY) {
    const batch: PromiseLike<{ data: T[] | null; error: unknown }>[] = [];
    for (let i = 0; i < PAGE_CONCURRENCY; i++) {
      const from = start + i * PAGE_SIZE;
      if (from >= max) break;
      batch.push(build().range(from, from + PAGE_SIZE - 1));
    }
    const results = await Promise.all(batch);
    let done = false;
    for (const { data, error } of results) {
      if (error || !data) {
        done = true;
        break;
      }
      out.push(...data);
      if (data.length < PAGE_SIZE) {
        done = true;
        break;
      }
    }
    if (done) break;
  }
  return out;
}
