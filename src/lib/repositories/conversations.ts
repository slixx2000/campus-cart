import { createClient } from "@/lib/supabase/server";
import type { ConversationRow, ConversationWithRelations, MessageRow } from "@/types/database";

// ─── Select string ─────────────────────────────────────────────────────────
// Uses FK-hint syntax (!buyer_id / !seller_id) to disambiguate the two
// foreign keys that both reference the `profiles` table.
const CONVERSATION_SELECT = `
  *,
  listings ( id, title ),
  buyer_profile:profiles!buyer_id ( id, full_name, avatar_url ),
  seller_profile:profiles!seller_id ( id, full_name, avatar_url )
`;

// ─── Public types ──────────────────────────────────────────────────────────

/** Flat, UI-ready representation of a conversation. */
export interface ConversationPreview {
  id: string;
  listing_id: string;
  listing_title: string;
  buyer_id: string;
  seller_id: string;
  other_participant_id: string;
  other_participant_name: string;
  other_participant_avatar: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  updated_at: string;
  created_at: string;
}

/** Full conversation data sent to the chat UI. */
export interface ConversationDetail extends ConversationRow {
  listing_title: string;
  other_participant_id: string;
  other_participant_name: string;
  other_participant_avatar: string | null;
  self_avatar: string | null;
  blocked_by_current_user: boolean;
  blocked_by_other_user: boolean;
}

// ─── Repository functions ──────────────────────────────────────────────────

/**
 * Finds an existing conversation between this buyer and seller for a
 * given listing, or creates a new one. Returns the conversation ID.
 *
 * Uses upsert via `onConflict` targeting the unique constraint
 * (listing_id, buyer_id) so a concurrent duplicate INSERT is handled
 * gracefully without throwing.
 */
export async function findOrCreateConversation(
  listingId: string,
  buyerId: string,
  sellerId: string
): Promise<string> {
  const supabase = await createClient();

  const { data: blockedRows } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_id")
    .or(
      `and(blocker_id.eq.${buyerId},blocked_id.eq.${sellerId}),and(blocker_id.eq.${sellerId},blocked_id.eq.${buyerId})`
    )
    .limit(1);

  if ((blockedRows ?? []).length > 0) {
    throw new Error("Cannot start a conversation with a blocked user.");
  }

  // First try to find an existing conversation for this listing + buyer pair.
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .maybeSingle();

  if (existing) return existing.id;

  // None found — create a new one.
  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

/**
 * Returns all conversations for a user (as buyer or seller), sorted by
 * most recently active. Enriches each row with the latest visible message.
 */
export async function getConversationsForUser(
  userId: string
): Promise<ConversationPreview[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ConversationWithRelations[];

  if (rows.length === 0) return [];

  // Block filtering works by removing any conversation where either side has
  // a block edge against the other participant. We do this after loading rows
  // so the same query still powers the list and realtime setup unchanged.
  const participantIds = rows
    .map((conv) => (conv.buyer_id === userId ? conv.seller_id : conv.buyer_id))
    .filter(Boolean);

  const blockedRelations = participantIds.length
    ? await Promise.all([
        supabase
          .from("blocked_users")
          .select("blocker_id, blocked_id")
          .eq("blocker_id", userId)
          .in("blocked_id", participantIds),
        supabase
          .from("blocked_users")
          .select("blocker_id, blocked_id")
          .eq("blocked_id", userId)
          .in("blocker_id", participantIds),
      ])
    : [];

  const blockedParticipantIds = new Set<string>();
  for (const query of blockedRelations) {
    for (const relation of query.data ?? []) {
      if (relation.blocker_id === userId) {
        blockedParticipantIds.add(relation.blocked_id);
      }
      if (relation.blocked_id === userId) {
        blockedParticipantIds.add(relation.blocker_id);
      }
    }
  }

  const visibleRows = rows.filter((conv) => {
    const otherId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
    return !blockedParticipantIds.has(otherId);
  });

  if (visibleRows.length === 0) return [];

  // Batch-fetch the latest non-expired message per conversation so we can
  // show a preview without N+1 queries.
  const convIds = visibleRows.map((r) => r.id);
  const { data: msgs } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at, sender_id")
    .in("conversation_id", convIds)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // Build a map of conversationId → latest message (first occurrence is newest).
  const latestMsg = new Map<
    string,
    Pick<MessageRow, "content" | "created_at">
  >();
  for (const msg of msgs ?? []) {
    if (!latestMsg.has(msg.conversation_id)) {
      latestMsg.set(msg.conversation_id, {
        content: msg.content,
        created_at: msg.created_at,
      });
    }
  }

  return visibleRows.map((conv) => {
    const isBuyer = conv.buyer_id === userId;
    const other = isBuyer ? conv.seller_profile : conv.buyer_profile;
    const latest = latestMsg.get(conv.id) ?? null;

    return {
      id: conv.id,
      listing_id: conv.listing_id,
      listing_title: conv.listings?.title ?? "Unknown Listing",
      buyer_id: conv.buyer_id,
      seller_id: conv.seller_id,
      other_participant_id: other?.id ?? "",
      other_participant_name: other?.full_name ?? "Unknown User",
      other_participant_avatar: other?.avatar_url ?? null,
      last_message_content: latest?.content ?? null,
      last_message_at: latest?.created_at ?? conv.updated_at,
      updated_at: conv.updated_at,
      created_at: conv.created_at,
    };
  });
}

/**
 * Loads a single conversation by ID, verifying the requesting user is
 * a participant. Returns null if not found or unauthorised.
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<ConversationDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", conversationId)
    .single();

  if (error || !data) return null;

  const conv = data as ConversationWithRelations;

  // Access check — participant guard (belt plus RLS suspenders).
  if (conv.buyer_id !== userId && conv.seller_id !== userId) return null;

  const isBuyer = conv.buyer_id === userId;
  const other = isBuyer ? conv.seller_profile : conv.buyer_profile;
  const self = isBuyer ? conv.buyer_profile : conv.seller_profile;

  const otherUserId = other?.id;
  const { data: blockRows } = otherUserId
    ? await supabase
        .from("blocked_users")
        .select("blocker_id, blocked_id")
        .or(
          `and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`
        )
    : { data: [] as Array<{ blocker_id: string; blocked_id: string }> };

  const blockedByCurrentUser =
    (blockRows ?? []).some(
      (row) => row.blocker_id === userId && row.blocked_id === otherUserId
    ) ?? false;
  const blockedByOtherUser =
    (blockRows ?? []).some(
      (row) => row.blocker_id === otherUserId && row.blocked_id === userId
    ) ?? false;

  return {
    ...conv,
    listing_title: conv.listings?.title ?? "Unknown Listing",
    other_participant_id: other?.id ?? "",
    other_participant_name: other?.full_name ?? "Unknown",
    other_participant_avatar: other?.avatar_url ?? null,
    self_avatar: self?.avatar_url ?? null,
    blocked_by_current_user: blockedByCurrentUser,
    blocked_by_other_user: blockedByOtherUser,
  };
}
