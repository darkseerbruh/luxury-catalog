"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TasteQuizQuestion } from "@/lib/taste";
import {
  buildVectorFromAnswers,
  nameTaste,
  completeness as computeCompleteness,
} from "@/lib/taste";
import { saveQuizAnswers } from "@/lib/taste-actions";
import { PENDING_QUIZ_KEY } from "@/lib/taste-pending";
import { track, EVENTS } from "@/lib/analytics/events";

interface ResultCard {
  name: string;
  tagline: string;
  completeness: number;
}

export default function QuizClient({
  questions,
  signedIn,
  initialResult,
}: {
  questions: TasteQuizQuestion[];
  signedIn: boolean;
  initialResult: ResultCard | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ResultCard | null>(initialResult);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [pending, startTransition] = useTransition();

  const total = questions.length;
  const progress = useMemo(() => Math.round((step / total) * 100), [step, total]);

  useEffect(() => {
    if (started) track(EVENTS.quizStarted, {});
  }, [started]);

  function choose(questionId: string, value: string) {
    if (!started) setStarted(true);
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      submit(next);
    }
  }

  function submit(finalAnswers: Record<string, string>) {
    setError(null);

    // No gatekeeping: a logged-out visitor gets their full result immediately,
    // computed client-side from the same canonical questions. We stash the
    // answers so we can persist them the instant they create an account (the
    // value-prop CTA below), instead of walling the result behind sign-up.
    if (!signedIn) {
      const vector = buildVectorFromAnswers(finalAnswers);
      const named = nameTaste(vector);
      const pct = computeCompleteness(vector);
      try {
        localStorage.setItem(PENDING_QUIZ_KEY, JSON.stringify(finalAnswers));
      } catch {
        /* private mode / storage disabled — result still shows, just not saved */
      }
      track(EVENTS.quizCompleted, { completeness: pct, signed_in: false });
      setResult({ name: named.name, tagline: named.tagline, completeness: pct });
      return;
    }

    startTransition(async () => {
      const res = await saveQuizAnswers(finalAnswers);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      track(EVENTS.quizCompleted, { completeness: res.completeness ?? 0, signed_in: true });
      // Refresh to read back the named taste from the server-derived vector.
      router.refresh();
      router.push("/quiz?done=1");
    });
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setResult(null);
    setError(null);
    setStarted(false);
  }

  // Result view (either freshly computed via refresh, or an existing taste).
  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 to-surface p-8 text-center">
          <p className="text-sm uppercase tracking-widest text-gold">Your taste profile</p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">{result.name}</h2>
          <p className="mt-3 text-muted">{result.tagline}</p>
          <div className="mx-auto mt-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-gold" style={{ width: `${result.completeness}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">{result.completeness}% mapped</p>
        </div>

        {!signedIn && (
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center">
            <p className="text-foreground">
              Your <span className="font-medium text-gold">{result.name}</span> profile
              is ready.
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Make a free account and we&rsquo;ll keep it — plus the bags matched to
              your taste, your saved Taste Map, and a heads-up when one you love drops
              to your target price.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {signedIn ? (
            <Link
              href="/profile"
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
            >
              See my Taste Map
            </Link>
          ) : (
            <Link
              href="/signup?from=quiz"
              className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft"
            >
              Save my profile &amp; see my matches →
            </Link>
          )}
          <button
            type="button"
            onClick={restart}
            className="rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
          >
            Retake quiz
          </button>
        </div>
      </div>
    );
  }

  const q = questions[step];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">
          {step + 1} of {total}
        </p>
      </div>

      <div>
        <h2 className="text-center font-serif text-2xl text-foreground">{q.prompt}</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {q.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={pending}
              onClick={() => choose(q.id, opt.value)}
              className="rounded-2xl border border-border bg-surface px-6 py-10 text-lg text-foreground transition-colors hover:border-gold hover:bg-gold/5 disabled:opacity-60"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!signedIn && (
        <p className="text-center text-sm text-muted">
          No sign-up needed to see your result.{" "}
          <Link href="/login" className="text-gold hover:underline">
            Log in
          </Link>{" "}
          to save it and get bag recommendations.
        </p>
      )}
      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
