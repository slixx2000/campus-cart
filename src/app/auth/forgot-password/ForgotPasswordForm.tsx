"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { sendPasswordResetEmail } from "@/lib/auth/authService";
import { useOtpCooldown } from "@/hooks/useOtpCooldown";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const lockRef = useRef(false);
  const { canResend, timeLeft, startCooldown } = useOtpCooldown({
    storageKey: "web_password_reset_cooldown",
    cooldownSeconds: 60,
  });

  const buttonLabel = useMemo(() => {
    if (isSending) return "Sending...";
    if (!canResend) return `Resend available in ${timeLeft}s`;
    return "Send Reset Link";
  }, [canResend, isSending, timeLeft]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (lockRef.current || isSending) return;
    if (!canResend) {
      setErrorMessage(`Too many requests. Please wait ${timeLeft}s before trying again.`);
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setErrorMessage("Please enter your email.");
      return;
    }

    lockRef.current = true;
    setIsSending(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      await sendPasswordResetEmail(normalizedEmail);
      startCooldown();
      setMessage("Check your email for the login code or reset link.");
    } catch (error) {
      const next = error instanceof Error ? error.message : "Could not send reset email. Please try again.";
      setErrorMessage(next);
    } finally {
      setIsSending(false);
      lockRef.current = false;
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-lg border border-line bg-surface p-8 dark:bg-surface"
    >
      {message && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-rose-300/20 dark:bg-rose-300/10 dark:text-rose-200">
          {errorMessage}
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@university.ac.zm"
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
        />
      </div>

      {!canResend ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Resend available in {timeLeft}s</p>
      ) : null}

      <button
        type="submit"
        disabled={isSending || !canResend}
        className="btn-primary h-12 w-full disabled:opacity-60"
      >
        {isSending ? (
          <span className="material-symbols-outlined animate-spin text-xl">
            progress_activity
          </span>
        ) : (
          buttonLabel
        )}
      </button>
    </form>
  );
}
