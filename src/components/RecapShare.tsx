"use client";

import { useState } from "react";

/**
 * Share button for the Year in Bags recap — mirrors the navigator.share +
 * clipboard-fallback pattern used in src/app/identify/page.tsx, with feature
 * detection so it degrades cleanly when neither API is available.
 */
export default function RecapShare({ summary }: { summary: string }) {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "My Year in Bags", text: summary, url });
      } catch {
        // user cancelled or share failed — no-op
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${summary} ${url}`.trim());
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 2000);
      } catch {
        // clipboard unavailable — no-op
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
    >
      <ShareIcon />
      {shareState === "copied" ? "Copied to clipboard" : "Share your Year in Bags"}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
