import React from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { SectionHeader } from '../components/SectionHeader';
import { CATEGORY_OPTIONS } from '../lib/constants';
import { styles } from '../lib/styles';
import type { Listing } from '../types';

type Props = {
  query: string;
  selectedCategory: string;
  favoritesOnly: boolean;
  favoriteCount: number;
  setQuery: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  setFavoritesOnly: (value: boolean) => void;
  listings: Listing[];
  favoriteIds: string[];
  canFavorite: boolean;
  onToggleFavorite: (listingId: string) => void;
  onOpenListing: (listing: Listing) => void;
};

export function BrowseScreen({
  query,
  selectedCategory,
  favoritesOnly,
  favoriteCount,
  setQuery,
  setSelectedCategory,
  setFavoritesOnly,
  listings,
  favoriteIds,
  canFavorite,
  onToggleFavorite,
  onOpenListing,
}: Props) {
  return (
    <View style={styles.screenContent}>
      <SectionHeader
        eyebrow="Marketplace feed"
        title="Browse"
        body="Search listings, narrow by category, and jump into item details without leaving the page flow."
        rightLabel={`${listings.length} live`}
      />
      <TextInput
        style={styles.input}
        placeholder="Search textbooks, phones, services…"
        placeholderTextColor="#64748b"
        value={query}
        onChangeText={setQuery}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalStrip}>
        <Pressable
          onPress={() => setFavoritesOnly(false)}
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

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, gap: 14 }}
        renderItem={({ item }) => (
          <ListingCard
            listing={item}
            onPress={() => onOpenListing(item)}
            canFavorite={canFavorite}
            isFavorite={favoriteIds.includes(item.id)}
            onToggleFavorite={() => onToggleFavorite(item.id)}
          />
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
