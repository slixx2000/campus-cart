"use client";

import { startTransition, useActionState, useState } from "react";
import { signUpAction } from "@/app/auth/actions";
import AvatarPicker, { type AvatarSelection } from "@/components/AvatarPicker";
import { compressProfileAvatarForSubmit } from "@/lib/avatarService";

export default function SignUpForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, {});
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>({ type: "none" });
  const [avatarError, setAvatarError] = useState<string | null>(null);

  if (state.message && !state.errors) {
    return (
      <div className="rounded-[1.75rem] border border-green-200 bg-green-50 p-8 text-center dark:border-emerald-300/20 dark:bg-emerald-300/10">
        <span className="material-symbols-outlined mb-4 block text-4xl text-green-500 dark:text-emerald-300">
          mark_email_read
        </span>
        <p className="mb-2 font-bold text-slate-900 dark:text-white">Check your inbox</p>
        <p className="text-sm text-slate-500 dark:text-slate-300">{state.message}</p>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    setAvatarError(null);

    try {
      if (avatarSelection.type === "default") {
        formData.set("defaultAvatarUrl", avatarSelection.url);
      }

      if (avatarSelection.type === "upload") {
        const compressedAvatar = await compressProfileAvatarForSubmit(avatarSelection.file);
        formData.set("avatarFile", compressedAvatar, "avatar.jpg");
      }

      startTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "We could not process the selected avatar."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {state.message && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
          {state.message}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          required
          placeholder="e.g. Mwila Banda"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
        />
        {state.errors?.fullName && (
          <p className="text-xs text-red-500 mt-1">{state.errors.fullName[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@university.ac.zm"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
        />
        {state.errors?.email && (
          <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
          Phone (WhatsApp)
        </label>
        <input
          type="tel"
          name="phone"
          placeholder="+260 97 1234567"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5">
        <AvatarPicker onChange={setAvatarSelection} />
        {avatarError && (
          <p className="mt-3 text-xs text-red-500 dark:text-rose-300">{avatarError}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
        />
        {state.errors?.password && (
          <p className="text-xs text-red-500 mt-1">{state.errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-500 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
      >
        {pending ? (
          <span className="material-symbols-outlined animate-spin text-xl">
            progress_activity
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
