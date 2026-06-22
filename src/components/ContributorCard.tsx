import Link from "next/link";
import { getContributorState } from "@/lib/photos";
import { TIER_META, type Tier } from "@/lib/contributions-core";

const NEXT_HINT: Record<Tier, string | null> = {
  aficionado: "Save a bag to your closet to become a Collector.",
  collector: "Add an approved photo to become a Connoisseur.",
  connoisseur: "Keep contributing quality photos and corrections to earn trust.",
  authenticator: "Sustained, high-quality contributions reach Curator.",
  curator: null,
};

/** Contributor tier + points on the profile — the engagement loop the photo
 * system rewards. Server component; resilient (shows the base tier pre-migration). */
export default async function ContributorCard({ userId }: { userId: string }) {
  const state = await getContributorState(userId);
  const meta = TIER_META[state.tier];

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Contributor tier</p>
          <p className="mt-1 font-serif text-2xl text-gold">{meta.label}</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-xl text-foreground">{state.points}</p>
          <p className="text-xs uppercase tracking-wide text-muted">points</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{meta.blurb}</p>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
        <span>{state.approvedPhotos} photo{state.approvedPhotos === 1 ? "" : "s"} published</span>
        {state.pendingPhotos > 0 && <span>{state.pendingPhotos} in review</span>}
      </div>

      {NEXT_HINT[state.tier] && (
        <p className="mt-3 text-sm text-foreground">{NEXT_HINT[state.tier]}</p>
      )}

      <Link
        href="/photos/most-wanted"
        className="mt-4 inline-block text-sm text-gold transition-colors hover:text-gold-soft"
      >
        Find a bag to photograph →
      </Link>
    </section>
  );
}
