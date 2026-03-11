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
    <div className="min-h-screen bg-background-light flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary text-5xl">
            shopping_cart_checkout
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-4">
            Welcome back
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Sign in to your CampusCart account
          </p>
        </div>
        <SignInForm redirectTo={redirectTo} />
        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <a
            href={`/auth/sign-up${redirectTo ? `?redirect=${redirectTo}` : ""}`}
            className="text-primary font-semibold hover:underline"
          >
            Sign up free
          </a>
        </p>
      </div>
    </div>
  );
}
