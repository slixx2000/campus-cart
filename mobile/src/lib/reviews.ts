import { supabase } from './supabase';
import type { SellerRatingSummary, SellerReview } from '../types';

function buildSummary(rows: Array<{ rating: number }>): SellerRatingSummary {
  const distribution: SellerRatingSummary['distribution'] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const row of rows) {
    const key = Math.min(5, Math.max(1, row.rating)) as 1 | 2 | 3 | 4 | 5;
    distribution[key] += 1;
  }

  const totalReviews = rows.length;
  const averageRating =
    totalReviews === 0
      ? 0
      : Number((rows.reduce((sum, row) => sum + row.rating, 0) / totalReviews).toFixed(2));

  return { averageRating, totalReviews, distribution };
}

export async function getSellerReviews(
  sellerId: string
): Promise<{ reviews: SellerReview[]; summary: SellerRatingSummary }> {
  const { data, error } = await supabase
    .from('seller_reviews')
    .select('id, seller_id, reviewer_id, listing_id, rating, review_text, created_at, profiles!seller_reviews_reviewer_id_fkey(full_name, avatar_url)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const reviews: SellerReview[] = ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    sellerId: row.seller_id,
    reviewerId: row.reviewer_id,
    reviewerName: row.profiles?.full_name ?? 'CampusCart User',
    reviewerAvatarUrl: row.profiles?.avatar_url ?? null,
    listingId: row.listing_id,
    rating: row.rating,
    reviewText: row.review_text,
    createdAt: row.created_at,
  }));

  return { reviews, summary: buildSummary(reviews) };
}

export async function upsertSellerReview(input: {
  sellerId: string;
  reviewerId: string;
  rating: number;
  reviewText?: string;
  listingId?: string;
}): Promise<void> {
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be from 1 to 5');
  }

  if (input.sellerId === input.reviewerId) {
    throw new Error('You cannot review yourself');
  }

  const { error } = await supabase.from('seller_reviews').upsert(
    {
      seller_id: input.sellerId,
      reviewer_id: input.reviewerId,
      listing_id: input.listingId ?? null,
      rating,
      review_text: input.reviewText?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'seller_id,reviewer_id' }
  );

  if (error) {
    throw new Error(error.message);
  }
}
