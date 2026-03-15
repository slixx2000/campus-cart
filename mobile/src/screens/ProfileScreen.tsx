import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import type { ListingSummary, UserProfileSummary } from "@campuscart/shared";
import {
  archiveMyListing,
  bumpListing,
  deleteMyListing,
  getMyListings,
  getMyProfile,
} from "@/services/profileService";
import { colors } from "@/theme";
import type { ProfileStackParamList } from "@/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "Profile">;

const LISTING_BUMP_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getRemainingBumpMs(lastBumpedAt: string | undefined, nowMs: number): number {
  if (!lastBumpedAt) return 0;

  const lastBumpedAtMs = new Date(lastBumpedAt).getTime();
  if (!Number.isFinite(lastBumpedAtMs)) return 0;

  return Math.max(0, lastBumpedAtMs + LISTING_BUMP_COOLDOWN_MS - nowMs);
}

function formatRemainingBump(ms: number): string {
  if (ms <= 0) return "Ready now";

  const totalMinutes = Math.ceil(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function ProfileScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [busyListingId, setBusyListingId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const loadProfileData = async () => {
    const [nextProfile, nextListings] = await Promise.all([getMyProfile(), getMyListings()]);
    setProfile(nextProfile);
    setListings(nextListings);
  };

  useEffect(() => {
    let mounted = true;

    loadProfileData()
      .then(() => {
        if (!mounted) return;
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useMemo(
      () => () => {
        void loadProfileData();

        return undefined;
      },
      []
    )
  );

  const stats = useMemo(() => {
    const sold = 0;
    const totalViews = listings.reduce((sum, item) => sum + Number(item.viewCount ?? 0), 0);
    return {
      active: listings.length,
      sold,
      views: totalViews,
    };
  }, [listings]);

  const confirmArchive = (listingId: string) => {
    Alert.alert("Archive listing", "This listing will be removed from your active listings.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: async () => {
          setBusyListingId(listingId);
          try {
            await archiveMyListing(listingId);
            await loadProfileData();
          } catch (error) {
            Alert.alert("Archive failed", error instanceof Error ? error.message : "Could not archive listing.");
          } finally {
            setBusyListingId(null);
          }
        },
      },
    ]);
  };

  const confirmBump = (listing: ListingSummary) => {
    const remainingMs = getRemainingBumpMs(listing.lastBumpedAt, nowTick);
    if (remainingMs > 0) {
      Alert.alert("Bump unavailable", `You can bump this listing again in ${formatRemainingBump(remainingMs)}.`);
      return;
    }

    Alert.alert("Bump listing", "This moves your listing higher in the feed. You can bump once every 24 hours.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Bump Listing",
        onPress: async () => {
          setBusyListingId(listing.id);
          try {
            await bumpListing(listing.id);
            await loadProfileData();
            Alert.alert("Listing bumped", "Your listing was bumped successfully.");
          } catch (error) {
            Alert.alert("Bump failed", error instanceof Error ? error.message : "Could not bump listing.");
          } finally {
            setBusyListingId(null);
          }
        },
      },
    ]);
  };

  const confirmDelete = (listingId: string) => {
    Alert.alert("Delete listing", "This listing will be deleted from your profile.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setBusyListingId(listingId);
          try {
            await deleteMyListing(listingId);
            await loadProfileData();
          } catch (error) {
            Alert.alert("Delete failed", error instanceof Error ? error.message : "Could not delete listing.");
          } finally {
            setBusyListingId(null);
          }
        },
      },
    ]);
  };

  const openListingActions = (listing: ListingSummary) => {
    const remainingMs = getRemainingBumpMs(listing.lastBumpedAt, nowTick);
    const canBump = remainingMs <= 0;

    Alert.alert("Manage listing", "Choose an action for this listing.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () => navigation.navigate("EditListing", { listingId: listing.id }),
      },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => confirmArchive(listing.id),
      },
      {
        text: canBump ? "Bump Listing" : `Bump in ${formatRemainingBump(remainingMs)}`,
        onPress: canBump ? () => confirmBump(listing) : undefined,
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => confirmDelete(listing.id),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Pressable style={styles.settingsBtn} onPress={() => navigation.navigate("ProfileSettings")}>
          <MaterialIcons name="settings" size={20} color="#334155" />
        </Pressable>
      </View>

      <View style={styles.profileTop}>
        <View style={styles.avatarWrap}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={60} color="#64748b" />
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile?.fullName ?? "CampusCart User"}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.active}</Text><Text style={styles.statLabel}>Listings</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.sold}</Text><Text style={styles.statLabel}>Sold</Text></View>
        <View style={styles.statCard}><Text style={styles.statValue}>{stats.views}</Text><Text style={styles.statLabel}>Views</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Active Listings</Text>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No active listings.</Text>}
        renderItem={({ item }) => (
          <View style={styles.listRow}>
            <View style={styles.thumb}><MaterialIcons name="inventory-2" size={22} color="#64748b" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.listMeta}>ZMW {item.price.toLocaleString()} • {item.viewCount ?? 0} views</Text>
              <Text style={styles.bumpMeta}>Next bump: {formatRemainingBump(getRemainingBumpMs(item.lastBumpedAt, nowTick))}</Text>
              <Pressable
                style={[styles.bumpBtn, busyListingId === item.id && styles.bumpBtnDisabled]}
                disabled={busyListingId === item.id || getRemainingBumpMs(item.lastBumpedAt, nowTick) > 0}
                onPress={() => confirmBump(item)}
              >
                <MaterialIcons name="trending-up" size={14} color="#fff" />
                <Text style={styles.bumpBtnText}>Bump Listing</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => openListingActions(item)}
              disabled={busyListingId === item.id}
              style={styles.actionBtn}
            >
              <MaterialIcons name="more-horiz" size={22} color="#2b9dee" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingTop: 52,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileTop: {
    marginTop: 12,
    alignItems: "center",
  },
  avatarWrap: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: "#2b9dee22",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#fff",
  },
  name: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  statsRow: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "700" },
  sectionTitle: {
    marginTop: 18,
    marginHorizontal: 16,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  listRow: {
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  listMeta: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textMuted,
  },
  bumpMeta: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },
  bumpBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bumpBtnDisabled: {
    opacity: 0.55,
  },
  bumpBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 30,
  },
});
