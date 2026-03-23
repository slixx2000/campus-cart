import React from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { CATEGORY_OPTIONS } from '../lib/constants';
import { styles } from '../lib/styles';
import type { Listing } from '../types';

type Props = {
  query: string;
  selectedCategory: string;
  listingType: 'all' | 'products' | 'services';
  maxPrice: string;
  sortBy: 'newest' | 'price-asc' | 'price-desc';
  favoritesOnly: boolean;
  favoriteCount: number;
  setQuery: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  setListingType: (value: 'all' | 'products' | 'services') => void;
  setMaxPrice: (value: string) => void;
  setSortBy: (value: 'newest' | 'price-asc' | 'price-desc') => void;
  setFavoritesOnly: (value: boolean) => void;
  listings: Listing[];
  favoriteIds: string[];
  canFavorite: boolean;
  onToggleFavorite: (listingId: string) => void;
  onOpenListing: (listing: Listing) => void;
  refreshing: boolean;
  onRefresh: () => void;
};

export function BrowseScreen({
  query,
  selectedCategory,
  listingType,
  maxPrice,
  sortBy,
  favoritesOnly,
  favoriteCount,
  setQuery,
  setSelectedCategory,
  setListingType,
  setMaxPrice,
  setSortBy,
  setFavoritesOnly,
  listings,
  favoriteIds,
  canFavorite,
  onToggleFavorite,
  onOpenListing,
  refreshing,
  onRefresh,
}: Props) {
  const header = (
    <View style={styles.browseHeaderSection}>
      <TextInput
        style={styles.input}
        placeholder="Search textbooks, phones, services..."
        placeholderTextColor="#64748b"
        value={query}
        onChangeText={setQuery}
      />
      <View style={styles.formSection}>
        <Text style={styles.fieldLabel}>Listing type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStripContent}>
          <Pressable onPress={() => setListingType('all')} style={[styles.chip, listingType === 'all' && styles.chipActive]}>
            <Text style={[styles.chipText, listingType === 'all' && styles.chipTextActive]}>All</Text>
          </Pressable>
          <Pressable onPress={() => setListingType('products')} style={[styles.chip, listingType === 'products' && styles.chipActive]}>
            <Text style={[styles.chipText, listingType === 'products' && styles.chipTextActive]}>Products</Text>
          </Pressable>
          <Pressable onPress={() => setListingType('services')} style={[styles.chip, listingType === 'services' && styles.chipActive]}>
            <Text style={[styles.chipText, listingType === 'services' && styles.chipTextActive]}>Services</Text>
          </Pressable>
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder="Max price (ZMW)"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={maxPrice}
          onChangeText={setMaxPrice}
        />

        <Text style={styles.fieldLabel}>Sort by</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStripContent}>
          <Pressable onPress={() => setSortBy('newest')} style={[styles.chip, sortBy === 'newest' && styles.chipActive]}>
            <Text style={[styles.chipText, sortBy === 'newest' && styles.chipTextActive]}>Newest</Text>
          </Pressable>
          <Pressable onPress={() => setSortBy('price-asc')} style={[styles.chip, sortBy === 'price-asc' && styles.chipActive]}>
            <Text style={[styles.chipText, sortBy === 'price-asc' && styles.chipTextActive]}>Price: Low to High</Text>
          </Pressable>
          <Pressable onPress={() => setSortBy('price-desc')} style={[styles.chip, sortBy === 'price-desc' && styles.chipActive]}>
            <Text style={[styles.chipText, sortBy === 'price-desc' && styles.chipTextActive]}>Price: High to Low</Text>
          </Pressable>
        </ScrollView>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStripContent}>
        <Pressable
          onPress={() => {
            setFavoritesOnly(false);
            setSelectedCategory('All');
          }}
          style={[styles.chip, !favoritesOnly && selectedCategory === 'All' && styles.chipActive]}
        >
          <Text style={[styles.chipText, !favoritesOnly && selectedCategory === 'All' && styles.chipTextActive]}>All</Text>
        </Pressable>
        <Pressable
          onPress={() => setFavoritesOnly(true)}
          style={[styles.chip, favoritesOnly && styles.chipActive]}
        >
          <Text style={[styles.chipText, favoritesOnly && styles.chipTextActive]}>Favorites {favoriteCount ? `(${favoriteCount})` : ''}</Text>
        </Pressable>
        {CATEGORY_OPTIONS.map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setFavoritesOnly(false);
              setSelectedCategory(item);
            }}
            style={[styles.chip, !favoritesOnly && selectedCategory === item && styles.chipActive]}
          >
            <Text style={[styles.chipText, !favoritesOnly && selectedCategory === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.screenContent}>
      <FlatList
        data={listings}
        ListHeaderComponent={header}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
        columnWrapperStyle={styles.browseGridRow}
        contentContainerStyle={styles.browseListContent}
        renderItem={({ item }) => (
          <View style={styles.browseGridItem}>
            <ListingCard
              listing={item}
              compact
              onPress={() => onOpenListing(item)}
              canFavorite={canFavorite}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{favoritesOnly ? 'No saved listings yet' : 'No listings found'}</Text>
            <Text style={styles.emptyBody}>{favoritesOnly ? 'Tap the heart on listings you want to revisit later.' : 'Try a different search or category.'}</Text>
          </View>
        }
      />
    </View>
  );
}
