import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import UniversityLinksGrid from "@/components/UniversityLinksGrid";
import { CATEGORIES } from "@/lib/data";
import { getFeaturedListings, getRecentListings } from "@/lib/repositories/listings";
import { dbListingToUi } from "@/lib/mappers";

export default async function HomePage() {
  const [featuredRows, recentRows] = await Promise.all([
    getFeaturedListings(8),
    getRecentListings(8),
  ]);
  const featuredListings = featuredRows.map(dbListingToUi);
  const recentListings = recentRows.map(dbListingToUi);

  return (
    <div className="bg-background-light">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 pt-10 pb-6">
        <div className="relative overflow-hidden rounded-xl bg-slate-900 p-8 md:p-20 text-center min-h-[520px] flex flex-col items-center justify-center">
          {/* Gradient overlay */}
          <div className="absolute inset-0 opacity-40 fluid-gradient" />

          <div className="relative z-10 max-w-3xl">
            <h1 className="text-white text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
              The Marketplace for Your{" "}
              <span className="text-primary italic">Campus</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto">
              Buy, sell, and trade with students on your campus instantly.
              Secure, verified, and student-only.
            </p>

            {/* Hero search */}
            <div className="relative w-full max-w-2xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 flex items-center shadow-2xl">
                <span className="material-symbols-outlined ml-4 text-white/60">
                  search
                </span>
                <input
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/50 px-4 py-3 text-lg outline-none"
                  placeholder="Search for textbooks, electronics, or services..."
                  type="text"
                  readOnly
                />
                <Link
                  href="/browse"
                  className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:opacity-90 transition-all shrink-0"
                >
                  Search
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/browse"
                className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <span className="material-symbols-outlined">explore</span>
                Browse
              </Link>
              <Link
                href="/sell"
                className="bg-primary/20 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full font-bold hover:bg-primary/30 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Sell Item
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="max-w-[1200px] mx-auto px-6 mt-16">
        <h2 className="text-2xl font-extrabold mb-8 flex items-center gap-2">
          <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">
            category
          </span>
          Featured Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.slice(0, 10).map((cat) => (
            <CategoryCard
              key={cat.label}
              label={cat.label}
              icon={cat.icon}
              materialIcon={cat.materialIcon}
              color={cat.color}
            />
          ))}
        </div>
      </section>

      {/* Trending Listings */}
      <section className="max-w-[1200px] mx-auto px-6 mt-20 pb-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">
              trending_up
            </span>
            Trending Listings
          </h2>
          <Link
            href="/browse"
            className="text-primary font-bold hover:underline flex items-center gap-1 text-sm"
          >
            View all{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredListings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Recent Listings */}
      <section className="bg-white py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-extrabold flex items-center gap-2">
              <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">
                schedule
              </span>
              Recent Listings
            </h2>
            <Link
              href="/browse"
              className="text-primary font-bold hover:underline flex items-center gap-1 text-sm"
            >
              View all{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentListings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* Partner Universities */}
      <section className="max-w-[1200px] mx-auto px-6 py-16">
        <h2 className="text-2xl font-extrabold mb-8 flex items-center gap-2">
          <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">
            apartment
          </span>
          Partner Universities 🇿🇲
        </h2>
        <UniversityLinksGrid />
      </section>

      {/* CTA Banner */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="absolute inset-0 opacity-40 fluid-gradient pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Got something to sell?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            List your items for free and reach thousands of verified students on
            campus.
          </p>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-10 py-4 rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/30 text-base"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Post a Free Listing
          </Link>
        </div>
      </section>
    </div>
  );
}
