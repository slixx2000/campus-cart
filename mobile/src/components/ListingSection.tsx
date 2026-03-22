import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../lib/styles';
import type { Listing } from '../types';
import { ListingCard } from './ListingCard';

export function ListingSection({
  title,
  listings,
  onOpenListing,
}: {
  title: string;
  listings: Listing[];
  onOpenListing: (listing: Listing) => void;
}) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyBody}>Nothing here yet.</Text>
        </View>
      ) : (
        listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} onPress={() => onOpenListing(listing)} />
        ))
      )}
    </View>
  );
}
