"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/newsletter-actions";
import { track, EVENTS } from "@/lib/analytics/events";

interface Props {
  className?: string;
  /** Placement tag stored with the row + sent on the analytics event
   *  (footer, articles_index, homepage, taste_page, ...). */
  source?: string;
  /** One-line value prop rendered above the form. Placements whose
   *  surrounding copy already sells the signup (e.g. the homepage section)
   *  omit it. */
  valueProp?: string;
}

type Status = "idle" | "pending" | "success" | "error";

/**
 * Newsletter opt-in (capture only, no sending yet). Submits through the
 * subscribeNewsletter server action, which writes newsletter_subscriber via
 * the service-role client. Unsubscribe + double opt-in land with the first
 * Resend send, so this form ships no links it can't honor.
 */
export function NewsletterSignup({ className, source, valueProp }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "pending") return;
    setStatus("pending");
    setMessage(null);

    try {
      const result = await subscribeNewsletter(email, source);
      if (result.ok) {
        setStatus("success");
        track(EVENTS.newsletterSubscribed, { source: source ?? "unknown" });
      } else {
        setStatus("error");
        setMessage(result.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (status === "success") {
    return (
      <p className={className ?? ""} aria-live="polite">
        <span className="text-foreground">You&rsquo;re in.</span>
        <span className="text-muted"> We&rsquo;ll write when there&rsquo;s something worth knowing.</span>
      </p>
    );
  }

  return (
    <div className={className}>
      {valueProp && <p className="mb-3 text-sm text-muted">{valueProp}</p>}
      <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-5 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "pending"}
          className="shrink-0 whitespace-nowrap rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60"
        >
          Get updates
        </button>
      </form>
      {status === "error" && message && (
        <p aria-live="polite" className="mt-2 text-sm text-muted">
          {message}
        </p>
      )}
    </div>
  );
}

// Named default export for flexibility
export default NewsletterSignup;
