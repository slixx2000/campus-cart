import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getConversationById,
  getConversationsForUser,
} from "@/lib/repositories/conversations";
import ConversationList from "@/app/messages/ConversationList";
import ChatWindow from "./ChatWindow";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/sign-in?next=/messages/${conversationId}`);
  }

  // Load the target conversation and the sidebar list in parallel.
  const [conversation, conversations] = await Promise.all([
    getConversationById(conversationId, user.id),
    getConversationsForUser(user.id).catch(() => []),
  ]);

  if (!conversation) notFound();

  // Fetch the current user's profile avatar for outgoing message bubbles.
  const { data: selfProfile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background-light dark:bg-[#07111f]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 md:hidden">
          Messages
        </h1>

        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Sidebar — hidden on mobile, full-width list on /messages */}
          <div className="hidden md:flex">
            <ConversationList
              conversations={conversations}
              activeId={conversationId}
            />
          </div>

          {/* Chat pane */}
          <ChatWindow
            conversationId={conversationId}
            currentUserId={user.id}
            currentUserAvatar={selfProfile?.avatar_url ?? null}
            otherParticipant={{
              id: conversation.other_participant_id,
              name: conversation.other_participant_name,
              avatarUrl: conversation.other_participant_avatar,
            }}
            listingId={conversation.listing_id}
            listingTitle={conversation.listing_title}
            blockedByCurrentUser={conversation.blocked_by_current_user}
            blockedByOtherUser={conversation.blocked_by_other_user}
          />
        </div>
      </div>
    </div>
  );
}
