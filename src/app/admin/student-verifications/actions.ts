"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AdminVerificationState = {
  message?: string;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in as an admin.");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.is_admin) {
    throw new Error("Admin access required.");
  }

  return { supabase, userId: user.id };
}

export async function approveStudentEmailAction(
  _prevState: AdminVerificationState,
  formData: FormData
): Promise<AdminVerificationState> {
  try {
    const { supabase } = await requireAdmin();
    const profileId = String(formData.get("profileId") ?? "");

    if (!profileId) {
      return { message: "Missing profile id." };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        is_verified_student: true,
        student_email_verified_at: now,
        updated_at: now,
      })
      .eq("id", profileId);

    if (error) {
      return { message: `Approval failed: ${error.message}` };
    }

    revalidatePath("/admin/student-verifications");
    revalidatePath("/profile/settings");
    revalidatePath("/sell");

    return { message: "Student seller approved." };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Approval failed." };
  }
}

export async function rejectStudentEmailAction(
  _prevState: AdminVerificationState,
  formData: FormData
): Promise<AdminVerificationState> {
  try {
    const { supabase } = await requireAdmin();
    const profileId = String(formData.get("profileId") ?? "");

    if (!profileId) {
      return { message: "Missing profile id." };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        is_verified_student: false,
        student_email: null,
        student_email_requested_at: null,
        student_email_verified_at: null,
        updated_at: now,
      })
      .eq("id", profileId);

    if (error) {
      return { message: `Rejection failed: ${error.message}` };
    }

    revalidatePath("/admin/student-verifications");
    revalidatePath("/profile/settings");
    revalidatePath("/sell");

    return { message: "Student email request rejected and cleared." };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Rejection failed." };
  }
}
