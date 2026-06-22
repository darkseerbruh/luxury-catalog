import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "./AuthForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log in · The Luxury Catalog" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/closet");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <h1 className="font-serif text-3xl text-foreground">Welcome back</h1>
      <p className="mt-2 mb-8 text-muted">
        Log back in to pick up your closet and the prices you&rsquo;re watching.
      </p>
      <AuthForm mode="login" />
    </main>
  );
}
