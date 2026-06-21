"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, signInWithProvider, type AuthFormState } from "@/lib/auth-actions";

const initial: AuthFormState = {};

const OAUTH = [
  { provider: "google", label: "Continue with Google" },
  { provider: "facebook", label: "Continue with Facebook" },
];

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {OAUTH.map((o) => (
          <form key={o.provider} action={signInWithProvider}>
            <input type="hidden" name="provider" value={o.provider} />
            <button
              type="submit"
              className="w-full rounded-full border border-border bg-surface px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-gold hover:text-gold"
            >
              {o.label}
            </button>
          </form>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or {mode === "login" ? "log in" : "sign up"} with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          className="rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
          placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
        />
      </label>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.message && <p className="text-sm text-gold">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-gold hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-gold hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
      </form>
    </div>
  );
}
