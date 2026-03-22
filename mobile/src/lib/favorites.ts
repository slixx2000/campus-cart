import { supabase } from './supabase';

export async function getFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => row.listing_id);
}

export async function toggleFavorite(userId: string, listingId: string, isFavorite: boolean) {
  if (isFavorite) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
    if (error) throw new Error(error.message);
    return false;
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, listing_id: listingId });
  if (error) throw new Error(error.message);
  return true;
}
