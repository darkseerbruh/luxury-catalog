/**
 * Is migration 0059 applied? Checks the live DB rather than guessing.
 *
 * PostgREST answers 42703 ("column does not exist") for an unapplied column,
 * which is the same signal the app's own graceful-degradation path keys on.
 *
 * Run: npx tsx scripts/probe-migration-0059.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing Supabase env");

const db = createClient(url, key, { auth: { persistSession: false } });

async function columnExists(table: string, column: string) {
  const { error } = await db.from(table).select(column).limit(1);
  if (!error) return { present: true as const };
  const code = (error as { code?: string }).code;
  if (code === "42703") return { present: false as const };
  return { present: null, error: error.message };
}

async function main() {
  const checks = {
    "watchlist.notify_on_listing": await columnExists("watchlist", "notify_on_listing"),
    "watchlist.last_listing_notified_at": await columnExists(
      "watchlist",
      "last_listing_notified_at",
    ),
    // 0058's target, for the same question about the older pending migration.
    "price_history.date_recorded": await columnExists("price_history", "date_recorded"),
  };

  // Enum values are not readable through PostgREST, so probe by attempting a
  // rejected insert shape: an invalid enum value errors 22P02 / 'invalid input
  // value for enum'. We use a NULL user_id so the row can never actually land.
  let enumHasListingAlert: boolean | string = "unknown";
  const { error: enumErr } = await db
    .from("notification")
    .insert({ user_id: null, type: "listing_alert", title: "probe" });
  if (enumErr) {
    const msg = enumErr.message ?? "";
    if (/invalid input value for enum/i.test(msg)) enumHasListingAlert = false;
    else if (/null value in column "user_id"|violates not-null/i.test(msg)) enumHasListingAlert = true;
    else enumHasListingAlert = `inconclusive: ${msg}`;
  }

  console.log(
    JSON.stringify(
      { as_of: new Date().toISOString(), checks, "notification_type has listing_alert": enumHasListingAlert },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
