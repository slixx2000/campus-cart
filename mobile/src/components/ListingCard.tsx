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
}: {
  listing: Listing;
  onPress: () => void;
  compact?: boolean;
  homeTight?: boolean;
  canFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const titleLines = compact ? 2 : 3;
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
        {listing.images.length > 1 ? (
          <View style={styles.imageCountBadge}>
            <Text style={styles.imageCountBadgeText}>{listing.images.length} photos</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.cardContent, useHomeTight && styles.cardContentHomeTight]}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardCategory}>{listing.category}</Text>
          <Text style={[styles.cardPrice, compact && styles.cardPriceCompact, useHomeTight && styles.cardPriceHomeTight]}>{formatPrice(listing.price)}</Text>
        </View>
        <Text style={[styles.cardTitle, compact && styles.cardTitleCompact, useHomeTight && styles.cardTitleHomeTight]} numberOfLines={titleLines}>{listing.title}</Text>
        <Text style={[styles.cardMeta, useHomeTight && styles.cardMetaHomeTight]}>{listing.university}</Text>
        <View style={[styles.trustRow, compact && styles.trustRowCompact, useHomeTight && styles.trustRowHomeTight]}>
          {listing.sellerVerified ? (
            <View style={[styles.trustPill, useHomeTight && styles.trustPillHomeTight]}>
              <Text style={[styles.trustPillText, useHomeTight && styles.trustPillTextHomeTight]}>Verified Student</Text>
            </View>
          ) : null}
          {listing.sellerPioneer ? (
            <View style={[styles.trustPill, useHomeTight && styles.trustPillHomeTight]}>
              <Text style={[styles.trustPillText, useHomeTight && styles.trustPillTextHomeTight]}>Pioneer Seller</Text>
            </View>
          ) : null}
          {listing.isService ? (
            <View style={[styles.trustPill, useHomeTight && styles.trustPillHomeTight]}>
              <Text style={[styles.trustPillText, useHomeTight && styles.trustPillTextHomeTight]}>Service</Text>
            </View>
          ) : listing.condition ? (
            <View style={[styles.trustPill, useHomeTight && styles.trustPillHomeTight]}>
              <Text style={[styles.trustPillText, useHomeTight && styles.trustPillTextHomeTight]}>{listing.condition}</Text>
            </View>
          ) : null}
        </View>
        {!compact ? <Text style={styles.cardDescription} numberOfLines={2}>{listing.description}</Text> : null}
        <View style={[styles.rowBetween, compact && styles.cardFooterCompact]}>
          <Text style={[styles.cardSeller, useHomeTight && styles.cardSellerHomeTight]}>{listing.sellerName}</Text>
          <Text style={[styles.cardDate, useHomeTight && styles.cardDateHomeTight]}>{relativeDate(listing.lastBumpedAt || listing.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
