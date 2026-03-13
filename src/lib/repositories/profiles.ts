import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

const PROFILE_IMAGE_BUCKET = "profile-images";
const DEFAULT_AVATAR_FOLDER = "profile-icons";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    phone?: string | null;
    avatar_url?: string | null;
  };
};

async function listDefaultAvatarUrlsWithClient(
  supabase: ServerSupabaseClient
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(DEFAULT_AVATAR_FOLDER, {
      limit: 20,
      sortBy: { column: "name", order: "asc" },
    });

  if (error) {
    return [];
  }

  return (data ?? [])
    .filter((file) => file.name)
    .map(
      (file) =>
        supabase.storage
          .from(PROFILE_IMAGE_BUCKET)
          .getPublicUrl(`${DEFAULT_AVATAR_FOLDER}/${file.name}`).data.publicUrl
    );
}

export async function getProfileById(
  id: string
): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ProfileRow;
}

export async function upsertProfile(
  profile: Partial<ProfileRow> & { id: string }
): Promise<ProfileRow> {
  const supabase = await createClient();
  const payload = { ...profile, updated_at: new Date().toISOString() };
  const { id, ...updatePayload } = payload;

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", profile.id)
    .select()
    .maybeSingle();

  if (updateError) throw new Error(updateError.message);
  if (updated) return updated as ProfileRow;

  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .insert(payload)
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);
  return inserted as ProfileRow;
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getProfileById(user.id);
}

export async function getDefaultAvatarUrls(): Promise<string[]> {
  const supabase = await createClient();
  return listDefaultAvatarUrlsWithClient(supabase);
}

export async function ensureProfileForUser(
  user: AuthUserLike,
  suppliedClient?: ServerSupabaseClient
): Promise<ProfileRow | null> {
  const supabase = suppliedClient ?? (await createClient());

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle() as { data: ProfileRow | null };

  const fallbackAvatar =
    existingProfile?.avatar_url ??
    user.user_metadata?.avatar_url ??
    (await listDefaultAvatarUrlsWithClient(supabase))[0] ??
    null;

  const fullName =
    user.user_metadata?.full_name ??
    existingProfile?.full_name ??
    user.email?.split("@")[0] ??
    "CampusCart User";

  const profilePayload: Partial<ProfileRow> & { id: string } = {
    id: user.id,
    full_name: fullName,
    phone: user.user_metadata?.phone ?? existingProfile?.phone ?? null,
    university_id: existingProfile?.university_id ?? null,
    avatar_url: fallbackAvatar,
    is_verified_student: existingProfile?.is_verified_student ?? false,
    created_at: existingProfile?.created_at,
    updated_at: new Date().toISOString(),
  };

  try {
    const data = await upsertProfile(profilePayload);
    return data;
  } catch {
    return null;
  }
}
