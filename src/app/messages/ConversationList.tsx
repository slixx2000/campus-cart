import Link from "next/link";
import AvatarImage from "@/components/AvatarImage";
import type { ConversationPreview } from "@/lib/repositories/conversations";

/** Returns e.g. "2m ago", "3h ago", "1d ago" relative to the given ISO string. */
function timeAgoLabel(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diffMs / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch {
    return "";
  }
}

interface ConversationListProps {
  conversations: ConversationPreview[];
  activeId?: string;
}

/** Renders the sidebar conversation list used on both /messages and /messages/[id]. */
export default function ConversationList({
  conversations,
  activeId,
}: ConversationListProps) {
  return (
    <aside className="w-80 flex-shrink-0 flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
      {/* Sidebar header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
          Messages
        </h3>
      </div>

      {/* Conversation rows */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3">
              chat_bubble_outline
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No conversations yet
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Browse listings and click "Message Seller" to start one.
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const timeAgo = timeAgoLabel(conv.last_message_at ?? conv.updated_at);

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`flex gap-3 p-4 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800 ${
                  isActive
                    ? "bg-primary/5 border-l-4 border-l-primary"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border-l-4 border-l-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative size-12 shrink-0">
                  <AvatarImage
                    src={conv.other_participant_avatar}
                    alt={conv.other_participant_name}
                    className="size-full rounded-full object-cover"
                    fallbackClassName="flex size-full rounded-full items-center justify-center bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-300"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {conv.other_participant_name}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {timeAgo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {conv.last_message_content ?? "Start the conversation…"}
                  </p>
                  <span className="text-[10px] font-medium text-primary mt-1 block truncate">
                    {conv.listing_title}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </aside>
  );
}
