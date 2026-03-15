import type { ConversationSummary } from "@campuscart/shared";
import { getSupabaseClient } from "@/lib/supabase";
import type { ChatMessage, ConversationItem } from "@/types";

const MESSAGE_EXPIRY_HOURS = 24;

const CONVERSATION_SELECT = `
  id,
  listing_id,
  buyer_id,
  seller_id,
  updated_at,
  created_at,
  listings ( title ),
  messages ( conversation_id, content, created_at, expires_at ),
  buyer_profile:profiles!buyer_id ( id, full_name, avatar_url ),
  seller_profile:profiles!seller_id ( id, full_name, avatar_url )
`;

type ConversationRow = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  created_at: string;
  listings: { title: string } | null;
  messages: Array<{
    conversation_id: string;
    content: string;
    created_at: string;
    expires_at: string;
  }> | null;
  buyer_profile: { id: string; full_name: string; avatar_url: string | null } | null;
  seller_profile: { id: string; full_name: string; avatar_url: string | null } | null;
};

type ConversationParticipants = {
  buyer_id: string;
  seller_id: string;
};

async function ensureConversationUsersNotBlocked(conversationId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .single<ConversationParticipants>();

  if (conversationError || !conversation) {
    throw new Error("Conversation not found.");
  }

  const { data: blockedRows, error: blockedError } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_id")
    .or(
      `and(blocker_id.eq.${conversation.buyer_id},blocked_id.eq.${conversation.seller_id}),and(blocker_id.eq.${conversation.seller_id},blocked_id.eq.${conversation.buyer_id})`
    )
    .limit(1);

  if (blockedError) {
    throw new Error(blockedError.message);
  }

  if ((blockedRows ?? []).length > 0) {
    throw new Error("Cannot send message because one user has blocked the other.");
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getConversations(): Promise<ConversationItem[]> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .filter("messages.expires_at", "gt", "now()")
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as unknown as ConversationRow[];

  return rows.map((row) => {
    const isBuyer = row.buyer_id === userId;
    const other = isBuyer ? row.seller_profile : row.buyer_profile;
    const latest = row.messages?.[0];

    const summary: ConversationSummary = {
      id: row.id,
      listingId: row.listing_id,
      otherParticipantId: other?.id ?? "",
      otherParticipantName: other?.full_name ?? "Unknown",
      otherParticipantAvatar: other?.avatar_url,
      lastMessageContent: latest?.content,
      lastMessageAt: latest?.created_at ?? row.updated_at,
    };

    return {
      ...summary,
      listingTitle: row.listings?.title,
    };
  });
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = getSupabaseClient();

  const { data } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at, expires_at")
    .eq("conversation_id", conversationId)
    .filter("expires_at", "gt", "now()")
    .order("created_at", { ascending: true })
    .limit(200);

  return (data ?? []).map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  }));
}

export async function sendMessage(conversationId: string, content: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You must sign in to send messages.");
  }

  await ensureConversationUsersNotBlocked(conversationId);

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + MESSAGE_EXPIRY_HOURS * 60 * 60 * 1000);

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    content: content.trim(),
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: ChatMessage) => void
): () => void {
  const supabase = getSupabaseClient();

  const channel = supabase
    .channel(`mobile:messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as {
          id: string;
          sender_id: string;
          content: string;
          created_at: string;
          expires_at: string;
        };

        if (new Date(row.expires_at).getTime() <= Date.now()) {
          return;
        }

        onMessage({
          id: row.id,
          senderId: row.sender_id,
          content: row.content,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function startConversationForListing(
  listingId: string,
  sellerId: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  if (!userId || userId === sellerId) return null;

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", userId)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      buyer_id: userId,
      seller_id: sellerId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}
