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

/**
 * Register "notify me when authentication launches" interest (the fake-door
 * capture, used while no authenticators exist yet). Stored as an
 * authentication_request row so it becomes the warm launch list / the first
 * authenticator's backlog. Deduped per user+bag so re-clicks don't pile up.
 */
export async function registerAuthInterest(
  variantId: number,
): Promise<AuthRequestResult & { already?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in so we can let you know." };
  const vId = Number.isInteger(variantId) && variantId > 0 ? variantId : null;

  const supabase = await createServerSupabase();
  // Dedupe: one standing interest row per user+bag.
  const existing = await supabase
    .from("authentication_request")
    .select("request_id")
    .eq("user_id", user.id)
    .eq("variant_id", vId)
    .eq("status", "open")
    .maybeSingle();
  if (existing.data) return { ok: true, already: true };

  const { error } = await supabase.from("authentication_request").insert({
    variant_id: vId,
    user_id: user.id,
    contact_email: user.email,
    details: null,
  });
  if (error) {
    console.error("registerAuthInterest error:", error);
    return { ok: false, error: "Could not add you. Please try again." };
  }
  if (vId) revalidatePath(`/bag/${vId}`);
  return { ok: true, already: false };
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
