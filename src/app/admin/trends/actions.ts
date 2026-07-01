"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Saves the owner-edited fields for one trending term: the creator/saturation
 * count, the content status, and freeform notes. Admin-gated and service-role;
 * touches only the three human columns, never the machine-refreshed ones.
 */
export async function updateTrend(
  term: string,
  patch: { creators_saturation?: number | null; content_status?: string | null; notes?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!term) return { ok: false, error: "missing term" };

  const update: Record<string, number | string | null> = {};
  if ("creators_saturation" in patch) {
    const v = patch.creators_saturation;
    update.creators_saturation = v === null || Number.isNaN(v as number) ? null : Math.round(v as number);
  }
  if ("content_status" in patch) update.content_status = patch.content_status || null;
  if ("notes" in patch) update.notes = patch.notes || null;

  if (Object.keys(update).length === 0) return { ok: true };
  update.updated_at = new Date().toISOString();

  const { error } = await getSupabaseAdmin().from("tiktok_trend").update(update).eq("term", term);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/trends");
  return { ok: true };
}
