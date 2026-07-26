import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { captureServer } from "@/lib/analytics/server";
import { sendEmail } from "@/lib/email";
import { isOptedIn } from "@/lib/notifications";
import { matchSpecAlert, type AlertSpec, type SpecCandidate } from "@/lib/price-alert-match";
import { pickNewListing, watchCutoff, type ListingRow } from "@/lib/listing-alert";
import { fetchAllRows } from "@/lib/supabase";

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
  platform?: string | null;
};

/** Platforms whose null-typed rows are actually boutique/MSRP records. */
const RETAIL_PLATFORM_RX = /retail|boutique|msrp/i;

/**
 * Same retail heuristic as lib/portfolio.ts. The canonical stored value is
 * "retail_msrp" (a `!== "retail"` check here once let MSRP rows inflate every
 * alert median).
 */
function isRetailPrice(p: PriceRow): boolean {
  return (
    p.price_type === "retail_msrp" ||
    (p.price_type == null && p.platform != null && RETAIL_PLATFORM_RX.test(p.platform))
  );
}

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
    | { style_id?: number | null; style: unknown; price_history: PriceRow[] | null }
    | { style_id?: number | null; style: unknown; price_history: PriceRow[] | null }[]
    | null;
};

/** A "want" with a breadth spec, keyed by `${user_id}|${variant_id}`. */
function specKey(userId: string, variantId: number): string {
  return `${userId}|${variantId}`;
}

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

type AvailabilityWatch = {
  watch_id: number;
  user_id: string;
  variant_id: number;
  last_listing_notified_at: string | null;
  created_at: string | null;
};

/**
 * Availability pass: tell a watcher when one turns up AT ALL (migration 0059).
 *
 * Runs as a floor UNDER the price rules, not as a third mode. The price modes
 * both need price data to work, and `pct_below_median` goes silent below 5
 * comps, so on rare bags the alert was dead exactly where our catalogue is
 * most differentiated. A collector's trigger is "a grail became available",
 * not "a grail got cheaper".
 *
 * Degrades to a no-op (and says so in the log) until 0059 is applied, so this
 * can merge and deploy before the migration runs.
 */
