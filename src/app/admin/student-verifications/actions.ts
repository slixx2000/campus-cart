"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
    const { supabase, userId } = await requireAdmin();
    const profileId = String(formData.get("profileId") ?? "");
    const note = String(formData.get("note") ?? "").trim();

    if (!profileId) {
      return { message: "Missing profile id." };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        is_verified_student: true,
        student_email_verified_at: now,
        verification_review_note: note || null,
        verification_rejection_reason: null,
        verification_reviewed_at: now,
        verification_reviewed_by: userId,
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
    const { supabase, userId } = await requireAdmin();
    const profileId = String(formData.get("profileId") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();

    if (!profileId) {
      return { message: "Missing profile id." };
    }

    if (!reason) {
      return { message: "Add a rejection reason before clearing the request." };
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({
        is_verified_student: false,
        student_email: null,
        student_email_requested_at: null,
        student_email_verified_at: null,
        verification_review_note: null,
        verification_rejection_reason: reason,
        verification_reviewed_at: now,
        verification_reviewed_by: userId,
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

export async function createStudentVerificationLinkAction(
  _prevState: AdminVerificationState,
  formData: FormData
): Promise<AdminVerificationState> {
  try {
    const { supabase, userId } = await requireAdmin();
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

    const rawToken = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

    const { error: insertError } = await supabase
      .from("student_email_verification_tokens")
      .insert({
        profile_id: profileId,
        student_email: profile.student_email,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by: userId,
      });

    if (insertError) {
      return { message: `Could not create verification link: ${insertError.message}` };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";
    const verificationLink = `${siteUrl}/student-email/confirm?token=${rawToken}`;

    revalidatePath("/admin/student-verifications");

    return {
      message:
        "Verification link created. Your mailer is not wired yet, so copy and send this link manually for now.",
      verificationLink,
    };
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Could not create verification link." };
  }
}
