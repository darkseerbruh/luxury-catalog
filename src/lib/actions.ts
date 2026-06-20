"use server";

import { getSupabase } from "./supabase";
import { createServerSupabase } from "./supabase/server";
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

function clean(value: FormDataEntryValue | null, max = 200): string | null {
  const s = String(value ?? "").trim().slice(0, max);
  return s || null;
}

function parseMoney(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const n = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * "Request this bag be added" — the write side of searched-not-found. Attributed
 * to the user when logged in, anonymous otherwise (RLS allows both).
 */
export async function requestBag(formData: FormData): Promise<FeedbackResult> {
  const brand = clean(formData.get("brand"));
  const style = clean(formData.get("style"));
  const searchQuery = clean(formData.get("search_query"), 300);
  const details = clean(formData.get("details"), 1000);

  if (!brand && !style && !searchQuery) {
    return { ok: false, error: "Tell us at least a brand or style." };
  }

  try {
    const user = await getCurrentUser();
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("bag_request").insert({
      user_id: user?.id ?? null,
      brand,
      style,
      search_query: searchQuery,
      details,
    });
    if (error) {
      console.error("requestBag error:", error);
      return { ok: false, error: "Could not submit your request. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    console.error("requestBag exception:", err);
    return { ok: false, error: "Could not submit your request. Please try again." };
  }
}

const FIND_CONDITIONS = ["new", "excellent", "very good", "good", "fair", "unknown"] as const;

/**
 * Thrift-store find logging — "what did you find, what did you pay?" Feeds
 * acquisition intelligence and the viral thrift use case. Anonymous-friendly.
 */
export async function logThriftFind(formData: FormData): Promise<FeedbackResult> {
  const brand = clean(formData.get("brand"));
  const style = clean(formData.get("style"));
  const whereFound = clean(formData.get("where_found"));
  const pricePaid = parseMoney(formData.get("price_paid"));
  const note = clean(formData.get("note"), 1000);
  const conditionRaw = String(formData.get("condition") ?? "");
  const condition = (FIND_CONDITIONS as readonly string[]).includes(conditionRaw) ? conditionRaw : null;

  if (!brand && !style) {
    return { ok: false, error: "Tell us at least the brand or style you found." };
  }

  try {
    const user = await getCurrentUser();
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("thrift_find").insert({
      user_id: user?.id ?? null,
      brand,
      style,
      where_found: whereFound,
      price_paid: pricePaid,
      currency: pricePaid != null ? "USD" : null,
      condition,
      note,
    });
    if (error) {
      console.error("logThriftFind error:", error);
      return { ok: false, error: "Could not log your find. Please try again." };
    }
    return { ok: true };
  } catch (err) {
    console.error("logThriftFind exception:", err);
    return { ok: false, error: "Could not log your find. Please try again." };
  }
}
