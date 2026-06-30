import Link from "next/link";
import { BagImage } from "@/components/BagImage";
import { getPhotosForReview } from "@/lib/photos";
import PhotoReviewActions from "./PhotoReviewActions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photos — Admin · The Luxury Catalog",
  robots: { index: false, follow: false },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminPhotosPage() {
  const pending = await getPhotosForReview("pending");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-10">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">
          <Link href="/admin" className="transition-colors hover:text-gold">Admin</Link> / Photos
        </p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Photo moderation</h1>
        <p className="mt-2 max-w-2xl text-muted">
          User-submitted reference photos awaiting review. <strong>Approve</strong> to
          publish it in the bag&rsquo;s gallery, <strong>Feature</strong> to also make it
          the bag&rsquo;s hero image, or <strong>Reject</strong> if it&rsquo;s off-topic,
          low quality, or not rights-clear. Trusted contributors (Authenticators)
          auto-publish and won&rsquo;t appear here.
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-serif text-xl text-foreground">
          Pending <span className="text-sm text-muted">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center text-muted">
            Nothing waiting. Submissions appear here when a non-trusted user adds a photo
            on a bag page. (Needs <code>SUPABASE_SERVICE_ROLE_KEY</code> and migration 0016.)
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((p) => (
              <li
                key={p.photoId}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <BagImage imageUrl={p.url} brand={p.brandName ?? undefined} invite={false} className="h-24 w-24 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <Link href={`/bag/${p.variantId}`} className="font-serif text-foreground hover:text-gold">
                      {[p.brandName, p.styleName].filter(Boolean).join(" · ") || `Variant #${p.variantId}`}
                    </Link>
                    <p className="mt-1 text-sm text-muted">By {p.byline}</p>
                    {p.caption && <p className="mt-1 text-sm italic text-muted">&ldquo;{p.caption}&rdquo;</p>}
                    <p className="mt-2 text-xs text-muted">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
                <PhotoReviewActions photoId={p.photoId} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
