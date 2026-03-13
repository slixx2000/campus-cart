import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { getListings } from "@/lib/repositories/listings";
import { getAllCategories } from "@/lib/repositories/universities";
import { dbListingToUi } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types";
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

  const isService =
    sp.type === "services" ? true : sp.type === "products" ? false : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userUniversityId = user
    ? (
        await supabase
          .from("profiles")
          .select("university_id")
          .eq("id", user.id)
          .maybeSingle()
      ).data?.university_id ?? null
    : null;

  const { data: rows, count } = await getListings({
    query: sp.q,
    category: sp.category,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    isService,
    sortBy: (sp.sort as SortBy) || "newest",
    disablePagination: true,
  });

  const categories = await getAllCategories();

  // Ranking logic:
  // 1) Fetch all active listings once (global feed, not restricted to one university).
  // 2) Compute "nearby" client-side by comparing listing.university_id to user.university_id.
  // 3) Render independent sections for Featured, Nearby, and All Listings.
  const allListings = rows.map((row) => {
    const listing = dbListingToUi(row);
    const isNearby = Boolean(userUniversityId && row.university_id === userUniversityId);
    return { ...listing, isNearby } as Listing;
  });

  const featuredListings = allListings.filter((listing) => listing.featured);
  const nearbyListings = allListings.filter((listing) => listing.isNearby);

  const renderSection = (title: string, items: Listing[]) => (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {items.length} items
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-5 py-7 text-sm text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400">
          Nothing to show in this section yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((listing) => (
            <ProductCard key={`${title}-${listing.id}`} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-background-light text-slate-900 transition-colors dark:bg-[#07111f] dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5 dark:shadow-[0_35px_120px_-55px_rgba(8,15,33,0.95)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80 dark:text-sky-300">
                Marketplace Feed
              </span>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Browse campus listings with live filters
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Search verified student listings, refine by category or university,
                and move between results without leaving the page context.
              </p>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4 dark:border-sky-400/20 dark:bg-sky-400/10">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary/80 dark:text-sky-200">
                Active inventory
              </p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                {count}
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={null}>
          <BrowseFilters categories={categories} count={count} showPagination={false}>
            {allListings.length === 0 ? (
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-16 text-center shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
                <span className="material-symbols-outlined mb-4 block text-5xl text-slate-300 dark:text-slate-500">
                  search_off
                </span>
                <p className="mb-2 text-lg font-bold text-slate-700 dark:text-slate-100">
                  No listings found
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting your filters or search query.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {renderSection("Featured Listings", featuredListings)}
                {renderSection("Nearby Listings", nearbyListings)}
                {renderSection("All Listings", allListings)}
              </div>
            )}
          </BrowseFilters>
        </Suspense>
      </div>
    </div>
  );
}

export default function BrowsePage(props: BrowsePageProps) {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          Loading listings…
        </div>
      }
    >
      <BrowseResults {...props} />
    </Suspense>
  );
}
