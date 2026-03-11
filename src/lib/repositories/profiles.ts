import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/types/database";

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
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ ...profile, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ProfileRow;
}

export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return getProfileById(user.id);
}
