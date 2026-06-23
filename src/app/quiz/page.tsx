import { getCurrentUser } from "@/lib/auth";
import { getUserTaste } from "@/lib/taste-data";
import { TASTE_QUESTIONS, nameTaste } from "@/lib/taste";
import QuizClient from "./QuizClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find your taste · The Luxury Catalog",
  description: "A quick visual quiz to read your handbag taste and point you at bags worth a look.",
};

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; seed?: string }>;
}) {
  const { done, seed } = await searchParams;
  const [user, taste] = await Promise.all([getCurrentUser(), getUserTaste()]);

  // Show the result card when they just finished, or already have a taste profile.
  const showResult = Boolean(done) || taste.hasQuiz;
  const named = nameTaste(taste.vector);
  const initialResult = showResult && taste.hasQuiz
    ? { name: named.name, tagline: named.tagline, completeness: taste.completeness }
    : null;

  // A `seed` deep link from the homepage tile pre-answers the first question.
  // Validate it against that question's real options before trusting it.
  const firstQuestion = TASTE_QUESTIONS[0];
  const seedAnswer =
    seed && firstQuestion.options.some((o) => o.value === seed)
      ? { questionId: firstQuestion.id, value: seed }
      : null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 py-12">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-muted">Find your taste</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">This or that</h1>
        <p className="mt-2 text-muted">
          A few quick taps. We read your taste off real catalog attributes — then
          point you at bags worth a look.
        </p>
      </header>

      <QuizClient
        questions={TASTE_QUESTIONS}
        signedIn={Boolean(user)}
        initialResult={initialResult}
        seedAnswer={seedAnswer}
      />
    </main>
  );
}
