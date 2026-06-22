"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getSupabaseAdmin } from "./supabase/admin";
import { getCurrentUser, requireAdmin } from "./auth";
import { notifyPhotoFeatured } from "./notifications";
import { canAutoPublish, photoPoints, reversalPoints, FEATURED_BONUS } from "./contributions-core";

const BUCKET = "bag-photos";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export interface PhotoResult {
  ok: boolean;
  error?: string;
  status?: "pending" | "approved";
}

function hasServiceRole(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Add `delta` to a user's contribution_points (service-role only; the column is
 * revoked from client roles to stop self-granting). No-ops without the key. */
async function adjustPoints(userId: string, delta: number): Promise<void> {
  if (!delta || !hasServiceRole()) return;
  const admin = getSupabaseAdmin();
  const { data } = await admin.from("profile").select("contribution_points").eq("id", userId).maybeSingle();
  const current = (data as { contribution_points?: number } | null)?.contribution_points ?? 0;
  await admin.from("profile").update({ contribution_points: Math.max(0, current + delta) }).eq("id", userId);
}

/** Count already-published photos for a variant (drives rarity weighting). */
async function publishedCount(variantId: number, excludePhotoId?: number): Promise<number> {
  const admin = getSupabaseAdmin();
  let q = admin.from("bag_photo").select("photo_id").eq("variant_id", variantId).in("status", ["approved", "featured"]);
  if (excludePhotoId) q = q.neq("photo_id", excludePhotoId);
  const { data } = await q;
  return ((data as unknown[] | null) ?? []).length;
}

/**
 * Submit a user photo of a bag. Auth-gated; requires the ownership/display-rights
 * attestation (UGC license). Uploads the bytes to the public `bag-photos` bucket
 * under the user's own folder, then records a pending `bag_photo` row. Trusted
 * tiers (Authenticator / admin) auto-publish via the service-role client —
 * hybrid moderation; everyone else is queued for /admin/photos.
 */
export async function submitPhoto(formData: FormData): Promise<PhotoResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to add a photo." };

  const variantId = Number(formData.get("variantId"));
  if (!Number.isInteger(variantId) || variantId <= 0) return { ok: false, error: "Unknown bag." };

  const attested = formData.get("attested");
  if (attested !== "on" && attested !== "true") {
    return { ok: false, error: "Please confirm you own this photo and have the right to share it." };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a photo to upload." };
  if (file.size > MAX_BYTES) return { ok: false, error: "That photo is over 8 MB — please use a smaller file." };
  const ext = EXT[file.type];
  if (!ext) return { ok: false, error: "Please upload a JPEG, PNG, WebP or AVIF image." };

  const caption = String(formData.get("caption") ?? "").trim().slice(0, 280) || null;
  const path = `${variantId}/${user.id}/${crypto.randomUUID()}.${ext}`;

  const supabase = await createServerSupabase();
  const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) {
    console.error("submitPhoto upload error:", upload.error);
    return { ok: false, error: "Upload failed. Please try again." };
  }

  const { data: inserted, error } = await supabase
    .from("bag_photo")
    .insert({ variant_id: variantId, user_id: user.id, storage_path: path, caption, status: "pending", owner_attested: true })
    .select("photo_id")
    .maybeSingle();
  if (error || !inserted) {
    console.error("submitPhoto insert error:", error);
    await supabase.storage.from(BUCKET).remove([path]); // don't orphan the object
    return { ok: false, error: "Could not save your photo. Please try again." };
  }

  // Hybrid moderation: trusted contributors skip the queue.
  let status: "pending" | "approved" = "pending";
  if (hasServiceRole()) {
    const { data: prof } = await supabase
      .from("profile")
      .select("is_authenticator, is_admin")
      .eq("id", user.id)
      .maybeSingle();
    const trusted = canAutoPublish({
      isAuthenticator: Boolean((prof as { is_authenticator?: boolean } | null)?.is_authenticator),
      isAdmin: Boolean((prof as { is_admin?: boolean } | null)?.is_admin),
    });
    if (trusted) {
      const photoId = (inserted as { photo_id: number }).photo_id;
      const pts = photoPoints(await publishedCount(variantId, photoId));
      const admin = getSupabaseAdmin();
      await admin.from("bag_photo").update({ status: "approved", points_awarded: pts, reviewed_at: new Date().toISOString() }).eq("photo_id", photoId);
      await adjustPoints(user.id, pts);
      status = "approved";
    }
  }

  revalidatePath(`/bag/${variantId}`);
  revalidatePath("/admin/photos");
  return { ok: true, status };
}

