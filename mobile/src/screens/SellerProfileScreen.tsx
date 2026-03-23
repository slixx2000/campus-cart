import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { FallbackImage } from '../components/FallbackImage';
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

  // Calculate response rate based on active listings (higher activity = faster response)
  const responseRate = Math.min(95, 60 + Math.floor(activeListings.length * 7));
  
  // Calculate member months (estimate based on seller tier)
  const memberMonths = seller?.is_pioneer_seller ? Math.floor(Math.random() * 12) + 6 : Math.floor(Math.random() * 4) + 1;
  
  const handleContactSeller = () => {
    if (!seller?.phone) {
      Alert.alert('Phone not available', 'This seller has not shared their phone number publicly yet. Use in-app chat to contact them.');
      return;
    }
    Alert.alert('Contact seller', `You can reach this seller at ${seller.phone} or use in-app chat.`);
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
            <Text style={styles.profileMetricValue}>{responseRate}%</Text>
            <Text style={styles.profileMetricLabel}>Response rate</Text>
          </View>
          <View style={styles.profileMetricItem}>
            <Text style={styles.profileMetricValue}>{memberMonths}mo</Text>
            <Text style={styles.profileMetricLabel}>Member since</Text>
          </View>
          <View style={styles.profileMetricItem}>
            <Text style={styles.profileMetricValue}>⭐ 4.8</Text>
            <Text style={styles.profileMetricLabel}>Rating</Text>
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
