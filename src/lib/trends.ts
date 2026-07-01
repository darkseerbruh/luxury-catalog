import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** One row of the tiktok_trend table (migration 0041). */
export type TrendRow = {
  term: string;
  popularity: string | null;
  pop_num: number | null;
  growth_pct: string | null;
  brand: string | null;
  suggested_content: string | null;
  our_page: string | null;
  sat_priority: number | null;
  creators_saturation: number | null;
  content_status: string | null;
  notes: string | null;
  captured_on: string;
  updated_at: string;
};

/**
 * All trending terms, most popular first. Admin-only (RLS has no public policy,
 * so this reads via the service-role client). The table holds < 1000 rows, well
 * under the PostgREST page cap, so a single ordered select is complete.
 * Returns [] (page renders its empty state) when the service key is absent.
 */
export async function getTiktokTrends(): Promise<TrendRow[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("tiktok_trend")
    .select(
      "term, popularity, pop_num, growth_pct, brand, suggested_content, our_page, sat_priority, creators_saturation, content_status, notes, captured_on, updated_at",
    )
    .order("pop_num", { ascending: false, nullsFirst: false })
    .limit(1000);

  if (error || !data) return [];
  return data as TrendRow[];
}
