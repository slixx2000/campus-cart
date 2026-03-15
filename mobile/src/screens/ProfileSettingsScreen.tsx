import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  getMyProfileSettings,
  updateMyProfile,
  uploadMyAvatarFromUri,
} from "@/services/profileService";
import { colors } from "@/theme";
import type { ProfileStackParamList } from "@/types";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileSettings">;

export function ProfileSettingsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUriDraft, setAvatarUriDraft] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getMyProfileSettings()
      .then((profile) => {
        if (!mounted) return;
        setFullName(profile?.fullName ?? "");
        setPhone(profile?.phone ?? "");
        setAvatarUrl(profile?.avatarUrl ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to update your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
      allowsMultipleSelection: false,
    });

    if (result.canceled) return;

    const nextUri = result.assets?.[0]?.uri;
    if (nextUri) {
      setAvatarUriDraft(nextUri);
    }
  };

  const onSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Missing name", "Display name is required.");
      return;
    }

    setSaving(true);
    try {
      let nextAvatarUrl = avatarUrl ?? undefined;

      if (avatarUriDraft) {
        nextAvatarUrl = await uploadMyAvatarFromUri(avatarUriDraft);
      }

      await updateMyProfile({
        fullName,
        phone,
        avatarUrl: nextAvatarUrl,
      });

      Alert.alert("Profile updated", "Your profile changes were saved.");
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Save failed",
        error instanceof Error ? error.message : "Could not save profile settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const avatarSource = avatarUriDraft ?? avatarUrl ?? null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#0f172a" />
        </Pressable>
        <Text style={styles.title}>Profile Settings</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {avatarSource ? (
              <Image source={{ uri: avatarSource }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={58} color="#64748b" />
              </View>
            )}
          </View>
          <Pressable style={styles.avatarBtn} onPress={pickAvatar}>
            <MaterialIcons name="photo-camera" size={16} color="#fff" />
            <Text style={styles.avatarBtnText}>Change Avatar</Text>
          </Pressable>
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your display name"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="e.g. +260 97 123 4567"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={[styles.saveBtn, saving && styles.saveBtnDisabled]} disabled={saving} onPress={onSave}>
          <MaterialIcons name="check" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
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
  avatarSection: {
    alignItems: "center",
    marginTop: 4,
  },
  avatarWrap: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  avatarPlaceholder: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtn: {
    marginTop: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  avatarBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  fieldWrap: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
