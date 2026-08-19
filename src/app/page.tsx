import Link from "next/link";
import UniversityLinksGrid from "@/components/UniversityLinksGrid";
import HomeFeedSections from "@/components/HomeFeedSections";
import FeaturedCategoriesSection from "@/components/FeaturedCategoriesSection";
import AdBanner from "@/components/AdBanner";
import {
  getNewListingsPage,
  getNearbyListingsPage,
} from "@/lib/repositories/listings";
import { TimeoutError, withTimeout } from "@/lib/asyncTimeout";
import { dbListingToUi } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/server";
import { getFavoriteListingIds } from "@/lib/repositories/favorites";

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

  try {
    [newRows, nearbyRows] = await withTimeout(
      Promise.all([
        getNewListingsPage(0, 20),
        userUniversityId ? getNearbyListingsPage(userUniversityId, 0, 20) : Promise.resolve([]),
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

  const favoriteIds = await getFavoriteListingIds(user?.id);

  const newListings = newRows.map(dbListingToUi);
  const nearbyListings = nearbyRows.map(dbListingToUi);

  return (
    <div className="bg-bg transition-colors">
      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 text-center md:px-12 md:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl md:text-6xl">
          Your campus.
          <br />
          Your marketplace.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted md:text-lg">
          Buy, sell, discover and connect with students around you. The efficient
          way to clear space or find what you need.
        </p>

        {/* Hero search */}
        <form
          action="/browse"
          method="get"
          className="mx-auto mt-8 flex w-full max-w-xl items-center gap-2"
        >
          <div className="relative flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-muted">
              search
            </span>
            <input
              className="input h-11 pl-10"
              placeholder="Search textbooks, electronics..."
              type="text"
              name="q"
              aria-label="Search listings"
            />
          </div>
          <button type="submit" className="btn-primary h-11">
            Search
          </button>
        </form>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/browse" className="btn-primary px-6 py-3">
            Explore Marketplace
          </Link>
          <Link href="/sell" className="btn-secondary px-6 py-3">
            Sell Something
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <FeaturedCategoriesSection />

      <section className="mx-auto max-w-[1280px] px-4 md:px-12">
        <AdBanner placement="home" />
      </section>

      <HomeFeedSections
        initialNewListings={newListings}
        initialNearbyListings={nearbyListings}
        hasNearbyUniversity={Boolean(userUniversityId)}
        favoriteIds={[...favoriteIds]}
        signedIn={Boolean(user)}
      />

      {/* Partner Universities */}
      <section className="mx-auto max-w-[1280px] px-4 py-12 md:px-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-fg">
          Partner Universities 🇿🇲
        </h2>
        <UniversityLinksGrid />
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-[1280px] px-4 pb-16 md:px-12">
        <div className="card px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Got something to sell?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
            List your items for free and reach thousands of verified students on
            campus.
          </p>
          <Link href="/sell" className="btn-primary mt-6 px-6 py-3">
            Post a Free Listing
          </Link>
        </div>
      </section>
    </div>
  );
}

