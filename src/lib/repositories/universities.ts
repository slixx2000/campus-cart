import { createClient } from "@/lib/supabase/server";
import type { UniversityRow, CategoryRow } from "@/types/database";

export async function getAllUniversities(): Promise<UniversityRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("universities")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data as UniversityRow[]) ?? [];
}

export async function getAllCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data as CategoryRow[]) ?? [];
}

export async function getUniversityById(
  id: string
): Promise<UniversityRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("universities")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as UniversityRow;
}

export async function getCategoryBySlug(
  slug: string
): Promise<CategoryRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as CategoryRow;
}
