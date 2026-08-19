import { createClient } from "@/lib/supabase/server";

/**
 * The viewer's entire favourites set in one query, so server-rendered card
 * grids can be marked up without a lookup per card.
 */
export async function getFavoriteListingIds(
  userId: string | null | undefined
): Promise<Set<string>> {
  if (!userId) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);

  // A failed lookup should leave hearts empty, never break the page.
  if (error) return new Set();
  return new Set((data ?? []).map((row) => row.listing_id));
}
