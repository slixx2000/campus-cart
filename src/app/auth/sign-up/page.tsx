import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignUpForm from "./SignUpForm";

export const metadata = { title: "Sign Up – CampusCart" };

export default async function SignUpPage({
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
    <div className="fluid-gradient-dark flex min-h-screen items-center justify-center bg-background-light px-4 py-16 transition-colors dark:bg-[#07111f]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="material-symbols-outlined text-5xl text-primary dark:text-sky-300">
            shopping_cart_checkout
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
            Join CampusCart
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Browse with any email. Sell only with a verified student account.
          </p>
        </div>
        <SignUpForm redirectTo={redirectTo} />
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <a
            href={`/auth/sign-in${redirectTo ? `?redirect=${redirectTo}` : ""}`}
            className="font-semibold text-primary hover:underline dark:text-sky-300"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
