"use client";

import { useEffect, useState } from "react";
import { BagImage } from "@/components/BagImage";

/**
 * A slim reminder bar that pins under the site header once you scroll past the
 * hero, so a reader deep in the value chart / specs never loses track of which
 * variant the page is about (owner 2026-07-14: "something sticky to the top to
 * remind people what they have selected, with a small image of it"). Reveal is
 * scroll-driven; it links back to the value summary so the money moment is one
 * tap away on a long page. Sits below the layout's sticky header (top-0, ~60px).
 */
export default function StickyVariantBar({
  imageUrl,
  brand,
  styleName,
  variantLabel,
}: {
  imageUrl: string | null;
  brand: string;
  styleName: string;
  variantLabel: string | null;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 top-[3.75rem] z-20 border-b border-border bg-bg/95 backdrop-blur-sm transition-all duration-200 print:hidden ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-5 py-2">
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
          <BagImage
            imageUrl={imageUrl}
            brand={brand}
            alt={`${brand} ${styleName}`}
            invite={false}
            fit="contain"
            className="h-full w-full"
          />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm text-foreground">
            {brand} {styleName}
          </span>
          {variantLabel && (
            <span className="block truncate text-xs text-muted">{variantLabel}</span>
          )}
        </span>
        <a
          href="#price"
          className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Value &amp; price
        </a>
      </div>
    </div>
  );
}
