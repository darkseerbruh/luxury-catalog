// Hard guard: importing this module from a Client Component is a build error,
// so the service-role key can never be bundled into browser JS. This backs up
// the "server-only" convention below with a compiler-enforced wall.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Service-role Supabase client — bypasses RLS. Server-only; never import into a
 * Client Component. Used by the admin dashboards to read tables that have no
 * public SELECT policy (bag_request, thrift_find).
 *
 * Lazily constructed so a build without env vars (e.g. the CI sandbox) doesn't
 * crash during page-data collection.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return adminClient;
}
