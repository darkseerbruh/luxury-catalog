import type { Metadata } from "next";
import Link from "next/link";
import AboutStory from "./AboutStory";

export const metadata: Metadata = {
  title: "About Luxury Catalog: The founder story",
  description:
    "Why Luxury Catalog exists, told by its founder Arielle. The bag reference she could never find: what's real, what it's worth (an estimate, not an appraisal), and what it's worth to you.",
};

// JSON-LD so the founder story is a citable, structured source (GEO strategy).
// AboutPage + the person/org behind it, composed from real facts only.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Luxury Catalog",
  description:
    "The founder story behind Luxury Catalog, a free reference for designer bags: production history, authentication markers, and resale prices.",
  publisher: {
    "@type": "Organization",
    name: "Luxury Catalog, LLC",
    founder: {
      "@type": "Person",
      name: "Arielle Coambes",
      jobTitle: "Founder",
    },
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* The editorial, scroll-animated story. All motion (framer-motion +
          lenis) lives inside this Client Component so it never ships on the
          home bundle. */}
      <AboutStory />

      {/* The honest housekeeping strip: who runs it, how it pays for itself,
          and the links legal/compliance expects on this page. Kept plain and
          static below the story so the required facts are never buried in
          motion. */}
      <aside className="mx-auto max-w-3xl px-5 pb-20 text-sm leading-relaxed text-muted">
        <div className="grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
          <div>
            <p className="font-medium text-foreground">Who runs it</p>
            <p className="mt-2">
              Luxury Catalog is built and run by Luxury Catalog, LLC, an
              independent company in the United States. We have no affiliation
              with any fashion house, and nobody pays to change a fact on this
              site.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">How it pays for itself</p>
            <p className="mt-2">
              The catalog is free and stays free. When you&rsquo;re ready to buy
              or sell, we hand you off to the platform that has the bag. Some
              outbound links are affiliate links; see our{" "}
              <Link
                href="/disclosure"
                className="text-foreground underline hover:text-gold"
              >
                affiliate disclosure
              </Link>
              .
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Talk to us</p>
            <p className="mt-2">
              Corrections, questions, partnerships: Email{" "}
              <a
                href="mailto:arielle@luxurycatalog.com"
                className="text-foreground underline hover:text-gold"
              >
                arielle@luxurycatalog.com
              </a>{" "}
              or use the{" "}
              <Link
                href="/contact"
                className="text-foreground underline hover:text-gold"
              >
                contact page
              </Link>
              . We&rsquo;d rather be right than fast.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
