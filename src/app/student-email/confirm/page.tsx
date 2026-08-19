import crypto from "node:crypto";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function getMessageCard(title: string, body: string, success = false) {
  return (
    <div className="min-h-screen bg-bg px-4 py-12 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-2xl rounded-lg border border-line bg-surface p-8 dark:bg-surface">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={success ? "/sell" : "/"}
            className="btn-primary px-6 py-3 text-sm"
          >
            {success ? "Continue to selling" : "Go home"}
          </Link>
          <Link
            href="/profile/settings"
            className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-surface-2 dark:text-slate-200 dark:hover:bg-surface"
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
