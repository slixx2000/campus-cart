import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, Text, UIManager, View } from 'react-native';
import FeaturedEmptyState from '../components/FeaturedEmptyState';
import FeaturedCarousel from '../components/FeaturedCarousel';
import FilterChips from '../components/FilterChips';
import ListingCard from '../components/ListingCard.js';
import { relativeDate } from '../lib/format';
import SearchBar from '../components/SearchBar';
import SectionHeader from '../components/SectionHeader.js';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const mapListing = (listing) => ({
  id: listing.id,
  title: listing.title,
  price: `K ${Number(listing.price || 0).toLocaleString()}`,
  condition: listing.condition || (listing.isService ? 'Service' : 'Used'),
  featured: Boolean(listing.featured),
  seller: listing.sellerName || 'Campus Seller',
  rating: '4.8',
  verified: Boolean(listing.sellerVerified),
  location: listing.university || 'Campus',
  distance: '0.5 km',
  timeAgo: relativeDate(listing.lastBumpedAt || listing.createdAt),
  image: listing.images?.[0] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900',
  avatar: listing.sellerAvatarUrl || 'https://i.pravatar.cc/100?img=5',
  raw: listing,
});

export default function HomeScreen({
  featuredListings = [],
  nearbyListings = [],
  onOpenListing,
  onBrowsePress,
  onSellPress,
  onCategoryPress,
  onFilterPress,
  refreshing,
  onRefresh,
}) {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [freshVisibleCount, setFreshVisibleCount] = useState(10);

  const featured = useMemo(() => {
    if (featuredListings.length > 0) return featuredListings.map(mapListing);
    return [];
  }, [featuredListings]);

  const recommended = useMemo(() => {
    return nearbyListings.map(mapListing).slice(0, 6);
  }, [nearbyListings]);

  const fresh = useMemo(() => {
    return nearbyListings.map(mapListing);
  }, [nearbyListings]);

  const visibleFresh = useMemo(() => fresh.slice(0, freshVisibleCount), [fresh, freshVisibleCount]);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (distanceFromBottom < 240 && freshVisibleCount < fresh.length) {
      setFreshVisibleCount((current) => Math.min(current + 8, fresh.length));
    }
  };

  const openCard = (card) => {
    if (card.raw && onOpenListing) {
      onOpenListing(card.raw);
    }
  };

  const animateLayout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F1A]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 16 }}
        refreshControl={<RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor="#3B82F6" />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onFilterPress={() => {
            onFilterPress?.();
          }}
        />

        <View className="mt-4">
          <FilterChips
            activeChip={activeChip}
            onSelectChip={(chip) => {
              animateLayout();
              setActiveChip(chip);
              if (onCategoryPress && chip !== 'All' && chip !== 'Price Range' && chip !== 'Condition') {
                onCategoryPress(chip);
              }
            }}
          />
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={onBrowsePress}
            accessibilityRole="button"
            accessibilityLabel="Browse listings"
            className="h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600"
          >
            <Text className="font-semibold text-white">Browse listings</Text>
          </Pressable>
          <Pressable
            onPress={onSellPress}
            accessibilityRole="button"
            accessibilityLabel="Sell item"
            className="h-12 flex-1 items-center justify-center rounded-2xl border border-amber-400"
          >
            <Text className="font-semibold text-amber-300">Sell item</Text>
          </Pressable>
        </View>

        <View className="mt-6">
          <SectionHeader title="Featured Listings" subtitle="Top campus picks curated for trust and quality" rightLabel={`${featured.length} live`} />
          {featured.length === 0 ? (
            <FeaturedEmptyState onBrowsePress={onBrowsePress} />
          ) : (
            <FeaturedCarousel items={featured} onPressItem={openCard} />
          )}
        </View>

        <View className="mt-4">
          <SectionHeader title="Recommended for you" subtitle="Smart picks based on your campus activity" />
          {recommended.length === 0 ? (
            <FeaturedEmptyState onBrowsePress={onBrowsePress} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommended.map((item) => (
                <ListingCard key={`rec-${item.id}`} listing={item} compact homeTight onPress={() => openCard(item)} />
              ))}
            </ScrollView>
          )}
        </View>

        <View className="mt-4">
          <SectionHeader title="Fresh on Campus" subtitle="Recently posted deals and services" />
          <View className="h-10 flex-row items-center rounded-xl bg-[#111827] px-4">
            <MaterialIcons name="new-releases" size={16} color="#FBBF24" />
            <Text className="ml-2 text-sm text-gray-300">Updated in near real-time</Text>
          </View>
          <View className="mt-4 flex-row flex-wrap justify-between">
            {visibleFresh.length === 0 ? (
              <FeaturedEmptyState onBrowsePress={onBrowsePress} />
            ) : (
              visibleFresh.map((item) => (
                <View key={`fresh-${item.id}`} className="mb-3 w-[48%]">
                  <ListingCard listing={item} homeTight onPress={() => openCard(item)} />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
