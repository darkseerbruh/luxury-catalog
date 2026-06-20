"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "./supabase";
import { getCurrentUser } from "./auth";

// Matches the feedback_type enum in the schema.
const ALLOWED_FEEDBACK = ["confirm accurate", "inaccurate", "missing information"] as const;
type FeedbackType = (typeof ALLOWED_FEEDBACK)[number];

export interface FeedbackResult {
  ok: boolean;
  error?: string;
}

/**
 * Records user feedback about a variant's catalog data into the `user_feedback` table.
 * Feeds the research-prioritization loop: which bags users say are wrong or incomplete.
 */
export async function submitFeedback(input: {
  variantId: number;
  feedbackType: FeedbackType;
  note?: string;
}): Promise<FeedbackResult> {
  const { variantId, feedbackType, note } = input;

  if (!Number.isInteger(variantId) || variantId <= 0) {
    return { ok: false, error: "Invalid item." };
  }
  if (!ALLOWED_FEEDBACK.includes(feedbackType)) {
    return { ok: false, error: "Invalid feedback type." };
  }

  const trimmedNote = note?.trim().slice(0, 1000) || null;

  try {
    const { error } = await getSupabase().from("user_feedback").insert({
      record_type: "variant",
      record_id: variantId,
      feedback_type: feedbackType,
      user_note: trimmedNote,
    });
    if (error) {
      console.error("submitFeedback error:", error);
      return { ok: false, error: "Could not save feedback. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    console.error("submitFeedback exception:", err);
    return { ok: false, error: "Could not save feedback. Please try again." };
  }
}

// ============ UGC: collection / wishlist mutations ============
// Writes to `user_bag` (migration 0002). These short-circuit until Supabase
// Auth is wired (getCurrentUser returns null → "Sign in required"). Once auth
// exists, the DB write must run through an authed client so RLS (auth.uid())
// accepts it — see src/lib/auth.ts.

const BAG_STATUSES = ["want", "own", "had", "considering"] as const;
type BagStatus = (typeof BAG_STATUSES)[number];

const AUTH_REQUIRED = "Sign in to track your bags.";

function validVariantId(variantId: unknown): variantId is number {
  return Number.isInteger(variantId) && (variantId as number) > 0;
}

/**
 * Adds or moves a variant in the current user's collection/wishlist by setting
 * its status. Upserts on (user_id, variant_id) so a bag a user "wants" becomes
 * one they "own" without creating a duplicate.
 */
export async function setBagStatus(input: {
  variantId: number;
  status: BagStatus;
}): Promise<FeedbackResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: AUTH_REQUIRED };
  if (!validVariantId(input.variantId)) return { ok: false, error: "Invalid item." };
  if (!BAG_STATUSES.includes(input.status)) return { ok: false, error: "Invalid status." };

  try {
    const { error } = await getSupabase()
      .from("user_bag")
      .upsert(
        { user_id: user.id, variant_id: input.variantId, status: input.status },
        { onConflict: "user_id,variant_id" }
      );
    if (error) {
      console.error("setBagStatus error:", error);
      return { ok: false, error: "Could not update your bags. Please try again." };
    }
    revalidatePath("/me/bags");
    revalidatePath("/me/wishlist");
    revalidatePath(`/bag/${input.variantId}`);
    return { ok: true };
  } catch (err) {
    console.error("setBagStatus exception:", err);
    return { ok: false, error: "Could not update your bags. Please try again." };
  }
}

/** Removes a variant from the current user's collection/wishlist entirely. */
export async function removeBag(input: { variantId: number }): Promise<FeedbackResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: AUTH_REQUIRED };
  if (!validVariantId(input.variantId)) return { ok: false, error: "Invalid item." };

  try {
    const { error } = await getSupabase()
      .from("user_bag")
      .delete()
      .eq("user_id", user.id)
      .eq("variant_id", input.variantId);
    if (error) {
      console.error("removeBag error:", error);
      return { ok: false, error: "Could not update your bags. Please try again." };
    }
    revalidatePath("/me/bags");
    revalidatePath("/me/wishlist");
    revalidatePath(`/bag/${input.variantId}`);
    return { ok: true };
  } catch (err) {
    console.error("removeBag exception:", err);
    return { ok: false, error: "Could not update your bags. Please try again." };
  }
}

/**
 * Sets "email me when this becomes available" on a wishlist item. Toggling it on
 * for a bag that isn't tracked yet adds it as a `want` first — "notify me" IS the
 * wishlist, not a separate feature.
 */
export async function setAvailabilityNotify(input: {
  variantId: number;
  notify: boolean;
}): Promise<FeedbackResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: AUTH_REQUIRED };
  if (!validVariantId(input.variantId)) return { ok: false, error: "Invalid item." };

  try {
    const { error } = await getSupabase()
      .from("user_bag")
      .upsert(
        {
          user_id: user.id,
          variant_id: input.variantId,
          status: "want",
          notify_on_availability: input.notify,
        },
        { onConflict: "user_id,variant_id" }
      );
    if (error) {
      console.error("setAvailabilityNotify error:", error);
      return { ok: false, error: "Could not update your alert. Please try again." };
    }
    revalidatePath("/me/wishlist");
    revalidatePath(`/bag/${input.variantId}`);
    return { ok: true };
  } catch (err) {
    console.error("setAvailabilityNotify exception:", err);
    return { ok: false, error: "Could not update your alert. Please try again." };
  }
}

// ============ Marketing: no-auth email price/availability alerts ============

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Captures an email against a specific bag for a price-drop / availability
 * alert (docs/marketing-plan.md, Tier-2 owned-audience play). Works without an
 * account; writes to bag_alert_subscription (migration 0003).
 */
export async function subscribeToBagAlert(input: {
  variantId: number;
  email: string;
  kind?: "price_drop" | "availability";
}): Promise<FeedbackResult> {
  if (!validVariantId(input.variantId)) return { ok: false, error: "Invalid item." };
  const email = input.email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, error: "Please enter a valid email." };
  }
  const kind = input.kind === "availability" ? "availability" : "price_drop";

  try {
    const { error } = await getSupabase()
      .from("bag_alert_subscription")
      .upsert(
        { email, variant_id: input.variantId, alert_kind: kind, unsubscribed: false },
        { onConflict: "email,variant_id,alert_kind" }
      );
    if (error) {
      console.error("subscribeToBagAlert error:", error);
      return { ok: false, error: "Could not save your alert. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    console.error("subscribeToBagAlert exception:", err);
    return { ok: false, error: "Could not save your alert. Please try again." };
  }
}
