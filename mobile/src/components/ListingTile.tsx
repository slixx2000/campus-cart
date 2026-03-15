import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import type { FeedListing } from "@/types";
import { colors } from "@/theme";

type ListingTileProps = {
  listing: FeedListing;
  onPress: () => void;
};

const PLACEHOLDER = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80&auto=format&fit=crop";

export function ListingTile({ listing, onPress }: ListingTileProps) {
  const imageUri =
    listing.imageUrl ??
    [...(listing.listing_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => image.public_url)
      .find((url): url is string => Boolean(url)) ??
    PLACEHOLDER;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.category}>{listing.universityShortName ?? "Campus"}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.price}>ZMW {listing.price.toLocaleString()}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eef2f7",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: "#e2e8f0",
  },
  body: {
    padding: 10,
    gap: 2,
  },
  category: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  price: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },
});
