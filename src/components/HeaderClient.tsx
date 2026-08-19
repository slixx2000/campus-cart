"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchUnreadCountAction } from "@/app/messages/actions";
import { createClient } from "@/lib/supabase/client";
import MarketplaceSearchBar from "@/components/MarketplaceSearchBar";
import ThemeToggle from "@/components/ThemeToggle";

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

  const navLinkClass =
    "shrink-0 text-sm font-medium text-muted transition-colors hover:text-fg";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 md:px-12">
        {/* Left: wordmark + primary nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="shrink-0 text-xl font-bold tracking-tight text-fg">
            CampusCart
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/browse" className={navLinkClass}>
              Marketplace
            </Link>
            <Link href="/about" className={navLinkClass}>
              About
            </Link>
            {user ? (
              <Link href="/messages" className={`${navLinkClass} relative`}>
                Messages
                {liveUnread > 0 ? (
                  <span className="absolute -right-4 -top-1 inline-flex min-w-[16px] justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-white">
                    {liveUnread > 9 ? "9+" : liveUnread}
                  </span>
                ) : null}
              </Link>
            ) : (
              <Link href="/downloads" className={navLinkClass}>
                Mobile App
              </Link>
            )}
            {isAdmin ? (
              <>
                <Link href="/admin/student-verifications" className={navLinkClass}>
                  Admin
                </Link>
                <Link href="/admin/promotions" className={navLinkClass}>
                  Promotions
                </Link>
              </>
            ) : null}
          </nav>
        </div>

        {/* Centre: search */}
        <MarketplaceSearchBar
          className="hidden max-w-md flex-1 md:flex"
          placeholder="Search marketplace..."
          inputClassName="block w-full rounded-md border border-line bg-surface-2 py-2 pl-9 pr-3 text-sm text-fg outline-none transition placeholder:text-muted/70 focus:border-fg focus:ring-2 focus:ring-fg/10"
        />

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {isAndroid && !isInstalled && installEvent ? (
            <button
              type="button"
              onClick={() => {
                void handleInstallClick();
              }}
              className="btn-secondary hidden px-3 py-1.5 text-xs md:inline-flex"
            >
              Install
            </button>
          ) : null}
          <ThemeToggle />
          {user ? (
            <Link
              href="/profile"
              aria-label="Your profile"
              className="hidden text-muted transition-colors hover:text-fg md:block"
            >
              <span className="material-symbols-outlined align-middle">person</span>
            </Link>
          ) : (
            <Link href="/auth/sign-in" className={`${navLinkClass} hidden md:block`}>
              Sign In
            </Link>
          )}
          <Link href="/sell" className="btn-primary relative px-4 py-2 text-sm">
            Sell
            {user ? (
              <span
                className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${
                  isVerifiedStudent ? "bg-accent" : "bg-danger"
                }`}
                title={
                  isVerifiedStudent
                    ? "Verified - Ready to sell"
                    : "Not verified - Link student email to sell"
                }
              />
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
