"use client";

import { useActionState } from "react";
import { signInAction } from "@/app/auth/actions";

export default function SignInForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <form action={formAction} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-5">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {state.message && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@university.ac.zm"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
        />
        {state.errors?.email && (
          <p className="text-xs text-red-500 mt-1">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Password
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
        />
        {state.errors?.password && (
          <p className="text-xs text-red-500 mt-1">{state.errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-full bg-gradient-to-r from-primary to-blue-500 text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
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
