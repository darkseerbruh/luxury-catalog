"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { notifyFollowersOfActivity } from "./notifications";
import type { WantSpec } from "./want-spec";

/** A short "@handle" / display-name label for the acting user, for notifications. */
async function actorLabel(userId: string): Promise<string> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profile")
    .select("handle, display_name")
    .eq("id", userId)
    .maybeSingle();
  const handle = data?.handle as string | undefined;
  const name = data?.display_name as string | undefined;
  return handle ? `@${handle}` : name ?? "A collector you follow";
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const CLOSET_STATUSES = ["want", "have", "had"] as const;
type ClosetStatus = (typeof CLOSET_STATUSES)[number];

// Local only: a "use server" module may export async functions exclusively, so
// keep the type + constant un-exported (WatchControls defines its own copies).
type AlertMode = "absolute" | "pct_below_median";
/** Default percent-below-median for a fresh watch (editable per bag). */
const DEFAULT_ALERT_PCT = 10;

/** Clamp a chosen percent to the 1..90 range the DB constraint allows, or null. */
function clampPct(pct: unknown): number | null {
  const n = typeof pct === "number" ? Math.round(pct) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(90, Math.max(1, n));
}

/** A write touched a column that does not exist yet (migration 0033 not applied). */
function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /column .* does not exist/i.test(error.message ?? "");
}

function validVariant(id: unknown): id is number {
  return Number.isInteger(id) && (id as number) > 0;
}

