"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/repositories/profiles";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  redirectTo: z.string().optional(),
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  defaultAvatarUrl: z.string().url().optional(),
  redirectTo: z.string().optional(),
});

export type AuthState = {
  errors?: Partial<Record<string, string[]>>;
  message?: string;
};

export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { message: error.message };

  if (data.user) {
    await ensureProfileForUser(data.user, supabase);
  }

  redirect(parsed.data.redirectTo ?? "/");
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    defaultAvatarUrl: formData.get("defaultAvatarUrl") || undefined,
    redirectTo: formData.get("redirectTo") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const avatarFile = formData.get("avatarFile");
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? null,
        avatar_url: parsed.data.defaultAvatarUrl ?? null,
      },
    },
  });

  if (error) return { message: error.message };

  if (data.user && avatarFile instanceof File && avatarFile.size > 0 && data.session) {
    const storagePath = `${data.user.id}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(storagePath, avatarFile, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: true,
      });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(storagePath);

      await supabase.auth.updateUser({
        data: {
          full_name: parsed.data.fullName,
          phone: parsed.data.phone ?? null,
          avatar_url: publicUrl,
        },
      });
    }
  }

  return {
    message:
      "Account created! Check your email to confirm your address before signing in.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
