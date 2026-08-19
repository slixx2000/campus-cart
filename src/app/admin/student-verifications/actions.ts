"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/siteUrl";
import { sendStudentVerificationEmail } from "@/lib/mailer";

export type AdminVerificationState = {
  message?: string;
  verificationLink?: string;
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
    const note = String(formData.get("note") ?? "").trim();

    if (!profileId) {
      return { message: "Missing profile id." };
    }

    // Privilege columns are not writable by the authenticated role; the definer
    // function re-checks is_admin server-side.
    const { error } = await supabase.rpc("admin_review_student_verification", {
      p_profile_id: profileId,
      p_approve: true,
      p_note: note || null,
    });

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
    const reason = String(formData.get("reason") ?? "").trim();

    if (!profileId) {
      return { message: "Missing profile id." };
    }

    if (!reason) {
      return { message: "Add a rejection reason before clearing the request." };
    }

    const { error } = await supabase.rpc("admin_review_student_verification", {
      p_profile_id: profileId,
      p_approve: false,
      p_reason: reason,
    });

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

export async function createStudentVerificationLinkAction(
  _prevState: AdminVerificationState,
  formData: FormData
): Promise<AdminVerificationState> {
  try {
    const { supabase } = await requireAdmin();
    const profileId = String(formData.get("profileId") ?? "");

    if (!profileId) {
      return { message: "Missing profile id." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("student_email")
      .eq("id", profileId)
      .maybeSingle();

    if (profileError) {
      return { message: `Could not load profile: ${profileError.message}` };
    }

    if (!profile?.student_email) {
      return { message: "This account does not have a linked student email yet." };
    }

    // Same definer RPC the student self-service path uses, so token shape,
    // expiry and throttling live in exactly one place.
    const { data: rawToken, error: mintError } = await supabase.rpc(
      "issue_student_email_verification",
      { p_profile_id: profileId }
    );

    if (mintError) {
      return { message: `Could not create verification link: ${mintError.message}` };
    }

    const verificationLink = `${siteUrl()}/student-email/confirm?token=${rawToken}`;
    const sent = await sendStudentVerificationEmail(profile.student_email, rawToken as string);

    revalidatePath("/admin/student-verifications");

    return {
      message: sent.ok
        ? `Verification email sent to ${profile.student_email}.`
        : `Link created, but the email could not be sent (${sent.error}). Copy it below and send it manually.`,
      verificationLink: sent.ok ? undefined : verificationLink,
    };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Could not create verification link." };
  }
}
