import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import AuthForm from "../login/AuthForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign up · Luxury Catalog" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next) ?? undefined;
  if (await getCurrentUser()) redirect(next ?? "/closet");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <h1 className="font-serif text-3xl text-foreground">Create your account</h1>
      <p className="mt-2 mb-8 text-muted">
        Build a closet, watch what prices do, and help shape the catalog. The
        catalog itself is always free.
      </p>
      <AuthForm mode="signup" next={next} />
    </main>
  );
}
