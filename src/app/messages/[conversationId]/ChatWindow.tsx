"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AvatarImage from "@/components/AvatarImage";
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  MESSAGE_EXPIRY_HOURS,
} from "@/lib/chatService";
import { blockUser, createReport } from "@/lib/safetyService";
import type { ReportType } from "@/types/database";
import type { MessageRow } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  currentUserAvatar: string | null;
  otherParticipant: Participant;
  listingId: string;
  listingTitle: string;
  blockedByCurrentUser: boolean;
  blockedByOtherUser: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Returns a human-readable "Disappears in …" label for a message expiry. */
function expiresInLabel(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    return `Disappears in ${Math.floor(hours / 24)}d`;
  }
  if (hours > 0 && minutes > 0) {
    return `Disappears in ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `Disappears in ${hours}h`;
  }
  if (minutes > 0) {
    return `Disappears in ${minutes}m`;
  }
  return "Disappearing soon";
}

/** Formats a timestamp as a short time string, e.g. "10:42 AM". */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ─── Message bubble ────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isOwn,
  senderAvatarUrl,
  senderName,
}: {
  message: MessageRow;
  isOwn: boolean;
  senderAvatarUrl: string | null;
  senderName: string;
}) {
  const [label, setLabel] = useState(() => expiresInLabel(message.expires_at));

  // Refresh the timer label every 60 seconds so it stays up-to-date.
  useEffect(() => {
    const id = setInterval(
      () => setLabel(expiresInLabel(message.expires_at)),
      60_000
    );
    return () => clearInterval(id);
  }, [message.expires_at]);

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-1 ml-auto max-w-[80%]">
        <div className="bg-primary text-white p-4 rounded-xl rounded-br-none shadow-lg shadow-primary/20">
          <p className="text-sm font-medium leading-relaxed">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 px-1">
          {/* Disappearing timer */}
          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
            <span className="material-symbols-outlined text-[10px]">timer</span>
            {label}
          </span>
          <span className="text-[10px] text-slate-400">{formatTime(message.created_at)}</span>
          <span className="material-symbols-outlined text-[10px] text-primary leading-none">
            done_all
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3 max-w-[80%]">
      <AvatarImage
        src={senderAvatarUrl}
        alt={senderName}
        className="size-8 rounded-full object-cover shrink-0"
        fallbackClassName="flex size-8 rounded-full shrink-0 items-center justify-center bg-primary/10 text-primary dark:bg-sky-400/10"
      />
      <div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[10px] text-slate-400">{formatTime(message.created_at)}</span>
          {/* Disappearing timer */}
          <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
            <span className="material-symbols-outlined text-[10px]">timer</span>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Quick replies ─────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "Is this still available?",
  "Where can we meet?",
  "Can you lower the price?",
  "Is it in good condition?",
];

// ─── Main component ────────────────────────────────────────────────────────

export default function ChatWindow({
  conversationId,
  currentUserId,
  currentUserAvatar,
  otherParticipant,
  listingId,
  listingTitle,
  blockedByCurrentUser,
  blockedByOtherUser,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportMode, setReportMode] = useState<ReportType | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isSavingSafetyAction, setIsSavingSafetyAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [locallyBlockedByCurrentUser, setLocallyBlockedByCurrentUser] = useState(
    blockedByCurrentUser
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBlockedByCurrentUser = locallyBlockedByCurrentUser;
  const isBlockedByOtherUser = blockedByOtherUser;
  const isMessagingDisabled = isBlockedByCurrentUser || isBlockedByOtherUser;

  const blockStatusMessage = isBlockedByCurrentUser
    ? "You have blocked this user"
    : isBlockedByOtherUser
    ? "You cannot message this user"
    : null;

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  // ── Load initial messages ──
  useEffect(() => {
    setIsLoading(true);
    fetchMessages(conversationId)
      .then((msgs) => {
        setMessages(msgs);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [conversationId]);

  // Scroll to bottom on first load (instant, no animation).
  useEffect(() => {
    if (!isLoading) scrollToBottom(false);
  }, [isLoading, scrollToBottom]);

  // ── Realtime subscription ──
  useEffect(() => {
    /**
     * Subscribe to postgres_changes INSERT events on the messages table,
     * filtered to this conversation. Deduplicate using message IDs so
     * optimistically-added messages aren't shown twice.
     */
    const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      scrollToBottom();
    });

    return unsubscribe; // cleans up the Supabase channel on unmount
  }, [conversationId, scrollToBottom]);

  // ── Auto-remove expired messages every 30 s ──
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setMessages((prev) =>
        prev.filter((m) => new Date(m.expires_at) > now)
      );
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ── Send message ──
  const handleSend = useCallback(async () => {
    if (isMessagingDisabled) return;

    const content = inputValue.trim();
    if (!content || isSending) return;

    setSendError(null);
    setInputValue("");
    setIsSending(true);

    try {
      const msg = await sendMessage(conversationId, content);
      // Optimistically add the message; the realtime callback deduplicates.
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/row-level security|blocked/i.test(message)) {
        setSendError("Messaging is disabled because one user has blocked the other.");
      } else {
        setSendError("Failed to send. Please try again.");
      }
      setInputValue(content); // restore on error
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }, [conversationId, inputValue, isMessagingDisabled, isSending, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Quick reply ──
  const handleQuickReply = (text: string) => {
    if (isMessagingDisabled) return;
    setInputValue(text);
    textareaRef.current?.focus();
  };

  const openReportModal = (type: ReportType) => {
    setReportMode(type);
    setReportReason("");
    setReportDetails("");
    setMenuOpen(false);
  };

  const handleBlockUser = async () => {
    setIsSavingSafetyAction(true);
    setActionFeedback(null);

    try {
      await blockUser(otherParticipant.id);
      setLocallyBlockedByCurrentUser(true);
      setActionFeedback("User blocked. Messaging has been disabled.");
    } catch (error) {
      setActionFeedback(
        error instanceof Error
          ? `Could not block user: ${error.message}`
          : "Could not block user."
      );
    } finally {
      setIsSavingSafetyAction(false);
      setMenuOpen(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportMode || !reportReason.trim()) return;

    setIsSavingSafetyAction(true);
    setActionFeedback(null);

    try {
      await createReport({
        reportType: reportMode,
        reportedUserId: otherParticipant.id,
        listingId: reportMode === "listing" ? listingId : undefined,
        conversationId: reportMode === "conversation" ? conversationId : undefined,
        reason: reportReason.trim(),
        details: reportDetails,
      });
      setActionFeedback("Report submitted. Thank you for helping keep CampusCart safe.");
      setReportMode(null);
      setReportReason("");
      setReportDetails("");
    } catch (error) {
      setActionFeedback(
        error instanceof Error
          ? `Could not submit report: ${error.message}`
          : "Could not submit report."
      );
    } finally {
      setIsSavingSafetyAction(false);
    }
  };

  // ── Partition messages by date for dividers ──
  const groupedMessages = useMemo(() => {
    const groups: { dateLabel: string; messages: MessageRow[] }[] = [];
    let currentLabel = "";

    for (const msg of messages) {
      const label = new Date(msg.created_at).toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ dateLabel: label, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [messages]);

  return (
    <section className="flex flex-1 flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 min-h-0">
      {/* ── Chat header ── */}
      <header className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative size-12">
            <AvatarImage
              src={otherParticipant.avatarUrl}
              alt={otherParticipant.name}
              className="size-full rounded-full object-cover"
              fallbackClassName="flex size-full rounded-full items-center justify-center bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-300"
            />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {otherParticipant.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
              Re: {listingTitle}
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          {/* Disappearing message notice */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-amber-50 dark:bg-amber-400/10 border border-amber-100 dark:border-amber-300/20 rounded-full px-3 py-1">
            <span className="material-symbols-outlined text-sm text-amber-500">timer</span>
            <span className="text-amber-700 dark:text-amber-300 font-medium">
              Messages expire in {MESSAGE_EXPIRY_HOURS}h
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="size-9 rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Conversation safety actions"
          >
            <span className="material-symbols-outlined text-lg leading-none">more_vert</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => openReportModal("user")}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-base">flag</span>
                Report User
              </button>
              <button
                type="button"
                onClick={() => openReportModal("conversation")}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-base">chat_info</span>
                Report Conversation
              </button>
              <button
                type="button"
                onClick={() => openReportModal("listing")}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span className="material-symbols-outlined text-base">inventory_2</span>
                Report Listing
              </button>
              <button
                type="button"
                onClick={handleBlockUser}
                disabled={isSavingSafetyAction || isBlockedByCurrentUser}
                className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-60 dark:border-slate-700 dark:text-rose-300 dark:hover:bg-rose-400/10"
              >
                <span className="material-symbols-outlined text-base">block</span>
                {isBlockedByCurrentUser ? "User Blocked" : "Block User"}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/30 dark:bg-slate-900/10 min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-3xl">
              progress_activity
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">
              chat_bubble_outline
            </span>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No messages yet
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Send a message to start the conversation.
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">timer</span>
              Messages automatically disappear after {MESSAGE_EXPIRY_HOURS} hours.
            </p>
          </div>
        ) : (
          <>
            {groupedMessages.map((group) => (
              <div key={group.dateLabel}>
                {/* Date divider */}
                <div className="flex justify-center mb-4">
                  <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-medium text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700 uppercase tracking-wider">
                    {group.dateLabel}
                  </span>
                </div>
                <div className="flex flex-col gap-6">
                  {group.messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === currentUserId}
                      senderAvatarUrl={
                        msg.sender_id === currentUserId
                          ? currentUserAvatar
                          : otherParticipant.avatarUrl
                      }
                      senderName={
                        msg.sender_id === currentUserId
                          ? "You"
                          : otherParticipant.name
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <footer className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
        {blockStatusMessage && (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200">
            {blockStatusMessage}
          </p>
        )}

        {actionFeedback && (
          <p className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {actionFeedback}
          </p>
        )}

        {/* Quick replies */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => handleQuickReply(reply)}
              disabled={isMessagingDisabled}
              className="shrink-0 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:border-primary/30 transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>

        {sendError && (
          <p className="text-xs text-red-500 mb-2">{sendError}</p>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              disabled={isSending || isMessagingDisabled}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 resize-none max-h-32 outline-none disabled:opacity-60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || isMessagingDisabled}
            className="size-11 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-400 text-white shadow-lg shadow-primary/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shrink-0"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-lg leading-none">
              {isSending ? "hourglass_empty" : "send"}
            </span>
          </button>
        </div>
      </footer>

      {reportMode && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {reportMode === "user"
                ? "Report User"
                : reportMode === "listing"
                ? "Report Listing"
                : "Report Conversation"}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Reports are reviewed by the CampusCart moderation team.
            </p>

            <label className="mt-4 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Reason
            </label>
            <input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. harassment, scam, inappropriate content"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <label className="mt-3 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Details (optional)
            </label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportMode(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSavingSafetyAction || !reportReason.trim()}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSavingSafetyAction ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
