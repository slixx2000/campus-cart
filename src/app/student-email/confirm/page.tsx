import crypto from "node:crypto";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function getMessageCard(title: string, body: string, success = false) {
  return (
    <div className="min-h-screen bg-background-light px-4 py-12 text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={success ? "/sell" : "/"}
            className="rounded-full bg-gradient-to-r from-primary to-blue-400 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
          >
            {success ? "Continue to selling" : "Go home"}
          </Link>
          <Link
            href="/profile/settings"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
          >
            Profile settings
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function StudentEmailConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return getMessageCard("Missing verification token", "The verification link is incomplete.");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_student_email_verification", {
    p_token_hash: tokenHash,
  });

  if (error) {
    return getMessageCard("Verification failed", `We could not verify this student email: ${error.message}`);
  }

  if (!data) {
    return getMessageCard(
      "Invalid or expired verification link",
      "This verification link is invalid, expired, or has already been used. Ask an admin to generate a new one."
    );
  }

  return getMessageCard(
    "Student email verified",
    "Your student email has been confirmed for this account. Selling should now be unlocked on CampusCart.",
    true
  );
}
