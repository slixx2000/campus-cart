"use client";

import { startTransition, useActionState, useState, useMemo, useRef } from "react";
import { signUpAction } from "@/app/auth/actions";
import AvatarPicker, { type AvatarSelection } from "@/components/AvatarPicker";
import { compressProfileAvatarForSubmit } from "@/lib/avatarService";
import { signInWithGoogle } from "@/lib/auth/authService";

function getPasswordStrength(password: string): { score: number; label: string; color: string; issues: string[] } {
  const issues: string[] = [];
  let score = 0;

  if (!password) return { score: 0, label: "None", color: "gray", issues: ["Password required"] };

  if (password.length >= 8) score += 1;
  else issues.push("At least 8 characters");

  if (/[0-9]/.test(password)) score += 1;
  else issues.push("Need at least one number");

  if (/[a-z]/.test(password)) score += 1;
  else issues.push("Need lowercase letters");

  if (/[A-Z]/.test(password)) score += 1;
  else issues.push("Need uppercase letters");

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else issues.push("Need a symbol (!@#$%^&*)");

  let label = "Weak";
  let color = "red";
  if (score >= 5) {
    label = "Strong";
    color = "green";
  } else if (score >= 3) {
    label = "Good";
    color = "yellow";
  }

  return { score, label, color, issues };
}

export default function SignUpForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, {});
  const [avatarSelection, setAvatarSelection] = useState<AvatarSelection>({ type: "none" });
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleLockRef = useRef(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  if (state.message && !state.errors) {
    return (
      <div className="rounded-[1.75rem] border border-green-200 bg-green-50 p-8 text-center dark:border-emerald-300/20 dark:bg-emerald-300/10">
        <span className="material-symbols-outlined mb-4 block text-4xl text-green-500 dark:text-emerald-300">
          mail_outline
        </span>
        <p className="mb-2 font-bold text-slate-900 dark:text-white">Check Your Email</p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">We've sent a confirmation link to your inbox. Click it to verify your account and start using CampusCart.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Can't find it? Check your spam folder or try signing in if you've already confirmed.</p>
        <a 
          href="/auth/sign-in"
          className="text-sm font-semibold text-primary hover:underline dark:text-sky-300"
        >
          Go to Sign In →
        </a>
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

  const handleGoogle = async () => {
    if (googleLockRef.current || googleLoading) return;
    googleLockRef.current = true;
    setGoogleLoading(true);

    try {
      await signInWithGoogle(redirectTo ?? "/");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not continue with Google.");
      setGoogleLoading(false);
      googleLockRef.current = false;
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
          placeholder="you@gmail.com or you@university.ac.zm"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          You can browse with any email. Selling is unlocked after student verification.
        </p>
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
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>

        {password && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passwordStrength.color === "green"
                      ? "bg-green-500 w-full"
                      : passwordStrength.color === "yellow"
                      ? "bg-yellow-500 w-2/3"
                      : "bg-red-500 w-1/3"
                  }`}
                />
              </div>
              <span
                className={`text-xs font-semibold ${
                  passwordStrength.color === "green"
                    ? "text-green-600 dark:text-green-400"
                    : passwordStrength.color === "yellow"
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {passwordStrength.label}
              </span>
            </div>
            {passwordStrength.issues.length > 0 && (
              <div className="space-y-1">
                {passwordStrength.issues.map((issue) => (
                  <div key={issue} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-red-500 mt-0.5">✕</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || pending}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white font-bold text-slate-800 transition-opacity hover:opacity-90 disabled:opacity-60 dark:border-white/20 dark:bg-[#0d1a2b] dark:text-slate-100"
      >
        <span className="material-symbols-outlined text-xl">login</span>
        {googleLoading ? "Connecting to Google..." : "Sign up with Google"}
      </button>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500">
        By signing up you agree to our Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
