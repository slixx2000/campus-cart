import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SAMPLE_LISTINGS, formatPrice, CATEGORIES } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return SAMPLE_LISTINGS.map((l) => ({ id: l.id }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const listing = SAMPLE_LISTINGS.find((l) => l.id === id);

  if (!listing) notFound();

  const related = SAMPLE_LISTINGS.filter(
    (l) => l.id !== listing.id && l.category === listing.category
  ).slice(0, 4);

  const categoryMeta = CATEGORIES.find((c) => c.label === listing.category);

  const dateFormatted = new Date(listing.createdAt).toLocaleDateString(
    "en-ZM",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-green-700">Home</Link>
        <span>/</span>
        <Link href="/browse" className="hover:text-green-700">Browse</Link>
        <span>/</span>
        <Link
          href={`/browse?category=${encodeURIComponent(listing.category)}`}
          className="hover:text-green-700"
        >
          {listing.category}
        </Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-80 md:h-full min-h-80">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover"
            unoptimized
          />
          {listing.featured && (
            <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-sm font-semibold px-3 py-1 rounded-full">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Category badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full self-start mb-3 ${categoryMeta?.color}`}
          >
            {categoryMeta?.icon} {listing.category}
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {listing.title}
          </h1>

          <div className="text-3xl font-extrabold text-green-700 mb-1">
            {formatPrice(listing.price)}
            {listing.isService && (
              <span className="text-base text-gray-400 font-normal ml-1">
                / session
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mb-5 mt-2 text-sm text-gray-500">
            {listing.condition && (
              <span className="bg-gray-100 px-3 py-1 rounded-full">
                Condition:{" "}
                <strong className="text-gray-700">{listing.condition}</strong>
              </span>
            )}
            <span className="bg-gray-100 px-3 py-1 rounded-full">
              🎓{" "}
              <strong className="text-gray-700">{listing.university}</strong>
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-full">
              📅 {dateFormatted}
            </span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {listing.description}
          </p>

          {/* Seller contact */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-5">
            <h2 className="font-semibold text-gray-800 mb-3 text-base">
              Seller Information
            </h2>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-sm">
                {listing.sellerName.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">
                  {listing.sellerName}
                </p>
                <p className="text-xs text-gray-500">{listing.university}</p>
              </div>
            </div>
            <a
              href={`tel:${listing.sellerPhone.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              📞 Call {listing.sellerPhone}
            </a>
            <a
              href={`https://wa.me/${listing.sellerPhone.replace(/[\s+]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full mt-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              💬 WhatsApp {listing.sellerName.split(" ")[0]}
            </a>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-800">
            ⚠️ <strong>Safety tip:</strong> Meet in a safe public place on
            campus when buying. Never send money in advance.
          </div>
        </div>
      </div>

      {/* Related listings */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-800 mb-5">
            More in {listing.category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((l) => (
              <ProductCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
