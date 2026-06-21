"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser } from "./auth";
import { notifyFollowersOfActivity } from "./notifications";

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

  if (error) return { ok: false, error: "Could not save — has migration 0014 been applied?" };
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

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("watchlist")
    .upsert(
      { user_id: user.id, variant_id: variantId, target_price: target, alert_enabled: true },
      { onConflict: "user_id,variant_id" }
    );

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

/** Update the target price / alert toggle for a watched variant. */
export async function updateWatch(input: {
  variantId: number;
  targetPrice?: number | null;
  alertEnabled?: boolean;
}): Promise<ActionResult> {
  if (!validVariant(input.variantId)) return { ok: false, error: "Invalid item." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };

  const patch: Record<string, unknown> = {};
  if (input.targetPrice !== undefined) {
    patch.target_price =
      typeof input.targetPrice === "number" && Number.isFinite(input.targetPrice) && input.targetPrice > 0
        ? input.targetPrice
        : null;
  }
  if (input.alertEnabled !== undefined) patch.alert_enabled = input.alertEnabled;
  if (Object.keys(patch).length === 0) return { ok: true };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("watchlist")
    .update(patch)
    .eq("user_id", user.id)
    .eq("variant_id", input.variantId);

  if (error) return { ok: false, error: "Could not update. Please try again." };
  revalidatePath("/watchlist");
  return { ok: true };
}
