import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { captureServer } from "@/lib/analytics/server";
import { sendEmail } from "@/lib/email";
import { isOptedIn } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Price-alert delivery job. Intended to be hit by Vercel Cron (see vercel.json);
 * secured by CRON_SECRET when set. For each watched bag with alerts enabled it
 * evaluates the user's rule and, on a fresh qualifying drop, creates an in-app
 * notification, (optionally) emails the user, and stamps watchlist.last_notified_at
 * so the same drop isn't re-sent.
 *
 * Two rule modes (migration 0033):
 *   - 'pct_below_median' (default): fire when a current listing sits at least
 *     alert_pct% below the variant's *median* resale price. Median, not average,
 *     because resale prices are right-skewed, so the median fires fewer, truer-deal
 *     alerts. Needs a minimum sample to be trustworthy.
 *   - 'absolute': fire when a price reaches the user's dollar target_price.
 *
 * Runs with the service-role client (bypasses RLS). No-ops without DB env.
 * Degrades gracefully pre-0033: if the new columns are absent it falls back to the
 * legacy absolute-target behavior.
 */

/** Minimum resale comps before a median is trustworthy enough to alert on. */
const MIN_MEDIAN_SAMPLE = 5;

type PriceRow = {
  sale_price: number | null;
  date_recorded: string;
  currency: string | null;
  price_type?: string | null;
};

type WatchRow = {
  watch_id: number;
  user_id: string;
  variant_id: number;
  target_price: number | null;
  alert_mode?: string | null;
  alert_pct?: number | null;
  currency: string | null;
  last_notified_at: string | null;
  variant:
    | { style: unknown; price_history: PriceRow[] | null }
    | { style: unknown; price_history: PriceRow[] | null }[]
    | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  return (Array.isArray(v) ? v[0] : v) ?? null;
}

function money(amount: number, currency: string | null): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(amount).toLocaleString()}`;
}

function median(nums: number[]): number {
  const s = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /column .* does not exist/i.test(error.message ?? "");
}

/** Style name + brand off the messy nested join. */
function nameOf(variantStyle: unknown): { styleName: string; brandName: string } {
  const style = one(variantStyle as Record<string, unknown> | Record<string, unknown>[] | null);
  const styleName = (style?.name as string) ?? "A watched bag";
  const brand = one(style?.brand as Record<string, unknown> | Record<string, unknown>[] | null);
  const brandName = (brand?.name as string) ?? "";
  return { styleName, brandName };
}

type Trigger = { price: number; currency: string | null; body: string };

/** Evaluate a row's rule against its price history; null = no fresh qualifying drop. */
function evaluate(row: WatchRow, prices: PriceRow[], cutoff: string | null): Trigger | null {
  const fresh = (p: PriceRow): boolean =>
    p.sale_price != null && (!cutoff || p.date_recorded > cutoff.slice(0, 10));

  const mode = row.alert_mode === "pct_below_median" ? "pct_below_median" : "absolute";

  if (mode === "pct_below_median") {
    const pct = row.alert_pct;
    if (pct == null || pct <= 0) return null;
    // Median over non-retail resale rows; a single sky-high listing won't distort it.
    const comps = prices
      .filter((p) => p.sale_price != null && p.price_type !== "retail")
      .map((p) => Number(p.sale_price));
    if (comps.length < MIN_MEDIAN_SAMPLE) return null;
    const med = median(comps);
    const threshold = med * (1 - pct / 100);
    const qualifying = prices.filter((p) => fresh(p) && Number(p.sale_price) <= threshold);
    if (qualifying.length === 0) return null;
    const best = qualifying.reduce((lo, p) => (Number(p.sale_price) < Number(lo.sale_price) ? p : lo));
    const price = Number(best.sale_price);
    const currency = best.currency ?? row.currency;
    const off = Math.round((1 - price / med) * 100);
    return {
      price,
      currency,
      body: `Now ${money(price, currency)}, about ${off}% below the typical resale price (around ${money(med, currency)}).`,
    };
  }

  // Absolute dollar target.
  if (row.target_price == null) return null;
  const qualifying = prices.filter((p) => fresh(p) && Number(p.sale_price) <= Number(row.target_price));
  if (qualifying.length === 0) return null;
  const best = qualifying.reduce((lo, p) => (Number(p.sale_price) < Number(lo.sale_price) ? p : lo));
  const price = Number(best.sale_price);
  const currency = best.currency ?? row.currency;
  return {
    price,
    currency,
    body: `Now ${money(price, currency)}, at or below your ${money(Number(row.target_price), row.currency)} target.`,
  };
}

export async function GET(request: NextRequest) {
  // Fail closed: deny unless CRON_SECRET is set AND the bearer token matches.
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  const fullJoin =
    "watch_id, user_id, variant_id, target_price, alert_mode, alert_pct, currency, last_notified_at, variant:variant_id(style:style_id(name, brand:brand_id(name)), price_history(sale_price, date_recorded, currency, price_type))";
  const legacyJoin =
    "watch_id, user_id, variant_id, target_price, currency, last_notified_at, variant:variant_id(style:style_id(name, brand:brand_id(name)), price_history(sale_price, date_recorded, currency))";

  // Try the 0033-aware read (all alert-enabled rows). Fall back to legacy
  // absolute-only behavior if the new columns aren't there yet.
  let { data, error } = await admin.from("watchlist").select(fullJoin).eq("alert_enabled", true);
  if (isMissingColumn(error)) {
    const fb = await admin
      .from("watchlist")
      .select(legacyJoin)
      .eq("alert_enabled", true)
      .not("target_price", "is", null);
    data = fb.data as unknown as typeof data;
    error = fb.error;
  }

  if (error) {
    console.error("price-alerts query error:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as WatchRow[];
  let triggered = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    const variant = one(row.variant);
    if (!variant) continue;
    const prices = variant.price_history ?? [];

    const hit = evaluate(row, prices, row.last_notified_at);
    if (!hit) continue;

    // Respect the user's price-alert opt-out (default-on).
    if (!(await isOptedIn(row.user_id, "price_alert"))) continue;

    const { styleName, brandName } = nameOf(variant.style);
    const title = `Price drop: ${[brandName, styleName].filter(Boolean).join(" ")}`;

    const { error: insErr } = await admin.from("notification").insert({
      user_id: row.user_id,
      type: "price_alert",
      title,
      body: hit.body,
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
          html: `<p>${hit.body}</p><p><a href="https://luxurycatalog.com/bag/${row.variant_id}">View the bag →</a></p>`,
        });
      }
    } catch (e) {
      console.error("alert email lookup failed:", e);
    }

    await captureServer({
      distinctId: row.user_id,
      event: "price_alert_triggered",
      properties: {
        variant_id: row.variant_id,
        price: hit.price,
        mode: row.alert_mode ?? "absolute",
        pct: row.alert_pct ?? null,
        target: row.target_price,
      },
    });

    triggered++;
  }

  return NextResponse.json({ checked: rows.length, triggered });
}
