import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConversationsForUser } from "@/lib/repositories/conversations";
import ConversationList from "./ConversationList";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/messages");
  }

  const conversations = await getConversationsForUser(user.id).catch(() => []);

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
          Messages
        </h1>

        <div className="flex gap-4 h-[calc(100vh-180px)]">
          {/* Conversation sidebar */}
          <ConversationList conversations={conversations} />

          {/* Empty state — prompt to select a conversation */}
          <section className="hidden md:flex flex-1 flex-col items-center justify-center bg-surface dark:bg-slate-900/70 rounded-2xl border border-line shadow-sm">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
              forum
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Select a conversation
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
              Choose a conversation from the left to start chatting, or browse
              listings and click &ldquo;Message Seller&rdquo; to begin a new one.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
