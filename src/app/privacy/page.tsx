import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — The Luxury Catalog",
  description:
    "What data The Luxury Catalog collects, why, who we share it with, and how you can access or delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl text-foreground">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated June 22, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <p>
          This policy explains what we collect and how we use it. We aim to collect as little as
          possible. You can browse the catalog without an account.
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-foreground">Account information</span> — if you sign up, your email
              address and the profile details you choose to add (handle, bio, avatar, social links).
            </li>
            <li>
              <span className="text-foreground">Activity you create</span> — bags in your closet, your
              watchlist and target prices, thrift finds (including a price you paid, if you enter it),
              reviews, taste-quiz answers, suggested edits, and bag requests.
            </li>
            <li>
              <span className="text-foreground">Usage analytics</span> — privacy-first, cookieless-by
              default product analytics to understand how the site is used. You can decline via the
              consent notice.
            </li>
          </ul>
          <p>
            We do <span className="text-foreground">not</span> collect or store payment card numbers.
            If we add paid features in the future, payments will be handled by a PCI-compliant processor
            and card data will never touch our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">How we use it</h2>
          <p>
            To operate your account and closet, deliver the watchlist price alerts you opt into, show
            relevant catalog content, improve the product, and keep the service secure. We do{" "}
            <span className="text-foreground">not sell your personal information.</span>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Who we share it with</h2>
          <p>
            Only the service providers that run the product on our behalf: our database/authentication
            host, our web host, our product-analytics provider, and our email provider (for alerts you
            opt into). They process data under their own terms; we do not share your data with anyone
            for their own marketing.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Your choices and rights</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-foreground">Access &amp; delete</span> — view and edit your data, or
              delete your account, from{" "}
              <a href="/settings" className="text-foreground underline hover:text-gold">
                Settings
              </a>
              .
            </li>
            <li>
              <span className="text-foreground">Notifications</span> — turn price alerts and emails on or
              off in Settings.
            </li>
            <li>
              <span className="text-foreground">Analytics</span> — decline tracking in the consent notice.
              We honor the Global Privacy Control (GPC) browser signal.
            </li>
          </ul>
          <p>
            Depending on where you live, you may have additional rights (for example, under U.S. state
            privacy laws or the GDPR). To exercise them, contact us at the address below.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Contact</h2>
          <p>Questions or requests: hello@luxurycatalog.com.</p>
        </section>

        <p className="text-muted/70">
          This is a good-faith summary of our practices and is not a substitute for legal advice; we
          may update it as the product evolves.
        </p>
      </div>
    </main>
  );
}
