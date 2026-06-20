import Link from "next/link";

/**
 * Placeholder shown until Supabase Auth is wired (see src/lib/auth.ts). When
 * sign-in goes live this becomes the auth prompt / redirect target.
 */
export default function SignedOutGate() {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center">
      <p className="font-serif text-xl text-foreground">Accounts are coming soon</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        Your collection and wishlist live behind sign-in, which isn&rsquo;t
        switched on yet. Soon you&rsquo;ll be able to track the bags you own, save
        the ones you want, and get an email when a wished-for bag becomes
        available to buy.
      </p>
      <Link
        href="/search"
        className="mt-5 inline-block rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
      >
        Browse the catalog
      </Link>
    </div>
  );
}
