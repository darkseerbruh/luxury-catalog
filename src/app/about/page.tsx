import type { Metadata } from "next";
import Link from "next/link";
import { HeritageIcon, type HeritageIconName } from "@/components/HeritageIcon";

export const metadata: Metadata = {
  title: "About Luxury Catalog",
  description:
    "What Luxury Catalog is, who runs it, and how the site pays for itself. A free reference for designer bags: production history, authentication markers, and resale prices.",
};

function Beat({
  icon,
  title,
  children,
}: {
  icon: HeritageIconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <HeritageIcon name={icon} className="mt-1 h-5 w-5 shrink-0 text-gold" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <div className="mt-1 space-y-2">{children}</div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl text-foreground">About Luxury Catalog</h1>
      <p className="mt-3 text-lg text-muted">
        Knowing a bag used to take the right sales associate, the right forum, or an
        expensive mistake. We put it in one place.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <Beat icon="catalogue" title="The catalog">
          <p>
            Production history, sizes, materials, and colorways for designer bag styles
            across the major houses. Researched, sourced, and free to read.
          </p>
        </Beat>

        <Beat icon="tag" title="The prices">
          <p>
            Resale price observations from major resale platforms, dated and shown with
            how many listings they come from. They are estimates of the market, not
            appraisals of your bag.{" "}
            <Link href="/data" className="text-foreground underline hover:text-gold">
              See the data behind every page
            </Link>
            .
          </p>
        </Beat>

        <Beat icon="clasp" title="The markers">
          <p>
            Authentication points you can check yourself: Stamps, stitching, hardware,
            date codes. We show markers to check, never verdicts. For a guarantee, the
            honest answer is a professional who inspects the bag itself.
          </p>
        </Beat>

        <Beat icon="atelier" title="Who runs it">
          <p>
            Luxury Catalog is built and run by Luxury Catalog, LLC, an independent
            company in the United States founded by Arielle, a collector who wanted the
            reference she couldn&rsquo;t find. We have no affiliation with any fashion
            house, and nobody pays to change a fact on this site.
          </p>
        </Beat>

        <Beat icon="trunk" title="How the site pays for itself">
          <p>
            The catalog is free and stays free. There is no cart and no checkout here;
            when you&rsquo;re ready to buy or sell, we hand you off to the platform that
            has the bag.
          </p>
          <p>
            Some of those outbound links are affiliate links, and we may earn a
            commission at no extra cost to you. The full picture is in our{" "}
            <Link href="/disclosure" className="text-foreground underline hover:text-gold">
              affiliate disclosure
            </Link>
            .
          </p>
        </Beat>

        <Beat icon="stitch" title="Talk to us">
          <p>
            Corrections, questions, partnerships: Email{" "}
            <a
              href="mailto:arielle@luxurycatalog.com"
              className="text-foreground underline hover:text-gold"
            >
              arielle@luxurycatalog.com
            </a>{" "}
            or use the{" "}
            <Link href="/contact" className="text-foreground underline hover:text-gold">
              contact page
            </Link>
            . We&rsquo;d rather be right than fast, so if we got something wrong, tell us.
          </p>
        </Beat>
      </div>

      <p className="mt-12 border-t border-border pt-6 font-serif text-foreground">
        Know what it&rsquo;s worth — and what it&rsquo;s worth to you.
      </p>
    </main>
  );
}
