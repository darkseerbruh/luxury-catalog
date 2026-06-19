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
