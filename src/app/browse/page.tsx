import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { getListings } from "@/lib/repositories/listings";
import { getAllCategories } from "@/lib/repositories/universities";
import { dbListingToUi } from "@/lib/mappers";
import BrowseFilters from "./BrowseFilters";

type SortBy = "newest" | "price-asc" | "price-desc";

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    university?: string;
    maxPrice?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
}

async function BrowseResults({ searchParams }: BrowsePageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  const isService =
    sp.type === "services" ? true : sp.type === "products" ? false : undefined;

  const { data: rows, count } = await getListings({
    query: sp.q,
    category: sp.category,
    university: sp.university,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    isService,
    sortBy: (sp.sort as SortBy) || "newest",
    page,
    pageSize: 12,
  });

  const categories = await getAllCategories();

  const listings = rows.map(dbListingToUi);

  return (
    <div className="bg-background-light min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar + sort/pagination controls (client island) */}
        <Suspense fallback={null}>
          <BrowseFilters categories={categories} count={count} />
        </Suspense>

        {/* Listings grid — server rendered */}
        <div className="flex-1">
          {listings.length === 0 ? (
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
              {listings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage(props: BrowsePageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">
          Loading listings…
        </div>
      }
    >
      <BrowseResults {...props} />
    </Suspense>
  );
}
