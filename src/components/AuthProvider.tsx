"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

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

    // Re-read on sign-in / sign-out so the header + badges update without a full
    // page reload.
    const supabase = createBrowserSupabase();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
