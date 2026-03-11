"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";

interface HeaderClientProps {
  user: { id: string; email: string } | null;
}

export default function HeaderClient({ user }: HeaderClientProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 md:px-8 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo + search */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-primary shrink-0">
            <span className="material-symbols-outlined text-3xl font-bold">
              shopping_cart_checkout
            </span>
            <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">
              CampusCart
            </h2>
          </Link>

          {/* Desktop search */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 min-w-[280px] xl:min-w-[380px]"
          >
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search textbooks, electronics, services..."
                className="block w-full pl-10 pr-3 py-2 border-none bg-slate-100 rounded-full text-sm placeholder-slate-500 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
              />
            </div>
          </form>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3 md:gap-5">
          <Link
            href="/browse"
            className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/about"
            className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
          >
            About
          </Link>
          {user ? (
            <>
              <Link
                href="/my-listings"
                className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
              >
                My Listings
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
            >
              Sign In
            </Link>
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
          className="md:hidden p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
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
        <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4 mt-3">
          <form onSubmit={handleSearch} className="flex mt-3 mb-4">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm border-none outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-1">
            <Link
              href="/browse"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
            >
              About
            </Link>
            {user ? (
              <>
                <Link
                  href="/my-listings"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
                >
                  My Listings
                </Link>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/auth/sign-in"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
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
