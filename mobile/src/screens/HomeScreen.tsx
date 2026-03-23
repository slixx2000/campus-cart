import { Image } from 'expo-image';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { styles } from '../lib/styles';
import type { Listing } from '../types';
import { HomeListingGrid } from '../components/HomeListingGrid';

type Props = {
  featuredListings: Listing[];
  nearbyListings: Listing[];
  onOpenListing: (listing: Listing) => void;
  onBrowsePress: () => void;
  onSellPress: () => void;
  onCategoryPress: (category: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
};

export function HomeScreen({
  featuredListings,
  nearbyListings,
  onOpenListing,
  onBrowsePress,
  onSellPress,
  onCategoryPress,
  refreshing,
  onRefresh,
}: Props) {
  return (
    <ScrollView
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
    >
      <View style={styles.heroCardCompact}>
        <View style={styles.heroBrandRow}>
          <Image source={require('../../assets/icon.png')} style={styles.heroLogo} contentFit="cover" />
          <View>
            <Text style={styles.heroBrandTitle}>Campus Cart</Text>
            <Text style={styles.heroBrandSubtitle}>Student marketplace</Text>
          </View>
        </View>
        <View style={styles.heroButtonRow}>
          <Pressable style={styles.primaryButton} onPress={onBrowsePress}>
            <Text style={styles.primaryButtonText}>Browse listings</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onSellPress}>
            <Text style={styles.secondaryButtonText}>Sell item</Text>
          </Pressable>
        </View>
      </View>

      <HomeListingGrid 
        title="Featured Listings" 
        listings={featuredListings} 
        onOpenListing={onOpenListing}
        onViewMore={onBrowsePress}
      />
      <HomeListingGrid 
        title="Fresh on Campus" 
        listings={nearbyListings} 
        onOpenListing={onOpenListing}
        onViewMore={onBrowsePress}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalStrip}>
        {['Electronics', 'Books & Stationery', 'Food & Drinks', 'Services', 'Tutoring', 'Home & Dorm'].map((item) => (
          <Pressable key={item} onPress={() => onCategoryPress(item)} style={styles.homeCategoryChip}>
            <Text style={styles.homeCategoryChipText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScrollView>
  );
}
