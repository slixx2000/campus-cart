import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { ListingTile } from "@/components/ListingTile";
import {
  addListingToFavorites,
  getListingDetail,
  getSimilarListings,
  isListingFavorited,
  removeListingFromFavorites,
} from "@/services/feedService";
import { reportListing, reportUser } from "@/services/safetyService";
import { startConversationForListing } from "@/services/chatService";
import { colors } from "@/theme";
import type { HomeStackParamList } from "@/types";

type Props = NativeStackScreenProps<HomeStackParamList, "ItemDetails">;

const FALLBACK = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80&auto=format&fit=crop";

export function ItemDetailsScreen({ navigation, route }: Props) {
  const { listingId } = route.params;
  const [loading, setLoading] = useState(true);
  const [busyChat, setBusyChat] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [busyReport, setBusyReport] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [listing, setListing] = useState<Awaited<ReturnType<typeof getListingDetail>>>(null);
  const [similar, setSimilar] = useState<Awaited<ReturnType<typeof getSimilarListings>>>([]);

  useEffect(() => {
    let mounted = true;

    const listingPromise = getListingDetail(listingId);

    Promise.all([
      listingPromise,
      listingPromise.then((detail) => getSimilarListings(detail?.categoryName)),
      isListingFavorited(listingId),
    ])
      .then(([detail, similarListings, saved]) => {
        if (!mounted) return;
        setListing(detail);
        setSimilar(similarListings.filter((item) => item.id !== listingId).slice(0, 8));
        setIsSaved(saved);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [listingId]);

  const handleChatSeller = async () => {
    if (!listing?.seller?.id) return;

    setBusyChat(true);
    try {
      const conversationId = await startConversationForListing(listing.id, listing.seller.id);
      if (conversationId) {
        navigation.getParent()?.navigate("ChatStack", {
          screen: "ChatThread",
          params: { conversationId },
        } as never);
      }
    } finally {
      setBusyChat(false);
    }
  };

  const handleToggleSave = async () => {
    if (!listing || busySave) return;

    setBusySave(true);
    try {
      if (isSaved) {
        await removeListingFromFavorites(listing.id);
        setIsSaved(false);
      } else {
        await addListingToFavorites(listing.id);
        setIsSaved(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update saved listing.";
      Alert.alert("Save failed", message);
    } finally {
      setBusySave(false);
    }
  };

  const submitListingReport = async (reason: string) => {
    if (!listing || busyReport) return;

    setBusyReport(true);
    try {
      await reportListing(listing.id, reason);
      Alert.alert("Report submitted", "Thank you. We will review this listing report.");
    } catch (error) {
      Alert.alert(
        "Report failed",
        error instanceof Error ? error.message : "Could not submit listing report."
      );
    } finally {
      setBusyReport(false);
    }
  };

  const submitUserReport = async (reason: string) => {
    if (!listing?.seller?.id || busyReport) return;

    setBusyReport(true);
    try {
      await reportUser(listing.seller.id, reason);
      Alert.alert("Report submitted", "Thank you. We will review this user report.");
    } catch (error) {
      Alert.alert(
        "Report failed",
        error instanceof Error ? error.message : "Could not submit user report."
      );
    } finally {
      setBusyReport(false);
    }
  };

  const openListingReportReasons = () => {
    Alert.alert("Report listing", "Choose a reason.", [
      { text: "Cancel", style: "cancel" },
      { text: "Spam or scam", onPress: () => void submitListingReport("Spam or scam") },
      { text: "Prohibited item", onPress: () => void submitListingReport("Prohibited item") },
      { text: "Misleading information", onPress: () => void submitListingReport("Misleading information") },
    ]);
  };

  const openUserReportReasons = () => {
    Alert.alert("Report user", "Choose a reason.", [
      { text: "Cancel", style: "cancel" },
      { text: "Harassment", onPress: () => void submitUserReport("Harassment") },
      { text: "Fraud or scam", onPress: () => void submitUserReport("Fraud or scam") },
      { text: "Impersonation", onPress: () => void submitUserReport("Impersonation") },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={styles.errorText}>Listing not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: listing.images[0] ?? FALLBACK }} style={styles.heroImage} />
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={20} color="#0f172a" />
          </Pressable>
        </View>

        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>ZMW {listing.price.toLocaleString()}</Text>

        <View style={styles.chipsRow}>
          <View style={styles.chip}><Text style={styles.chipText}>{listing.universityShortName ?? "Campus"}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>{listing.isService ? "Service" : "Product"}</Text></View>
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{listing.description}</Text>

        <View style={styles.sellerCard}>
          <Text style={styles.sellerName}>{listing.seller?.fullName ?? "Unknown Seller"}</Text>
          <Text style={styles.sellerMeta}>{listing.universityName}</Text>
          <View style={styles.reportRow}>
            <Pressable style={styles.reportBtn} disabled={busyReport} onPress={openListingReportReasons}>
              <MaterialIcons name="flag" size={14} color="#b91c1c" />
              <Text style={styles.reportBtnText}>Report Listing</Text>
            </Pressable>
            <Pressable
              style={styles.reportBtn}
              disabled={busyReport || !listing.seller?.id}
              onPress={openUserReportReasons}
            >
              <MaterialIcons name="outlined-flag" size={14} color="#b91c1c" />
              <Text style={styles.reportBtnText}>Report Seller</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Similar Items</Text>
        </View>
        <View style={styles.gridRow}>
          {similar.slice(0, 4).map((item) => (
            <View key={item.id} style={styles.gridItem}>
              <ListingTile listing={item} onPress={() => navigation.push("ItemDetails", { listingId: item.id })} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.secondaryBtn} onPress={handleToggleSave} disabled={busySave}>
          <MaterialIcons name={isSaved ? "favorite" : "favorite-border"} size={20} color={isSaved ? "#ef4444" : "#0f172a"} />
          <Text style={styles.secondaryBtnText}>{busySave ? "Saving..." : isSaved ? "Saved" : "Save"}</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={handleChatSeller} disabled={busyChat}>
          <MaterialIcons name="chat-bubble-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>{busyChat ? "Opening..." : "Chat Seller"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingBottom: 120,
  },
  heroWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 0.9,
    backgroundColor: "#e2e8f0",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  backBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    paddingHorizontal: 18,
    marginTop: 18,
    fontSize: 27,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  price: {
    paddingHorizontal: 18,
    marginTop: 8,
    fontSize: 30,
    color: colors.primary,
    fontWeight: "800",
  },
  chipsRow: {
    paddingHorizontal: 18,
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "700",
  },
  sectionTitle: {
    paddingHorizontal: 18,
    marginTop: 20,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  description: {
    paddingHorizontal: 18,
    marginTop: 8,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  sellerCard: {
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  sellerMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  reportRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  reportBtn: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff1f2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  reportBtnText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 11,
  },
  sectionHeader: {
    marginTop: 10,
  },
  gridRow: {
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridItem: {
    width: "48%",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtnText: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  primaryBtn: {
    flex: 1.8,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    color: colors.textMuted,
    fontWeight: "700",
  },
});
