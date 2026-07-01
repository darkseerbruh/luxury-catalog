import type { Metadata } from "next";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { getStyleShopData } from "@/lib/article-shop";
import { SITE_URL } from "@/lib/geo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Check a listing for red flags · Luxury Catalog",
  description:
    "A quick check of a resale listing for the common scam signals: price far below the going rate, the authenticity-card tell, missing detail photos, and where you are buying. Red flags to weigh, not a verdict.",
  alternates: { canonical: `${SITE_URL}/authentication/check` },
};

type SP = {
  brand?: string;
  style?: string;
  price?: string;
  platform?: string;
  card?: string;
  photos?: string;
  pressure?: string;
};

// Houses that do NOT issue an authenticity card, so a listing that includes one is a
// flag, not a credential. Sourced from the per-house guides (2026-06-30).
const NO_CARD_HOUSES = ["louis vuitton", "goyard", "hermes", "hermès"];

const PLATFORMS: { value: string; label: string; note: string; risk: "low" | "mid" | "high" }[] = [
  { value: "ebay", label: "eBay", note: "Items over $500 are checked by an independent authenticator before they ship. Under that, it is buyer-beware.", risk: "mid" },
  { value: "poshmark", label: "Poshmark", note: "Items over $500 are authenticated before they ship. Under that, it is buyer-beware.", risk: "mid" },
  { value: "therealreal", label: "The RealReal", note: "Authenticates everything it sells. Lower risk, though no check is infallible.", risk: "low" },
  { value: "fashionphile", label: "Fashionphile", note: "Authenticates everything it sells. Lower risk, though no check is infallible.", risk: "low" },
  { value: "rebag", label: "Rebag", note: "Authenticates everything it sells. Lower risk, though no check is infallible.", risk: "low" },
  { value: "vestiaire", label: "Vestiaire Collective", note: "Offers authentication, confirm it is switched on for this specific item.", risk: "mid" },
  { value: "private", label: "Private sale / offline / social", note: "No built-in authentication and no buyer protection. This is where most of the risk lives.", risk: "high" },
  { value: "other", label: "Somewhere else", note: "Check whether authentication and buyer protection are actually built in before you pay.", risk: "mid" },
];

