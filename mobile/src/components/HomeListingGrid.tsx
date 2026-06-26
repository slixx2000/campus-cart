import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../lib/styles';
import type { Listing } from '../types';
import { ListingCard } from './ListingCard';

type Props = {
  title: string;
  listings: Listing[];
  onOpenListing: (listing: Listing) => void;
  onViewMore: () => void;
};

export function HomeListingGrid({ title, listings, onOpenListing, onViewMore }: Props) {
  const [expanded, setExpanded] = useState(false);
  const itemsToShow = expanded ? listings.length : Math.min(16, listings.length);
  const displayListings = listings.slice(0, itemsToShow);
  const hasMore = listings.length > 16;

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyBody}>Nothing here yet.</Text>
        </View>
      ) : (
        <>
          <View style={styles.homeGridContainer}>
            {displayListings.map((listing, index) => (
              <View key={listing.id} style={styles.homeGridItem}>
                <ListingCard
                  listing={listing}
                  compact
                  homeTight
                  onPress={() => onOpenListing(listing)}
                />
              </View>
            ))}
          </View>

          {hasMore && (
            <Pressable
              style={styles.viewMoreButton}
              onPress={() => {
                setExpanded(!expanded);
                if (!expanded) {
                  onViewMore();
                }
              }}
            >
              <Text style={styles.viewMoreButtonText}>
                {expanded ? 'Show less' : `View more (${listings.length - 16} more)`}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
