"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, type ReactNode } from "react";
import MarketplaceSearchBar from "@/components/MarketplaceSearchBar";
import { useUniversities } from "@/hooks/useUniversities";
import type { CategoryRow } from "@/types/database";

interface BrowseFiltersProps {
  categories: CategoryRow[];
  count: number;
  children: ReactNode;
  showPagination?: boolean;
}

export default function BrowseFilters({
  categories,
  count,
  children,
  showPagination = true,
}: BrowseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { universities, isLoading, error } = useUniversities();

  const get = (key: string) => searchParams.get(key) ?? "";

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      // Reset to page 1 on filter change
      params.delete("page");
      router.push(`/browse?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAll = () => router.push("/browse");

  const hasFilters =
    get("q") || get("category") || get("university") || get("maxPrice") || get("type");

  const sortBy = get("sort") || "newest";
  const currentPage = Number(get("page") || 1);

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <aside className="w-full shrink-0 space-y-6 md:w-72">
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Filters</h3>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-sm font-medium text-primary hover:underline dark:text-sky-300"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <MarketplaceSearchBar
                initialValue={get("q")}
                placeholder="Search listings..."
                onSubmitQuery={(nextQuery) => push({ q: nextQuery })}
                inputClassName="w-full rounded-full border border-slate-200 bg-slate-100 py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
              />
            </div>

            {/* Category */}
            <fieldset className="space-y-3 mb-6">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Category
              </legend>
              <div className="space-y-2 mt-2">
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="category"
                    checked={!get("category")}
                    onChange={() => push({ category: "" })}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-primary dark:text-slate-200 dark:group-hover:text-sky-300">
                    All Categories
                  </span>
                </label>
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="group flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={get("category") === c.slug}
                      onChange={() => push({ category: c.slug })}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-primary dark:text-slate-200 dark:group-hover:text-sky-300">
                      {c.name}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Price Range */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Max Price (ZMW)
              </h4>
              <input
                type="number"
                defaultValue={get("maxPrice")}
                placeholder="Max ZMW"
                onBlur={(e) => push({ maxPrice: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    push({ maxPrice: (e.target as HTMLInputElement).value });
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
              />
            </div>

            {/* University */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                University
              </h4>
              {error && (
                <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
              )}
              <select
                value={get("university")}
                disabled={isLoading || universities.length === 0}
                onChange={(e) => push({ university: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-white/10 dark:bg-[#0d1a2b] dark:text-white dark:focus:border-sky-300 dark:focus:ring-sky-300"
              >
                <option value="">
                  {isLoading
                    ? "Loading universities..."
                    : universities.length === 0
                    ? "No universities available"
                    : "All Universities"}
                </option>
                {universities.map((u) => (
                  <option key={u.id} value={u.code}>
                    {u.short_name} — {u.city}
                  </option>
                ))}
              </select>
              {!isLoading && !error && universities.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No universities found in the database.
                </p>
              )}
            </div>

            {/* Listing Type */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Listing Type
              </legend>
              <div className="space-y-2 mt-2">
                {(
                  [
                    { value: "", label: "All" },
                    { value: "products", label: "Products" },
                    { value: "services", label: "Services" },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={label}
                    className="group flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="radio"
                      name="listing-type"
                      checked={get("type") === value}
                      onChange={() => push({ type: value })}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-primary dark:text-slate-200 dark:group-hover:text-sky-300">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
        </div>

        <div className="rounded-[1.5rem] border border-primary/20 bg-primary/10 p-5 dark:border-sky-400/20 dark:bg-sky-400/10">
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-primary dark:text-sky-200">
            <span className="material-symbols-outlined text-lg">verified_user</span>
              Campus Verified
            </p>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Shop with confidence. All sellers are verified university students.
            </p>
        </div>
      </aside>

      <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(["newest", "price-asc", "price-desc"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => push({ sort: s })}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    sortBy === s
                      ? "bg-primary text-white dark:bg-sky-400 dark:text-slate-950"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {s === "newest"
                    ? "Newest"
                    : s === "price-asc"
                    ? "Price: Low to High"
                    : "Price: High to Low"}
                </button>
              ))}
            </div>
            <p className="whitespace-nowrap text-sm font-medium text-slate-500 dark:text-slate-400">
              Showing {count} {count === 1 ? "result" : "results"}
            </p>
          </div>

          {children}

          {showPagination && count > 12 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => push({ page: String(Math.max(1, currentPage - 1)) })}
                disabled={currentPage <= 1}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium transition-colors hover:border-primary disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:border-sky-300"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                Page {currentPage}
              </span>
              <button
                onClick={() => push({ page: String(currentPage + 1) })}
                disabled={currentPage * 12 >= count}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium transition-colors hover:border-primary disabled:opacity-40 dark:border-white/10 dark:text-slate-200 dark:hover:border-sky-300"
              >
                Next →
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
