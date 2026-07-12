"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthState } from "@/components/AuthProvider";

/**
 * Author-only "Edit article" link. The article page is ISR-cached signed-out, so
 * this renders nothing on the cached HTML and asks /api/articles/[slug]/can-edit
 * after mount (only when signed in). Keeps the page cacheable without losing the
 * author's edit affordance.
 */
export default function AuthorEditLink({ slug }: { slug: string }) {
  const { signedIn, ready } = useAuthState();
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!ready || !signedIn) return;
    let cancelled = false;
    fetch(`/api/articles/${slug}/can-edit`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { canEdit: false }))
      .then((d: { canEdit?: boolean }) => {
        if (!cancelled) setCanEdit(!!d.canEdit);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug, signedIn, ready]);

  if (!canEdit) return null;

  return (
    <Link
      href={`/articles/${slug}/edit`}
      className="mt-3 inline-block rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
    >
      Edit article
    </Link>
  );
}
