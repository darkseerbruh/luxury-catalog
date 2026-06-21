import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  poshmark?: string;
  substack?: string;
  website?: string;
}

export interface UserProfile {
  id: string;
  displayName: string | null;
  persona: string | null;
  onboarded: boolean;
  handle: string | null;
  bio: string | null;
  avatarUrl: string | null;
  closetPublic: boolean;
  isVerified: boolean;
  isExpert: boolean;
  isAuthenticator: boolean;
  socialLinks: SocialLinks;
  tasteCompleteness: number;
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

const EMPTY_PROFILE = (id: string): UserProfile => ({
  id,
  displayName: null,
  persona: null,
  onboarded: false,
  handle: null,
  bio: null,
  avatarUrl: null,
  closetPublic: false,
  isVerified: false,
  isExpert: false,
  isAuthenticator: false,
  socialLinks: {},
  tasteCompleteness: 0,
});

type ProfileRow = {
  id: string;
  display_name: string | null;
  persona: string | null;
  onboarded: boolean;
  handle?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  closet_public?: boolean | null;
  is_verified?: boolean | null;
  is_expert?: boolean | null;
  is_authenticator?: boolean | null;
  social_links?: Record<string, unknown> | null;
  taste_completeness?: number | null;
};

function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    persona: row.persona,
    onboarded: row.onboarded,
    handle: row.handle ?? null,
    bio: row.bio ?? null,
    avatarUrl: row.avatar_url ?? null,
    closetPublic: Boolean(row.closet_public),
    isVerified: Boolean(row.is_verified),
    isExpert: Boolean(row.is_expert),
    isAuthenticator: Boolean(row.is_authenticator),
    socialLinks: (row.social_links as SocialLinks) ?? {},
    tasteCompleteness: row.taste_completeness ?? 0,
  };
}

/** The current user's profile row, or null if signed out / not yet created. */
export async function getProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerSupabase();
  // Select the extended (0006/0007) columns; if those migrations aren't applied
  // yet the query errors, so fall back to the base columns and an empty record.
  const { data, error } = await supabase
    .from("profile")
    .select(
      "id, display_name, persona, onboarded, handle, bio, avatar_url, closet_public, is_verified, is_expert, is_authenticator, social_links, taste_completeness"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    const base = await supabase
      .from("profile")
      .select("id, display_name, persona, onboarded")
      .eq("id", user.id)
      .maybeSingle();
    if (!base.data) return EMPTY_PROFILE(user.id);
    return mapProfileRow(base.data as ProfileRow);
  }

  if (!data) return EMPTY_PROFILE(user.id);
  return mapProfileRow(data as ProfileRow);
}

/**
 * True only if the current request is an authenticated user whose
 * `profile.is_admin` is true. FAILS CLOSED: returns false if signed out, if the
 * profile row is missing, or if the `is_admin` column doesn't exist yet
 * (pre-migration 0008) — any error path denies access rather than crashing.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("profile")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !data) return false;
    return Boolean((data as { is_admin?: boolean | null }).is_admin);
  } catch {
    return false;
  }
}

/**
 * Server-side admin guard for /admin/* pages and admin server actions. Redirects
 * non-admins to /login. Because it relies on `isAdmin()` (fail-closed), it denies
 * access when the migration is unapplied or env is absent rather than crashing.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await isAdmin())) redirect("/login");
  return user;
}
