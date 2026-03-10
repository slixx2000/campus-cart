import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { SAMPLE_LISTINGS, CATEGORIES, UNIVERSITIES } from "@/lib/data";

export default function HomePage() {
  const featuredListings = SAMPLE_LISTINGS.filter((l) => l.featured);
  const recentListings = SAMPLE_LISTINGS.slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 via-green-600 to-green-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span>🇿🇲</span>
            <span>Zambia&apos;s Campus Marketplace</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Buy &amp; Sell on Your{" "}
            <span className="text-yellow-300">Campus</span>
          </h1>
          <p className="text-lg sm:text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            CampusCart connects student entrepreneurs with fellow students
            across Zambian universities. Find products, food, services and more
            — all on campus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="bg-white text-green-800 font-bold px-8 py-3 rounded-full hover:bg-green-50 transition text-base"
            >
              Browse Listings
            </Link>
            <Link
              href="/sell"
              className="bg-yellow-400 text-green-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition text-base"
            >
              + Post a Listing
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-green-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-yellow-300">8+</p>
            <p className="text-xs text-green-200">Universities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-300">10</p>
            <p className="text-xs text-green-200">Categories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-300">Free</p>
            <p className="text-xs text-green-200">To List</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-300">🇿🇲</p>
            <p className="text-xs text-green-200">Campus-first</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.label}
              label={cat.label}
              icon={cat.icon}
              color={cat.color}
            />
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            ⭐ Featured Listings
          </h2>
          <Link
            href="/browse"
            className="text-sm text-green-700 font-medium hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featuredListings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Recent Listings */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🆕 Recent Listings
            </h2>
            <Link
              href="/browse"
              className="text-sm text-green-700 font-medium hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentListings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      {/* Universities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          🎓 Partner Universities
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {UNIVERSITIES.map((uni) => (
            <Link
              key={uni.id}
              href={`/browse?university=${encodeURIComponent(uni.name)}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-400 hover:shadow-sm transition text-center"
            >
              <p className="font-bold text-green-700 text-lg">{uni.shortName}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{uni.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{uni.city}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-yellow-400 to-yellow-300 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-green-900 mb-3">
            Got something to sell?
          </h2>
          <p className="text-green-800 mb-6 text-base">
            Post your listing for free and reach thousands of students on
            campus.
          </p>
          <Link
            href="/sell"
            className="bg-green-700 text-white font-bold px-8 py-3 rounded-full hover:bg-green-800 transition text-base inline-block"
          >
            + Post a Free Listing
          </Link>
        </div>
      </section>
    </div>
  );
}
