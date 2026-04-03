import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { FallbackImage } from '../components/FallbackImage';
import { SectionHeader } from '../components/SectionHeader';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { relativeDate } from '../lib/format';
import { styles } from '../lib/styles';
import type { Listing, Profile, SellerRatingSummary, SellerReview } from '../types';

export function SellerProfileScreen({
  seller,
  universityName,
  listings,
  canFavorite,
  favoriteIds,
  currentUserId,
  canReview,
  reviewSubmitting,
  reviews,
  ratingSummary,
  onSubmitReview,
  onOpenListing,
  onToggleFavorite,
  onShowFeedback,
}: {
  seller: Profile | null;
  universityName?: string;
  listings: Listing[];
  canFavorite: boolean;
  favoriteIds: string[];
  currentUserId?: string;
  canReview: boolean;
  reviewSubmitting: boolean;
  reviews: SellerReview[];
  ratingSummary: SellerRatingSummary;
  onSubmitReview: (payload: { rating: number; reviewText: string }) => Promise<void>;
  onOpenListing: (listing: Listing) => void;
  onToggleFavorite: (listingId: string) => void;
  onShowFeedback: (title: string, message: string) => void;
}) {
  const activeListings = listings.filter((listing) => listing.status !== 'sold');
  const soldCount = listings.filter((listing) => listing.status === 'sold').length;
  const [draftRating, setDraftRating] = useState(5);
  const [draftReview, setDraftReview] = useState('');

  const ratingStars = ratingSummary.averageRating
    ? `${'★'.repeat(Math.round(ratingSummary.averageRating))}${'☆'.repeat(5 - Math.round(ratingSummary.averageRating))}`
    : '☆☆☆☆☆';
  
  const handleContactSeller = () => {
    if (!seller?.phone) {
      onShowFeedback('Phone not available', 'This seller has not shared their phone number publicly yet. Use in-app chat to contact them.');
      return;
    }
    onShowFeedback('Contact seller', `You can reach this seller at ${seller.phone} or use in-app chat.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHeader
        eyebrow="Seller"
        title={seller?.full_name || 'Campus Cart seller'}
        body="See who you’re dealing with, what they’re selling, and the trust signals behind the profile."
      />

      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <FallbackImage
            uri={seller?.avatar_url}
            fallbackUri={PLACEHOLDER_IMAGE}
            style={styles.avatarLarge}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{seller?.full_name || 'Seller'}</Text>
            <Text style={styles.profileMeta}>{universityName || 'University not linked'}</Text>
            <Text style={styles.profileMeta}>{seller?.phone || 'Phone not shared publicly yet'}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          {seller?.is_verified_student ? (
            <View style={[styles.badge, styles.badgeVerified]}>
              <Text style={styles.badgeText}>Verified student</Text>
            </View>
          ) : null}
          {seller?.is_pioneer_seller ? (
            <View style={[styles.badge, { backgroundColor: '#78350f' }]}>
              <Text style={styles.badgeText}>Pioneer seller</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.miniStatRow}>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatValue}>{activeListings.length}</Text>
            <Text style={styles.miniStatLabel}>active listings</Text>
          </View>
          <View style={styles.miniStatCard}>
            <Text style={styles.miniStatValue}>{soldCount}</Text>
            <Text style={styles.miniStatLabel}>items sold</Text>
          </View>
        </View>

        {/* Premium Features Section */}
        <Pressable 
          style={styles.profileContactButton}
          onPress={handleContactSeller}
        >
          <Text style={styles.profileContactButtonText}>💬 Message seller</Text>
        </Pressable>

        {/* Response & Member Metrics */}
        <View style={styles.profileMetricsRow}>
          <View style={styles.profileMetricItem}>
            <Text style={styles.profileMetricValue}>{ratingSummary.averageRating ? ratingSummary.averageRating.toFixed(1) : '--'}</Text>
            <Text style={styles.profileMetricLabel}>Avg rating</Text>
          </View>
          <View style={styles.profileMetricItem}>
            <Text style={styles.profileMetricValue}>{ratingSummary.totalReviews}</Text>
            <Text style={styles.profileMetricLabel}>Reviews</Text>
          </View>
          <View style={styles.profileMetricItem}>
            <Text style={styles.profileMetricValue}>{ratingStars}</Text>
            <Text style={styles.profileMetricLabel}>Stars</Text>
          </View>
        </View>

        {/* Seller About Section */}
        <View style={styles.profileAboutCard}>
          <Text style={styles.profileAboutLabel}>About this seller</Text>
          <Text style={styles.profileAboutText}>
            {seller?.is_verified_student ? '✓ Verified student • ' : ''}
            {seller?.is_pioneer_seller ? '👑 Early supporter • ' : ''}
            Trusted member of the Campus Cart community. Quick response times and fair deals.
          </Text>
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Ratings overview</Text>
        <Text style={styles.statusBody}>
          {ratingSummary.totalReviews > 0
            ? `Based on ${ratingSummary.totalReviews} review${ratingSummary.totalReviews === 1 ? '' : 's'}: ${ratingSummary.averageRating.toFixed(1)}/5.`
            : 'No ratings yet. Be the first to leave feedback after your interaction.'}
        </Text>
      </View>

      {canReview ? (
        <View style={styles.helperCard}>
          <Text style={styles.helperCardTitle}>Leave a review</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setDraftRating(star)}
                style={{ paddingVertical: 6, paddingHorizontal: 2 }}
              >
                <Text style={{ fontSize: 24, color: star <= draftRating ? '#fbbf24' : '#475569' }}>★</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            multiline
            placeholder="Share your experience with this seller"
            placeholderTextColor="#64748b"
            value={draftReview}
            onChangeText={setDraftReview}
          />
          <Pressable
            style={styles.primaryButton}
            disabled={reviewSubmitting}
            onPress={async () => {
              try {
                await onSubmitReview({ rating: draftRating, reviewText: draftReview });
                setDraftReview('');
              } catch (error) {
                onShowFeedback('Could not submit review', error instanceof Error ? error.message : 'Please try again.');
              }
            }}
          >
            {reviewSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit review</Text>}
          </Pressable>
        </View>
      ) : null}

      <View style={styles.helperCard}>
        <Text style={styles.helperCardTitle}>Recent reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.helperText}>No reviews yet.</Text>
        ) : (
          reviews.map((review) => {
            const isMine = review.reviewerId === currentUserId;
            return (
              <View key={review.id} style={[styles.sellerListingCard, { marginTop: 8 }]}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sellerListingTitle}>{review.reviewerName}{isMine ? ' (You)' : ''}</Text>
                  <Text style={styles.cardDate}>{relativeDate(review.createdAt)}</Text>
                </View>
                <Text style={{ color: '#fbbf24', fontSize: 16 }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
                {review.reviewText ? <Text style={styles.helperText}>{review.reviewText}</Text> : null}
              </View>
            );
          })
        )}
      </View>

      <SectionHeader
        eyebrow="Inventory"
        title="Other listings"
        body="These are the seller’s current items and services on Campus Cart."
        rightLabel={`${activeListings.length} live`}
      />

      {activeListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active listings</Text>
          <Text style={styles.emptyBody}>This seller doesn’t have any other live listings right now.</Text>
        </View>
      ) : (
        activeListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onPress={() => onOpenListing(listing)}
            canFavorite={canFavorite}
            isFavorite={favoriteIds.includes(listing.id)}
            onToggleFavorite={() => onToggleFavorite(listing.id)}
          />
        ))
      )}
    </ScrollView>
  );
}
