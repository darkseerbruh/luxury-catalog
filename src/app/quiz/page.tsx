import { getCurrentUser } from "@/lib/auth";
import { getUserTaste } from "@/lib/taste-data";
import { TASTE_QUESTIONS, nameTaste } from "@/lib/taste";
import QuizClient from "./QuizClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find your taste · The Luxury Catalog",
  description: "A quick visual quiz to map your handbag taste and unlock recommendations.",
};

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;
  const [user, taste] = await Promise.all([getCurrentUser(), getUserTaste()]);

  // Show the result card when they just finished, or already have a taste profile.
  const showResult = Boolean(done) || taste.hasQuiz;
  const named = nameTaste(taste.vector);
  const initialResult = showResult && taste.hasQuiz
    ? { name: named.name, tagline: named.tagline, completeness: taste.completeness }
    : null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 py-12">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-muted">Find your taste</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">This or that</h1>
        <p className="mt-2 text-muted">
          A few quick taps. We map your taste from real catalog attributes — then
          recommend bags you might love.
        </p>
      </header>

      <QuizClient
        questions={TASTE_QUESTIONS}
        signedIn={Boolean(user)}
        initialResult={initialResult}
      />
    </main>
  );
}
