"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Toast = {
  id: string;
  conversationId: string;
  senderName: string;
  preview: string;
};

export default function MessageToastProvider({ userId }: { userId: string }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const convMapRef = useRef<Map<string, string>>(new Map());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Keep pathnameRef current so the Realtime callback doesn't close over stale value.
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    // Pre-load the user's conversations so we can map conversationId → other name.
    void supabase
      .from("conversations")
      .select(
        "id, buyer_id, seller_id, buyer_profile:profiles!buyer_id(full_name), seller_profile:profiles!seller_id(full_name)"
      )
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .then(({ data }) => {
        for (const row of data ?? []) {
          const isBuyer = row.buyer_id === userId;
          // Supabase returns the profile join as an object or array; normalise it.
          const raw = isBuyer ? row.seller_profile : row.buyer_profile;
          const profile = Array.isArray(raw) ? raw[0] : raw;
          convMapRef.current.set(row.id, (profile as { full_name?: string } | null)?.full_name ?? "Someone");
        }
      });

    // Subscribe to all message INSERTs for this user's conversations.
    // Supabase RLS on the messages table gates delivery to conversation participants only.
    const channel = supabase
      .channel(`toasts:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            expires_at: string;
          };

          // Ignore own messages.
          if (msg.sender_id === userId) return;

          const senderName = convMapRef.current.get(msg.conversation_id);
          if (!senderName) return;

          // Don't show toast while already viewing that conversation.
          const current = pathnameRef.current;
          if (
            current === `/messages/${msg.conversation_id}` ||
            current === `/chat/${msg.conversation_id}`
          )
            return;

          const preview =
            msg.content.length > 70 ? msg.content.slice(0, 70) + "…" : msg.content;

          const toast: Toast = {
            id: msg.id,
            conversationId: msg.conversation_id,
            senderName,
            preview,
          };

          setToasts((prev) => {
            // Bump an existing toast for the same conversation instead of stacking.
            const idx = prev.findIndex((t) => t.conversationId === toast.conversationId);
            if (idx >= 0) {
              const next = [...prev];
              // Clear old auto-dismiss timer.
              const oldTimer = timersRef.current.get(prev[idx].id);
              if (oldTimer) clearTimeout(oldTimer);
              timersRef.current.delete(prev[idx].id);
              next[idx] = toast;
              return next;
            }
            return [...prev, toast].slice(-4); // cap at 4 visible toasts
          });

          const timer = setTimeout(() => dismiss(toast.id), 5000);
          timersRef.current.set(toast.id, timer);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Clear all pending timers on cleanup.
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, [userId]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] hidden w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 md:flex"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-slate-900"
        >
          <span className="material-symbols-outlined mt-0.5 text-xl text-primary">
            chat
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {toast.senderName}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-300">
              {toast.preview}
            </p>
            <Link
              href={`/chat/${toast.conversationId}`}
              onClick={() => dismiss(toast.id)}
              className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
            >
              View →
            </Link>
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
