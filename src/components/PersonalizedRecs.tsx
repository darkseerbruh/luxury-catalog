import Link from "next/link";
import { getPersonalizedRecs } from "@/lib/personalization/recs";
import { getVariantImages } from "@/lib/queries";
import { RecommendationCard } from "./RecommendationCard";
import { PersonalizedRecsTracker } from "./PersonalizedRecsTracker";

/**
 * Phase-2 personalized "Bags you might like" rail.
 * Reads from the precomputed `user_recs` table (fast; falls back to an
 * on-demand compute on first access). Rendered only when the PostHog
 * `personalized_home` flag is in the test variant.
 *
 * Falls back gracefully to a quiz CTA when there are no recs yet.
 */
export default async function PersonalizedRecs({
  userId,
  source = "home_personalized",
  layout = "scroll",
  limit = 8,
}: {
  userId: string;
  source?: string;
  layout?: "scroll" | "grid";
  limit?: number;
}) {
  const recs = await getPersonalizedRecs(userId, limit);

  if (!recs || recs.length === 0) {
    return (
      <section className="px-0">
        <h2 className="font-serif text-2xl text-foreground">Bags you might like</h2>
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="mx-auto max-w-sm text-muted">
            Take the 60-second taste quiz and we&rsquo;ll point you at bags that fit
            your eye — matched on real catalog attributes, nothing made up.
          </p>
          <Link
            href="/quiz"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Find your taste
          </Link>
        </div>
      </section>
    );
  }

  const images = await getVariantImages(recs.map((r) => r.variantId));

  return (
    <section className="px-0">
      <h2 className="font-serif text-2xl text-foreground">Bags you might like</h2>
      <div
        className={
          layout === "grid"
            ? "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            : "mt-6 flex gap-4 overflow-x-auto pb-2"
        }
      >
        {recs.map((rec) => (
          <RecommendationCard
            key={rec.variantId}
            rec={rec}
            source={source}
            imageUrl={images[rec.variantId]}
          />
        ))}
      </div>
      <PersonalizedRecsTracker count={recs.length} />
    </section>
  );
}
