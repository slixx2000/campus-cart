import React from 'react';
import type { Listing } from '../types';
// JS screen uses NativeWind className styling; keep TS wrapper for app-level typing.
const nativeWindHomeScreenModule = require('./HomeScreen.js');
const NativeWindHomeScreen =
  nativeWindHomeScreenModule.default ??
  nativeWindHomeScreenModule.HomeScreen ??
  nativeWindHomeScreenModule;

type Props = {
  featuredListings: Listing[];
  nearbyListings: Listing[];
  onOpenListing: (listing: Listing) => void;
  onBrowsePress: () => void;
  onSellPress: () => void;
  onCategoryPress: (category: string) => void;
  onFilterPress?: () => void;
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
  onFilterPress,
  refreshing,
  onRefresh,
}: Props) {
  return (
    <NativeWindHomeScreen
      featuredListings={featuredListings}
      nearbyListings={nearbyListings}
      onOpenListing={onOpenListing}
      onBrowsePress={onBrowsePress}
      onSellPress={onSellPress}
      onCategoryPress={onCategoryPress}
      onFilterPress={onFilterPress}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
