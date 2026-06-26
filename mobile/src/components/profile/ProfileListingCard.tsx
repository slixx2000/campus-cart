import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FallbackImage } from '../FallbackImage';
import { PLACEHOLDER_IMAGE } from '../../lib/constants';
import { ActionSheetCard } from '../ActionSheetCard';
import type { Listing } from '../../types';

type Props = {
  listing: Listing;
  onMarkSold: (listingId: string) => void;
  onBumpListing: (listingId: string) => void;
  onArchiveListing: (listingId: string) => void;
  onRelist: (listingId: string) => void;
  onEditListing: (listing: Listing) => void;
};

export function ProfileListingCard({ listing, onMarkSold, onBumpListing, onArchiveListing, onRelist, onEditListing }: Props) {
  const isSold = listing.status === 'sold';
  const isArchived = listing.status === 'archived';
  const [showActions, setShowActions] = useState(false);

  const actionItems = useMemo(() => {
    const items = [] as Array<{ key: string; label: string; tone?: 'default' | 'danger'; onPress: () => void }>;
    if (!isSold && !isArchived) {
      items.push({
        key: 'mark-sold',
        label: 'Mark sold',
        onPress: () => onMarkSold(listing.id),
      });
    }
    if (isSold || isArchived) {
      items.push({
        key: 'relist',
        label: 'Relist',
        onPress: () => onRelist(listing.id),
      });
    }
    items.push({
      key: 'edit',
      label: 'Edit listing',
      onPress: () => onEditListing(listing),
    });
    items.push({
      key: 'bump',
      label: 'Bump listing',
      onPress: () => onBumpListing(listing.id),
    });
    items.push({
      key: 'archive',
      label: 'Archive listing',
      tone: 'danger',
      onPress: () => onArchiveListing(listing.id),
    });
    return items;
  }, [isArchived, isSold, listing, onArchiveListing, onBumpListing, onEditListing, onMarkSold, onRelist]);

  return (
    <View
      style={{
        backgroundColor: '#0f172a',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      <View style={{ position: 'relative' }}>
        <FallbackImage
          uri={listing.images?.[0]}
          fallbackUri={PLACEHOLDER_IMAGE}
          style={{ width: '100%', height: 170, backgroundColor: '#111827' }}
          contentFit="cover"
        />

        <View
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.25)',
          }}
        >
          <Text style={{ color: '#f8fafc', fontWeight: '900', fontSize: 14 }}>K {listing.price.toLocaleString()}</Text>
        </View>

        <View
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            backgroundColor: isArchived ? 'rgba(100, 116, 139, 0.9)' : isSold ? 'rgba(22, 163, 74, 0.9)' : 'rgba(14, 165, 233, 0.9)',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>{isArchived ? 'Archived' : isSold ? 'Sold' : 'Active'}</Text>
        </View>

        <Pressable
          onPress={() => setShowActions(true)}
          style={({ pressed }) => [
            {
              position: 'absolute',
              right: 12,
              bottom: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(2, 6, 23, 0.85)',
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open actions for ${listing.title}`}
        >
          <MaterialIcons name="more-vert" size={18} color="#e2e8f0" />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text style={{ color: '#f8fafc', fontWeight: '800', fontSize: 16 }} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 13 }} numberOfLines={1}>
          {listing.category} • {listing.university}
        </Text>
      </View>

      <ActionSheetCard
        visible={showActions}
        title="Listing actions"
        subtitle={listing.title}
        actions={actionItems}
        onClose={() => setShowActions(false)}
      />
    </View>
  );
}
