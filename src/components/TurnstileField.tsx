"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile challenge for the auth forms.
 *
 * Why it exists: six bot accounts registered through the open signup form
 * between 2026-07-10 and 2026-07-23 (dotted-gmail addresses, none confirmed,
 * none ever signed in; deleted 2026-07-26). Every one of them made Supabase
 * send a confirmation email to an address we don't control, which is a sender-
 * reputation cost we pay before the first real newsletter send.
 *
 * Ordering still matters in one direction: turn the Supabase captcha toggle on
 * BEFORE this widget is live in prod and every signup breaks, because Supabase
 * would demand a token the page cannot yet mint. Widget first, toggle second.
 *
 * The script host is allow-listed in next.config.ts (script-src, frame-src,
 * connect-src). Without that, prod blocks it silently while dev looks fine.
 */

/**
 * The Cloudflare widget for www.luxurycatalog.com, luxurycatalog.com and
 * localhost (created 2026-08-27, "Luxury Catalog auth forms", Managed mode).
 *
 * In code, not an env var, because a Turnstile SITE key is public by design:
 * it is rendered into the HTML of every page carrying the widget, so there is
 * nothing here to leak. Its partner SECRET key is the real credential, and that
 * one lives only in the Supabase dashboard. Keeping the public half in code
 * follows the house rule (non-secret config in code, secrets in the Vercel or
 * Supabase UI) and means a deploy is all it takes to turn the widget on.
 *
 * The env var still wins if set, which is the escape hatch for rotating the key
 * or pointing a preview build at a different widget.
 */
const DEFAULT_SITE_KEY = "0x4AAAAAAEeQ3P0isTCTt6jP";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEFAULT_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "cf-turnstile-script";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve(), { once: true }));
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    // Resolve on error too: a blocked or failed script must not wedge the form.
    s.addEventListener("load", () => resolve(), { once: true });
    s.addEventListener("error", () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

export default function TurnstileField() {
  const holder = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadScript().then(() => {
      if (cancelled || !holder.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(holder.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: (t: string) => setToken(t),
        // A solved token is single-use and expires. Clearing it means the form
        // fails the check rather than submitting something Supabase will reject.
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
      });
    });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* widget already gone */
        }
      }
    };
  }, []);

  if (!SITE_KEY) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={holder} />
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  );
}
