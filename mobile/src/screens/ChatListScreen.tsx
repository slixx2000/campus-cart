import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { getConversations } from "@/services/chatService";
import { colors } from "@/theme";
import type { ChatStackParamList, ConversationItem } from "@/types";

type Props = NativeStackScreenProps<ChatStackParamList, "Chats">;

export function ChatListScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ConversationItem[]>([]);

  useEffect(() => {
    let mounted = true;

    getConversations()
      .then((rows) => {
        if (mounted) setItems(rows);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>Start from a listing and tap Chat Seller.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("ChatThread", { conversationId: item.id })}
          >
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={22} color="#475569" />
            </View>
            <View style={styles.rowBody}>
              <View style={styles.rowHeader}>
                <Text style={styles.name}>{item.otherParticipantName}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessageContent ?? "Start the conversation"}
              </Text>
              <Text style={styles.listing} numberOfLines={1}>
                {item.listingTitle ?? "CampusCart Listing"}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingTop: 56,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  preview: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  listing: {
    marginTop: 2,
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  emptyText: {
    marginTop: 6,
    color: colors.textMuted,
    textAlign: "center",
  },
});
