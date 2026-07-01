"use client";

import Link from "next/link";
import { useAuthState } from "@/components/AuthProvider";

/**
 * Footer's auth-varying column. Rendered client-side so the layout stays
 * cookieless (and therefore statically shell-able). Signed-out (and until auth
 * resolves): Account links. Signed-in: the personal "You" surfaces.
 */
export default function FooterAccountLinks() {
  const { signedIn, ready } = useAuthState();

  if (ready && signedIn) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-muted/70">You</p>
        <Link href="/feed" className="hover:text-foreground">Feed</Link>
        <Link href="/closet" className="hover:text-foreground">Your closet</Link>
        <Link href="/watchlist" className="hover:text-foreground">Watchlist</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-wide text-muted/70">Account</p>
      <Link href="/login" className="hover:text-foreground">Log in</Link>
      <Link href="/signup" className="hover:text-foreground">Create account</Link>
    </div>
  );
}
