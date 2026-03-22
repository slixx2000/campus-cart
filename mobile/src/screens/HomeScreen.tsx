import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { styles } from '../lib/styles';
import type { Listing } from '../types';
import { ListingSection } from '../components/ListingSection';
import { SectionHeader } from '../components/SectionHeader';

type Props = {
  featuredListings: Listing[];
  nearbyListings: Listing[];
  onOpenListing: (listing: Listing) => void;
  onBrowsePress: () => void;
  onSellPress: () => void;
};

export function HomeScreen({
  featuredListings,
  nearbyListings,
  onOpenListing,
  onBrowsePress,
  onSellPress,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Your campus marketplace</Text>
        <Text style={styles.heroTitle}>Buy, sell, and discover trusted student deals.</Text>
        <Text style={styles.heroBody}>
          Browse with any email. Selling stays locked to verified students so the marketplace feels safer from day one.
        </Text>
        <View style={styles.heroButtonRow}>
          <Pressable style={styles.primaryButton} onPress={onBrowsePress}>
            <Text style={styles.primaryButtonText}>Browse listings</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onSellPress}>
            <Text style={styles.secondaryButtonText}>Sell item</Text>
          </Pressable>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{featuredListings.length}</Text>
            <Text style={styles.statLabel}>featured now</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{nearbyListings.length}</Text>
            <Text style={styles.statLabel}>fresh listings</Text>
          </View>
        </View>
      </View>

      <SectionHeader
        eyebrow="Quick explore"
        title="Featured Categories"
        body="Jump into the parts of Campus Cart students are most likely to browse first."
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalStrip}>
        {['Electronics', 'Books & Stationery', 'Food & Drinks', 'Services', 'Tutoring', 'Home & Dorm'].map((item) => (
          <View key={item} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
          </View>
        ))}
      </ScrollView>

      <ListingSection title="Featured Listings" listings={featuredListings} onOpenListing={onOpenListing} />
      <ListingSection title="Fresh on Campus" listings={nearbyListings} onOpenListing={onOpenListing} />
    </ScrollView>
  );
}
