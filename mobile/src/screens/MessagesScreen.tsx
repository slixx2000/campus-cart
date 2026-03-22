import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SectionHeader } from '../components/SectionHeader';
import { relativeDate } from '../lib/format';
import { PLACEHOLDER_IMAGE } from '../lib/constants';
import { styles } from '../lib/styles';
import type { ConversationPreview } from '../types';

export function MessagesScreen({
  signedIn,
  conversations,
  loading,
  refreshing,
  onRefresh,
  onOpenConversation,
}: {
  signedIn: boolean;
  conversations: ConversationPreview[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenConversation: (conversation: ConversationPreview) => void;
}) {
  if (!signedIn) {
    return (
      <ScrollView
        contentContainerStyle={styles.screenContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
      >
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>You need an account to chat</Text>
          <Text style={styles.noticeBody}>Once you sign in, this tab will show your conversations with buyers and sellers.</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.screenContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
    >
      <Pressable style={styles.secondaryButton} onPress={onRefresh} disabled={loading || refreshing}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.secondaryButtonText}>Refresh conversations</Text>}
      </Pressable>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyBody}>Browse listings and tap “Message Seller” to start your first chat.</Text>
        </View>
      ) : (
        conversations.map((conversation) => (
          <Pressable key={conversation.id} style={styles.profileCard} onPress={() => onOpenConversation(conversation)}>
            <View style={styles.profileTopRow}>
              <Image source={{ uri: conversation.other_participant_avatar || PLACEHOLDER_IMAGE }} style={styles.avatarLarge} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.profileName}>{conversation.other_participant_name}</Text>
                  {conversation.unread ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.profileMeta}>{conversation.listing_title}</Text>
                <Text style={styles.helperText} numberOfLines={2}>{conversation.last_message_content || 'No messages yet — say hi and ask the important stuff.'}</Text>
              </View>
              <Text style={styles.cardDate}>{relativeDate(conversation.last_message_at || conversation.updated_at)}</Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}
