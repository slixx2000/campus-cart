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
      className="space-y-5 rounded-lg border border-line bg-surface p-8 dark:bg-surface"
    >
      {state.message && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
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
              className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
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
              className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
            />
            {state.errors?.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{state.errors.confirmPassword[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn-primary h-12 w-full disabled:opacity-60"
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
          className="btn-primary h-12 w-full"
        >
          Continue to Sign In
        </Link>
      )}
    </form>
  );
}
