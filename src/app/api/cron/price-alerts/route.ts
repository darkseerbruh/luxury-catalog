import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { captureServer } from "@/lib/analytics/server";
import { sendEmail } from "@/lib/email";
import { isOptedIn } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Price-alert delivery job. Intended to be hit by Vercel Cron (see vercel.json);
 * secured by CRON_SECRET when set. Scans watchlist rows with a target price and
 * alerts enabled, and for any variant whose recorded price has dropped to/below
 * the target *since the last notification*, creates an in-app notification,
 * (optionally) emails the user, and stamps watchlist.last_notified_at so the
 * same drop isn't re-sent.
 *
 * Runs with the service-role client (bypasses RLS). No-ops without DB env.
 */

type WatchRow = {
  watch_id: number;
  user_id: string;
  variant_id: number;
  target_price: number | null;
  currency: string | null;
  last_notified_at: string | null;
  variant:
    | {
        style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
        price_history: { sale_price: number | null; date_recorded: string; currency: string | null }[] | null;
      }
    | {
        style: { name: string; brand: { name: string } | { name: string }[] | null } | { name: string; brand: { name: string } | { name: string }[] | null }[] | null;
        price_history: { sale_price: number | null; date_recorded: string; currency: string | null }[] | null;
      }[]
    | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  return (Array.isArray(v) ? v[0] : v) ?? null;
}

function money(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("watchlist")
    .select(
      "watch_id, user_id, variant_id, target_price, currency, last_notified_at, variant:variant_id(style:style_id(name, brand:brand_id(name)), price_history(sale_price, date_recorded, currency))"
    )
    .eq("alert_enabled", true)
    .not("target_price", "is", null);

  if (error) {
    console.error("price-alerts query error:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const rows = (data ?? []) as WatchRow[];
  let triggered = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    if (row.target_price == null) continue;
    const variant = one(row.variant);
    if (!variant) continue;

    const lastNotified = row.last_notified_at;
    // Qualifying drops: at/below target and newer than the last notification.
    const qualifying = (variant.price_history ?? [])
      .filter((p) => p.sale_price != null && Number(p.sale_price) <= Number(row.target_price))
      .filter((p) => !lastNotified || p.date_recorded > lastNotified.slice(0, 10));

    if (qualifying.length === 0) continue;

    const best = qualifying.reduce((lo, p) =>
      Number(p.sale_price) < Number(lo.sale_price) ? p : lo
    );
    const style = one(variant.style);
    const brand = style ? one(style.brand) : null;
    const styleName = style?.name ?? "A watched bag";
    const brandName = brand?.name ?? "";
    const price = Number(best.sale_price);
    const currency = best.currency ?? row.currency;

    // Respect the user's price-alert opt-out (default-on).
    if (!(await isOptedIn(row.user_id, "price_alert"))) continue;

    const title = `Price drop: ${[brandName, styleName].filter(Boolean).join(" ")}`;
    const body = `Now ${money(price, currency)} — at or below your ${money(Number(row.target_price), row.currency)} target.`;

    const { error: insErr } = await admin.from("notification").insert({
      user_id: row.user_id,
      type: "price_alert",
      title,
      body,
      variant_id: row.variant_id,
    });
    if (insErr) {
      console.error("notification insert error:", insErr);
      continue;
    }

    await admin.from("watchlist").update({ last_notified_at: now }).eq("watch_id", row.watch_id);

    // Optional email (no-op without RESEND_API_KEY). Honor the email opt-out.
    try {
      const emailOptIn = await isOptedIn(row.user_id, "email");
      const { data: userRes } = await admin.auth.admin.getUserById(row.user_id);
      const email = userRes?.user?.email;
      if (email && emailOptIn) {
        await sendEmail({
          to: email,
          subject: title,
          html: `<p>${body}</p><p><a href="https://luxurycatalog.com/bag/${row.variant_id}">View the bag →</a></p>`,
        });
      }
    } catch (e) {
      console.error("alert email lookup failed:", e);
    }

    await captureServer({
      distinctId: row.user_id,
      event: "price_alert_triggered",
      properties: { variant_id: row.variant_id, price, target: row.target_price },
    });

    triggered++;
  }

  return NextResponse.json({ checked: rows.length, triggered });
}
