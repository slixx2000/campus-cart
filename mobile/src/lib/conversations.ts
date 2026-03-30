import { supabase } from './supabase';
import type { ConversationPreview, MessageItem } from '../types';

const CONVERSATION_SELECT = `
  *,
  listings ( id, title ),
  buyer_profile:profiles!buyer_id ( id, full_name, avatar_url ),
  seller_profile:profiles!seller_id ( id, full_name, avatar_url )
`;

export async function findOrCreateConversation(listingId: string, buyerId: string, sellerId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing?.id) return existing.id as string;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select('id')
    .maybeSingle();

  if (!error && data?.id) {
    return data.id as string;
  }

  // Another request may have created the same row in parallel.
  if (error && /duplicate key value|unique constraint/i.test(error.message)) {
    const { data: afterDuplicate, error: afterDuplicateError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', buyerId)
      .single();

    if (afterDuplicateError) throw new Error(afterDuplicateError.message);
    return afterDuplicate.id as string;
  }

  if (error) throw new Error(error.message);

  const { data: fallback, error: fallbackError } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)
    .single();

  if (fallbackError) throw new Error(fallbackError.message);
  return fallback.id as string;
}

export async function getConversationsForUser(userId: string): Promise<ConversationPreview[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const { data: msgs } = await supabase
    .from('messages')
    .select('id, conversation_id, content, created_at, sender_id')
    .in('conversation_id', ids)
    .order('created_at', { ascending: false });

  const latest = new Map<string, { content: string; created_at: string; sender_id: string }>();
  for (const msg of msgs ?? []) {
    if (!latest.has(msg.conversation_id)) {
      latest.set(msg.conversation_id, { content: msg.content, created_at: msg.created_at, sender_id: msg.sender_id });
    }
  }

  return rows.map((conv) => {
    const isBuyer = conv.buyer_id === userId;
    const other = isBuyer ? conv.seller_profile : conv.buyer_profile;
    const msg = latest.get(conv.id);
    const readAt = isBuyer ? conv.buyer_last_read_at : conv.seller_last_read_at;
    const unread = Boolean(msg && msg.sender_id !== userId && (!readAt || new Date(msg.created_at) > new Date(readAt)));
    return {
      id: conv.id,
      listing_id: conv.listing_id,
      listing_title: conv.listings?.title ?? 'Unknown Listing',
      buyer_id: conv.buyer_id,
      seller_id: conv.seller_id,
      other_participant_id: other?.id ?? '',
      other_participant_name: other?.full_name ?? 'Unknown User',
      other_participant_avatar: other?.avatar_url ?? null,
      last_message_content: msg?.content ?? null,
      last_message_at: msg?.created_at ?? conv.updated_at,
      updated_at: conv.updated_at,
      created_at: conv.created_at,
      unread,
    } satisfies ConversationPreview;
  });
}

export async function markConversationRead(conversationId: string, userId: string) {
  const now = new Date().toISOString();
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', conversationId)
    .single();

  if (error) throw new Error(error.message);
  const readField = conversation.buyer_id === userId ? 'buyer_last_read_at' : 'seller_last_read_at';
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ [readField]: now })
    .eq('id', conversationId);
  if (updateError) throw new Error(updateError.message);
}

export async function getMessages(conversationId: string): Promise<MessageItem[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as MessageItem[]);
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);

  const now = new Date().toISOString();
  const { data: conversation } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id')
    .eq('id', conversationId)
    .single();

  if (conversation) {
    const readField = conversation.buyer_id === senderId ? 'buyer_last_read_at' : 'seller_last_read_at';
    await supabase.from('conversations').update({ updated_at: now, [readField]: now }).eq('id', conversationId);
  }
}

export async function getHiddenConversationIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('hidden_conversations')
    .select('conversation_id')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => row.conversation_id);
}

export async function hideConversationForUser(userId: string, conversationId: string) {
  const { error } = await supabase
    .from('hidden_conversations')
    .upsert({ user_id: userId, conversation_id: conversationId }, { onConflict: 'user_id,conversation_id' });
  if (error) throw new Error(error.message);
}
