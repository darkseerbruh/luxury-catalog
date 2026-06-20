import { createServerSupabase } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

export interface UserProfile {
  id: string;
  displayName: string | null;
  persona: string | null;
  onboarded: boolean;
}

/**
 * The authenticated user for the current request, or null. Uses
 * `supabase.auth.getUser()` which validates the token with the Auth server
 * (not just the cookie), so it is safe to gate data access on.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

/** The current user's profile row, or null if signed out / not yet created. */
export async function getProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profile")
    .select("id, display_name, persona, onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    // Profile trigger may lag or be absent; fall back to a minimal record.
    return { id: user.id, displayName: null, persona: null, onboarded: false };
  }
  return {
    id: data.id,
    displayName: data.display_name,
    persona: data.persona,
    onboarded: data.onboarded,
  };
}
