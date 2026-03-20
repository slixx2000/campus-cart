"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/auth/actions";

export default function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <form action={formAction} className="space-y-5 rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {state.message && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
          {state.message}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
          Email
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
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
        />
        {state.errors?.password && (
          <p className="text-xs text-red-500 mt-1">{state.errors.password[0]}</p>
        )}
        <div className="mt-2 text-right">
          <a
            href="/auth/forgot-password"
            className="text-xs font-semibold text-primary hover:underline dark:text-sky-300"
          >
            Forgot password?
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        Browse with any email. Only verified students can create listings.
      </p>

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
          "Sign In"
        )}
      </button>
    </form>
  );
}
