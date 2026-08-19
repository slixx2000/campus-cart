import { Suspense } from "react";
import BrowseScrollRestorer from "@/components/BrowseScrollRestorer";
import ProgressiveListingGrid from "@/components/ProgressiveListingGrid";
import { getFeaturedListings, getListings } from "@/lib/repositories/listings";
import { getAllCategories } from "@/lib/repositories/universities";
import { dbListingToUi } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteListingIds } from "@/lib/repositories/favorites";
import type { ListingCondition } from "@/types/database";
import type { Listing } from "@/types";
import AdBanner from "@/components/AdBanner";
import BrowseFilters from "./BrowseFilters";
import BrowseLoading from "./loading";

type SortBy = "newest" | "price-asc" | "price-desc";

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    university?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string;
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

  const conditions = sp.condition
    ? (sp.condition.split(",").filter(Boolean) as ListingCondition[])
    : undefined;

  const { data: rows, count } = await getListings({
    query: sp.q,
    category: sp.category,
    university: sp.university,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    conditions,
    isService,
    sortBy: (sp.sort as SortBy) || "newest",
    disablePagination: true,
  });
  const featuredRows = await getFeaturedListings(8);

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

  const featuredListings = featuredRows.map((row) => {
    const listing = dbListingToUi(row);
    const isNearby = Boolean(userUniversityId && row.university_id === userUniversityId);
    return { ...listing, isNearby } as Listing;
  });
  const nearbyListings = allListings.filter((listing) => listing.isNearby);
  const browseStateKey = JSON.stringify({
    q: sp.q ?? "",
    category: sp.category ?? "",
    university: sp.university ?? "",
    minPrice: sp.minPrice ?? "",
    maxPrice: sp.maxPrice ?? "",
    condition: sp.condition ?? "",
    type: sp.type ?? "",
    sort: sp.sort ?? "",
  });

  const favoriteIds = [...(await getFavoriteListingIds(user?.id))];
  const signedIn = Boolean(user);

  // Any active filter collapses the three curated sections into one result set,
  // matching the mockup's single grid.
  const hasActiveFilters = Boolean(
    sp.q || sp.category || sp.university || sp.minPrice || sp.maxPrice || sp.condition || sp.type
  );

  const renderSection = (title: string, items: Listing[], showHeading = true) => (
    <section className="space-y-4">
      {showHeading ? (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
          <span className="text-xs font-medium text-muted">{items.length} items</span>
        </div>
      ) : null}
      {items.length === 0 ? (
        <div className="card border-dashed px-5 py-7 text-sm text-muted">
          Nothing to show in this section yet.
        </div>
      ) : (
        <ProgressiveListingGrid
          items={items}
          storageKey={`${browseStateKey}:${title}`}
          favoriteIds={favoriteIds}
          signedIn={signedIn}
        />
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-bg text-fg transition-colors">
      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
        <BrowseScrollRestorer storageKey={browseStateKey} />
        <Suspense fallback={null}>
          <BrowseFilters categories={categories} count={count} showPagination={false}>
            <div className="mb-6">
              <AdBanner placement="browse" />
            </div>
            {allListings.length === 0 ? (
              <div className="card p-9 text-center sm:p-16">
                <span className="material-symbols-outlined mb-4 block text-5xl text-muted">
                  search_off
                </span>
                <p className="mb-2 text-lg font-semibold text-fg">No results found</p>
                <p className="text-sm text-muted">
                  We couldn&apos;t find any items matching your current filters. Try
                  adjusting your search criteria or broadening your categories.
                </p>
              </div>
            ) : hasActiveFilters ? (
              renderSection("All Listings", allListings, false)
            ) : (
              <div className="space-y-10">
                {/* Curated sections only appear when they have something in them —
                    an empty "Featured Listings — 0 items" block reads as broken. */}
                {featuredListings.length > 0
                  ? renderSection("Featured Listings", featuredListings)
                  : null}
                {nearbyListings.length > 0
                  ? renderSection("Nearby Listings", nearbyListings)
                  : null}
                {renderSection(
                  "All Listings",
                  allListings,
                  featuredListings.length > 0 || nearbyListings.length > 0
                )}
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
    <Suspense fallback={<BrowseLoading />}>
      <BrowseResults {...props} />
    </Suspense>
  );
}
