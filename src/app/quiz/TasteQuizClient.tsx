"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QUIZ_FLOW, MARKS, type QuizQuestion } from "@/lib/taste-quiz";
import { tasteIdentity, type Mark, type TasteAnswers, type Vibe, type Logo } from "@/lib/taste-identity";
import { saveTasteResult } from "@/lib/taste-result-actions";

type MarkMap = Record<string, Mark>;

interface Answers {
  occasions: string[];
  vibe: MarkMap;
  logo: Logo | null;
  carry: MarkMap;
  finishes: MarkMap;
  hardware: MarkMap;
  houses: MarkMap;
}

const EMPTY: Answers = { occasions: [], vibe: {}, logo: null, carry: {}, finishes: {}, hardware: {}, houses: {} };

/** A simple brand-neutral bag glyph for the logo options (no real house marks). */
function LogoGlyph({ kind }: { kind: Logo }) {
  return (
    <svg viewBox="0 0 56 44" className="mx-auto h-9 w-12" aria-hidden="true">
      <path d="M16 18 Q16 11 23 11 Q30 11 30 18 M30 18 Q30 11 37 11 Q44 11 44 18" fill="none" stroke="var(--color-gold)" strokeWidth="1.5" />
      <rect x="13" y="18" width="30" height="18" rx="2.5" fill="none" stroke="var(--color-gold-soft)" strokeWidth="1.5" />
      {kind === "recognizable" && <circle cx="28" cy="27" r="2.2" fill="var(--color-gold)" />}
      {kind === "loud" && (
        <g stroke="var(--color-gold)" strokeWidth="1">
          <line x1="19" y1="23" x2="23" y2="27" /><line x1="26" y1="23" x2="30" y2="27" /><line x1="33" y1="23" x2="37" y2="27" />
          <line x1="19" y1="29" x2="23" y2="33" /><line x1="26" y1="29" x2="30" y2="33" /><line x1="33" y1="29" x2="37" y2="33" />
        </g>
      )}
    </svg>
  );
}

function MarkRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: Mark;
  onChange: (m: Mark) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <div className="text-sm text-foreground">{label}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
      <div className="mt-2 flex gap-1.5">
        {MARKS.map((m) => {
          const on = value === m.value;
          const tone =
            m.value === "love"
              ? "border-gold bg-gold/15 text-gold-soft"
              : m.value === "not"
                ? "border-red-500/60 bg-red-500/10 text-red-300"
                : "border-border bg-surface-raised text-foreground";
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value as Mark)}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                on ? tone : "border-border text-muted hover:border-gold/40"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TasteQuizClient({
  houses,
  signedIn,
}: {
  houses: string[];
  signedIn: boolean;
}) {
  // Houses become a final "mark" question, built from the live brand directory.
  const housesQuestion: QuizQuestion = useMemo(
    () => ({
      id: "houses",
      input: "mark",
      skippable: true,
      prompt: "Any houses you always love, or never touch?",
      sub: "Mark only the ones you feel strongly about.",
      options: houses.map((h) => ({ value: h, label: h })),
    }),
    [houses],
  );

  const flow = useMemo<QuizQuestion[]>(() => [...QUIZ_FLOW, housesQuestion], [housesQuestion]);
  const total = flow.length + 1; // questions + result

  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [showMore, setShowMore] = useState(false);

  const onResult = step >= flow.length;
  const q = onResult ? null : flow[step];

  const identity = useMemo(() => {
    const input: TasteAnswers = {
      vibe: a.vibe as Partial<Record<Vibe, Mark>>,
      logo: a.logo,
      hardware: a.hardware,
      finishes: a.finishes,
    };
    return tasteIdentity(input);
  }, [a]);

  function setMark(field: keyof Answers, value: string, mark: Mark) {
    setA((prev) => ({ ...prev, [field]: { ...(prev[field] as MarkMap), [value]: mark } }));
  }
  function toggleOccasion(value: string) {
    setA((prev) => ({
      ...prev,
      occasions: prev.occasions.includes(value)
        ? prev.occasions.filter((o) => o !== value)
        : [...prev.occasions, value],
    }));
  }

  const next = () => setStep((s) => Math.min(s + 1, flow.length));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Signed-in users get their result saved automatically when they reach it.
  const savedRef = useRef(false);
  useEffect(() => {
    if (signedIn && onResult && !savedRef.current) {
      savedRef.current = true;
      void saveTasteResult({
        occasions: a.occasions,
        vibe: a.vibe,
        logo: a.logo,
        carry: a.carry,
        finishes: a.finishes,
        hardware: a.hardware,
        houses: a.houses,
      });
    }
  }, [signedIn, onResult, a]);

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted">
          {onResult ? "Your result" : `Step ${step + 1} of ${total}`}
        </span>
      </div>

      {q && (
        <div>
          <h2 className="font-serif text-2xl text-foreground">{q.prompt}</h2>
          {q.sub && <p className="mt-1 mb-4 text-sm text-muted">{q.sub}</p>}

          {q.input === "multi" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {q.options.map((o) => {
                const on = a.occasions.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleOccasion(o.value)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      on ? "border-gold bg-gold/15 text-gold-soft" : "border-border text-muted hover:border-gold/40"
                    }`}
                  >
                    {o.label}
                    {o.hint && <span className="ml-1 text-xs opacity-70">· {o.hint}</span>}
                  </button>
                );
              })}
            </div>
          )}

          {q.input === "single" && (
            <div className="mt-3 flex flex-col gap-3">
              {q.options.map((o) => {
                const on = a.logo === (o.value as Logo);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setA((prev) => ({ ...prev, logo: o.value as Logo }))}
                    className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
                      on ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
                    }`}
                  >
                    <LogoGlyph kind={o.value as Logo} />
                    <span>
                      <span className="block text-foreground">{o.label}</span>
                      {o.hint && <span className="block text-sm text-muted">{o.hint}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {q.input === "mark" && (
            <>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(q.id === "houses" && !showMore ? q.options.slice(0, 8) : q.options).map((o) => (
                  <MarkRow
                    key={o.value}
                    label={o.label}
                    hint={o.hint}
                    value={(a[q.id as keyof Answers] as MarkMap)[o.value] ?? "fine"}
                    onChange={(m) => setMark(q.id as keyof Answers, o.value, m)}
                  />
                ))}
              </div>
              {q.id === "houses" && q.options.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowMore((v) => !v)}
                  className="mt-3 text-sm text-muted underline-offset-2 hover:text-gold hover:underline"
                >
                  {showMore ? "Show fewer houses" : "More houses"}
                </button>
              )}
            </>
          )}

          <div className="mt-7 flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              className={`text-sm text-muted/80 hover:text-foreground ${step === 0 ? "invisible" : ""}`}
            >
              Back
            </button>
            <div className="flex items-center gap-4">
              {q.skippable && (
                <button type="button" onClick={next} className="text-sm text-muted/80 hover:text-foreground">
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
              >
                {step === flow.length - 1 ? "See my read" : step === 0 ? "Continue" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}

      {onResult && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 text-center">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted">What your style says</div>
            <div className="mt-3 font-serif text-3xl leading-tight text-foreground">{identity.headline}</div>
            <p className="mt-3 font-serif text-base italic text-gold-soft">{identity.read}</p>
            {identity.tags.length > 0 && (
              <>
                <div className="mx-6 my-5 h-px bg-border" />
                <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-muted">
                  {identity.tags.map((t, i) => (
                    <span key={t}>
                      {i > 0 && <span className="mr-2 text-border">·</span>}
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex w-full max-w-sm flex-col items-center gap-4">
            {signedIn ? (
              <Link
                href="/search"
                className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
              >
                See my bags
              </Link>
            ) : (
              <>
                <div className="w-full rounded-xl border border-border bg-surface-raised p-4 text-left">
                  <p className="mb-2 text-center text-sm text-foreground">An account does more with it</p>
                  <ul className="flex flex-col gap-1.5 text-sm text-muted">
                    <li className="flex gap-2"><span className="text-gold">+</span> Keeps your read and your boards</li>
                    <li className="flex gap-2"><span className="text-gold">+</span> Tells you when a bag you want drops</li>
                    <li className="flex gap-2"><span className="text-gold">+</span> Saves the bags matched to your taste</li>
                  </ul>
                </div>
                <Link
                  href="/signup"
                  className="rounded-full bg-gold px-6 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
                >
                  Create account
                </Link>
              </>
            )}
            <button type="button" onClick={() => setStep(0)} className="text-sm text-muted/80 hover:text-foreground">
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
