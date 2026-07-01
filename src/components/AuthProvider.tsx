"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * App-wide auth state, resolved in the browser so the root layout never has to
 * read cookies. Reading cookies in the layout would force every route to render
 * dynamically (no static shell, full serverless cold start on the first hit).
 * Instead the layout renders a cookieless static shell and this provider fills
 * in the signed-in bits (header account menu, unread badge, footer links,
 * TasteFlusher) after hydration.
 *
 * `ready` is false until the first session read resolves; consumers render the
 * signed-out view until then, so signed-out visitors (the common case) get the
 * correct UI with no flash, and a signed-in visitor's UI settles in a beat later.
 *
 * Deliberately fetch-only (no supabase-js import): pulling the browser client in
 * here would add the whole Supabase SDK (~235KB) to the app-wide First Load JS.
 * Auth changes always navigate (login/logout redirect), which remounts this and
 * re-reads the session; a focus refetch covers same-tab changes.
 */
export type NotificationPreview = { id: number; title: string; href: string; read: boolean };

export interface AuthState {
  signedIn: boolean;
  unread: number;
  notifications: NotificationPreview[];
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ signedIn: false, unread: 0, notifications: [], ready: false });

export function useAuthState(): AuthState {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ signedIn: false, unread: 0, notifications: [], ready: false });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/me/session", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Partial<AuthState>;
        if (!cancelled) {
          setState({
            signedIn: !!data.signedIn,
            unread: data.unread ?? 0,
            notifications: data.notifications ?? [],
            ready: true,
          });
        }
      } catch {
        if (!cancelled) setState({ signedIn: false, unread: 0, notifications: [], ready: true });
      }
    }

    refresh();

    // Catch auth changes made in another tab (e.g. signed out elsewhere) when the
    // user returns to this one. The common login/logout path navigates, which
    // remounts this provider and re-reads the session on its own.
    function onFocus() {
      refresh();
    }
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
