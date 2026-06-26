import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { formatPrice, relativeDate } from '../lib/format';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { styles } from '../lib/styles';
import type { Listing } from '../types';
import { FallbackImage } from '../components/FallbackImage';

export function ListingDetailScreen({
  listing,
  onMessageSeller,
  canMessage,
  canFavorite,
  isFavorite,
  onToggleFavorite,
  onOpenSeller,
}: {
  listing: Listing;
  onMessageSeller?: () => void;
  canMessage?: boolean;
  canFavorite?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onOpenSeller?: () => void;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const images = useMemo(() => (listing.images.length > 0 ? listing.images : []), [listing.images]);

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      {canFavorite && onToggleFavorite ? (
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]} onPress={onToggleFavorite}>
            <Text style={styles.favoriteButtonText}>{isFavorite ? '♥' : '♡'}</Text>
          </Pressable>
        </View>
      ) : null}
      <FallbackImage
        uri={images[activeImage] || listing.images[0]}
        fallbackUri={PLACEHOLDER_IMAGE}
        style={styles.detailImage}
        contentFit="cover"
      />
      {images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.detailThumbRow}>
          {images.map((image, index) => (
            <Pressable key={`${image}-${index}`} onPress={() => setActiveImage(index)}>
              <FallbackImage
                uri={image}
                fallbackUri={PLACEHOLDER_IMAGE}
                style={styles.detailThumb}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <Text style={styles.detailCategory}>{listing.category}</Text>
      <Text style={styles.detailTitle}>{listing.title}</Text>
      <Text style={styles.detailPrice}>{formatPrice(listing.price)}</Text>
      <Text style={styles.detailMeta}>{listing.university}</Text>

      <View style={styles.detailMetaGrid}>
        {listing.sellerVerified ? (
          <View style={styles.detailMetaPill}>
            <Text style={styles.detailMetaPillText}>Verified Student</Text>
          </View>
        ) : null}
        {listing.sellerPioneer ? (
          <View style={styles.detailMetaPill}>
            <Text style={styles.detailMetaPillText}>Pioneer Seller</Text>
          </View>
        ) : null}
        {listing.isService ? (
          <View style={styles.detailMetaPill}>
            <Text style={styles.detailMetaPillText}>Service Listing</Text>
          </View>
        ) : null}
        {listing.condition ? (
          <View style={styles.detailMetaPill}>
            <Text style={styles.detailMetaPillText}>{listing.condition}</Text>
          </View>
        ) : null}
        <View style={styles.detailMetaPill}>
          <Text style={styles.detailMetaPillText}>{relativeDate(listing.lastBumpedAt || listing.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.detailBody}>{listing.description}</Text>

      {canMessage && onMessageSeller ? (
        <Pressable style={styles.primaryButton} onPress={onMessageSeller}>
          <Text style={styles.primaryButtonText}>Message Seller</Text>
        </Pressable>
      ) : null}

      <View style={styles.detailInfoCard}>
        <Text style={styles.infoLabel}>Seller</Text>
        {onOpenSeller ? (
          <Pressable onPress={onOpenSeller}>
            <Text style={styles.infoValue}>{listing.sellerName}</Text>
          </Pressable>
        ) : (
          <Text style={styles.infoValue}>{listing.sellerName}</Text>
        )}
        <Text style={styles.infoLabel}>Phone</Text>
        <Text style={styles.infoValue}>{listing.sellerPhone || 'Not provided yet'}</Text>
        <Text style={styles.infoLabel}>Views</Text>
        <Text style={styles.infoValue}>{listing.viewCount} people viewed this listing</Text>
        <Text style={styles.infoLabel}>Listed</Text>
        <Text style={styles.infoValue}>{new Date(listing.createdAt).toLocaleDateString('en-ZM')}</Text>
      </View>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>Safety tip</Text>
        <Text style={styles.noticeBody}>Meet in public, well-lit campus spaces and keep conversations inside verified channels where possible.</Text>
      </View>
    </ScrollView>
  );
}
