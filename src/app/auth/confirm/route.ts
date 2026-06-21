import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Email confirmation / magic-link landing route. Handles BOTH Supabase flows:
 *
 *  1. Default (free-tier) PKCE flow — the unedited confirmation email links to
 *     `${emailRedirectTo}?code=...`. We exchange the code for a session via
 *     `exchangeCodeForSession`. signUp passes `emailRedirectTo` → this route.
 *
 *  2. Custom-template token flow — requires editing the email template to:
 *     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}
 *     We verify it with `verifyOtp`.
 *
 * On success redirect to `next` (default /onboarding); on failure to
 * /login?error=confirm. A leading-slash check on `next` blocks open redirects.
 */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/onboarding";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createServerSupabase();

  // Default Supabase flow (PKCE): ?code=...
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Custom-template flow: ?token_hash=...&type=...
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}
