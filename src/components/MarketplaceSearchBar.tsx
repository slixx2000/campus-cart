"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMarketplaceSearch } from "@/hooks/useMarketplaceSearch";

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
  const { results, totalCount, isLoading, error } = useMarketplaceSearch(query);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  const shouldShowDropdown = isFocused && hasQuery;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextQuery = query.trim();

    if (!nextQuery) {
      onSubmitQuery?.("");
      return;
    }

    if (onSubmitQuery) {
      onSubmitQuery(nextQuery);
      return;
    }

    router.push(`/browse?q=${encodeURIComponent(nextQuery)}`);
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
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay close slightly so click events on result links can fire first.
            window.setTimeout(() => setIsFocused(false), 120);
          }}
          placeholder={placeholder}
          className={inputClassName}
          aria-label="Search marketplace listings"
        />

        {shouldShowDropdown && (
          <div className="absolute top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-35px_rgba(15,23,42,0.65)] dark:border-white/10 dark:bg-[#07111f]">
            {isLoading ? (
              <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-300">Searching listings...</p>
            ) : error ? (
              <p className="px-4 py-3 text-sm text-amber-700 dark:text-amber-300">{error}</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                No listings found. Post a request to let sellers know what you need.
              </p>
            ) : (
              <div>
                <p className="border-b border-slate-200/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:text-slate-400">
                  {totalCount} results
                </p>
                <ul className="max-h-80 overflow-auto">
                  {results.map(({ listing, combinedScore }) => (
                    <li key={listing.id}>
                      <Link
                        href={`/product/${listing.id}`}
                        className="block px-4 py-3 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{listing.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                          ZMW {listing.price.toFixed(2)} - {listing.universityShortName ?? listing.university}
                        </p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                          Rank {combinedScore.toFixed(3)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