const formatPrice = (n: number, currency: string) => {
  const s = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${s}${Math.round(n).toLocaleString()}`;
};

/** Resolve "brand + style" text to a resale median from our data. Best-effort; null
 * when we can't confidently match, so the price check simply omits rather than guesses. */
async function resolveMedian(brand: string, style: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !brand.trim()) return null;
  try {
    const db = getSupabase();
    const { data: brands } = await db.from("brand").select("brand_id, name").ilike("name", `%${brand.trim()}%`).limit(1);
    if (!brands?.length || !style.trim()) return null;
    const brandName = brands[0].name as string;
    const { data: styles } = await db
      .from("style").select("style_id, name")
      .eq("brand_id", brands[0].brand_id).ilike("name", `%${style.trim()}%`).limit(25);
    if (!styles?.length) return null;
    // Prefer an exact (case-insensitive) name match, else the shortest name — the
    // canonical style ("Classic Flap") is short; verbose promoted variants lose.
    const q = style.trim().toLowerCase();
    styles.sort((a, b) => {
      const ae = a.name.toLowerCase() === q ? 0 : 1;
      const be = b.name.toLowerCase() === q ? 0 : 1;
      return ae - be || a.name.length - b.name.length;
    });
    const chosen = styles[0];
    const shop = await getStyleShopData(chosen.style_id);
    if (!shop || shop.count === 0) return null;
    const label = chosen.name.toLowerCase().includes(brandName.toLowerCase()) ? chosen.name : `${brandName} ${chosen.name}`;
    return { label, median: shop.medianPrice, count: shop.count, currency: shop.currency, asOf: shop.asOf };
  } catch {
    return null;
  }
}

type Signal = { tone: "flag" | "note" | "ok"; title: string; body: string };

export default async function ListingCheck({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const submitted = Boolean(sp.brand || sp.price || sp.platform);
  const brand = (sp.brand ?? "").trim();
  const style = (sp.style ?? "").trim();
  const price = sp.price ? Number(sp.price) : null;

  const median = submitted ? await resolveMedian(brand, style) : null;
  const signals: Signal[] = [];

  if (submitted) {
    // 1. Price sanity
    if (median && price && price > 0) {
      const pctBelow = Math.round(((median.median - price) / median.median) * 100);
      const base = `Typical resale for the ${median.label} is about ${formatPrice(median.median, median.currency)} (median of ${median.count} listings${median.asOf ? `, as of ${median.asOf}` : ""}). This listing is ${formatPrice(price, median.currency)}.`;
      if (pctBelow >= 50) signals.push({ tone: "flag", title: "The price is far below the going rate", body: `${base} That is ${pctBelow}% under. A price this far below the market is the single most common scam signal.` });
      else if (pctBelow >= 25) signals.push({ tone: "note", title: "The price is below the going rate", body: `${base} That is ${pctBelow}% under. Not damning on its own, but ask why it is cheaper and check everything else.` });
      else signals.push({ tone: "ok", title: "The price is roughly in line", body: `${base} That is close to the going rate, so price alone is not a red flag here.` });
    } else if (price && price > 0) {
      signals.push({ tone: "note", title: "We could not price-check this bag", body: "We do not have resale data for this exact model, so we cannot compare the asking price. If it feels far too cheap, treat that as a warning on its own." });
    }

    // 2. The authenticity-card tell
    const isNoCard = NO_CARD_HOUSES.some((h) => brand.toLowerCase().includes(h));
    if (sp.card === "yes" && isNoCard) {
      signals.push({ tone: "flag", title: "That house does not issue authenticity cards", body: `${brand} does not include an authenticity card, so a listing that brags about including one is waving a flag, not handing you a credential.` });
    } else if (sp.card === "yes") {
      signals.push({ tone: "note", title: "A card is reassuring, not proof", body: "Cards are copied and swapped between bags. If the house does issue one, its number should match the bag's serial, but a matching card is still necessary, not sufficient." });
    }

    // 3. Detail photos
    if (sp.photos === "no") {
      signals.push({ tone: "flag", title: "Ask for the detail photos", body: "A real seller can photograph the stamp or date code, the hardware engraving, the interior tag, and the stitching at the seams. Only glossy, stock-style photos, or a seller who dodges the request, is telling you something." });
    } else if (sp.photos === "yes") {
      signals.push({ tone: "ok", title: "Detail photos are there", body: "Good. Now run them against the brand's markers below rather than trusting them at a glance." });
    }

    // 4. Where you buy
    const plat = PLATFORMS.find((p) => p.value === sp.platform);
    if (plat) {
      signals.push({ tone: plat.risk === "high" ? "flag" : plat.risk === "low" ? "ok" : "note", title: `Where you are buying: ${plat.label}`, body: plat.note });
    }

    // 5. Pressure
    if (sp.pressure === "yes") {
      signals.push({ tone: "flag", title: "Pressure is itself a red flag", body: "Urgency is a sales tactic, and it exists to stop you doing the very checks this page describes. A real bag will still be real tomorrow, so give yourself the time to look." });
    }
  }

  const flags = signals.filter((s) => s.tone === "flag").length;
  const input = "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-gold focus:outline-none";
  const toneStyle: Record<Signal["tone"], string> = {
    flag: "border-[#cf7d59]/40 bg-[#cf7d59]/10",
    note: "border-gold/30 bg-gold/5",
    ok: "border-[#9bbf6a]/30 bg-[#9bbf6a]/10",
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Authentication</p>
      <h1 className="mt-1 font-serif text-3xl text-foreground sm:text-4xl">Check a listing</h1>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
        Most fakes and scams give themselves away in the listing, before the bag ever ships. Answer a
        few things and we will flag the common signals against our resale data. These are{" "}
        <span className="text-gold-soft">red flags to weigh, not a verdict</span>. It does not read the
        bag, and a clean listing is never proof on its own.
      </p>

      <form method="GET" className="mt-6 grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Brand</span>
          <input name="brand" defaultValue={brand} placeholder="e.g. Chanel" className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Style / model</span>
          <input name="style" defaultValue={style} placeholder="e.g. Classic Flap" className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Asking price</span>
          <input name="price" type="number" min="0" defaultValue={sp.price ?? ""} placeholder="e.g. 2200" className={input} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Where is it listed?</span>
          <select name="platform" defaultValue={sp.platform ?? ""} className={input}>
            <option value="">Pick one</option>
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
        <Radio name="card" label="Does the listing include an 'authenticity card'?" value={sp.card} />
        <Radio name="photos" label="Are there close-up detail photos?" value={sp.photos} yesFirst />
        <Radio name="pressure" label="Is the seller creating urgency?" value={sp.pressure} />
        <div className="sm:col-span-2">
          <button type="submit" className="w-full rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft">
            Check the listing
          </button>
        </div>
      </form>

      {submitted && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl text-foreground">
            {flags === 0 ? "Nothing here rules it out" : `${flags} thing${flags === 1 ? "" : "s"} to scrutinize`}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {flags === 0
              ? "None of the common signals fired, but that is not proof. Run the markers and, for anything costly, a pro."
              : "Weigh these together, no single one is a verdict, then run the markers and get a pro for anything costly."}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {signals.map((s, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${toneStyle[s.tone]}`}>
                <p className="font-serif text-foreground">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-surface/50 p-5 text-sm">
            <p className="text-muted">These are red flags to weigh, not a verdict. The safest check is a human expert with the bag in hand.</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-medium text-gold">
              <Link href="/authentication" className="transition-colors hover:text-gold-soft">Run the brand markers &rarr;</Link>
              <Link href="/authenticate" className="transition-colors hover:text-gold-soft">Get it checked by a pro &rarr;</Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Radio({ name, label, value, yesFirst }: { name: string; label: string; value?: string; yesFirst?: boolean }) {
  const opts = yesFirst ? ["yes", "no"] : ["no", "yes", "unsure"];
  return (
    <fieldset className="text-sm sm:col-span-2">
      <legend className="mb-1.5 text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <label key={o} className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${value === o ? "border-gold text-gold" : "border-border text-muted hover:border-gold/60"}`}>
            <input type="radio" name={name} value={o} defaultChecked={value === o} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