/** Add a variant to the closet (or update its status if already saved). */
export async function saveToCloset(variantId: number, status: ClosetStatus = "want"): Promise<ActionResult> {
  if (!validVariant(variantId)) return { ok: false, error: "Invalid item." };
  if (!CLOSET_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to save bags." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("closet_item")
    .upsert({ user_id: user.id, variant_id: variantId, status }, { onConflict: "user_id,variant_id" });

  if (error) return { ok: false, error: "Could not save. Please try again." };

  // Re-engagement: a public 'have' add is feed-worthy → notify followers.
  // (Only 'have' is public per the 0006 privacy rule; want/had stay private.)
  if (status === "have") {
    const label = await actorLabel(user.id);
    await notifyFollowersOfActivity(user.id, label, "added a bag to their closet", variantId);
  }

  revalidatePath(`/bag/${variantId}`);
  revalidatePath("/closet");
  revalidatePath("/feed");
  return { ok: true };
}

/**
 * Save a "want" at a chosen breadth (exact variant / any colour family / any
 * colourway). The variant stays as the representative row; the breadth lives in
 * want_spec. Degrades to a plain exact want if migration 0035 isn't applied.
 */
export async function saveWantSpec(variantId: number, spec: WantSpec): Promise<ActionResult> {
  if (!validVariant(variantId)) return { ok: false, error: "Invalid item." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to save bags." };

  const supabase = await createServerSupabase();
  const legacyRow = { user_id: user.id, variant_id: variantId, status: "want" as const };
  let { error } = await supabase
    .from("closet_item")
    .upsert({ ...legacyRow, want_spec: spec } as typeof legacyRow, { onConflict: "user_id,variant_id" });
  if (isMissingColumn(error)) {
    ({ error } = await supabase.from("closet_item").upsert(legacyRow, { onConflict: "user_id,variant_id" }));
  }

  if (error) return { ok: false, error: "Could not save. Please try again." };
  revalidatePath(`/bag/${variantId}`);
  revalidatePath("/closet");
  return { ok: true };
}

/** Set (or clear, with null) the acquisition price on an owned closet item — the
 *  collection-report cost basis. Needs migration 0014; fails with a clear message
 *  if the column is missing. */
export async function setPurchasePrice(
  variantId: number,
  price: number | null,
  currency: string | null,
): Promise<ActionResult> {
  if (!validVariant(variantId)) return { ok: false, error: "Invalid item." };
  if (price != null && (!Number.isFinite(price) || price < 0)) {
    return { ok: false, error: "Enter a valid amount." };
  }
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("closet_item")
    .update({
      purchase_price: price,
      purchase_currency: price != null ? currency ?? "USD" : null,
    })
    .eq("user_id", user.id)
    .eq("variant_id", variantId);

  if (error) return { ok: false, error: "Could not save. Please try again." };
  revalidatePath("/closet/report");
  revalidatePath("/closet");
  return { ok: true };
}

export async function removeFromCloset(variantId: number): Promise<ActionResult> {
  if (!validVariant(variantId)) return { ok: false, error: "Invalid item." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("closet_item")
    .delete()
    .eq("user_id", user.id)
    .eq("variant_id", variantId);

  if (error) return { ok: false, error: "Could not remove. Please try again." };
  revalidatePath(`/bag/${variantId}`);
  revalidatePath("/closet");
  return { ok: true };
}

/** Add a variant to the watchlist with an optional target price. */
export async function addToWatchlist(
  variantId: number,
  targetPrice?: number | null
): Promise<ActionResult> {
  if (!validVariant(variantId)) return { ok: false, error: "Invalid item." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to track prices." };

  const target = typeof targetPrice === "number" && Number.isFinite(targetPrice) && targetPrice > 0 ? targetPrice : null;

  // No explicit dollar target = default to "X% below the typical resale price",
  // the rule a new user actually wants (they want a deal, not a number to guess).
  const legacyRow = { user_id: user.id, variant_id: variantId, target_price: target, alert_enabled: true };
  const fullRow =
    target == null
      ? { ...legacyRow, alert_mode: "pct_below_median" as const, alert_pct: DEFAULT_ALERT_PCT }
      : { ...legacyRow, alert_mode: "absolute" as const, alert_pct: null };

  const supabase = await createServerSupabase();
  // Cast to the legacy shape: the 0033 columns aren't in the generated DB types
  // yet, but they're real at runtime and sent on the wire.
  let { error } = await supabase
    .from("watchlist")
    .upsert(fullRow as typeof legacyRow, { onConflict: "user_id,variant_id" });
  if (isMissingColumn(error)) {
    // Migration 0033 not applied yet: fall back to the legacy absolute-target row.
    ({ error } = await supabase
      .from("watchlist")
      .upsert(legacyRow, { onConflict: "user_id,variant_id" }));
  }

  if (error) return { ok: false, error: "Could not add to watchlist. Please try again." };
  revalidatePath(`/bag/${variantId}`);
  revalidatePath("/watchlist");
  return { ok: true };
}

export async function removeFromWatchlist(variantId: number): Promise<ActionResult> {
  if (!validVariant(variantId)) return { ok: false, error: "Invalid item." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("variant_id", variantId);

  if (error) return { ok: false, error: "Could not remove. Please try again." };
  revalidatePath(`/bag/${variantId}`);
  revalidatePath("/watchlist");
  return { ok: true };
}

/** Update the alert rule (mode + percent or dollar target) and toggle for a watched variant. */
export async function updateWatch(input: {
  variantId: number;
  targetPrice?: number | null;
  alertEnabled?: boolean;
  alertMode?: AlertMode;
  alertPct?: number | null;
}): Promise<ActionResult> {
  if (!validVariant(input.variantId)) return { ok: false, error: "Invalid item." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  // Columns that exist pre-0033 (the resilient fallback set).
  const legacyPatch: Record<string, unknown> = {};
  if (input.targetPrice !== undefined) {
    legacyPatch.target_price =
      typeof input.targetPrice === "number" && Number.isFinite(input.targetPrice) && input.targetPrice > 0
        ? input.targetPrice
        : null;
  }
  if (input.alertEnabled !== undefined) legacyPatch.alert_enabled = input.alertEnabled;

  // Columns added by 0033.
  const patch: Record<string, unknown> = { ...legacyPatch };
  if (input.alertMode !== undefined) patch.alert_mode = input.alertMode;
  if (input.alertPct !== undefined) patch.alert_pct = clampPct(input.alertPct);
  if (Object.keys(patch).length === 0) return { ok: true };

  const supabase = await createServerSupabase();
  let { error } = await supabase
    .from("watchlist")
    .update(patch)
    .eq("user_id", user.id)
    .eq("variant_id", input.variantId);

  if (isMissingColumn(error)) {
    // Migration 0033 not applied: write only the legacy columns so the UI still saves.
    if (Object.keys(legacyPatch).length === 0) {
      error = null;
    } else {
      ({ error } = await supabase
        .from("watchlist")
        .update(legacyPatch)
        .eq("user_id", user.id)
        .eq("variant_id", input.variantId));
    }
  }

  if (error) return { ok: false, error: "Could not update. Please try again." };
  revalidatePath("/watchlist");
  return { ok: true };
}
