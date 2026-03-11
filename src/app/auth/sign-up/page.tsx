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
    <div className="min-h-screen bg-background-light flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary text-5xl">
            shopping_cart_checkout
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-4">
            Join CampusCart
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Create a free account and start buying or selling today
          </p>
        </div>
        <SignUpForm redirectTo={redirectTo} />
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <a
            href={`/auth/sign-in${redirectTo ? `?redirect=${redirectTo}` : ""}`}
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
