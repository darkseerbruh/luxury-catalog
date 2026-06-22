"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServerSupabase } from "./supabase/server";
import { identifyUserToPostHog } from "./analytics/flags";
import { getUserProfile } from "./personalization/user-profile";

/**
 * Best-effort request origin for building absolute redirect URLs (e.g. the
 * email-confirmation landing page). Prefers the actual request host so it works
 * across preview/prod deployments; falls back to NEXT_PUBLIC_SITE_URL.
 */
async function getOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`;
    }
  } catch {
    // headers() unavailable — fall through to env.
  }
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://luxury-catalog-omega.vercel.app"
  );
}

export interface AuthFormState {
  error?: string;
  message?: string;
}

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

function validate(email: string, password: string): string | null {
  if (!email || !email.includes("@")) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null;
}

/** Email + password sign-up. Honors Supabase's email-confirmation setting. */
export async function signUp(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  const invalid = validate(email, password);
  if (invalid) return { error: invalid };

  const supabase = await createServerSupabase();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Land Supabase's DEFAULT (free-tier, unedited-template) confirmation email
    // on our /auth/confirm route, which handles the ?code= PKCE exchange.
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { error: error.message };

  // When email confirmation is on, there's no active session yet.
  if (!data.session) {
    return { message: "Check your email to confirm your account, then log in." };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

/** Email + password sign-in. */
export async function signIn(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createServerSupabase();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password." };

  // Stitch anonymous → identified in PostHog and write persona as a person
  // property so the personalized_home flag can target it.
  if (signInData.user) {
    const userId = signInData.user.id;
    const profile = await getUserProfile(userId);
    identifyUserToPostHog(userId, {
      persona: profile?.persona ?? null,
      budget_band: profile?.budgetBand ?? null,
      intent: profile?.intent ?? null,
    }).catch(() => undefined); // fire-and-forget, never block sign-in
  }

  revalidatePath("/", "layout");
  redirect("/closet");
}

/**
 * OAuth sign-in (Google / Facebook / …). The provider button posts its name in
 * the form data. Supabase returns a URL to redirect the browser to; the provider
 * sends the user back to /auth/confirm, which exchanges the ?code= for a session
 * (the same PKCE handler the email flow uses) and lands them on /onboarding.
 *
 * NOTE: each provider must be enabled in the Supabase dashboard (Authentication →
 * Providers) with its OAuth client id/secret before the button works.
 */
const OAUTH_PROVIDERS = ["google", "facebook"] as const;
type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export async function signInWithProvider(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") ?? "") as OAuthProvider;
  if (!OAUTH_PROVIDERS.includes(provider)) redirect("/login?error=provider");

  const supabase = await createServerSupabase();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/confirm?next=/onboarding` },
  });

  if (error || !data?.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
