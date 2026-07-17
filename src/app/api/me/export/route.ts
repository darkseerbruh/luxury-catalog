import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * GDPR Art. 15/20 data export. Returns a JSON file with every row this user owns
 * across the app's tables, plus their account record. Authenticated by the
 * cookie session (`getCurrentUser`); the user id used for every query comes from
 * the validated session, never from the request, so there is no IDOR surface.
 *
 * We use the service-role client so the export is complete even for tables the
 * user cannot read directly (e.g. the RLS-locked newsletter table), but every
 * query is pinned to THIS user's id/email. Each query is wrapped so a table that
 * does not exist yet (unapplied migration) is skipped rather than failing the
 * whole export.
 */

// [table, owner column] for every table keyed to a single user id.
const OWNED_TABLES: ReadonlyArray<readonly [string, string]> = [
  ["profile", "id"],
  ["closet_item", "user_id"],
  ["watchlist", "user_id"],
  ["bag_request", "user_id"],
  ["thrift_find", "user_id"],
  ["review", "user_id"],
  ["notification", "user_id"],
  ["correction", "created_by"],
  ["four_grails", "user_id"],
  ["bag_axis_vote", "user_id"],
  ["bag_photo", "user_id"],
  ["authentication_request", "user_id"],
  ["user_profile", "user_id"],
  ["user_recs", "user_id"],
  ["closet_value_snapshot", "user_id"],
  ["bag_wear", "user_id"],
  ["post", "author_user_id"],
];

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Export isn't available right now. Please contact arielle@luxurycatalog.com." },
      { status: 503 },
    );
  }

  const admin = getSupabaseAdmin();
  const data: Record<string, unknown> = {};

  for (const [table, column] of OWNED_TABLES) {
    try {
      const { data: rows, error } = await admin.from(table).select("*").eq(column, user.id);
      if (!error) data[table] = rows ?? [];
    } catch {
      /* table missing (unapplied migration) — skip it */
    }
  }

  // closet_favorite links two users; include rows on either side.
  try {
    const { data: rows } = await admin
      .from("closet_favorite")
      .select("*")
      .or(`follower_user_id.eq.${user.id},owner_user_id.eq.${user.id}`);
    data["closet_favorite"] = rows ?? [];
  } catch {
    /* skip */
  }

  // Newsletter is email-keyed with no FK to the account.
  if (user.email) {
    try {
      const { data: rows } = await admin
        .from("newsletter_subscriber")
        .select("*")
        .eq("email", user.email);
      data["newsletter_subscriber"] = rows ?? [];
    } catch {
      /* skip */
    }
  }

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    data,
  };

  const filename = `luxury-catalog-data-${user.id}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
