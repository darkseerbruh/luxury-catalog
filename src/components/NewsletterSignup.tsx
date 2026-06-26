"use client";

import { useState } from "react";
import { track, EVENTS } from "@/lib/analytics/events";

interface Props {
  className?: string;
  source?: string;
}

type Status = "idle" | "pending" | "success" | "error";

export function NewsletterSignup({ className, source }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "pending") return;
    setStatus("pending");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: { ok: boolean; error?: string; skipped?: boolean } = await res.json();

      if (data.ok) {
        setStatus("success");
        track(EVENTS.newsletterSubscribed, { source: source ?? "unknown" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className={className ?? ""} aria-live="polite">
        <span className="text-foreground">You&rsquo;re in.</span>
        <span className="text-muted"> We&rsquo;ll be in touch.</span>
      </p>
    );
  }

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "pending"}
          className="rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
        >
          Get updates
        </button>
      </form>
      {status === "error" && (
        <p aria-live="polite" className="mt-2 text-sm text-muted">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
}

// Named default export for flexibility
export default NewsletterSignup;
