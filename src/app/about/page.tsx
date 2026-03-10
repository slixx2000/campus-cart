import Link from "next/link";
import { UNIVERSITIES, CATEGORIES } from "@/lib/data";

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-500 text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="text-5xl mb-4 block">🛒</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
            About CampusCart
          </h1>
          <p className="text-green-100 text-lg leading-relaxed">
            Zambia&apos;s first dedicated campus marketplace — empowering student
            entrepreneurs and making campus life easier for everyone.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Our Mission
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CampusCart was created to bridge the gap between young student
              entrepreneurs and the thousands of students on Zambian university
              campuses. Many talented students run small businesses — selling
              food, clothing, electronics, offering tutoring or services — but
              struggle to reach their target audience.
            </p>
            <p className="text-gray-600 leading-relaxed">
              By creating a trusted, campus-focused marketplace, we make it
              easier for businesses to grow and for students to find what they
              need right on their doorstep.
            </p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
            <ul className="space-y-4">
              {[
                { icon: "🌱", title: "Empower entrepreneurs", desc: "Help student business owners reach more customers." },
                { icon: "🔍", title: "Easy discovery", desc: "Students find products and services quickly, on campus." },
                { icon: "🤝", title: "Trust & safety", desc: "Campus-verified listings and safety guidelines." },
                { icon: "🇿🇲", title: "Made for Zambia", desc: "Built around Zambian campuses, culture and currency (ZMW)." },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-10 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: "📝",
                title: "Post a Listing",
                desc: "Create a free listing in minutes. Add a title, description, price, category and your contact details.",
              },
              {
                step: "2",
                icon: "👀",
                title: "Students Discover You",
                desc: "Your listing appears in search results for students at your university and beyond.",
              },
              {
                step: "3",
                icon: "💬",
                title: "Connect & Sell",
                desc: "Buyers contact you directly via phone or WhatsApp. Meet on campus and complete the sale safely.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 text-green-700 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Universities */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          Partner Universities 🎓
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {UNIVERSITIES.map((uni) => (
            <Link
              key={uni.id}
              href={`/browse?university=${encodeURIComponent(uni.name)}`}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-green-400 hover:shadow-sm transition"
            >
              <p className="font-bold text-green-700 text-base">
                {uni.shortName}
              </p>
              <p className="text-xs text-gray-500 mt-1">{uni.city}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
            What You Can Buy &amp; Sell
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className={`${cat.color} rounded-xl p-4 text-center`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <p className="text-xs font-semibold">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-yellow-400 to-yellow-300 py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-green-900 mb-3">
            Ready to get started?
          </h2>
          <p className="text-green-800 mb-6">
            Post your first listing for free or browse what&apos;s available on your campus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sell"
              className="bg-green-700 text-white font-bold px-8 py-3 rounded-full hover:bg-green-800 transition"
            >
              + Post a Listing
            </Link>
            <Link
              href="/browse"
              className="bg-white text-green-800 font-bold px-8 py-3 rounded-full hover:bg-green-50 transition"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
