"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendStudentVerificationEmail } from "@/lib/mailer";
import { normalizeZambiaPhoneForStorage } from "@/lib/whatsapp";

const avatarSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL"),
});

const phoneSchema = z.object({
  phone: z.string().trim().min(1, "Enter your phone number"),
});

const studentEmailSchema = z.object({
  studentEmail: z
    .string()
    .email("Enter a valid student email address")
    .transform((value) => value.trim().toLowerCase()),
});

export type ProfileSettingsState = {
  errors?: Partial<Record<string, string[]>>;
  message?: string;
  /** Set when the mailer is unconfigured, so an admin can still send it by hand. */
  manualLink?: string;
};

/**
 * Mints a verification token for the signed-in user and emails it.
 *
 * Shared by "link a student email" and the resend button. Every failure mode is
 * a message rather than a throw: an unlisted university falls back to admin
 * review, and an unconfigured mailer surfaces the raw link instead of losing it.
 */
async function issueAndSendVerification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentEmail: string
): Promise<ProfileSettingsState> {
  const { data: token, error } = await supabase.rpc(
    "issue_student_email_verification",
    {}
  );

  if (error) {
    if (error.message.includes("no_domain_on_file")) {
      return {
        message:
          "Student email saved. We don't recognise that university's email domain yet, so an admin will review your request manually.",
      };
    }
    return { message: error.message };
  }

  const sent = await sendStudentVerificationEmail(studentEmail, token as string);

  if (!sent.ok) {
    return {
      message: `Student email saved, but the verification email could not be sent (${sent.error}). Use the link below or ask an admin.`,
      manualLink: `/student-email/confirm?token=${token}`,
    };
  }

  return {
    message: `Verification email sent to ${studentEmail}. Open the link within 24 hours to unlock selling.`,
  };
}

export async function resendStudentVerificationAction(
  _prevState: ProfileSettingsState,
  _formData: FormData
): Promise<ProfileSettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("student_email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.student_email) {
    return { message: "Link a student email first." };
  }

  return issueAndSendVerification(supabase, profile.student_email);
}

export async function updateProfileAvatarAction(
  _prevState: ProfileSettingsState,
  formData: FormData
): Promise<ProfileSettingsState> {
  const parsed = avatarSchema.safeParse({
    avatarUrl: formData.get("avatarUrl"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "You must be signed in to update your avatar." };
  }

  const { data: updatedProfile, error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: parsed.data.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (profileError) {
    return { message: `Avatar update failed: ${profileError.message}` };
  }

  if (!updatedProfile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "CampusCart User",
      phone: (user.user_metadata?.phone as string | undefined) ?? null,
      avatar_url: parsed.data.avatarUrl,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      return {
        message:
          "Avatar update failed: Profile row missing and insert was blocked by RLS. Add an INSERT policy like with check (auth.uid() = id).",
      };
    }
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: parsed.data.avatarUrl },
  });

  if (authError) {
    return { message: `Avatar saved, but auth profile sync failed: ${authError.message}` };
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/profile/settings");

  return { message: "Profile avatar updated." };
}

export async function linkStudentEmailAction(
  _prevState: ProfileSettingsState,
  formData: FormData
): Promise<ProfileSettingsState> {
  const parsed = studentEmailSchema.safeParse({
    studentEmail: formData.get("studentEmail"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "You must be signed in to link a student email." };
  }

  if (parsed.data.studentEmail === user.email?.toLowerCase()) {
    return {
      message:
        "Use your university student email here, not the same personal email already used on the account.",
    };
  }

  const { data: existingEmailOwner, error: existingEmailOwnerError } = await supabase
    .from("profiles")
    .select("id")
    .eq("student_email", parsed.data.studentEmail)
    .neq("id", user.id)
    .maybeSingle();

  if (existingEmailOwnerError) {
    return { message: `We could not check that student email: ${existingEmailOwnerError.message}` };
  }

  if (existingEmailOwner) {
    return { message: "That student email is already linked to another CampusCart account." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      // is_verified_student / student_email_verified_at are cleared by the
      // profiles_reset_verification_on_email_change trigger — they are not
      // writable by the authenticated role.
      student_email: parsed.data.studentEmail,
      student_email_requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { message: `Could not save student email: ${updateError.message}` };
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/profile/settings");
  revalidatePath("/sell");

  return issueAndSendVerification(supabase, parsed.data.studentEmail);
}


/**
 * Web sign-up treats the phone as optional and there was no way to add one
 * afterwards, so web-only sellers had no WhatsApp or call button on their
 * listings at all. Normalised to +260 E.164 so it matches what mobile stores.
 */
export async function updatePhoneAction(
  _prevState: ProfileSettingsState,
  formData: FormData
): Promise<ProfileSettingsState> {
  const parsed = phoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const normalized = normalizeZambiaPhoneForStorage(parsed.data.phone);
  if (!normalized) {
    return {
      errors: {
        phone: ["Enter a valid Zambian mobile number, e.g. 097 123 4567 or 077 123 4567."],
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "You must be signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ phone: normalized, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { message: `Could not save your phone number: ${error.message}` };

  revalidatePath("/profile/settings");
  revalidatePath(`/profile/${user.id}`);
  return { message: `Phone number saved as ${normalized}.` };
}
