import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FallbackImage } from './FallbackImage';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { formatPrice, relativeDate } from '../lib/format';
import { styles } from '../lib/styles';
import type { Listing } from '../types';

export function ListingCard({
  listing,
  onPress,
  compact,
  homeTight,
  canFavorite,
  isFavorite,
  onToggleFavorite,
  onMessagePress,
}: {
  listing: Listing;
  onPress: () => void;
  compact?: boolean;
  homeTight?: boolean;
  canFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onMessagePress?: () => void;
}) {
  const titleLines = compact ? 1 : 2;
  const useHomeTight = compact && homeTight;

  return (
    <Pressable style={[styles.card, compact && styles.cardCompact, useHomeTight && styles.cardHomeTight]} onPress={onPress}>
      <View style={styles.cardImageWrap}>
        <FallbackImage
          uri={listing.images[0]}
          fallbackUri={PLACEHOLDER_IMAGE}
          style={[styles.cardImage, compact && styles.cardImageCompact, useHomeTight && styles.cardImageHomeTight]}
          contentFit="cover"
        />
        <View style={styles.cardTopActions}>
          {canFavorite && onToggleFavorite ? (
            <Pressable
              style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
              onPress={onToggleFavorite}
            >
              <Text style={styles.favoriteButtonText}>{isFavorite ? '♥' : '♡'}</Text>
            </Pressable>
          ) : null}
        </View>
        {onMessagePress ? (
          <Pressable style={styles.cardImageMessageButton} onPress={onMessagePress}>
            <Text style={styles.cardImageMessageButtonText}>Message</Text>
          </Pressable>
        ) : null}
        {listing.images.length > 1 ? (
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountBadgeText}>{listing.images.length} photos</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.cardContent, useHomeTight && styles.cardContentHomeTight]}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardConditionLabel}>{listing.isService ? 'Service' : (listing.condition || 'Used')}</Text>
          <Text style={[styles.cardPrice, compact && styles.cardPriceCompact, useHomeTight && styles.cardPriceHomeTight]}>{formatPrice(listing.price)}</Text>
        </View>
        <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, useHomeTight && styles.cardTitleHomeTight]} numberOfLines={titleLines}>
          {listing.title}
        </Text>
        <View style={styles.cardMetaLine}>
          <View style={styles.cardMetaLineLeft}>
            {listing.sellerVerified ? (
              <View style={styles.cardVerifiedBadge}>
                <Text style={styles.cardVerifiedBadgeText}>✓</Text>
              </View>
            ) : null}
            <Text style={[styles.cardSeller, useHomeTight && styles.cardSellerHomeTight]} numberOfLines={1}>{listing.sellerName}</Text>
          </View>
          <Text style={[styles.cardDate, useHomeTight && styles.cardDateHomeTight]}>{relativeDate(listing.lastBumpedAt || listing.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
