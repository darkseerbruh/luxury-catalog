"use client";

import Link from "next/link";
import { useAuthState } from "@/components/AuthProvider";
import { useHomeMe } from "@/lib/use-home-me";
import { BagImage } from "@/components/BagImage";

/**
 * Closet slot. Signed-out (and until auth resolves): the "create an account"
 * prompt, part of the static shell. Signed-in: a preview of their closet,
 * streamed in after the personalization fetch.
 */
export default function HomeCloset() {
  const { signedIn, ready } = useAuthState();
  const { data } = useHomeMe(signedIn);

  if (!ready || !signedIn) {
    return (
      <section className="border-b border-border px-5 py-12">
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <h2 className="font-serif text-2xl text-foreground">Your closet</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Keep the bags you own and the ones you&rsquo;re after in one place, and watch
            what they&rsquo;re worth.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Create a free account
          </Link>
        </div>
      </section>
    );
  }

  const closet = data?.closet ?? [];
  const images = data?.images ?? {};

  return (
    <section className="border-b border-border px-5 py-12">
      {closet.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <h2 className="font-serif text-2xl text-foreground">Your closet</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Nothing here yet. Hit <span className="text-gold">Save this bag</span> on any bag
            and it lands in your closet.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl text-foreground">Your closet</h2>
            <Link href="/closet" className="text-sm text-muted transition-colors hover:text-gold">
              View all ({closet.length})
            </Link>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {closet.slice(0, 8).map((c) => (
              <Link
                key={c.variantId}
                href={`/bag/${c.variantId}`}
                className="min-w-[200px] max-w-[220px] flex-shrink-0 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-gold"
              >
                <BagImage imageUrl={images[c.variantId]} brand={c.brandName} className="mb-3 aspect-square w-full rounded-xl" />
                <p className="text-sm uppercase tracking-wide text-muted">{c.brandName}</p>
                <p className="mt-1 font-serif text-lg text-foreground">{c.styleName}</p>
                <p className="mt-2 text-sm text-muted">{c.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
