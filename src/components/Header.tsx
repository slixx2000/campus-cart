"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
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
    <header className="bg-green-700 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🛒</span>
            <span className="font-bold text-xl tracking-tight">
              Campus<span className="text-yellow-300">Cart</span>
            </span>
          </Link>

          {/* Search bar – hidden on mobile */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 mx-8 max-w-xl"
          >
            <div className="flex w-full rounded-full overflow-hidden border-2 border-yellow-300 focus-within:border-yellow-400 transition">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or services…"
                className="flex-1 px-4 py-1.5 text-gray-900 text-sm outline-none"
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-300 text-green-900 font-semibold px-4 text-sm transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/browse" className="hover:text-yellow-300 transition">
              Browse
            </Link>
            <Link href="/about" className="hover:text-yellow-300 transition">
              About
            </Link>
            <Link
              href="/sell"
              className="bg-yellow-400 hover:bg-yellow-300 text-green-900 px-4 py-1.5 rounded-full font-semibold transition"
            >
              + Sell
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded focus:outline-none"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white mb-1"></span>
            <span className="block w-5 h-0.5 bg-white"></span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-green-800 px-4 pb-4">
          <form onSubmit={handleSearch} className="flex mt-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className="flex-1 px-3 py-2 rounded-l text-gray-900 text-sm outline-none"
            />
            <button
              type="submit"
              className="bg-yellow-400 text-green-900 px-3 rounded-r text-sm font-semibold"
            >
              Go
            </button>
          </form>
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <Link
              href="/browse"
              onClick={() => setMenuOpen(false)}
              className="hover:text-yellow-300"
            >
              Browse
            </Link>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="hover:text-yellow-300"
            >
              About
            </Link>
            <Link
              href="/sell"
              onClick={() => setMenuOpen(false)}
              className="bg-yellow-400 text-green-900 px-4 py-2 rounded-full font-semibold text-center"
            >
              + Sell
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
