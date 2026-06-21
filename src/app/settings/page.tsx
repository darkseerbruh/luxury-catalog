import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import {
  EmailForm,
  PasswordForm,
  NotificationPrefsForm,
  DeleteAccountForm,
} from "./SettingsForms";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings · The Luxury Catalog",
  robots: { index: false, follow: false },
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="font-serif text-xl text-foreground">{title}</h2>
      {description && <p className="mb-4 mt-1 text-sm text-muted">{description}</p>}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getProfile();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-12">
      <header>
        <p className="text-sm uppercase tracking-widest text-muted">Account</p>
        <h1 className="mt-1 font-serif text-3xl text-foreground">Settings</h1>
      </header>

      <Section
        title="Email"
        description="Changing your email sends a confirmation link; it updates once confirmed."
      >
        <EmailForm currentEmail={user.email} />
      </Section>

      <Section title="Password">
        <PasswordForm />
      </Section>

      <Section
        title="Notifications"
        description="Choose what we notify you about. Everything is on by default."
      >
        <NotificationPrefsForm initial={profile?.notificationPrefs ?? {}} />
      </Section>

      <Section
        title="Delete account"
        description="Permanently remove your account and all your data."
      >
        <DeleteAccountForm currentEmail={user.email} />
      </Section>
    </main>
  );
}
