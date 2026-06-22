import Link from "next/link";
import { getRecommendations, getPopularBags } from "@/lib/recommendations";
import { getUserTaste } from "@/lib/taste-data";
import { getVariantImages } from "@/lib/queries";
import { RecommendationCard } from "./RecommendationCard";

/**
 * "Bags you might like" section for the home and profile pages. Fetches the
 * current user's content-based recommendations; renders a quiz stub when there's
 * no taste signal yet (graceful cold start). Renders nothing extra when signed
 * out — callers gate on auth.
 */
export default async function Recommendations({
  source,
  layout = "scroll",
  limit = 8,
}: {
  source: string;
  layout?: "scroll" | "grid";
  limit?: number;
}) {
  const { recommendations, hasTaste } = await getRecommendations(limit);

  // Never an empty rail: a user WITH taste but 0 scored results gets a graceful
  // popular-bags fallback, or an honest message + CTA (not a blank gap).
  if (hasTaste && recommendations.length === 0) {
    const taste = await getUserTaste();
    const popular = await getPopularBags(taste.seenVariantIds, limit);
    const popularImages = await getVariantImages(popular.map((r) => r.variantId));
    if (popular.length > 0) {
      return (
        <section className="px-0">
          <h2 className="font-serif text-2xl text-foreground">Bags you might like</h2>
          <p className="mt-1 text-sm text-muted">
            We&rsquo;re still learning your taste — here&rsquo;s what collectors want most right now.
          </p>
          <div
            className={
              layout === "grid"
                ? "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                : "mt-6 flex gap-4 overflow-x-auto pb-2"
            }
          >
            {popular.map((rec) => (
              <RecommendationCard
                key={rec.variantId}
                rec={rec}
                source={source}
                imageUrl={popularImages[rec.variantId]}
              />
            ))}
          </div>
        </section>
      );
    }
    return (
      <section className="px-0">
        <h2 className="font-serif text-2xl text-foreground">Bags you might like</h2>
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="mx-auto max-w-sm text-muted">
            We don&rsquo;t have a confident match yet. Answer a few more quiz
            questions and we&rsquo;ll sharpen your recommendations.
          </p>
          <Link
            href="/quiz"
            className="mt-5 inline-block rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
          >
            Sharpen your taste
          </Link>
        </div>
      </section>
    );
  }

  if (!hasTaste) {
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

  if (recommendations.length === 0) return null;

  const images = await getVariantImages(recommendations.map((r) => r.variantId));

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
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.variantId}
            rec={rec}
            source={source}
            imageUrl={images[rec.variantId]}
          />
        ))}
      </div>
    </section>
  );
}
