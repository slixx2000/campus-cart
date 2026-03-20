import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminVerificationTable from "./AdminVerificationTable";

export const metadata = { title: "Student Verifications – CampusCart Admin" };

export default async function StudentVerificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?redirect=/admin/student-verifications");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!currentProfile?.is_admin) {
    redirect("/");
  }

  const { data: rows, error } = await supabase
    .from("profiles")
    .select("id, full_name, student_email, student_email_requested_at, student_email_verified_at, is_verified_student")
    .not("student_email", "is", null)
    .order("student_email_requested_at", { ascending: true });

  if (error) {
    throw new Error(`Could not load student verifications: ${error.message}`);
  }

  return (
    <div className="min-h-screen bg-background-light px-4 py-12 text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <span className="text-sm font-bold uppercase tracking-[0.28em] text-primary dark:text-sky-300">
            Admin
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            Student seller approvals
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Review linked student emails and approve seller access for existing CampusCart accounts.
          </p>
        </div>

        <AdminVerificationTable rows={rows ?? []} />
      </div>
    </div>
  );
}
