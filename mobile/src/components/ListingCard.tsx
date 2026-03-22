import { Image } from 'expo-image';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatPrice, relativeDate } from '../lib/format';
import { styles } from '../lib/styles';
import type { Listing } from '../types';

export function ListingCard({
  listing,
  onPress,
  canFavorite,
  isFavorite,
  onToggleFavorite,
}: {
  listing: Listing;
  onPress: () => void;
  canFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardImageWrap}>
        <Image source={{ uri: listing.images[0] }} style={styles.cardImage} contentFit="cover" />
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
      <View style={styles.cardContent}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardCategory}>{listing.category}</Text>
          <Text style={styles.cardPrice}>{formatPrice(listing.price)}</Text>
        </View>
        <Text style={styles.cardTitle}>{listing.title}</Text>
        <Text style={styles.cardMeta}>{listing.university}</Text>
        <View style={styles.trustRow}>
          {listing.sellerVerified ? (
            <View style={styles.trustPill}>
              <Text style={styles.trustPillText}>Verified Student</Text>
            </View>
          ) : null}
          {listing.sellerPioneer ? (
            <View style={styles.trustPill}>
              <Text style={styles.trustPillText}>Pioneer Seller</Text>
            </View>
          ) : null}
          {listing.isService ? (
            <View style={styles.trustPill}>
              <Text style={styles.trustPillText}>Service</Text>
            </View>
          ) : listing.condition ? (
            <View style={styles.trustPill}>
              <Text style={styles.trustPillText}>{listing.condition}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardDescription} numberOfLines={2}>{listing.description}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.cardSeller}>{listing.sellerName}</Text>
          <Text style={styles.cardDate}>{relativeDate(listing.lastBumpedAt || listing.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
