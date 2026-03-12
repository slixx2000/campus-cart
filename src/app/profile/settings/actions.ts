"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const avatarSchema = z.object({
  avatarUrl: z.string().url("Invalid avatar URL"),
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

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      avatar_url: parsed.data.avatarUrl,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    return { message: `Avatar update failed: ${profileError.message}` };
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
