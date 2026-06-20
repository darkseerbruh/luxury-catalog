"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase/server";

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
  if (!email || !email.includes("@")) return "Please enter a valid email.";
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
  const { data, error } = await supabase.auth.signUp({ email, password });
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Incorrect email or password." };

  revalidatePath("/", "layout");
  redirect("/closet");
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
