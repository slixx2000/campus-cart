"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchUnreadCountAction } from "@/app/messages/actions";
import { createClient } from "@/lib/supabase/client";
import MarketplaceSearchBar from "@/components/MarketplaceSearchBar";
import ThemeToggle from "@/components/ThemeToggle";
import SlideTabs from "@/components/slide-tabs";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface HeaderClientProps {
  user: { id: string; email: string } | null;
  isVerifiedStudent?: boolean;
  isAdmin?: boolean;
  unreadMessages?: number;
}

export default function HeaderClient({
  user,
  isVerifiedStudent = false,
  isAdmin = false,
  unreadMessages = 0,
}: HeaderClientProps) {
  const [liveUnread, setLiveUnread] = useState(unreadMessages);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Sync server-fetched initial value when it changes (e.g., full navigation).
  useEffect(() => {
    setLiveUnread(unreadMessages);
  }, [unreadMessages]);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(ua));

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstallEvent(null);
  };

  // Subscribe to conversation changes via Realtime to keep the badge live.
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const refresh = () => {
      void fetchUnreadCountAction().then(setLiveUnread);
    };

    // Two channels so we catch events where this user is buyer or seller.
    const buyerChannel = supabase
      .channel(`header:conv:buyer:${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `buyer_id=eq.${user.id}`,
      }, refresh)
      .subscribe();

    const sellerChannel = supabase
      .channel(`header:conv:seller:${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `seller_id=eq.${user.id}`,
      }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(buyerChannel);
      supabase.removeChannel(sellerChannel);
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 w-full border border-white/20 bg-white/70 px-3 py-2.5 shadow-lg backdrop-blur-md md:px-6 dark:bg-neutral-900/70">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl font-bold">
              shopping_cart_checkout
            </span>
            <h2 className="text-slate-900 text-[clamp(0.82rem,1vw,1.1rem)] font-bold leading-tight tracking-tight dark:text-white">
              CampusCart
            </h2>
          </Link>

          <MarketplaceSearchBar
            className="flex min-w-[150px] w-[min(34vw,340px)]"
            placeholder="Search textbooks, electronics, services..."
            inputClassName="block w-full rounded-full border-none bg-slate-200/60 py-1.5 pl-9 pr-3 text-[clamp(0.68rem,0.88vw,0.84rem)] text-slate-900 placeholder-slate-500 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary dark:bg-primary/10 dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-white/10"
          />
        </div>

        <nav className="no-scrollbar flex max-w-[54%] min-w-0 items-center gap-1.5 overflow-x-auto pl-1">
          {isAndroid && !isInstalled && installEvent ? (
            <button
              type="button"
              onClick={() => {
                void handleInstallClick();
              }}
              className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
            >
              Install
            </button>
          ) : null}
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin ? (
                <Link
                  href="/admin/student-verifications"
                  className="shrink-0 text-[clamp(0.68rem,0.85vw,0.8rem)] font-semibold text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
                >
                  Admin
                </Link>
              ) : null}
              <SlideTabs unreadMessages={liveUnread} />
            </>
          ) : (
            <>
              <Link
                href="/browse"
                className="shrink-0 text-[clamp(0.68rem,0.85vw,0.8rem)] font-semibold text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
              >
                Browse
              </Link>
              <Link
                href="/downloads"
                className="shrink-0 text-[clamp(0.68rem,0.85vw,0.8rem)] font-semibold text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
              >
                Mobile App
              </Link>
              <Link
                href="/about"
                className="shrink-0 text-[clamp(0.68rem,0.85vw,0.8rem)] font-semibold text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
              >
                About
              </Link>
              <Link
                href="/auth/sign-in"
                className="shrink-0 text-[clamp(0.68rem,0.85vw,0.8rem)] font-semibold text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
              >
                Sign In
              </Link>
            </>
          )}
          <Link
            href="/sell"
            className="relative inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/45 bg-gradient-to-r from-primary to-sky-400 px-2.5 py-1 text-[clamp(0.68rem,0.85vw,0.8rem)] font-bold text-sky-950 shadow-lg shadow-primary/25 transition-all hover:opacity-95 active:scale-[0.98] dark:border-primary/60 dark:text-white dark:shadow-primary/45"
          >
            <span className="material-symbols-outlined text-sm leading-none">
              add_circle
            </span>
            Sell Item
            {user && (
              <span
                className={`absolute top-0 right-0 h-2.5 w-2.5 rounded-full ${
                  isVerifiedStudent
                    ? "bg-emerald-400"
                    : "bg-red-400"
                }`}
                title={isVerifiedStudent ? "Verified - Ready to sell" : "Not verified - Link student email to sell"}
              />
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
