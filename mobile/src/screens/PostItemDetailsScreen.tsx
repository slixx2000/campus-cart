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
import { createListing, getCategories } from "@/services/postService";
import { colors } from "@/theme";
import type { SellStackParamList } from "@/types";

type Props = NativeStackScreenProps<SellStackParamList, "PostItemDetails">;

const CONDITIONS = [
  { key: "new", label: "New" },
  { key: "like_new", label: "Used - Like New" },
  { key: "good", label: "Used - Good" },
  { key: "fair", label: "Used - Fair" },
] as const;

export function PostItemDetailsScreen({ navigation, route }: Props) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]["key"]>("new");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getCategories().then((data) => {
      setCategories(data);
      setCategoryId(data[0]?.id ?? "");
    });
  }, []);

  const canSubmit = useMemo(
    () => title.trim() && description.trim() && Number(price) > 0 && categoryId,
    [title, description, price, categoryId]
  );

  const onSubmit = async () => {
    if (!canSubmit) return;

    setSaving(true);
    try {
      const listingId = await createListing({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        condition,
        price: Number(price),
        photoUris: route.params.photoUris,
      });

      Alert.alert("Listing posted", `Your listing (${listingId.slice(0, 8)}) is live.`);
      navigation.popToTop();
    } catch (error) {
      Alert.alert("Could not post listing", error instanceof Error ? error.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
        <Text style={styles.title}>Post Listing</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Tell us about your item</Text>
        <Text style={styles.subtitle}>Step 2 of 3: Item Details</Text>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Listing Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., MacBook Pro 2021 M1"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[styles.chip, categoryId === cat.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
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
          <Text style={styles.label}>Condition</Text>
          <View style={styles.segmentWrap}>
            {CONDITIONS.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setCondition(item.key)}
                style={[styles.segmentBtn, condition === item.key && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, condition === item.key && styles.segmentTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            placeholder="Describe your item clearly..."
            style={[styles.input, styles.textArea]}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.backAction} onPress={() => navigation.goBack()}>
          <Text style={styles.backActionText}>Back</Text>
        </Pressable>
        <Pressable style={[styles.nextAction, !canSubmit && styles.disabledBtn]} onPress={onSubmit} disabled={!canSubmit || saving}>
          <Text style={styles.nextActionText}>{saving ? "Posting..." : "Post Listing"}</Text>
          <MaterialIcons name="check" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.textPrimary },
  content: { padding: 16, paddingBottom: 120, gap: 14 },
  heading: { fontSize: 26, fontWeight: "800", color: colors.textPrimary },
  subtitle: { color: colors.primary, fontWeight: "700" },
  fieldWrap: { gap: 8 },
  label: { color: "#334155", fontWeight: "700", fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  chip: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: "#dbeafe",
  },
  chipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: colors.primary,
  },
  segmentWrap: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  segmentTextActive: {
    color: colors.primary,
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
    flexDirection: "row",
    gap: 10,
  },
  backAction: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  backActionText: {
    color: "#475569",
    fontWeight: "700",
  },
  nextAction: {
    flex: 1.8,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  nextActionText: {
    color: "#fff",
    fontWeight: "800",
  },
});
