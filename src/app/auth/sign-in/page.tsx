import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignInForm from "./SignInForm";

export const metadata = { title: "Sign In – CampusCart" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { redirect: redirectTo } = await searchParams;

  if (user) redirect(redirectTo ?? "/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-16 transition-colors">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="material-symbols-outlined text-5xl text-primary">
            shopping_cart_checkout
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Sign in to browse, chat, or manage your verified student seller account.
          </p>
        </div>
        <SignInForm redirectTo={redirectTo} />
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <a
            href={`/auth/sign-up${redirectTo ? `?redirect=${redirectTo}` : ""}`}
            className="font-semibold text-primary hover:underline"
          >
            Sign up free
          </a>
        </p>
      </div>
    </div>
  );
}
