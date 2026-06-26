import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllCategories } from "@/lib/repositories/universities";
import SellForm from "./SellForm";

export const metadata = { title: "Post a Listing – CampusCart" };

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in?redirect=/sell");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified_student")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_verified_student) {
    return (
      <div className="min-h-screen bg-background-light px-4 py-12 text-slate-900 dark:bg-background-dark dark:text-slate-100">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-white/5">
          <span className="text-sm font-bold uppercase tracking-[0.28em] text-primary dark:text-sky-300">
            Verified seller access required
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            You can browse CampusCart, but selling is for verified students only.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            To reduce scams and keep the marketplace trustworthy, only verified students can create listings. If your student status has already been approved, refresh and try again. Otherwise, head to your profile settings to complete seller verification or link your student account.
          </p>
          <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-slate-700 dark:border-sky-300/15 dark:bg-sky-300/10 dark:text-slate-200">
            Browse with any email. Post listings once your student account is verified.
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/profile/settings"
              className="rounded-full bg-gradient-to-r from-primary to-blue-400 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
            >
              Go to profile settings
            </Link>
            <Link
              href="/browse"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Continue browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categories = await getAllCategories();

  return <SellForm categories={categories} userId={user.id} />;
}
