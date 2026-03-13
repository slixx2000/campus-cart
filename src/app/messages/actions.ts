"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findOrCreateConversation } from "@/lib/repositories/conversations";

/**
 * Server Action: "Message Seller"
 *
 * Called when a buyer clicks the "Message Seller" button on a product page.
 * - Validates the caller is authenticated.
 * - Prevents a seller from messaging their own listing.
 * - Finds or creates the conversation row.
 * - Redirects to /messages/[conversationId].
 */
export async function startConversationAction(formData: FormData) {
  const listingId = (formData.get("listingId") as string | null) ?? "";
  const sellerId = (formData.get("sellerId") as string | null) ?? "";

  if (!listingId || !sellerId) {
    // Should not happen — inputs are filled server-side.
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — send them to the sign-in page with a return URL.
    redirect(`/auth/sign-in?next=${encodeURIComponent(`/product/${listingId}`)}`);
  }

  if (user.id === sellerId) {
    // Sellers cannot message themselves.
    redirect(`/product/${listingId}`);
  }

  const { data: blockedRelationships } = await supabase
    .from("blocked_users")
    .select("blocker_id, blocked_id")
    .or(
      `and(blocker_id.eq.${user.id},blocked_id.eq.${sellerId}),and(blocker_id.eq.${sellerId},blocked_id.eq.${user.id})`
    )
    .limit(1);

  if ((blockedRelationships ?? []).length > 0) {
    redirect(`/product/${listingId}`);
  }

  try {
    const conversationId = await findOrCreateConversation(
      listingId,
      user.id,
      sellerId
    );
    redirect(`/messages/${conversationId}`);
  } catch {
    // Fallback — return to product page on unexpected error.
    redirect(`/product/${listingId}`);
  }
}
