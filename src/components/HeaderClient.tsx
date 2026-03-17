"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutAction } from "@/app/auth/actions";
import { fetchUnreadCountAction } from "@/app/messages/actions";
import { createClient } from "@/lib/supabase/client";
import MarketplaceSearchBar from "@/components/MarketplaceSearchBar";
import ThemeToggle from "@/components/ThemeToggle";
import SlideTabs from "@/components/slide-tabs";

interface HeaderClientProps {
  user: { id: string; email: string } | null;
  unreadMessages?: number;
}

export default function HeaderClient({
  user,
  unreadMessages = 0,
}: HeaderClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveUnread, setLiveUnread] = useState(unreadMessages);

  // Sync server-fetched initial value when it changes (e.g., full navigation).
  useEffect(() => {
    setLiveUnread(unreadMessages);
  }, [unreadMessages]);

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
    <header className="sticky top-0 z-50 w-full px-4 md:px-8 py-3 border-b border-primary/10 bg-background-light/80 backdrop-blur-md dark:border-primary/20 dark:bg-background-dark/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo + search */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-primary shrink-0">
            <span className="material-symbols-outlined text-3xl font-bold">
              shopping_cart_checkout
            </span>
            <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight dark:text-white">
              CampusCart
            </h2>
          </Link>

          {/* Desktop search */}
          <MarketplaceSearchBar
            className="hidden md:flex flex-1 min-w-[280px] xl:min-w-[380px]"
            placeholder="Search textbooks, electronics, services..."
            inputClassName="block w-full rounded-full border-none bg-slate-200/60 py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-500 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary dark:bg-primary/10 dark:text-white dark:placeholder:text-slate-400 dark:focus:bg-white/10"
          />
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3 md:gap-5">
          <ThemeToggle />
          {user ? (
            <SlideTabs unreadMessages={liveUnread} />
          ) : (
            <>
              <Link
                href="/browse"
                className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors dark:text-slate-300"
              >
                Browse
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors dark:text-slate-300"
              >
                About
              </Link>
              <Link
                href="/auth/sign-in"
                className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors dark:text-slate-300"
              >
                Sign In
              </Link>
            </>
          )}
          <Link
            href="/sell"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg leading-none">
              add_circle
            </span>
            Sell Item
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors dark:text-slate-200 dark:hover:bg-white/10"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="material-symbols-outlined">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4 mt-3 dark:bg-background-dark dark:border-primary/10">
          <MarketplaceSearchBar
            className="mt-3 mb-4 flex"
            placeholder="Search..."
            inputClassName="w-full rounded-full border-none bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary dark:bg-primary/10 dark:text-white dark:placeholder:text-slate-400"
          />
          <div className="mb-3 flex justify-end">
            <ThemeToggle />
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              href="/browse"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors dark:text-slate-200 dark:hover:bg-white/10"
            >
              Browse
            </Link>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors dark:text-slate-200 dark:hover:bg-white/10"
            >
              About
            </Link>
            {user ? (
              <>
                <Link
                  href="/messages"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors dark:text-slate-200 dark:hover:bg-white/10"
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors dark:text-slate-200 dark:hover:bg-white/10"
                >
                  My Profile
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/auth/sign-in"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors dark:text-slate-200 dark:hover:bg-white/10"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/sell"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-full font-bold text-sm mt-1 justify-center"
            >
              <span className="material-symbols-outlined text-lg leading-none">
                add_circle
              </span>
              Sell Item
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
