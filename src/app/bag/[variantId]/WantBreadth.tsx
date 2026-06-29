"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveWantSpec } from "@/lib/collection-actions";
import type { WantSpec } from "@/lib/want-spec";

type Breadth = "exact" | "family" | "any";

function specFor(b: Breadth, colorFamily: string | null): WantSpec {
  if (b === "family" && colorFamily) return { colorFamily };
  if (b === "any") return { anyColor: true };
  return null;
}

/**
 * Lets a saver open up a want from the exact variant to "any {colour family}" or
 * "any colourway" of this style. Only shown when the style has colour variation,
 * so the broaden options mean something.
 */
export default function WantBreadth({
  variantId,
  colorFamily,
  initialBreadth = null,
}: {
  variantId: number;
  colorFamily: string | null;
  /** The currently-saved breadth, or null if not saved as a want. */
  initialBreadth?: Breadth | null;
}) {
  const [active, setActive] = useState<Breadth | null>(initialBreadth);
  const [pending, start] = useTransition();
  const router = useRouter();

  function choose(b: Breadth) {
    const prev = active;
    setActive(b);
    start(async () => {
      const res = await saveWantSpec(variantId, specFor(b, colorFamily));
      if (!res.ok) {
        setActive(prev);
        if (/log in/i.test(res.error ?? "")) router.push(`/signup?next=/bag/${variantId}`);
      }
    });
  }

  const opts: { b: Breadth; label: string }[] = [
    { b: "exact", label: "Just this one" },
    ...(colorFamily ? [{ b: "family" as Breadth, label: `Any ${colorFamily.toLowerCase()}` }] : []),
    { b: "any", label: "Any colourway" },
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Want:</span>
      {opts.map(({ b, label }) => (
        <button
          key={b}
          type="button"
          onClick={() => choose(b)}
          disabled={pending}
          className={`rounded-full border px-3.5 py-1.5 transition-colors disabled:opacity-50 ${
            active === b
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-muted hover:border-gold hover:text-gold"
          }`}
        >
          {label}
        </button>
      ))}
      {active && active !== "exact" && (
        <span className="text-xs text-muted">We&rsquo;ll watch for any that match.</span>
      )}
    </div>
  );
}
