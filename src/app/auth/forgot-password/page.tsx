import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = { title: "Forgot Password - CampusCart" };

export default function ForgotPasswordPage() {
  return (
    <div className="fluid-gradient-dark flex min-h-screen items-center justify-center bg-background-light px-4 py-16 transition-colors dark:bg-[#07111f]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="material-symbols-outlined text-5xl text-primary dark:text-sky-300">
            lock_reset
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Enter your email and we will send you a secure reset link.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Remember your password?{" "}
          <Link
            href="/auth/sign-in"
            className="font-semibold text-primary hover:underline dark:text-sky-300"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
