import ResetPasswordForm from "./ResetPasswordForm";

export const metadata = { title: "Set New Password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-16 transition-colors">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="material-symbols-outlined text-5xl text-primary">
            shield_lock
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Choose a strong password to secure your CampusCart account.
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
