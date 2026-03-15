import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { getMyListingForEdit, updateMyListing } from "@/services/profileService";
import { colors } from "@/theme";
import type { ProfileStackParamList } from "@/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditListing">;

export function ProfileEditListingScreen({ navigation, route }: Props) {
  const { listingId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    let mounted = true;

    getMyListingForEdit(listingId)
      .then((listing) => {
        if (!mounted) return;

        if (!listing) {
          Alert.alert("Unavailable", "This listing was not found or you are not allowed to edit it.");
          navigation.goBack();
          return;
        }

        setTitle(listing.title);
        setDescription(listing.description);
        setPrice(String(listing.price));
      })
      .catch((error) => {
        if (!mounted) return;
        Alert.alert("Load failed", error instanceof Error ? error.message : "Could not load listing.");
        navigation.goBack();
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [listingId, navigation]);

  const canSave = useMemo(
    () => title.trim().length > 0 && description.trim().length > 0 && Number(price) > 0,
    [title, description, price]
  );

  const onSave = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    try {
      await updateMyListing(listingId, {
        title,
        description,
        price: Number(price),
      });

      Alert.alert("Listing updated", "Your listing changes were saved.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Save failed", error instanceof Error ? error.message : "Could not save listing.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading listing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
        <Text style={styles.title}>Edit Listing</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Listing title"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Price (ZMW)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="0.00"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            placeholder="Describe your listing"
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]} disabled={!canSave || saving} onPress={onSave}>
          <MaterialIcons name="check" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Listing"}</Text>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: colors.textMuted,
    fontWeight: "700",
  },
  topBar: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 120,
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  textArea: {
    height: 140,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
    padding: 12,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
