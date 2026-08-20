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

/** The subset of a profile that is safe to show to anyone, including visitors. */
export type PublicProfile = Pick<
  ProfileRow,
  | "id"
  | "full_name"
  | "avatar_url"
  | "university_id"
  | "is_verified_student"
  | "is_pioneer_seller"
  | "created_at"
>;

const PUBLIC_PROFILE_COLUMNS =
  "id, full_name, avatar_url, university_id, is_verified_student, is_pioneer_seller, created_at";

/**
 * Another user's profile, as shown on seller and profile pages.
 *
 * Explicit columns rather than `select("*")`: `*` requires privileges on every
 * column, so it breaks the moment a sensitive column is revoked — and it was
 * shipping `phone` and `student_email` to anyone viewing a listing.
 */
export async function getProfileById(
  id: string
): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as PublicProfile;
}

export async function upsertProfile(
  profile: Partial<ProfileRow> & { id: string }
): Promise<ProfileRow> {
  const supabase = await createClient();
  const payload = { ...profile, updated_at: new Date().toISOString() };
  const { ...updatePayload } = payload;

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

/**
 * The signed-in user's own profile, including private fields (phone, student
 * email, verification notes) that `getProfileById` deliberately omits.
 *
 * Note this reads `*`: column privileges are role-wide, not row-aware, so if
 * `phone` is ever revoked from `authenticated` as well as `anon`, this needs to
 * move behind a `security definer` my_profile() function.
 */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error) return null;
  return data as ProfileRow;
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
    // university_id is deliberately absent, for the same reason as
    // is_verified_student below: this function never derives it. handle_new_user
    // sets it from the email domain, and the mobile profile editor sets it by
    // hand. Including it meant any failed read of the existing row silently
    // cleared the user's university on their next sign-in.
    avatar_url: fallbackAvatar,
    // is_verified_student is deliberately absent: it is not writable by the
    // authenticated role (migration 20260819091000). handle_new_user seeds it,
    // and only the admin/verification definer functions may change it.
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
