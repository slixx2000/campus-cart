import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { styles } from '../lib/styles';
import type { MessageItem } from '../types';

export function ChatDetailScreen({
  title,
  currentUserId,
  messages,
  loading,
  sending,
  onRefresh,
  onSend,
}: {
  title: string;
  currentUserId: string;
  messages: MessageItem[];
  loading: boolean;
  sending: boolean;
  onRefresh: () => void;
  onSend: (content: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const sortedMessages = useMemo(() => [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [messages]);

  return (
    <View style={[styles.container, { paddingHorizontal: 18, paddingTop: 16 }]}> 
      <SectionHeader eyebrow="Chat" title={title} body="Keep it clear, friendly, and specific so buyers and sellers can close faster." />
      <Pressable style={styles.secondaryButton} onPress={onRefresh} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.secondaryButtonText}>Refresh messages</Text>}
      </Pressable>
      <FlatList
        data={sortedMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 18, paddingBottom: 120 }}
        renderItem={({ item }) => {
          const mine = item.sender_id === currentUserId;
          return (
            <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
              <View style={{ maxWidth: '82%', backgroundColor: mine ? '#0ea5e9' : '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: mine ? '#0ea5e9' : '#1e293b', paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ color: '#fff', lineHeight: 20 }}>{item.content}</Text>
              </View>
              <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start the conversation</Text>
            <Text style={styles.emptyBody}>Ask about availability, condition, pickup point, or price.</Text>
          </View>
        }
      />
      <View style={{ position: 'absolute', left: 18, right: 18, bottom: 24, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Type a message…"
          placeholderTextColor="#64748b"
          value={draft}
          onChangeText={setDraft}
        />
        <Pressable
          style={[styles.primaryButton, { paddingHorizontal: 18 }]}
          disabled={sending || !draft.trim()}
          onPress={async () => {
            const next = draft.trim();
            if (!next) return;
            setDraft('');
            await onSend(next);
          }}
        >
          {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send</Text>}
        </Pressable>
      </View>
    </View>
  );
}
