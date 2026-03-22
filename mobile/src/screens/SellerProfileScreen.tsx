import { Image } from 'expo-image';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { SectionHeader } from '../components/SectionHeader';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { styles } from '../lib/styles';
import type { Listing, Profile } from '../types';

export function SellerProfileScreen({
  seller,
  universityName,
  listings,
  canFavorite,
  favoriteIds,
  onOpenListing,
  onToggleFavorite,
}: {
  seller: Profile | null;
  universityName?: string;
  listings: Listing[];
  canFavorite: boolean;
  favoriteIds: string[];
  onOpenListing: (listing: Listing) => void;
  onToggleFavorite: (listingId: string) => void;
}) {
  const activeListings = listings.filter((listing) => listing.status !== 'sold');
  const soldCount = listings.filter((listing) => listing.status === 'sold').length;

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <SectionHeader
        eyebrow="Seller"
        title={seller?.full_name || 'Campus Cart seller'}
        body="See who you’re dealing with, what they’re selling, and the trust signals behind the profile."
      />

      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <Image source={{ uri: seller?.avatar_url || PLACEHOLDER_IMAGE }} style={styles.avatarLarge} contentFit="cover" />
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
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Seller note</Text>
        <Text style={styles.statusBody}>
          Check their other listings, use in-app chat, and meet in a safe public campus spot before completing a deal.
        </Text>
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
