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
    get("q") ||
    get("category") ||
    get("university") ||
    get("minPrice") ||
    get("maxPrice") ||
    get("condition") ||
    get("type");

  const selectedConditions = get("condition").split(",").filter(Boolean);

  const toggleCondition = (value: string) => {
    const next = selectedConditions.includes(value)
      ? selectedConditions.filter((c) => c !== value)
      : [...selectedConditions, value];
    push({ condition: next.join(",") });
  };

  const sortBy = get("sort") || "newest";
  const currentPage = Number(get("page") || 1);

  const filtersPanel = (
    <div className="card p-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-fg">Filters</h3>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm font-medium text-muted hover:text-fg"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mb-4 sm:mb-6">
        <MarketplaceSearchBar
          initialValue={get("q")}
          placeholder="Search listings..."
          onSubmitQuery={(nextQuery) => push({ q: nextQuery })}
          inputClassName="input pl-10"
        />
      </div>

      <fieldset className="mb-4 space-y-3 sm:mb-6">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted">
          Category
        </legend>
        <div className="mt-2 space-y-2">
          <label className="group flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name="category"
              checked={!get("category")}
              onChange={() => push({ category: "" })}
              className="accent-fg"
            />
            <span className="text-sm text-fg">
              All Categories
            </span>
          </label>
          {categories.map((c) => (
            <label key={c.id} className="group flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="category"
                checked={get("category") === c.slug}
                onChange={() => push({ category: c.slug })}
                className="accent-fg"
              />
              <span className="text-sm text-fg">
                {c.name}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-6 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          Price (K)
        </h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            defaultValue={get("minPrice")}
            placeholder="Min"
            aria-label="Minimum price in Kwacha"
            onBlur={(e) => push({ minPrice: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") push({ minPrice: (e.target as HTMLInputElement).value });
            }}
            className="input"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min={0}
            defaultValue={get("maxPrice")}
            placeholder="Max"
            aria-label="Maximum price in Kwacha"
            onBlur={(e) => push({ maxPrice: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") push({ maxPrice: (e.target as HTMLInputElement).value });
            }}
            className="input"
          />
        </div>
      </div>

      <fieldset className="mb-6 space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted">
          Condition
        </legend>
        <div className="mt-2 space-y-2">
          {(
            [
              { value: "new", label: "New" },
              { value: "like_new", label: "Like New" },
              { value: "good", label: "Good" },
              { value: "fair", label: "Fair" },
            ] as const
          ).map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={selectedConditions.includes(value)}
                onChange={() => toggleCondition(value)}
                className="accent-fg"
              />
              <span className="text-sm text-fg">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-4 space-y-3 sm:mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
          University
        </h4>
        {error && <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>}
        <select
          value={get("university")}
          disabled={isLoading || universities.length === 0}
          onChange={(e) => push({ university: e.target.value })}
          className="input"
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
              {u.short_name} - {u.city}
            </option>
          ))}
        </select>
        {!isLoading && !error && universities.length === 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No universities found in the database.
          </p>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-muted">
          Listing Type
        </legend>
        <div className="mt-2 space-y-2">
          {(
            [
              { value: "", label: "All" },
              { value: "products", label: "Products" },
              { value: "services", label: "Services" },
            ] as const
          ).map(({ value, label }) => (
            <label key={label} className="group flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="listing-type"
                checked={get("type") === value}
                onChange={() => push({ type: value })}
                className="accent-fg"
              />
              <span className="text-sm text-fg">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 md:flex-row md:gap-8">
      <aside className="w-full shrink-0 space-y-4 md:w-72 md:space-y-6">
        <details className="md:hidden">
          <summary className="card cursor-pointer list-none px-4 py-3 text-sm font-semibold text-fg">
            <span className="flex items-center justify-between gap-4">
              <span>Filters</span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {hasFilters ? "active" : "show"}
              </span>
            </span>
          </summary>
          <div className="mt-3">{filtersPanel}</div>
        </details>

        <div className="hidden md:block">{filtersPanel}</div>

      </aside>

      <div className="flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Showing <span className="font-bold">{count}</span>{" "}
            {count === 1 ? "result" : "results"}
          </h1>
          <label className="flex items-center gap-2">
            <span className="sr-only">Sort results</span>
            <select
              value={sortBy}
              onChange={(e) => push({ sort: e.target.value })}
              className="input w-auto py-2"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </label>
        </div>

        {children}

        {showPagination && count > 12 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => push({ page: String(Math.max(1, currentPage - 1)) })}
              disabled={currentPage <= 1}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-primary disabled:opacity-40 dark:text-slate-200 dark:hover:border-sky-300"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
              Page {currentPage}
            </span>
            <button
              onClick={() => push({ page: String(currentPage + 1) })}
              disabled={currentPage * 12 >= count}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-primary disabled:opacity-40 dark:text-slate-200 dark:hover:border-sky-300"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
