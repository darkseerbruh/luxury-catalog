"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { logThriftFind } from "@/lib/actions";
import { buildConsignmentLinks } from "@/lib/affiliate";
import { track, EVENTS } from "@/lib/analytics/events";

const CONDITIONS = ["unknown", "new", "excellent", "very good", "good", "fair"];

export default function ThriftFindForm({
  defaultBrand = "",
  defaultStyle = "",
}: {
  defaultBrand?: string;
  defaultStyle?: string;
}) {
  const [submitted, setSubmitted] = useState<{ brand: string; style: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (submitted) {
    // The find is logged — and a thrift find is a flipper's strongest sell
    // signal, so this is the consignor-referral moment (the highest-value
    // outbound link in the model). Surface it when we know the brand.
    const sellLinks = buildConsignmentLinks(submitted.brand, submitted.style);
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
        <p className="font-serif text-xl text-foreground">Logged. Nice find.</p>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          Thanks — that&rsquo;s one more data point on what&rsquo;s turning up and
          what it actually sells for.
        </p>

        {sellLinks.length > 0 && (
          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-border bg-surface p-5 text-left">
            <p className="font-serif text-base text-foreground">Flipping it?</p>
            <p className="mt-1 text-sm text-muted">
              Get a buyout quote (cash now) or consign it (listed for you, paid on
              sale). Quotes and splits are set by each platform.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sellLinks.map((l) => (
                <a
                  key={l.key}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  onClick={() =>
                    track(EVENTS.outboundConsignClicked, {
                      platform: l.key,
                      mode: l.mode,
                      brand: submitted.brand,
                      style: submitted.style,
                      source: "thrift_find",
                    })
                  }
                  className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-gold hover:text-gold"
                >
                  {l.mode === "buyout" ? `Quote on ${l.name}` : `Consign with ${l.name}`} →
                </a>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted/70">
              Affiliate links — we may earn a commission, at no cost to you.{" "}
              <Link href="/disclosure" className="underline hover:text-foreground">Learn more</Link>.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setSubmitted(null)}
          className="mt-5 rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
        >
          Log another find
        </button>
      </div>
    );
  }

  function action(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await logThriftFind(formData);
      if (res.ok) {
        const brand = String(formData.get("brand") ?? "").trim();
        const style = String(formData.get("style") ?? "").trim();
        track(EVENTS.thriftFindLogged, { brand: brand || undefined });
        setSubmitted({ brand, style });
      } else setError(res.error ?? "Something went sideways — try again.");
    });
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Brand">
          <input
            name="brand"
            defaultValue={defaultBrand}
            placeholder="Coach"
            className="input"
          />
        </Field>
        <Field label="Style (if you know it)">
          <input name="style" defaultValue={defaultStyle} placeholder="Tabby" className="input" />
        </Field>
        <Field label="Where did you find it?">
          <input name="where_found" placeholder="Goodwill, estate sale…" className="input" />
        </Field>
        <Field label="What did you pay?">
          <input name="price_paid" inputMode="decimal" placeholder="$ amount" className="input" />
        </Field>
        <Field label="Condition">
          <select name="condition" defaultValue="unknown" className="input capitalize">
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          name="note"
          rows={2}
          maxLength={1000}
          placeholder="Hardware, stamps, anything notable"
          className="input"
        />
      </Field>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold px-5 py-3 font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-40"
        >
          {pending ? "Logging…" : "Log this find"}
        </button>
        <Link href="/identify" className="text-sm text-muted transition-colors hover:text-gold">
          Identify a bag instead →
        </Link>
      </div>

      <style>{`
        .input {
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-bg);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--color-foreground);
          width: 100%;
        }
        .input:focus { border-color: var(--color-gold); outline: none; }
        .input::placeholder { color: var(--color-muted); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}
