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
 * Inert until `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set: renders nothing and
 * submits no token, so the forms keep working exactly as they do today until
 * the key exists AND Supabase is set to require it. That ordering matters. Turn
 * the Supabase toggle on first with no key here and every signup breaks.
 *
 * The script host is allow-listed in next.config.ts (script-src, frame-src,
 * connect-src). Without that, prod blocks it silently while dev looks fine.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
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
