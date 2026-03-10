import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-green-800 text-green-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🛒</span>
              <span className="font-bold text-xl text-white">
                Campus<span className="text-yellow-300">Cart</span>
              </span>
            </div>
            <p className="text-sm text-green-200 leading-relaxed">
              Zambia&apos;s campus marketplace — connecting student entrepreneurs
              with fellow students across universities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-yellow-300 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/browse"
                  className="hover:text-yellow-300 transition"
                >
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-yellow-300 transition">
                  Post a Listing
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-yellow-300 transition"
                >
                  About CampusCart
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-white mb-3">Categories</h3>
            <ul className="space-y-2 text-sm">
              {[
                "Food & Drinks",
                "Electronics",
                "Books & Stationery",
                "Tutoring",
                "Services",
              ].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/browse?category=${encodeURIComponent(cat)}`}
                    className="hover:text-yellow-300 transition"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Universities */}
          <div>
            <h3 className="font-semibold text-white mb-3">Universities</h3>
            <ul className="space-y-2 text-sm">
              {["UNZA", "CBU", "Mulungushi University", "Northrise University", "Cavendish University Zambia"].map(
                (uni) => (
                  <li key={uni}>
                    <Link
                      href={`/browse?university=${encodeURIComponent(uni)}`}
                      className="hover:text-yellow-300 transition"
                    >
                      {uni}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-green-700 mt-10 pt-6 text-center text-xs text-green-400">
          © {new Date().getFullYear()} CampusCart Zambia. Built for students,
          by students. 🇿🇲
        </div>
      </div>
    </footer>
  );
}
