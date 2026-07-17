import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Luxury Catalog",
  description:
    "What data Luxury Catalog collects, why, who we share it with, and how you can access, export, or delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-serif text-3xl text-foreground">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated July 17, 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <p>
          Here is what we collect and how we use it. We keep it to as little as we can, and you
          can browse the whole catalog without an account.
        </p>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Who we are</h2>
          <p>
            Luxury Catalog, LLC, United States, is the data controller for the personal
            information described here. Questions or requests? Email{" "}
            <a href="mailto:arielle@luxurycatalog.com" className="text-foreground underline hover:text-gold">
              arielle@luxurycatalog.com
            </a>
            . If you are in the EU or UK and need a local point of contact, use that address and we
            will route your request.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-foreground">Account information:</span> if you sign up, your email
              address and the profile details you choose to add (handle, bio, avatar, social links).
            </li>
            <li>
              <span className="text-foreground">Activity you create:</span> bags in your closet, your
              watchlist and target prices, thrift finds (including a price you paid, if you enter it),
              reviews, taste-quiz answers, suggested edits, bag requests, and authentication requests.
            </li>
            <li>
              <span className="text-foreground">Photos you submit to identify a bag:</span> processed
              to return a match and not stored on our servers (see sharing, below).
            </li>
            <li>
              <span className="text-foreground">Usage analytics:</span> privacy-first, cookieless-by
              default product analytics to understand how the site is used. You can decline in the
              consent notice, and we honor the Global Privacy Control (GPC) signal.
            </li>
          </ul>
          <p>
            We do <span className="text-foreground">not</span> collect or store payment card numbers.
            If we add paid features later, a PCI-compliant processor handles payments and card data
            never touches our servers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">How we use it, and our legal basis</h2>
          <p>
            We use your data to operate your account and closet, deliver the watchlist price alerts
            you opt into, show relevant catalog content, improve the product, and keep the service
            secure. We do <span className="text-foreground">not sell your personal information.</span>
          </p>
          <p>For visitors in the EU and UK, our legal bases under the GDPR are:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-foreground">Contract:</span> running your account, closet,
              watchlist, and the alerts you request.
            </li>
            <li>
              <span className="text-foreground">Consent:</span> enhanced analytics (session replay and
              surveys) and marketing emails. You can withdraw consent at any time.
            </li>
            <li>
              <span className="text-foreground">Legitimate interests:</span> cookieless, memory-only
              baseline analytics and keeping the service secure, balanced against your privacy. A GPC
              signal or declining in the consent notice turns this off for you.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Who we share it with</h2>
          <p>
            Only the service providers that run the product on our behalf, acting as our processors
            under their own terms. We do not share your data with anyone for their own marketing.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th className="py-2 pr-4 font-medium">Provider</th>
                  <th className="py-2 pr-4 font-medium">What it handles</th>
                  <th className="py-2 font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-foreground">Supabase</td>
                  <td className="py-2 pr-4">Database and sign-in (account, closet, activity)</td>
                  <td className="py-2">United States</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-foreground">PostHog</td>
                  <td className="py-2 pr-4">Product analytics</td>
                  <td className="py-2">United States</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-foreground">Anthropic</td>
                  <td className="py-2 pr-4">Vision model that reads a photo you submit to identify a bag</td>
                  <td className="py-2">United States</td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="py-2 pr-4 text-foreground">Resend</td>
                  <td className="py-2 pr-4">Sends the emails and alerts you opt into</td>
                  <td className="py-2">United States</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-foreground">Vercel</td>
                  <td className="py-2 pr-4">Web hosting</td>
                  <td className="py-2">United States</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Photos you submit to the bag-identify tool are sent to Anthropic to generate a match and
            are not saved to our database afterward.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Where your data is processed</h2>
          <p>
            We are based in the United States and our providers are US-based, so your data is
            processed in the US. If you are in the EU or UK, transfers rely on the providers&rsquo;
            Standard Contractual Clauses or an equivalent safeguard under their own data processing
            terms. You can ask us for more detail at the contact address above.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">How long we keep it</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-foreground">Account and activity data:</span> kept while your
              account is open. Delete your account and we remove it, and your newsletter subscription
              with it.
            </li>
            <li>
              <span className="text-foreground">Newsletter:</span> kept until you unsubscribe.
            </li>
            <li>
              <span className="text-foreground">Anonymous logs</span> (for example, searches that
              returned no result): kept up to 24 months, then purged automatically.
            </li>
            <li>
              <span className="text-foreground">Analytics:</span> retained by our analytics provider
              under its own limits.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Affiliate links and tracking</h2>
          <p>
            Some links to retailers and resale marketplaces are affiliate links. If you click one and
            make a purchase, we may earn a commission at no extra cost to you. We always say so on the
            page where these links appear.
          </p>
          <p>
            To credit those purchases, our affiliate partners and the networks they use set their own
            third-party cookies or similar identifiers in your browser when you click out to a merchant.
            Partners and networks we work with include the eBay Partner Network, Impact, CJ (Commission
            Junction), Awin, and Skimlinks, among others. These are{" "}
            <span className="text-foreground">separate from our own analytics</span>, which stay
            privacy-first and cookieless by default. The affiliate partners process the data they collect
            under their own privacy policies, and we do not control those cookies.
          </p>
          <p>
            You can limit this tracking by declining non-essential cookies in our consent notice, using
            your browser&rsquo;s cookie controls, or sending a Global Privacy Control (GPC) signal, which
            we honor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Your choices and rights</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-foreground">Access and edit:</span> view and change your data in{" "}
              <a href="/settings" className="text-foreground underline hover:text-gold">
                Settings
              </a>
              .
            </li>
            <li>
              <span className="text-foreground">Export:</span> download a copy of your data as a file
              from{" "}
              <a href="/settings" className="text-foreground underline hover:text-gold">
                Settings
              </a>
              .
            </li>
            <li>
              <span className="text-foreground">Delete:</span> delete your account, and the data tied
              to it, from Settings.
            </li>
            <li>
              <span className="text-foreground">Notifications:</span> turn price alerts and emails on or
              off in Settings.
            </li>
            <li>
              <span className="text-foreground">Analytics:</span> decline in the consent notice. We
              honor the Global Privacy Control (GPC) browser signal.
            </li>
          </ul>
          <p>
            Depending on where you live, you may have additional rights (for example, under U.S. state
            privacy laws or the GDPR), including the right to object to processing, to lodge a complaint
            with your data protection authority, and to withdraw consent. To exercise any of them,
            contact us at the address above.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Contact</h2>
          <p>
            Questions or requests? Email{" "}
            <a href="mailto:arielle@luxurycatalog.com" className="text-foreground underline hover:text-gold">
              arielle@luxurycatalog.com
            </a>
            .
          </p>
        </section>

        <p className="text-muted/70">
          This is a good-faith summary of our practices and is not a substitute for legal advice; we
          may update it as the product evolves.
        </p>
      </div>
    </main>
  );
}