async function runAvailabilityAlerts(
  admin: ReturnType<typeof getSupabaseAdmin>,
  alreadyPinged: Set<number>,
  now: string,
): Promise<number> {
  const { data, error } = await admin
    .from("watchlist")
    .select("watch_id, user_id, variant_id, last_listing_notified_at, created_at")
    .eq("alert_enabled", true)
    .eq("notify_on_listing", true);

  if (isMissingColumn(error)) {
    console.warn("availability alerts skipped: migration 0059 not applied yet");
    return 0;
  }
  if (error) {
    console.error("availability watch query error:", error);
    return 0;
  }

  const watches = ((data ?? []) as AvailabilityWatch[]).filter(
    (w) => !alreadyPinged.has(w.watch_id),
  );
  if (watches.length === 0) return 0;

  // One read for the whole batch rather than a query per watch. Bounded by the
  // earliest cutoff in the batch so we never scan the full price history.
  const variantIds = [...new Set(watches.map((w) => w.variant_id))];
  const cutoffs = watches
    .map((w) => watchCutoff(w))
    .filter((c): c is string => !!c)
    .map((c) => Date.parse(c))
    .filter((n) => Number.isFinite(n));
  const earliest = cutoffs.length > 0 ? new Date(Math.min(...cutoffs)) : null;

  const listings = await fetchAllRows<ListingRow>(() => {
    let q = admin
      .from("price_history")
      .select("variant_id, sale_price, currency, observed_on, date_recorded, listing_ref, platform")
      .in("variant_id", variantIds)
      .eq("listing_status", "available");
    if (earliest) q = q.gte("observed_on", earliest.toISOString().slice(0, 10));
    return q.order("observed_on", { ascending: false });
  });

  const byVariant = new Map<number, ListingRow[]>();
  for (const l of listings) {
    const bucket = byVariant.get(l.variant_id);
    if (bucket) bucket.push(l);
    else byVariant.set(l.variant_id, [l]);
  }

  let fired = 0;
  for (const watch of watches) {
    const hit = pickNewListing(byVariant.get(watch.variant_id) ?? [], watchCutoff(watch));
    if (!hit) continue;

    // Same opt-out governs both kinds of watched-bag alert.
    if (!(await isOptedIn(watch.user_id, "price_alert"))) continue;

    const { data: v } = await admin
      .from("variant")
      .select("style:style_id(name, brand:brand_id(name))")
      .eq("variant_id", watch.variant_id)
      .single();
    const { styleName, brandName } = nameOf((v as { style?: unknown } | null)?.style);
    const name = [brandName, styleName].filter(Boolean).join(" ");

    const title = `Now available: ${name}`;
    const where = hit.platform ? ` on ${hit.platform}` : "";
    const price = hit.price ? ` at ${money(hit.price, hit.currency)}` : "";
    const also =
      hit.alsoCount > 1 ? ` ${hit.alsoCount - 1} more came up too.` : "";
    // Availability first, price second. Never frames it as a deal: the whole
    // point is that a collector wants to know it exists at any price.
    const body = `One came up${where}${price}.${also}`;

    const { error: insErr } = await admin.from("notification").insert({
      user_id: watch.user_id,
      type: "listing_alert",
      title,
      body,
      variant_id: watch.variant_id,
    });
    if (insErr) {
      console.error("listing notification insert error:", insErr);
      continue;
    }

    await admin
      .from("watchlist")
      .update({ last_listing_notified_at: now })
      .eq("watch_id", watch.watch_id);

    try {
      const emailOptIn = await isOptedIn(watch.user_id, "email");
      const { data: userRes } = await admin.auth.admin.getUserById(watch.user_id);
      const email = userRes?.user?.email;
      if (email && emailOptIn) {
        await sendEmail({
          to: email,
          subject: title,
          html: `<p>${body}</p><p><a href="https://luxurycatalog.com/bag/${watch.variant_id}">See it →</a></p>`,
        });
      }
    } catch (e) {
      console.error("listing alert email lookup failed:", e);
    }

    await captureServer({
      distinctId: watch.user_id,
      event: "listing_alert_triggered",
      properties: {
        variant_id: watch.variant_id,
        platform: hit.platform,
        price: hit.price,
        new_listings: hit.alsoCount,
      },
    });

    fired++;
  }

  return fired;
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
  // A qualifying drop must be something she can act on: fresh since the last
  // notification, never a retail/MSRP row, and never an already-sold record.
  const fresh = (p: PriceRow): boolean =>
    p.sale_price != null &&
    !isRetailPrice(p) &&
    p.price_type !== "sold" &&
    (!cutoff || p.date_recorded > cutoff.slice(0, 10));

  const mode = row.alert_mode === "pct_below_median" ? "pct_below_median" : "absolute";

  if (mode === "pct_below_median") {
    const pct = row.alert_pct;
    if (pct == null || pct <= 0) return null;
    // Median over non-retail resale rows; a single sky-high listing won't distort it.
    const comps = prices
      .filter((p) => p.sale_price != null && !isRetailPrice(p))
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
    "watch_id, user_id, variant_id, target_price, alert_mode, alert_pct, currency, last_notified_at, variant:variant_id(style_id, style:style_id(name, brand:brand_id(name)), price_history(sale_price, date_recorded, currency, price_type, platform))";
  const legacyJoin =
    "watch_id, user_id, variant_id, target_price, currency, last_notified_at, variant:variant_id(style:style_id(name, brand:brand_id(name)), price_history(sale_price, date_recorded, currency, price_type, platform))";

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

  // Spec map: for the users in this batch, which (user, variant) wants carry a
  // breadth spec (any green / any colourway)? Resilient: pre-0035 there is no
  // want_spec column, so the map is empty and every alert stays exact-variant.
  const specMap = new Map<string, AlertSpec>();
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  if (userIds.length > 0) {
    const { data: wants } = await admin
      .from("closet_item")
      .select("user_id, variant_id, want_spec")
      .in("user_id", userIds)
      .eq("status", "want");
    for (const w of (wants ?? []) as { user_id: string; variant_id: number; want_spec: unknown }[]) {
      const ws = w.want_spec;
      if (ws && typeof ws === "object") {
        const s = ws as AlertSpec;
        if (s.anyColor || s.colorFamily) specMap.set(specKey(w.user_id, w.variant_id), s);
      }
    }
  }

  let triggered = 0;
  // Watches that already got a price-drop ping this run. They don't also get an
  // availability ping for the same bag in the same minute.
  const pricedVariants = new Set<number>();
  const now = new Date().toISOString();

  for (const row of rows) {
    const variant = one(row.variant);
    if (!variant) continue;
    const prices = variant.price_history ?? [];

    const spec = specMap.get(specKey(row.user_id, row.variant_id));
    const pct = row.alert_pct ?? 0;
    let hit: { price: number; currency: string | null; body: string } | null = null;
    let notifyVariantId = row.variant_id;

    if (spec && row.alert_mode === "pct_below_median" && pct > 0 && variant.style_id != null) {
      // Spec alert ("any green"): match across the style's variants.
      const { data: sibs } = await admin
        .from("variant")
        .select("variant_id, exterior_colorway, price_history(sale_price, date_recorded, currency, price_type, platform)")
        .eq("style_id", variant.style_id);
      const candidates: SpecCandidate[] = ((sibs ?? []) as {
        variant_id: number;
        exterior_colorway: string | null;
        price_history: PriceRow[] | null;
      }[]).map((s) => ({ variantId: s.variant_id, colorway: s.exterior_colorway, prices: s.price_history ?? [] }));
      const sm = matchSpecAlert(candidates, spec, pct, row.last_notified_at);
      if (sm) {
        notifyVariantId = sm.variantId;
        const which = spec.colorFamily ? `a ${spec.colorFamily.toLowerCase()} one` : "one";
        hit = {
          price: sm.price,
          currency: sm.currency,
          body: `Found ${which} at ${money(sm.price, sm.currency)}, about ${sm.off}% below the typical resale price (around ${money(sm.median, sm.currency)}).`,
        };
      }
    } else {
      hit = evaluate(row, prices, row.last_notified_at);
    }
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
      variant_id: notifyVariantId,
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
          html: `<p>${hit.body}</p><p><a href="https://luxurycatalog.com/bag/${notifyVariantId}">View the bag →</a></p>`,
        });
      }
    } catch (e) {
      console.error("alert email lookup failed:", e);
    }

    await captureServer({
      distinctId: row.user_id,
      event: "price_alert_triggered",
      properties: {
        variant_id: notifyVariantId,
        spec: spec ? (spec.colorFamily ?? "any") : null,
        price: hit.price,
        mode: row.alert_mode ?? "absolute",
        pct: row.alert_pct ?? null,
        target: row.target_price,
      },
    });

    triggered++;
    pricedVariants.add(row.watch_id);
  }

  const availability = await runAvailabilityAlerts(admin, pricedVariants, now);

  return NextResponse.json({
    checked: rows.length,
    triggered,
    availability_triggered: availability,
  });
}
