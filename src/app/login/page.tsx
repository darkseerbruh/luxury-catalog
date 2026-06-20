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
        Log in to save bags to your closet and track prices.
      </p>
      <AuthForm mode="login" />
    </main>
  );
}
