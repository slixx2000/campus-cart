"use client";

import { useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { SAMPLE_LISTINGS, CATEGORIES, UNIVERSITIES } from "@/lib/data";
import { Category } from "@/types";
import { Suspense } from "react";

function BrowseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = (searchParams.get("category") as Category) || "";
  const initialUniversity = searchParams.get("university") || "";
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<Category | "">(
    initialCategory
  );
  const [selectedUniversity, setSelectedUniversity] =
    useState(initialUniversity);
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">(
    "newest"
  );

  const filtered = useMemo(() => {
    let results = SAMPLE_LISTINGS;

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      results = results.filter((l) => l.category === selectedCategory);
    }

    if (selectedUniversity) {
      results = results.filter((l) =>
        l.university.toLowerCase().includes(selectedUniversity.toLowerCase())
      );
    }

    if (maxPrice !== "") {
      results = results.filter((l) => l.price <= maxPrice);
    }

    switch (sortBy) {
      case "price-asc":
        results = [...results].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        results = [...results].sort((a, b) => b.price - a.price);
        break;
      default:
        results = [...results].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return results;
  }, [query, selectedCategory, selectedUniversity, maxPrice, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedUniversity) params.set("university", selectedUniversity);
    router.push(`/browse?${params.toString()}`);
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("");
    setSelectedUniversity("");
    setMaxPrice("");
    setSortBy("newest");
    router.push("/browse");
  };

  const hasFilters =
    query || selectedCategory || selectedUniversity || maxPrice !== "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Browse Listings
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">
                Search
              </h3>
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search listings…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </form>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">
                Category
              </h3>
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as Category | "")
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">
                University
              </h3>
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="">All Universities</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.shortName} – {u.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">
                Max Price (K)
              </h3>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value ? Number(e.target.value) : "")
                }
                placeholder="No limit"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="w-full text-sm text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Sort + results count */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              {filtered.length}{" "}
              {filtered.length === 1 ? "listing" : "listings"} found
            </p>
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort"
                className="text-sm text-gray-600 shrink-0"
              >
                Sort:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "newest" | "price-asc" | "price-desc"
                  )
                }
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 flex-wrap mb-6">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.label ? "" : cat.label
                  )
                }
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  selectedCategory === cat.label
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg font-medium mb-2">No listings found</p>
              <p className="text-sm">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filtered.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading listings…</div>}>
      <BrowseContent />
    </Suspense>
  );
}
