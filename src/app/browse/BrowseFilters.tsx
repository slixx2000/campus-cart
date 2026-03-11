"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useUniversities } from "@/hooks/useUniversities";
import type { CategoryRow } from "@/types/database";

interface BrowseFiltersProps {
  categories: CategoryRow[];
  count: number;
}

export default function BrowseFilters({
  categories,
  count,
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
    <div className="bg-background-light min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900">Filters</h3>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">
                  search
                </span>
                <input
                  type="text"
                  defaultValue={get("q")}
                  placeholder="Search listings..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      push({ q: (e.target as HTMLInputElement).value });
                  }}
                  onBlur={(e) => push({ q: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 bg-slate-100 rounded-full text-sm border-none outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Category */}
            <fieldset className="space-y-3 mb-6">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Category
              </legend>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={!get("category")}
                    onChange={() => push({ category: "" })}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium group-hover:text-primary">
                    All Categories
                  </span>
                </label>
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={get("category") === c.slug}
                      onChange={() => push({ category: c.slug })}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium group-hover:text-primary">
                      {c.name}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Price Range */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                className="w-full px-3 py-2 bg-slate-100 rounded-md text-sm border-none outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* University */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                University
              </h4>
              {error && (
                <p className="text-xs text-amber-700">{error}</p>
              )}
              <select
                value={get("university")}
                disabled={isLoading || universities.length === 0}
                onChange={(e) => push({ university: e.target.value })}
                className="w-full px-3 py-2 bg-slate-100 rounded-md text-sm border-none outline-none focus:ring-1 focus:ring-primary"
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
                <p className="text-xs text-slate-500">
                  No universities found in the database.
                </p>
              )}
            </div>

            {/* Listing Type */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="listing-type"
                      checked={get("type") === value}
                      onChange={() => push({ type: value })}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium group-hover:text-primary">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="bg-primary/10 p-5 rounded-xl border border-primary/20">
            <p className="text-primary text-sm font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">verified_user</span>
              Campus Verified
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Shop with confidence. All sellers are verified university students.
            </p>
          </div>
        </aside>

        {/* Main area — sort bar + pagination */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(["newest", "price-asc", "price-desc"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => push({ sort: s })}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    sortBy === s
                      ? "bg-primary text-white"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
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
            <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
              Showing {count} {count === 1 ? "result" : "results"}
            </p>
          </div>

          {/* Pagination rendered server-side; these are just nav arrows */}
          {count > 12 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => push({ page: String(Math.max(1, currentPage - 1)) })}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-full border border-slate-200 text-sm font-medium disabled:opacity-40 hover:border-primary transition-colors"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-slate-500">
                Page {currentPage}
              </span>
              <button
                onClick={() => push({ page: String(currentPage + 1) })}
                disabled={currentPage * 12 >= count}
                className="px-4 py-2 rounded-full border border-slate-200 text-sm font-medium disabled:opacity-40 hover:border-primary transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