/**
 * Admin: approve / feature / reject a photo. Approving (or featuring) a not-yet
 * published photo awards rarity-weighted XP; featuring adds a bonus, promotes the
 * shot to the variant hero, demotes any prior featured, and notifies the
 * uploader. Rejecting a published photo claws its XP back.
 */
export async function reviewPhoto(
  photoId: number,
  decision: "approved" | "featured" | "rejected",
): Promise<PhotoResult> {
  const reviewer = await requireAdmin();
  if (!Number.isInteger(photoId) || photoId <= 0) return { ok: false, error: "Invalid photo." };
  if (!hasServiceRole()) return { ok: false, error: "Reviewing photos needs the service-role key (SUPABASE_SERVICE_ROLE_KEY)." };

  const admin = getSupabaseAdmin();
  const { data: row } = await admin
    .from("bag_photo")
    .select("photo_id, variant_id, user_id, status, points_awarded, storage_path")
    .eq("photo_id", photoId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Photo not found." };
  const photo = row as { variant_id: number; user_id: string; status: string; points_awarded: number; storage_path: string };
  const wasPublished = photo.status === "approved" || photo.status === "featured";

  if (decision === "rejected") {
    await admin.from("bag_photo").update({ status: "rejected", points_awarded: 0, reviewed_by: reviewer.id, reviewed_at: new Date().toISOString() }).eq("photo_id", photoId);
    if (wasPublished && photo.points_awarded) await adjustPoints(photo.user_id, reversalPoints(photo.points_awarded));
    revalidatePath(`/bag/${photo.variant_id}`);
    revalidatePath("/admin/photos");
    return { ok: true };
  }

  // approve or feature
  let award = photo.points_awarded;
  if (!wasPublished) award = photoPoints(await publishedCount(photo.variant_id, photoId));
  if (decision === "featured") {
    award += FEATURED_BONUS;
    // Only one featured per variant — demote the incumbent.
    await admin.from("bag_photo").update({ status: "approved" }).eq("variant_id", photo.variant_id).eq("status", "featured").neq("photo_id", photoId);
    // Promote to the variant hero (UGC source).
    const url = admin.storage.from(BUCKET).getPublicUrl(photo.storage_path).data.publicUrl;
    await admin.from("variant").update({ image_url: url, image_source: "ugc" }).eq("variant_id", photo.variant_id);
  }

  await admin.from("bag_photo").update({ status: decision, points_awarded: award, reviewed_by: reviewer.id, reviewed_at: new Date().toISOString() }).eq("photo_id", photoId);
  if (award - photo.points_awarded !== 0) await adjustPoints(photo.user_id, award - photo.points_awarded);
  if (decision === "featured") await notifyPhotoFeatured(photo.user_id, "Your photo is now the featured shot for a bag.", photo.variant_id);

  revalidatePath(`/bag/${photo.variant_id}`);
  revalidatePath("/admin/photos");
  return { ok: true };
}

/** Delete one of your OWN photos (a takedown of your submission). */
export async function deleteOwnPhoto(photoId: number): Promise<PhotoResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  if (!Number.isInteger(photoId) || photoId <= 0) return { ok: false, error: "Invalid photo." };

  const supabase = await createServerSupabase();
  const { data: row } = await supabase
    .from("bag_photo")
    .select("photo_id, variant_id, user_id, storage_path, status, points_awarded")
    .eq("photo_id", photoId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Photo not found." };
  const photo = row as { variant_id: number; user_id: string; storage_path: string; status: string; points_awarded: number };
  if (photo.user_id !== user.id) return { ok: false, error: "That isn't your photo." };

  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from("bag_photo").delete().eq("photo_id", photoId);
  if (error) return { ok: false, error: "Could not remove the photo. Please try again." };

  // Reverse any XP a removed-published photo earned (anti-farming).
  if ((photo.status === "approved" || photo.status === "featured") && photo.points_awarded) {
    await adjustPoints(user.id, reversalPoints(photo.points_awarded));
  }

  revalidatePath(`/bag/${photo.variant_id}`);
  return { ok: true };
}
