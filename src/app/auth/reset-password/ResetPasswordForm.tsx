"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction } from "@/app/auth/actions";

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, {});

  const success = !!state.message && !state.errors && state.message.includes("successfully");

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5"
    >
      {state.message && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200">
          {state.message}
        </div>
      )}

      {!success ? (
        <>
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              New Password
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
              <p className="mt-1 text-xs text-red-500">{state.errors.password[0]}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
            />
            {state.errors?.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{state.errors.confirmPassword[0]}</p>
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
              "Update Password"
            )}
          </button>
        </>
      ) : (
        <Link
          href="/auth/sign-in"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-blue-500 font-bold text-white transition-opacity hover:opacity-90 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
        >
          Continue to Sign In
        </Link>
      )}
    </form>
  );
}
