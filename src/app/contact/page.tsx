import type { Metadata } from "next";
import Link from "next/link";
import { HeritageIcon, type HeritageIconName } from "@/components/HeritageIcon";

export const metadata: Metadata = {
  title: "Contact Luxury Catalog",
  description:
    "Reach Luxury Catalog: Corrections, questions, partnerships, and privacy requests. Email arielle@luxurycatalog.com.",
};

function Reason({
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

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl text-foreground">Contact</h1>
      <p className="mt-3 text-lg text-muted">
        A real person reads this inbox. Email{" "}
        <a
          href="mailto:arielle@luxurycatalog.com"
          className="text-foreground underline hover:text-gold"
        >
          arielle@luxurycatalog.com
        </a>{" "}
        and expect a reply within a few business days.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <Reason icon="stitch" title="Corrections">
          <p>
            Spotted a wrong spec, price, or marker? Send the page and the fix. We&rsquo;d
            rather be right than fast, and we credit good catches.
          </p>
        </Reason>

        <Reason icon="family" title="Partnerships and press">
          <p>
            Resale platforms, authenticators, and writers: We&rsquo;re happy to talk.
            Tell us who you are and what you have in mind.
          </p>
        </Reason>

        <Reason icon="flag" title="Privacy requests">
          <p>
            Access, correction, and deletion requests are covered in our{" "}
            <Link href="/privacy" className="text-foreground underline hover:text-gold">
              privacy policy
            </Link>
            . The same email works for those.
          </p>
        </Reason>
      </div>

      <p className="mt-12 border-t border-border pt-6 text-sm text-muted/70">
        Luxury Catalog, LLC · United States · More about who we are on the{" "}
        <Link href="/about" className="text-foreground underline hover:text-gold">
          about page
        </Link>
        .
      </p>
    </main>
  );
}
