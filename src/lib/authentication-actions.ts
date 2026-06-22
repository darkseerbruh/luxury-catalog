"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";
import { getCurrentUser, getProfile } from "./auth";

export interface AuthRequestResult {
  ok: boolean;
  error?: string;
}

/**
 * Submit an authentication request (lead capture). Auth-gated. No money moves —
 * a verified Authenticator will claim it and arrange the service off-platform.
 */
export async function submitAuthRequest(formData: FormData): Promise<AuthRequestResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in to request authentication." };

  const variantIdRaw = Number(formData.get("variantId"));
  const variantId = Number.isInteger(variantIdRaw) && variantIdRaw > 0 ? variantIdRaw : null;

  const details = String(formData.get("details") ?? "").trim().slice(0, 2000) || null;
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().slice(0, 200) || user.email || null;

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("authentication_request").insert({
    variant_id: variantId,
    user_id: user.id,
    details,
    contact_email: contactEmail,
  });
  if (error) {
    console.error("submitAuthRequest error:", error);
    return { ok: false, error: "Could not submit your request. Please try again." };
  }

  if (variantId) revalidatePath(`/bag/${variantId}`);
  revalidatePath("/authenticate");
  return { ok: true };
}

/** Verified Authenticator claims an open request (reveals the requester's contact). */
export async function claimAuthRequest(requestId: number): Promise<AuthRequestResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  const profile = await getProfile();
  if (!profile?.isAuthenticator) {
    return { ok: false, error: "Only verified Authenticators can claim requests." };
  }
  if (!Number.isInteger(requestId) || requestId <= 0) return { ok: false, error: "Invalid request." };

  const supabase = await createServerSupabase();
  // Only claim if still open (guards against two authenticators racing).
  const { data, error } = await supabase
    .from("authentication_request")
    .update({ status: "claimed", claimed_by: user.id, claimed_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .eq("status", "open")
    .select("request_id")
    .maybeSingle();
  if (error) {
    console.error("claimAuthRequest error:", error);
    return { ok: false, error: "Could not claim the request. Please try again." };
  }
  if (!data) return { ok: false, error: "That request was already taken." };

  revalidatePath("/authenticate");
  return { ok: true };
}

/** Close a request — allowed for the requester or the authenticator who claimed it. */
export async function closeAuthRequest(requestId: number): Promise<AuthRequestResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in." };
  if (!Number.isInteger(requestId) || requestId <= 0) return { ok: false, error: "Invalid request." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("authentication_request")
    .update({ status: "closed" })
    .eq("request_id", requestId)
    .or(`user_id.eq.${user.id},claimed_by.eq.${user.id}`);
  if (error) {
    console.error("closeAuthRequest error:", error);
    return { ok: false, error: "Could not close the request. Please try again." };
  }

  revalidatePath("/authenticate");
  return { ok: true };
}
