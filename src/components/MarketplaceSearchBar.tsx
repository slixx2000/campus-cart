"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMarketplaceSearch } from "@/hooks/useMarketplaceSearch";

const RECENTS_KEY = "cc-recent-searches";
const MAX_RECENTS = 5;

function readRecents(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  try {
    const prev = readRecents();
    const next = [query, ...prev.filter((r) => r !== query)].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore storage errors */
  }
}

type MarketplaceSearchBarProps = {
  initialValue?: string;
  placeholder?: string;
  onSubmitQuery?: (query: string) => void;
  className?: string;
  inputClassName?: string;
};

export default function MarketplaceSearchBar({
  initialValue = "",
  placeholder = "Search listings...",
  onSubmitQuery,
  className,
  inputClassName,
}: MarketplaceSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { results, totalCount, isLoading, error } = useMarketplaceSearch(query);

  // Load recents client-side only.
  useEffect(() => {
    setRecentSearches(readRecents());
  }, []);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Reset keyboard highlight whenever the result list changes.
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  const showRecents = isFocused && !hasQuery && recentSearches.length > 0;
  const showResults = isFocused && hasQuery;
  const shouldShowDropdown = showRecents || showResults;

  const navigateTo = useCallback(
    (href: string) => {
      router.push(href);
      setIsFocused(false);
    },
    [router]
  );

  const commitSearch = (term: string) => {
    saveRecent(term);
    setRecentSearches(readRecents());
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    if (!next) {
      onSubmitQuery?.("");
      return;
    }
    // Navigate directly to the highlighted result if the user pressed Enter.
    if (activeIndex >= 0 && results[activeIndex]) {
      commitSearch(next);
      navigateTo(`/product/${results[activeIndex].listing.id}`);
      return;
    }
    commitSearch(next);
    if (onSubmitQuery) {
      onSubmitQuery(next);
      return;
    }
    navigateTo(`/browse?q=${encodeURIComponent(next)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (event.key === "Escape") {
      setIsFocused(false);
      setActiveIndex(-1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <span className="material-symbols-outlined">search</span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Small delay so clicks inside the dropdown can fire first.
            window.setTimeout(() => setIsFocused(false), 120);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClassName}
          aria-label="Search marketplace listings"
          aria-autocomplete="list"
          aria-expanded={shouldShowDropdown}
        />

        {shouldShowDropdown && (
          <div className="absolute top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.65)] dark:border-white/10 dark:bg-[#07111f]">
            {/* ── Recent searches ── */}
            {showRecents && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-2 dark:border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Recent
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(RECENTS_KEY);
                      setRecentSearches([]);
                    }}
                    className="text-[10px] text-slate-400 hover:text-primary"
                  >
                    Clear
                  </button>
                </div>
                <ul>
                  {recentSearches.map((term) => (
                    <li key={term}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                        onMouseDown={() => {
                          setQuery(term);
                          navigateTo(`/browse?q=${encodeURIComponent(term)}`);
                        }}
                      >
                        <span className="material-symbols-outlined text-base text-slate-400">
                          history
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-200">{term}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Live results ── */}
            {showResults &&
              (isLoading ? (
                <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
                  Searching listings...
                </p>
              ) : error ? (
                <p className="px-4 py-3 text-sm text-amber-700 dark:text-amber-300">{error}</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  No listings found. Post a request to let sellers know what you need.
                </p>
              ) : (
                <div>
                  <p className="border-b border-slate-200/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:text-slate-400">
                    {totalCount} result{totalCount !== 1 ? "s" : ""}
                  </p>
                  <ul className="max-h-80 overflow-auto" role="listbox">
                    {results.map(({ listing }, index) => (
                      <li key={listing.id} role="option" aria-selected={activeIndex === index}>
                        <Link
                          href={`/product/${listing.id}`}
                          onClick={() => commitSearch(query.trim())}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                            activeIndex === index
                              ? "bg-slate-100 dark:bg-white/10"
                              : "hover:bg-slate-100 dark:hover:bg-white/10"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">
                              {listing.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                              ZMW {listing.price.toFixed(2)} ·{" "}
                              {listing.universityShortName ?? listing.university}
                            </p>
                          </div>
                          <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                            {listing.category}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </div>
    </form>
  );
}
