import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { ListingTile } from "@/components/ListingTile";
import { getHomeFeedPage } from "@/services/feedService";
import { colors } from "@/theme";
import type { FeedListing, HomeFeed, HomeStackParamList } from "@/types";

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

const categories = [
  { label: "All Items", icon: "apps" as const, active: true },
  { label: "Textbooks", icon: "menu-book" as const },
  { label: "Electronics", icon: "devices" as const },
  { label: "Dorm Life", icon: "chair" as const },
];

type FeedSection = {
  key: "nearby" | "new" | "active";
  title: "Nearby Listings" | "New Listings" | "Recently Active Listings";
  items: FeedListing[];
};

const IS_DEV = typeof __DEV__ !== "undefined" ? __DEV__ : false;

export function HomeFeedScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreError, setLoadingMoreError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [listings, setListings] = useState<HomeFeed | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState({
    newListings: true,
    nearbyListings: true,
    recentlyActiveListings: true,
  });
  const onEndReachedCalledDuringMomentum = useRef(false);

  const appendUnique = (current: FeedListing[], incoming: FeedListing[]) => {
    if (incoming.length === 0) return current;

    const seen = new Set(current.map((item) => item.id));
    const nextItems = incoming.filter((item) => !seen.has(item.id));
    return nextItems.length === 0 ? current : [...current, ...nextItems];
  };

  const loadInitialFeed = async () => {
    const startedAt = Date.now();
    const { feed, hasMore: nextHasMore } = await getHomeFeedPage(0);
    setListings(feed);
    setHasMore(nextHasMore);
    setPage(0);
    setLoadingMoreError(null);

    console.info("home-feed-mobile", {
      event: "initial-load-success",
      page: 0,
      durationMs: Date.now() - startedAt,
      counts: {
        newListings: feed.newListings.length,
        nearbyListings: feed.nearbyListings.length,
        recentlyActiveListings: feed.recentlyActiveListings.length,
      },
    });
  };

  useEffect(() => {
    let mounted = true;

    loadInitialFeed()
      .catch(() => {
        if (!mounted) return;
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const onRefresh = async () => {
    if (refreshing || loadingMore) return;

    const startedAt = Date.now();
    setRefreshing(true);
    onEndReachedCalledDuringMomentum.current = false;
    try {
      await loadInitialFeed();
      console.info("home-feed-mobile", {
        event: "refresh-success",
        page: 0,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      console.warn("home-feed-mobile", {
        event: "refresh-failure",
        page: 0,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown-error",
      });
      throw error;
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = async () => {
    if (loading || loadingMore) return;
    if (!hasMore.newListings && !hasMore.nearbyListings && !hasMore.recentlyActiveListings) return;

    setLoadingMoreError(null);
    setLoadingMore(true);
    const nextPage = page + 1;
    const startedAt = Date.now();
    try {
      const { feed, hasMore: nextHasMore } = await getHomeFeedPage(nextPage);
      const appendStartedAt = Date.now();

      setListings((prev) => {
        if (!prev) return feed;

        const next = {
          newListings: appendUnique(prev.newListings, feed.newListings),
          nearbyListings: appendUnique(prev.nearbyListings, feed.nearbyListings),
          recentlyActiveListings: appendUnique(
            prev.recentlyActiveListings,
            feed.recentlyActiveListings
          ),
        };

        if (IS_DEV) {
          console.info("home-feed-mobile", {
            event: "append-complete",
            page: nextPage,
            appendDurationMs: Date.now() - appendStartedAt,
            deltas: {
              newListings: next.newListings.length - prev.newListings.length,
              nearbyListings: next.nearbyListings.length - prev.nearbyListings.length,
              recentlyActiveListings:
                next.recentlyActiveListings.length - prev.recentlyActiveListings.length,
            },
            totals: {
              newListings: next.newListings.length,
              nearbyListings: next.nearbyListings.length,
              recentlyActiveListings: next.recentlyActiveListings.length,
            },
          });
        }

        return next;
      });
      setHasMore(nextHasMore);
      setPage(nextPage);

      console.info("home-feed-mobile", {
        event: "page-load-success",
        page: nextPage,
        durationMs: Date.now() - startedAt,
        counts: {
          newListings: feed.newListings.length,
          nearbyListings: feed.nearbyListings.length,
          recentlyActiveListings: feed.recentlyActiveListings.length,
        },
      });
    } catch (error) {
      setLoadingMoreError(
        error instanceof Error ? error.message : "Could not load more listings."
      );

      console.warn("home-feed-mobile", {
        event: "page-load-failure",
        page: nextPage,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown-error",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const sections = useMemo<FeedSection[]>(() => {
    if (!listings) return [];

    const term = search.trim().toLowerCase();
    const filterItems = (items: FeedListing[]) => {
      if (!term) return items;

      return items.filter((item) =>
        `${item.title} ${item.description}`.toLowerCase().includes(term)
      );
    };

    return [
      {
        key: "nearby",
        title: "Nearby Listings",
        items: filterItems(listings.nearbyListings),
      },
      {
        key: "new",
        title: "New Listings",
        items: filterItems(listings.newListings),
      },
      {
        key: "active",
        title: "Recently Active Listings",
        items: filterItems(listings.recentlyActiveListings),
      },
    ];
  }, [listings, search]);

  const hasAnyMore = hasMore.newListings || hasMore.nearbyListings || hasMore.recentlyActiveListings;
  const shouldShowEndOfFeedMessage = page > 0 && !hasAnyMore;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="shopping-cart" size={22} color="#fff" />
          </View>
          <Text style={styles.brandText}>CampusCart</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.circleBtn}>
            <MaterialIcons name="notifications-none" size={20} color="#475569" />
          </Pressable>
          <Pressable style={styles.circleBtn}>
            <MaterialIcons name="tune" size={20} color="#475569" />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search for textbooks, tech, dorm gear..."
          placeholderTextColor="#94a3b8"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {categories.map((item) => (
          <View key={item.label} style={[styles.chip, item.active && styles.chipActive]}>
            <MaterialIcons name={item.icon} size={16} color={item.active ? "#fff" : "#475569"} />
            <Text style={[styles.chipText, item.active && styles.chipTextActive]}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(section) => section.key}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          initialNumToRender={3}
          windowSize={5}
          removeClippedSubviews
          onMomentumScrollBegin={() => {
            onEndReachedCalledDuringMomentum.current = false;
          }}
          onEndReached={() => {
            if (onEndReachedCalledDuringMomentum.current) return;
            onEndReachedCalledDuringMomentum.current = true;
            void loadMore();
          }}
          onEndReachedThreshold={0.7}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.footerLoaderText}>Loading more listings...</Text>
              </View>
            ) : loadingMoreError ? (
              <View style={styles.footerLoader}>
                <Text style={styles.footerErrorText}>Could not load more listings.</Text>
                <Pressable style={styles.footerRetryBtn} onPress={() => void loadMore()}>
                  <Text style={styles.footerRetryBtnText}>Tap to retry</Text>
                </Pressable>
              </View>
            ) : shouldShowEndOfFeedMessage ? (
              <View style={styles.footerLoader}>
                <Text style={styles.footerDoneText}>You have reached the end of this feed.</Text>
              </View>
            ) : null
          }
          renderItem={({ item: section }) => {
            if (section.items.length === 0) {
              return null;
            }

            return (
              <View style={styles.sectionBlock}>
                <View style={styles.feedHeader}>
                  <Text style={styles.feedTitle}>{section.title}</Text>
                  <Text style={styles.feedAction}>{section.items.length} items</Text>
                </View>
                <FlatList
                  data={section.items}
                  numColumns={2}
                  scrollEnabled={false}
                  keyExtractor={(listing) => `${section.key}-${listing.id}`}
                  contentContainerStyle={styles.sectionListContent}
                  columnWrapperStyle={styles.sectionGridRow}
                  initialNumToRender={6}
                  maxToRenderPerBatch={8}
                  windowSize={4}
                  removeClippedSubviews
                  renderItem={({ item }) => (
                    <View style={styles.cardWrap}>
                      <ListingTile
                        listing={item}
                        onPress={() => navigation.navigate("ItemDetails", { listingId: item.id })}
                      />
                    </View>
                  )}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontWeight: "700",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#fff",
  },
  feedHeader: {
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  feedAction: {
    color: colors.primary,
    fontWeight: "700",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  sectionBlock: {
    marginBottom: 6,
  },
  footerLoader: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  footerLoaderText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  footerDoneText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "700",
  },
  footerErrorText: {
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: "700",
  },
  footerRetryBtn: {
    marginTop: 2,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
  },
  footerRetryBtnText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionListContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  sectionGridRow: {
    gap: 10,
  },
  cardWrap: {
    flexBasis: "48%",
    maxWidth: "48%",
    minHeight: 230,
  },
});
