"use server";

import { getSupabase } from "./supabase";

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
