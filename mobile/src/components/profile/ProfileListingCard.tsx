import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FallbackImage } from '../FallbackImage';
import { PLACEHOLDER_IMAGE } from '../../lib/constants';
import { ActionSheetCard } from '../ActionSheetCard';
import type { Listing } from '../../types';
import { formatPrice } from '../../lib/format';
import { radius, text, useTheme } from '../../lib/styles';

/**
 * Chips that sit on top of a listing photo. Deliberately NOT theme tokens: what
 * is behind them is a user's photo, not a themed surface, so they have to stay
 * dark-on-light-text in both modes to keep contrast.
 */
const OVERLAY_BG = 'rgba(2, 6, 23, 0.82)';
const OVERLAY_LINE = 'rgba(248, 250, 252, 0.22)';
const OVERLAY_FG = '#F8FAFC';

type Props = {
  listing: Listing;
  onMarkSold: (listingId: string) => void;
  onBumpListing: (listingId: string) => void;
  onArchiveListing: (listingId: string) => void;
  onRelist: (listingId: string) => void;
  onEditListing: (listing: Listing) => void;
};

export function ProfileListingCard({ listing, onMarkSold, onBumpListing, onArchiveListing, onRelist, onEditListing }: Props) {
  const { colors } = useTheme();
  const isSold = listing.status === 'sold';
  const isArchived = listing.status === 'archived';
  const [showActions, setShowActions] = useState(false);

  const statusLabel = isArchived ? 'Archived' : isSold ? 'Sold' : 'Active';
  const statusColor = isArchived ? colors.muted : isSold ? colors.accent : OVERLAY_FG;

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
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      <View style={{ position: 'relative' }}>
        <FallbackImage
          uri={listing.images?.[0]}
          fallbackUri={PLACEHOLDER_IMAGE}
          style={{ width: '100%', height: 170, backgroundColor: colors.surface2 }}
          contentFit="cover"
        />

        <View
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            backgroundColor: OVERLAY_BG,
            borderRadius: radius.full,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderWidth: 1,
            borderColor: OVERLAY_LINE,
          }}
        >
          <Text style={{ color: OVERLAY_FG, fontWeight: '800', fontSize: text.sm }}>
            {formatPrice(listing.price)}
          </Text>
        </View>

        <View
          style={{
            position: 'absolute',
            right: 12,
            top: 12,
            backgroundColor: OVERLAY_BG,
            borderRadius: radius.full,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: OVERLAY_LINE,
          }}
        >
          <Text
            style={{
              color: statusColor,
              fontWeight: '800',
              fontSize: text.xs,
              textTransform: 'uppercase',
            }}
          >
            {statusLabel}
          </Text>
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
              borderRadius: radius.full,
              backgroundColor: OVERLAY_BG,
              borderWidth: 1,
              borderColor: OVERLAY_LINE,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open actions for ${listing.title}`}
        >
          <MaterialIcons name="more-vert" size={18} color={OVERLAY_FG} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text style={{ color: colors.fg, fontWeight: '800', fontSize: text.base }} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4, fontSize: text.sm }} numberOfLines={1}>
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
