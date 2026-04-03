import Link from "next/link";
import UniversityLinksGrid from "@/components/UniversityLinksGrid";
import HomeFeedSections from "@/components/HomeFeedSections";
import FeaturedCategoriesSection from "@/components/FeaturedCategoriesSection";
import { CATEGORIES } from "@/lib/data";
import {
  getNewListingsPage,
  getNearbyListingsPage,
  getRecentlyActiveListingsPage,
} from "@/lib/repositories/listings";
import { TimeoutError, withTimeout } from "@/lib/asyncTimeout";
import { dbListingToUi } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/server";

const HOME_PAGE_FEED_TIMEOUT_MS = 4_500;

export default async function HomePage() {
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

  // Liquidity feed slices are all loaded server-side so the first payload
  // already reflects freshness, proximity, and recent interaction activity.
  let newRows: Awaited<ReturnType<typeof getNewListingsPage>> = [];
  let nearbyRows: Awaited<ReturnType<typeof getNearbyListingsPage>> | [] = [];
  let recentlyActiveRows: Awaited<ReturnType<typeof getRecentlyActiveListingsPage>> = [];

  try {
    [newRows, nearbyRows, recentlyActiveRows] = await withTimeout(
      Promise.all([
        getNewListingsPage(0, 20),
        userUniversityId ? getNearbyListingsPage(userUniversityId, 0, 20) : Promise.resolve([]),
        getRecentlyActiveListingsPage(0, 20),
      ]),
      HOME_PAGE_FEED_TIMEOUT_MS,
      "Timed out while loading homepage feed"
    );
  } catch (error) {
    if (!(error instanceof TimeoutError)) {
      throw error;
    }

    console.warn("home-page-feed", {
      event: "timeout-fallback-empty",
      userId: user?.id ?? null,
    });
  }

  const newListings = newRows.map(dbListingToUi);
  const nearbyListings = nearbyRows.map(dbListingToUi);
  const recentlyActiveListings = recentlyActiveRows.map(dbListingToUi);

  return (
    <div className="bg-background-light transition-colors dark:bg-background-dark">
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-4 pb-6 pt-6 sm:px-6 sm:pt-10">
        <div className="relative flex min-h-[460px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-900 p-5 text-center sm:min-h-[520px] sm:p-8 md:p-20 dark:glass-card-dark dark:bg-background-dark">
          {/* Gradient overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-40 fluid-gradient dark:hidden" />
          <div className="pointer-events-none absolute inset-0 hidden fluid-gradient-dark dark:block" />
          <div className="absolute -left-24 -top-24 hidden h-72 w-72 rounded-full bg-primary/10 blur-[100px] dark:block" />
          <div className="absolute -bottom-16 -right-16 hidden h-64 w-64 rounded-full bg-blue-400/10 blur-[100px] dark:block" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="mb-4 text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:mb-6 sm:text-5xl md:text-7xl">
              The Marketplace for Your{" "}
              <span className="text-primary italic">Campus</span>
            </h1>
            <p className="mx-auto mb-7 max-w-2xl text-base font-medium text-white/80 sm:mb-10 sm:text-lg md:text-xl">
              Browse campus deals with ease. Only verified students can create listings and sell.
            </p>

            {/* Hero search */}
            <form action="/browse" method="get" className="relative mx-auto mb-7 w-full max-w-2xl sm:mb-8">
              <div className="flex flex-col items-stretch gap-2 rounded-3xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-2 dark:border-primary/20 dark:bg-primary/5">
                <span className="material-symbols-outlined ml-1 hidden text-white/60 sm:ml-4 sm:block">search</span>
                <input
                  className="w-full border-none bg-transparent px-3 py-2 text-base text-white placeholder:text-white/50 outline-none focus:ring-0 sm:px-4 sm:py-3 sm:text-lg"
                  placeholder="Search for textbooks, electronics, or services..."
                  type="text"
                  name="q"
                  aria-label="Search listings"
                />
                <button
                  type="submit"
                  className="w-full shrink-0 rounded-full bg-primary px-8 py-3 font-bold text-white shadow-lg transition-all hover:opacity-90 sm:w-auto"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link
                href="/browse"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-slate-900 shadow-xl transition-transform hover:scale-105 sm:w-auto dark:bg-white/10 dark:text-white dark:backdrop-blur-sm"
              >
                <span className="material-symbols-outlined">explore</span>
                Browse
              </Link>
              <Link
                href="/sell"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/35 bg-primary/15 px-8 py-4 font-bold text-sky-900 backdrop-blur-sm transition-all hover:bg-primary/25 sm:w-auto dark:text-white"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Sell Item
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <FeaturedCategoriesSection />

      <HomeFeedSections
        initialNewListings={newListings}
        initialNearbyListings={nearbyListings}
        initialRecentlyActiveListings={recentlyActiveListings}
        hasNearbyUniversity={Boolean(userUniversityId)}
      />

      {/* Partner Universities */}
      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 sm:py-16">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-extrabold text-slate-900 sm:mb-8 sm:text-2xl dark:text-white">
          <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">
            apartment
          </span>
          Partner Universities 🇿🇲
        </h2>
        <UniversityLinksGrid />
      </section>

      {/* CTA Banner */}
      <section className="bg-slate-900 px-4 py-10 sm:px-6 sm:py-16 dark:bg-background-dark">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl bg-slate-900 px-5 py-10 text-center sm:px-8 sm:py-14 dark:border dark:border-white/15 dark:bg-white/5 dark:shadow-2xl dark:shadow-black/35 dark:backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 opacity-40 fluid-gradient dark:hidden" />
          <div className="pointer-events-none absolute inset-0 hidden opacity-30 fluid-gradient-dark dark:block" />
          <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-4xl dark:text-sky-100">
            Got something to sell?
          </h2>
          <p className="mb-7 text-base text-white/70 sm:mb-8 sm:text-lg dark:text-slate-200">
            List your items for free and reach thousands of verified students on
            campus.
          </p>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 sm:px-10 sm:py-4 sm:text-base"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Post a Free Listing
          </Link>
        </div>
      </section>
    </div>
  );
}

