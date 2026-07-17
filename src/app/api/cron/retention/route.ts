import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Storage-limitation purge (GDPR Art. 5(1)(e)). Deletes anonymous, append-only
 * log rows older than the retention window so they do not accumulate forever.
 * Runs with the service-role client; secured by CRON_SECRET (fail closed), same
 * as the other cron jobs. Scheduled in vercel.json.
 *
 * Only anonymous logs are purged here. Account-linked data is removed on account
 * deletion (see deleteAccount), not on a clock.
 */

// Anonymous log tables and how long we keep them.
const RETENTION_DAYS = 730; // ~24 months

// [table, timestamp column] for each anonymous log we age out.
const PURGE_TARGETS: ReadonlyArray<readonly [string, string]> = [
  ["searched_not_found", "created_at"],
];

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const admin = getSupabaseAdmin();
  const purged: Record<string, number | "error"> = {};

  for (const [table, column] of PURGE_TARGETS) {
    try {
      const { data, error } = await admin
        .from(table)
        .delete()
        .lt(column, cutoff)
        .select("*");
      purged[table] = error ? "error" : (data?.length ?? 0);
      if (error) console.error(`retention purge ${table} error:`, error);
    } catch (err) {
      purged[table] = "error";
      console.error(`retention purge ${table} exception:`, err);
    }
  }

  return NextResponse.json({ ok: true, cutoff, purged });
}
