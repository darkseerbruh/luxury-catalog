"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BagImage } from "@/components/BagImage";
import { submitPhoto } from "@/lib/photo-actions";
import { track, EVENTS } from "@/lib/analytics/events";
import type { BagPhoto } from "@/lib/photos";

/**
 * User photo gallery + contribution on the bag page. Real, owned, rights-attested
 * reference shots (never AI-generated). Shows a rare-find empty state when a bag
 * has no photo: the recruiting moment the contributor-tier ladder rewards.
 *
 * A photo arrives as INFORMATION, not just an image: the uploader picks what it
 * shows, so the catalog learns the bag, not only how it looks. We compose that
 * into the existing `caption` field, so no schema change is needed.
 */
const SHOT_TYPES: { value: string; label: string }[] = [
  { value: "full", label: "The full bag" },
  { value: "hardware", label: "Hardware and clasp" },
  { value: "stamp", label: "Stamp, date code or serial" },
  { value: "interior", label: "Interior and lining" },
  { value: "wear", label: "Corners and wear" },
  { value: "detail", label: "Another telling detail" },
];
export default function PhotoContributions({
  variantId,
  brand,
  photos,
  signedIn,
}: {
  variantId: number;
  brand: string;
  photos: BagPhoto[];
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<null | "pending" | "approved">(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function action(formData: FormData) {
    setError(null);
    // Fold "what does this show" + the optional note into the caption the action
    // already stores, e.g. "Hardware and clasp: gold, date code Z".
    const shot = SHOT_TYPES.find((s) => s.value === formData.get("shotType"));
    const note = String(formData.get("note") ?? "").trim();
    formData.set("caption", [shot?.label, note].filter(Boolean).join(": ").slice(0, 280));
    startTransition(async () => {
      const res = await submitPhoto(formData);
      if (res.ok) {
        track(EVENTS.photoSubmitted, { variant_id: variantId, status: res.status });
        setDone(res.status ?? "pending");
        setOpen(false);
        formRef.current?.reset();
        // Pull the freshly published photo into the gallery without a manual reload.
        router.refresh();
      } else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <section id="photos" className="scroll-mt-4 border-t border-border pt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-foreground">
          Photos{photos.length > 0 && <span className="ml-2 text-sm text-muted">({photos.length})</span>}
        </h2>
        {signedIn ? (
          <button
            type="button"
            onClick={() => { setOpen((o) => !o); setDone(null); }}
            className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
          >
            {open ? "Cancel" : "Add a photo"}
          </button>
        ) : (
          <Link href="/login" className="rounded-full border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold">
            Log in to add a photo
          </Link>
        )}
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <li key={p.photoId} className="overflow-hidden rounded-xl border border-border bg-surface">
              <BagImage imageUrl={p.url} brand={brand} alt={p.caption ?? `${brand} bag`} className="aspect-square w-full" />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate text-xs text-muted">
                  {p.handle ? (
                    <Link href={`/u/${p.handle}`} className="hover:text-gold">{p.byline}</Link>
                  ) : (
                    p.byline
                  )}
                </span>
                {p.featured && <span className="shrink-0 text-xs text-gold">★ Featured</span>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !open && (
          <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-6 text-center">
            <p className="text-foreground">This bag is a rare find.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              The Luxury Catalog is built by the people who carry these bags. If you
              own this one, add a photo and tell us what it shows. Yours could become
              the photo everyone sees here.
            </p>
          </div>
        )
      )}

      {done && (
        <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-foreground">
          <p>
            {done === "approved"
              ? "Thank you. Your photo is live."
              : "Thank you. Your photo is in the review queue, and we publish it once it is checked."}
          </p>
          <p className="mt-2 text-muted">
            You clearly know this one.{" "}
            <a href="#reviews" className="text-gold underline hover:text-gold-soft">
              Add a quick review
            </a>{" "}
            and tell other collectors what it is like to carry.
          </p>
        </div>
      )}

      {open && signedIn && (
        <form ref={formRef} action={action} className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <input type="hidden" name="variantId" value={variantId} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Photo (JPEG, PNG, WebP or AVIF · up to 8 MB)</span>
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required
              className="text-sm text-muted file:mr-3 file:rounded-full file:border file:border-border file:bg-bg file:px-4 file:py-2 file:text-sm file:text-foreground hover:file:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">What does this show?</span>
            <select
              name="shotType"
              required
              defaultValue=""
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
            >
              <option value="" disabled>
                Choose what it shows
              </option>
              {SHOT_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-muted">Anything worth knowing? (optional)</span>
            <input
              name="note"
              maxLength={240}
              placeholder="e.g. date code Z, gold hardware, bought 2019"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
            />
          </label>
          <label className="flex items-start gap-2 text-sm text-muted">
            <input type="checkbox" name="attested" required className="mt-1 accent-gold" />
            <span>
              I took this photo (or own the rights) and grant The Luxury Catalog a licence to
              display it. <Link href="/disclosure" className="underline hover:text-foreground">Details</Link>.
            </span>
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="self-start rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-40"
          >
            {pending ? "Uploading…" : "Submit photo"}
          </button>
        </form>
      )}
    </section>
  );
}
