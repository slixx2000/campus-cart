import React, { useMemo, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { FilterChips } from '../components/FilterChips';
import { ListingCard } from '../components/ListingCard';
import { SearchBar } from '../components/SearchBar';
import { SectionHeader } from '../components/SectionHeader';
import { useStyles, useTheme } from '../lib/styles';
import type { Listing } from '../types';

type Props = {
  featuredListings?: Listing[];
  nearbyListings?: Listing[];
  onOpenListing: (listing: Listing) => void;
  onBrowsePress: () => void;
  onSellPress: () => void;
  onCategoryPress: (category: string) => void;
  onSearchSubmit: (query: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Shown wherever a section has nothing in it yet. Local because it is three
 *  call sites in one file. */
function EmptySection({ onBrowsePress }: { onBrowsePress: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Nothing here yet</Text>
      <Text style={styles.emptyBody}>
        Listings from your campus will show up here as students post them.
      </Text>
      <Pressable onPress={onBrowsePress} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Browse everything</Text>
      </Pressable>
    </View>
  );
}

export function HomeScreen({
  featuredListings = [],
  nearbyListings = [],
  onOpenListing,
  onBrowsePress,
  onSellPress,
  onCategoryPress,
  onSearchSubmit,
  refreshing,
  onRefresh,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [freshVisibleCount, setFreshVisibleCount] = useState(10);

  // ListingCard takes a domain Listing and formats it itself, so there is no
  // view-model mapping step any more — which is also how the old screen's
  // invented `rating` and `distance` values disappear.
  const recommended = useMemo(() => nearbyListings.slice(0, 6), [nearbyListings]);
  const visibleFresh = useMemo(
    () => nearbyListings.slice(0, freshVisibleCount),
    [nearbyListings, freshVisibleCount],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 240 && freshVisibleCount < nearbyListings.length) {
      setFreshVisibleCount((current) => Math.min(current + 8, nearbyListings.length));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.screenContent}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.muted}
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={onSearchSubmit}
          placeholder="Search textbooks, electronics..."
        />

        <FilterChips
          active={activeChip}
          onSelect={(chip) => {
            setActiveChip(chip);
            if (chip !== 'All') onCategoryPress(chip);
          }}
        />

        <View style={styles.homeActionRow}>
          <Pressable
            onPress={onBrowsePress}
            accessibilityRole="button"
            style={[styles.primaryButton, styles.homeActionButton]}
          >
            <Text style={styles.primaryButtonText}>Browse listings</Text>
          </Pressable>
          <Pressable
            onPress={onSellPress}
            accessibilityRole="button"
            style={[styles.secondaryButton, styles.homeActionButton]}
          >
            <Text style={styles.secondaryButtonText}>Sell an item</Text>
          </Pressable>
        </View>

        <View>
          <SectionHeader
            title="Featured"
            body="Paid placements from student sellers."
            rightLabel={featuredListings.length ? `${featuredListings.length} live` : undefined}
          />
          {featuredListings.length === 0 ? (
            <EmptySection onBrowsePress={onBrowsePress} />
          ) : (
            <FeaturedCarousel items={featuredListings} onPressItem={onOpenListing} />
          )}
        </View>

        <View>
          <SectionHeader title="Near you" body="Listings from your campus." />
          {recommended.length === 0 ? (
            <EmptySection onBrowsePress={onBrowsePress} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommended.map((listing) => (
                <ListingCard
                  key={`near-${listing.id}`}
                  listing={listing}
                  compact
                  homeTight
                  onPress={() => onOpenListing(listing)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        <View>
          <SectionHeader title="Fresh on campus" body="Recently posted deals and services." />
          {visibleFresh.length === 0 ? (
            <EmptySection onBrowsePress={onBrowsePress} />
          ) : (
            <View style={styles.homeGrid}>
              {visibleFresh.map((listing) => (
                <View key={`fresh-${listing.id}`} style={styles.homeGridItem}>
                  <ListingCard
                    listing={listing}
                    homeTight
                    onPress={() => onOpenListing(listing)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
