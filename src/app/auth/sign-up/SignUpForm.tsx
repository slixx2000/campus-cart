"use client";

import { useActionState } from "react";
import { signUpAction } from "@/app/auth/actions";

export default function SignUpForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, {});

  if (state.message && !state.errors) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-green-500 text-4xl block mb-4">
          mark_email_read
        </span>
        <p className="font-bold text-slate-900 mb-2">Check your inbox</p>
        <p className="text-slate-500 text-sm">{state.message}</p>
      </div>
    );
  }

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
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          required
          placeholder="e.g. Mwila Banda"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
        />
        {state.errors?.fullName && (
          <p className="text-xs text-red-500 mt-1">{state.errors.fullName[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Email <span className="text-red-500">*</span>
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
          Phone (WhatsApp)
        </label>
        <input
          type="tel"
          name="phone"
          placeholder="+260 97 1234567"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          name="password"
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
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
          "Create Account"
        )}
      </button>

      <p className="text-xs text-slate-400 text-center">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
