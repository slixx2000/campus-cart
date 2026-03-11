import Link from "next/link";
import UniversityCountStat from "@/components/UniversityCountStat";
import UniversityLinksGrid from "@/components/UniversityLinksGrid";
import { CATEGORIES } from "@/lib/data";

export default function AboutPage() {
  return (
    <div className="bg-background-light min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary font-bold text-sm px-4 py-2 rounded-full mb-6">
            <span className="material-symbols-outlined text-lg leading-none">
              school
            </span>
            Built for Zambian students
          </div>
          <h1 className="text-white text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
            The Marketplace for Your{" "}
            <span className="text-primary">Campus</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            CampusCart connects student entrepreneurs with fellow students
            across universities in Zambia — making it easier to buy, sell, and
            discover products and services right on campus.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-12 flex items-center gap-2">
          <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">
            help_outline
          </span>
          How CampusCart Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              icon: "add_circle",
              title: "Post for Free",
              desc: "List your product or service in minutes. No fees, no commissions. Just describe your item, set your price, and add your contact.",
            },
            {
              step: "2",
              icon: "search",
              title: "Students Discover You",
              desc: "Verified students on your campus browse and search listings by category, price, and university. Your listing reaches your entire campus community.",
            },
            {
              step: "3",
              icon: "handshake",
              title: "Connect & Trade",
              desc: "Buyers contact you directly via WhatsApp or phone. Meet in a safe public place on campus and complete your transaction.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-xl border border-slate-200 p-8 hover:shadow-xl hover:shadow-primary/5 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl leading-none">
                    {item.icon}
                  </span>
                </div>
                <span className="text-4xl font-extrabold text-slate-100">
                  0{item.step}
                </span>
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-16 px-6 border-y border-slate-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-extrabold text-primary mb-1">
              <UniversityCountStat />
            </p>
            <p className="text-slate-500 text-sm font-medium">Universities</p>
          </div>
          {[
            { value: "10", label: "Categories" },
            { value: "Free", label: "Listings" },
            { value: "🇿🇲", label: "Zambia" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-primary mb-1">
                {s.value}
              </p>
              <p className="text-slate-500 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Universities */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
          <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">
            apartment
          </span>
          Partner Universities 🇿🇲
        </h2>
        <UniversityLinksGrid />
      </section>

      {/* Categories */}
      <section className="bg-white py-16 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
            <span className="bg-primary/10 p-2 rounded-md text-primary material-symbols-outlined">
              category
            </span>
            What You Can Buy &amp; Sell
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={`/browse?category=${encodeURIComponent(cat.label)}`}
                className={`p-4 rounded-xl border border-slate-200 hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all flex flex-col items-center text-center gap-2 group`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${cat.color}`}
                >
                  <span className="material-symbols-outlined text-2xl leading-none">
                    {cat.materialIcon}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-white/70 mb-8 text-base">
            Join thousands of Zambian students already buying and selling on
            CampusCart.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined">explore</span>
              Browse Listings
            </Link>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Post for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
