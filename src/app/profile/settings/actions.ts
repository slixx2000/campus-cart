"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const avatarSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL"),
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
};

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
      student_email: parsed.data.studentEmail,
      student_email_requested_at: new Date().toISOString(),
      student_email_verified_at: null,
      is_verified_student: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { message: `Could not save student email: ${updateError.message}` };
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/profile/settings");
  revalidatePath("/sell");

  return {
    message:
      "Student email linked to your account. Mark it verified in your admin/backend approval flow to unlock selling.",
  };
}
