import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@/theme";
import type { SellStackParamList } from "@/types";

type Props = NativeStackScreenProps<SellStackParamList, "PostUploadPhotos">;

export function PostUploadPhotosScreen({ navigation }: Props) {
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  const canContinue = useMemo(() => photoUris.length > 0, [photoUris.length]);

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload listing images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 10 - photoUris.length),
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const pickedUris = result.assets.map((asset) => asset.uri).filter(Boolean);
    if (pickedUris.length === 0) {
      return;
    }

    setPhotoUris((prev) => {
      const next = [...prev, ...pickedUris];
      return next.slice(0, 10);
    });
  };

  const removePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((item) => item !== uri));
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Post Listing</Text>
      </View>

      <View style={styles.progressWrap}>
        <Text style={styles.progressLabel}>Step 1 of 3</Text>
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.heading}>Add Photos</Text>
        <Text style={styles.subtitle}>Upload up to 10 photos to improve listing trust.</Text>

        <Pressable style={styles.uploadCard} onPress={pickPhotos}>
          <View style={styles.uploadIcon}><MaterialIcons name="add-a-photo" size={34} color={colors.primary} /></View>
          <Text style={styles.uploadTitle}>Tap to upload</Text>
          <Text style={styles.uploadHint}>{photoUris.length}/10 selected</Text>
        </Pressable>

        {photoUris.length > 0 ? (
          <View style={styles.gridWrap}>
            {photoUris.map((uri, index) => (
              <View key={uri} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                {index === 0 ? <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Cover</Text></View> : null}
                <Pressable style={styles.removeBtn} onPress={() => removePhoto(uri)}>
                  <MaterialIcons name="close" size={16} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
          disabled={!canContinue}
          onPress={() => navigation.navigate("PostItemDetails", { photoUris })}
        >
          <Text style={styles.nextText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topBar: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
  progressWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  progressLabel: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  progressRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  progressDot: { height: 6, flex: 1, borderRadius: 4, backgroundColor: "#e2e8f0" },
  progressActive: { backgroundColor: colors.primary },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 20 },
  heading: { fontSize: 28, fontWeight: "800", color: colors.textPrimary },
  subtitle: { marginTop: 6, color: colors.textMuted, fontSize: 14 },
  uploadCard: {
    marginTop: 18,
    borderWidth: 2,
    borderColor: "#93c5fd",
    borderStyle: "dashed",
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: "#eff6ff",
  },
  gridWrap: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  thumbWrap: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  coverBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: { marginTop: 10, fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  uploadHint: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  nextBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
