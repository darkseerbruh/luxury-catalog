"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser, requireAdmin } from "./auth";

export interface CorrectionResult {
  ok: boolean;
  error?: string;
}

export interface SubmitCorrectionInput {
  variantId?: number | null;
  styleId?: number | null;
  brandId?: number | null;
  fieldPath: string;
  currentValue?: string | null;
  suggestedValue: string;
  note?: string | null;
}

/**
 * Submit a structured correction (suggest-an-edit). Auth-gated: a signed-out
 * user gets a clear prompt to log in. Server-side validated; RLS
 * (`correction_insert_own`) ensures created_by must be the caller.
 */
export async function submitCorrection(
  input: SubmitCorrectionInput
): Promise<CorrectionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to suggest an edit." };

  const variantId = Number.isInteger(input.variantId) && (input.variantId ?? 0) > 0 ? input.variantId! : null;
  const styleId = Number.isInteger(input.styleId) && (input.styleId ?? 0) > 0 ? input.styleId! : null;
  const brandId = Number.isInteger(input.brandId) && (input.brandId ?? 0) > 0 ? input.brandId! : null;

  if (!variantId && !styleId && !brandId) {
    return { ok: false, error: "Nothing to correct." };
  }

  const fieldPath = input.fieldPath?.trim().slice(0, 120);
  if (!fieldPath) return { ok: false, error: "Pick the field you want to correct." };

  const suggestedValue = input.suggestedValue?.trim().slice(0, 2000);
  if (!suggestedValue) return { ok: false, error: "Enter your suggested value." };

  const currentValue = input.currentValue?.trim().slice(0, 2000) || null;
  const note = input.note?.trim().slice(0, 1000) || null;

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("correction").insert({
    variant_id: variantId,
    style_id: styleId,
    brand_id: brandId,
    field_path: fieldPath,
    current_value: currentValue,
    suggested_value: suggestedValue,
    note,
    created_by: user.id,
  });

  if (error) {
    console.error("submitCorrection error:", error);
    return { ok: false, error: "Could not submit your suggestion. Please try again." };
  }

  if (variantId) revalidatePath(`/bag/${variantId}`);
  revalidatePath("/admin/corrections");
  return { ok: true };
}

/**
 * Admin: accept or reject a correction. Marks status + stamps reviewer/time.
 * Does NOT write the catalog — applying the change is a manual admin task.
 * Guarded by requireAdmin() (server actions are reachable via direct POST).
 */
export async function reviewCorrection(
  correctionId: number,
  decision: "accepted" | "rejected"
): Promise<CorrectionResult> {
  const admin = await requireAdmin(); // redirects non-admins
  if (!Number.isInteger(correctionId) || correctionId <= 0) {
    return { ok: false, error: "Invalid correction." };
  }
  if (decision !== "accepted" && decision !== "rejected") {
    return { ok: false, error: "Invalid decision." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("correction")
    .update({
      status: decision,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("correction_id", correctionId);

  if (error) {
    console.error("reviewCorrection error:", error);
    return { ok: false, error: "Could not update the correction. Please try again." };
  }

  revalidatePath("/admin/corrections");
  return { ok: true };
}
