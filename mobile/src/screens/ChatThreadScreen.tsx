import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { getCurrentUserId, getMessages, sendMessage, subscribeToMessages } from "@/services/chatService";
import { colors } from "@/theme";
import type { ChatMessage, ChatStackParamList } from "@/types";

type Props = NativeStackScreenProps<ChatStackParamList, "ChatThread">;

export function ChatThreadScreen({ route, navigation }: Props) {
  const { conversationId } = route.params;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void getCurrentUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    let mounted = true;

    getMessages(conversationId).then((rows) => {
      if (mounted) setMessages(rows);
    });

    const unsubscribe = subscribeToMessages(conversationId, (message) => {
      setMessages((prev) => (prev.some((item) => item.id === message.id) ? prev : [...prev, message]));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [conversationId]);

  const onSend = useCallback(async () => {
    if (!input.trim() || sending) return;

    const next = input;
    setInput("");
    setSending(true);

    try {
      await sendMessage(conversationId, next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send message.";
      Alert.alert("Message not sent", message);
      setInput(next);
    } finally {
      setSending(false);
    }
  }, [conversationId, input, sending]);

  const data = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back-ios" size={18} color="#64748b" />
        </Pressable>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={18} color="#475569" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Conversation</Text>
          <Text style={styles.subtitle}>CampusCart</Text>
        </View>
        <Pressable style={styles.iconBtn}>
          <MaterialIcons name="more-vert" size={20} color="#64748b" />
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        inverted
        // Keep the visible window stable when new realtime items are inserted,
        // so manual reading position is not unexpectedly disturbed.
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 32,
        }}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          const own = item.senderId === currentUserId;
          return (
            <View style={[styles.bubbleWrap, own ? styles.ownWrap : styles.otherWrap]}>
              <View style={[styles.bubble, own ? styles.ownBubble : styles.otherBubble]}>
                <Text style={[styles.bubbleText, own && styles.ownBubbleText]}>{item.content}</Text>
              </View>
              <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
        />
        <Pressable onPress={onSend} style={styles.sendBtn} disabled={sending || !input.trim()}>
          <MaterialIcons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  bubbleWrap: {
    maxWidth: "84%",
  },
  ownWrap: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherWrap: {
    alignSelf: "flex-start",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bubbleText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  ownBubbleText: {
    color: "#fff",
  },
  time: {
    marginTop: 3,
    fontSize: 10,
    color: "#94a3b8",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
