/**
 * chatService.ts — Client-side messaging utilities.
 *
 * All three exported functions use the Supabase browser client and are
 * intended to be called from Client Components only. Never import this
 * file from a Server Component or Server Action.
 */

import { createClient } from "@/lib/supabase/client";
import type { MessageRow } from "@/types/database";

/** Messages expire 24 hours after creation by default. */
export const MESSAGE_EXPIRY_HOURS = 24;

/**
 * Sends a message in a conversation.
 *
 * The `expires_at` timestamp is calculated client-side and sent with the
 * INSERT so the value is consistent with what the UI will display.
 * Row-Level Security on the server validates that the caller is an
 * authenticated participant in the conversation.
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<MessageRow> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + MESSAGE_EXPIRY_HOURS);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MessageRow;
}

/**
 * Fetches the most recent 50 non-expired messages for a conversation,
 * returned in ascending chronological order (oldest first) for display.
 *
 * The filter `expires_at > now()` ensures the frontend never renders
 * messages that have already expired.
 */
export async function fetchMessages(
  conversationId: string
): Promise<MessageRow[]> {
  const supabase = createClient();

  // Fetch the 50 most-recent non-expired messages in DESC order, then
  // reverse them so the chat window shows oldest → newest (top → bottom).
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return ((data ?? []) as MessageRow[]).reverse();
}

/**
 * Subscribes to new messages in a conversation via Supabase Realtime.
 *
 * Uses `postgres_changes` with an INSERT filter on the `messages` table
 * so only rows for the given conversation_id trigger the callback.
 *
 * The callback is skipped for messages whose `expires_at` is already in
 * the past (defensive guard; should not normally happen for brand-new rows).
 *
 * Returns an **unsubscribe** function — call it in a `useEffect` cleanup
 * to avoid memory leaks when the component unmounts.
 *
 * @example
 * useEffect(() => {
 *   const unsubscribe = subscribeToMessages(conversationId, (msg) => {
 *     setMessages((prev) => [...prev, msg]);
 *   });
 *   return unsubscribe; // cleanup on unmount
 * }, [conversationId]);
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (message: MessageRow) => void
): () => void {
  const supabase = createClient();

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        // Server-side filter: Supabase will only forward rows matching
        // this conversation to the subscribed client.
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const message = payload.new as MessageRow;
        // Client-side guard: discard any message already past its expiry.
        if (new Date(message.expires_at) > new Date()) {
          callback(message);
        }
      }
    )
    .subscribe();

  // Return the cleanup / unsubscribe function for use in useEffect.
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Marks the active conversation as read for the current participant role. */
export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });

  if (error) throw new Error(error.message);
}
