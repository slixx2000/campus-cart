import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-12 dark:border-primary/10 dark:bg-background-dark">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary p-1.5 rounded-md text-white">
              <span className="material-symbols-outlined block text-xl leading-none">
                shopping_cart
              </span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-primary">
              CampusCart
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            The student-first marketplace. Helping university students in Zambia
            save money and reduce waste.
          </p>
        </div>

        {/* Marketplace */}
        <div>
          <h5 className="mb-4 font-bold text-slate-900 dark:text-white">Marketplace</h5>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>
              <Link
                href="/browse"
                className="hover:text-primary transition-colors"
              >
                All Categories
              </Link>
            </li>
            <li>
              <Link
                href="/sell"
                className="hover:text-primary transition-colors"
              >
                Sell an Item
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-primary transition-colors"
              >
                Trust &amp; Safety
              </Link>
            </li>
            <li>
              <Link
                href="/browse"
                className="hover:text-primary transition-colors"
              >
                Verified Students
              </Link>
            </li>
          </ul>
        </div>

        {/* Community */}
        <div>
          <h5 className="mb-4 font-bold text-slate-900 dark:text-white">Community</h5>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>
              <Link
                href="/about"
                className="hover:text-primary transition-colors"
              >
                Campus Ambassadors
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-primary transition-colors"
              >
                Help Center
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h5 className="mb-4 font-bold text-slate-900 dark:text-white">Stay Updated</h5>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Join our newsletter for the best deals on campus.
          </p>
          <div className="flex gap-2">
            <input
              className="w-full rounded-full border-none bg-slate-100 px-4 py-2 text-sm outline-none placeholder-slate-400 focus:ring-1 focus:ring-primary dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
              placeholder="Email"
              type="email"
            />
            <button className="bg-primary p-2 rounded-full text-white hover:opacity-90 transition-opacity shrink-0">
              <span className="material-symbols-outlined block leading-none">
                send
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-slate-100 pt-8 text-center text-xs text-slate-400 dark:border-primary/10 dark:text-slate-500">
        © {new Date().getFullYear()} CampusCart Zambia. Built for students, by
        students. 🇿🇲
      </div>
    </footer>
  );
}
