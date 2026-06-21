"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateEmail,
  updatePassword,
  updateNotificationPrefs,
  deleteAccount,
  type SettingsResult,
} from "@/lib/settings-actions";
import type { NotificationPrefs } from "@/lib/auth";

function Status({ result }: { result: SettingsResult | null }) {
  if (!result) return null;
  if (result.error) return <p className="text-sm text-red-400">{result.error}</p>;
  if (result.message) return <p className="text-sm text-gold">{result.message}</p>;
  return null;
}

const inputClass =
  "rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-gold focus:outline-none";
const primaryBtn =
  "self-start rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-gold-soft disabled:opacity-60";

export function EmailForm({ currentEmail }: { currentEmail: string | null }) {
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => setResult(await updateEmail(formData)));
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Email address</span>
        <input name="email" type="email" defaultValue={currentEmail ?? ""} className={inputClass} />
      </label>
      <Status result={result} />
      <button type="submit" disabled={pending} className={primaryBtn}>
        {pending ? "Saving…" : "Update email"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await updatePassword(formData);
      setResult(res);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">New password</span>
        <input name="password" type="password" minLength={8} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Confirm new password</span>
        <input name="password_confirm" type="password" minLength={8} className={inputClass} />
      </label>
      <Status result={result} />
      <button type="submit" disabled={pending} className={primaryBtn}>
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}

const PREFS: { key: keyof NotificationPrefs; name: string; label: string; help: string }[] = [
  {
    key: "price_alert",
    name: "pref_price_alert",
    label: "Price-drop alerts",
    help: "When a watched bag hits your target price.",
  },
  {
    key: "closet_activity",
    name: "pref_closet_activity",
    label: "Closet activity",
    help: "New followers and activity from closets you follow.",
  },
  {
    key: "photo_featured",
    name: "pref_photo_featured",
    label: "Photo featured",
    help: "When a photo you contributed is featured.",
  },
  {
    key: "email",
    name: "pref_email",
    label: "Email delivery",
    help: "Master switch for email. In-app alerts still appear when off.",
  },
];

export function NotificationPrefsForm({ initial }: { initial: NotificationPrefs }) {
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => setResult(await updateNotificationPrefs(formData)));
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3">
      {PREFS.map((p) => (
        <label
          key={p.key}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3"
        >
          <input
            type="checkbox"
            name={p.name}
            // Default-on: absent key means opted in.
            defaultChecked={initial[p.key] !== false}
            className="mt-1 accent-gold"
          />
          <span>
            <span className="block text-foreground">{p.label}</span>
            <span className="block text-sm text-muted">{p.help}</span>
          </span>
        </label>
      ))}
      <Status result={result} />
      <button type="submit" disabled={pending} className={primaryBtn}>
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}

export function DeleteAccountForm({ currentEmail }: { currentEmail: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SettingsResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const res = await deleteAccount(formData);
      // On success the action redirects; only an error returns here.
      setResult(res);
      if (res.ok) router.push("/");
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-border px-5 py-2.5 text-sm text-muted transition-colors hover:border-red-400/50 hover:text-red-400"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3 rounded-xl border border-red-400/30 bg-red-400/5 p-5">
      <p className="text-sm text-foreground">
        This permanently deletes your account and all associated data (closet, watchlist,
        reviews, posts). This cannot be undone.
      </p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">
          Type your email (<span className="text-foreground">{currentEmail}</span>) to confirm
        </span>
        <input name="confirm_email" type="email" className={inputClass} autoComplete="off" />
      </label>
      <Status result={result} />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Permanently delete"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-full px-4 py-2.5 text-sm text-muted/70 transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
