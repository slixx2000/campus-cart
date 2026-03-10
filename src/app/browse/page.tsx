"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { SAMPLE_LISTINGS, CATEGORIES, UNIVERSITIES } from "@/lib/data";
import { Category } from "@/types";

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
  const [listingType, setListingType] = useState<"all" | "products" | "services">("all");
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
    if (listingType === "products") {
      results = results.filter((l) => !l.isService);
    } else if (listingType === "services") {
      results = results.filter((l) => l.isService);
    }

    switch (sortBy) {
      case "price-asc":
        return [...results].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...results].sort((a, b) => b.price - a.price);
      default:
        return [...results].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [query, selectedCategory, selectedUniversity, maxPrice, listingType, sortBy]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("");
    setSelectedUniversity("");
    setMaxPrice("");
    setListingType("all");
    setSortBy("newest");
    router.push("/browse");
  };

  const hasFilters =
    query || selectedCategory || selectedUniversity || maxPrice !== "" || listingType !== "all";

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
                  onClick={clearFilters}
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
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search listings..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-100 rounded-full text-sm border-none outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Category -- radio buttons (single select) */}
            <fieldset className="space-y-3 mb-6">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Category
              </legend>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === ""}
                    onChange={() => setSelectedCategory("")}
                    className="text-primary focus:ring-primary bg-slate-100 border-slate-300"
                  />
                  <span className="text-sm font-medium group-hover:text-primary">
                    All Categories
                  </span>
                </label>
                {CATEGORIES.map((c) => (
                  <label
                    key={c.label}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === c.label}
                      onChange={() => setSelectedCategory(c.label)}
                      className="text-primary focus:ring-primary bg-slate-100 border-slate-300"
                    />
                    <span className="text-sm font-medium group-hover:text-primary">
                      {c.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Price Range */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Price Range
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="Max ZMW"
                  className="w-full px-3 py-2 bg-slate-100 rounded-md text-sm border-none outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* University */}
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                University
              </h4>
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 rounded-md text-sm border-none outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Universities</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.shortName} -- {u.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Listing Type -- functional radio buttons */}
            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Listing Type
              </legend>
              <div className="space-y-2 mt-2">
                {(
                  [
                    { value: "all", label: "All" },
                    { value: "products", label: "Products" },
                    { value: "services", label: "Services" },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="listing-type"
                      value={value}
                      checked={listingType === value}
                      onChange={() => setListingType(value)}
                      className="text-primary focus:ring-primary bg-slate-100 border-slate-300"
                    />
                    <span className="text-sm font-medium group-hover:text-primary">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Campus Verified badge */}
          <div className="bg-primary/10 p-5 rounded-xl border border-primary/20">
            <p className="text-primary text-sm font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                verified_user
              </span>
              Campus Verified
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Shop with confidence. All sellers are verified university
              students.
            </p>
          </div>
        </aside>

        {/* Main listing area */}
        <div className="flex-1 space-y-6">
          {/* Sort + results */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(["newest", "price-asc", "price-desc"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
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
              Showing {filtered.length}{" "}
              {filtered.length === 1 ? "result" : "results"}
            </p>
          </div>

          {/* Listings grid */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">
                search_off
              </span>
              <p className="text-lg font-bold text-slate-700 mb-2">
                No listings found
              </p>
              <p className="text-sm text-slate-500">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Loading listings...
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
