import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, CATEGORIES } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { getListingById, getRelatedListings } from "@/lib/repositories/listings";
import { dbListingToUi } from "@/lib/mappers";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const row = await getListingById(id);

  if (!row) notFound();

  const listing = dbListingToUi(row);

  const relatedRows = await getRelatedListings(row.id, row.category_id);
  const related = relatedRows.map(dbListingToUi);

  const categoryMeta = CATEGORIES.find((c) => c.label === listing.category);

  const dateFormatted = new Date(listing.createdAt).toLocaleDateString(
    "en-ZM",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="bg-background-light min-h-screen">
      <div className="pt-6 pb-20 px-4 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-8 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href="/browse" className="hover:text-primary transition-colors">Browse</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link
            href={`/browse?category=${encodeURIComponent(listing.category)}`}
            className="hover:text-primary transition-colors"
          >
            {listing.category}
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-medium text-slate-900 truncate max-w-xs">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Product Image */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-white shadow-sm border border-slate-200">
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover"
                unoptimized
              />
              {listing.featured && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-900">
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="lg:col-span-5 space-y-5">
            {/* Price card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              {/* Category badge */}
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full mb-4 ${categoryMeta?.color}`}
              >
                <span className="material-symbols-outlined text-sm leading-none">
                  {categoryMeta?.materialIcon}
                </span>
                {listing.category}
              </span>

              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight pr-4">
                  {listing.title}
                </h1>
                <button className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                  <span className="material-symbols-outlined text-2xl">favorite</span>
                </button>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-primary">
                  {formatPrice(listing.price)}
                </span>
                {listing.isService && (
                  <span className="text-slate-500 text-base">/session</span>
                )}
              </div>

              {/* Meta chips */}
              <div className="space-y-3 mb-7">
                {listing.condition && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-background-light border border-slate-100">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Condition</p>
                      <p className="text-sm font-bold text-slate-900">{listing.condition}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background-light border border-slate-100">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">University</p>
                    <p className="text-sm font-bold text-slate-900">{listing.university}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background-light border border-slate-100">
                  <span className="material-symbols-outlined text-primary">calendar_today</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Listed on</p>
                    <p className="text-sm font-bold text-slate-900">{dateFormatted}</p>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <a
                  href={`https://wa.me/${listing.sellerPhone.replace(/[\s+]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 rounded-full bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">forum</span>
                  Chat with Seller
                </a>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${listing.sellerPhone.replace(/\s/g, "")}`}
                    className="h-12 rounded-full border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">call</span>
                    Call
                  </a>
                  <button className="h-12 rounded-full border border-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                    <span className="material-symbols-outlined text-xl">bookmark</span>
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Seller info card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Seller Information
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-extrabold text-2xl">
                      {listing.sellerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{listing.sellerName}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-amber-400 text-sm">star</span>
                      <span className="text-sm font-bold text-slate-900">4.8</span>
                      <span className="text-xs text-slate-500">(12 sales)</span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-full text-xs font-bold text-primary border border-primary/30 hover:bg-primary/5 transition-colors">
                  View Profile
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-500">{listing.university}</span>
                <span className="flex items-center gap-1 text-green-500 font-bold">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Quick Responder
                </span>
              </div>
            </div>

            {/* Safety tip */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 flex gap-3">
              <span className="material-symbols-outlined text-amber-500 shrink-0">
                security
              </span>
              <div>
                <strong>Safety tip:</strong> Always meet in well-lit, public
                campus areas. Use the CampusCart messaging system for all
                communication.
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-12 max-w-4xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Item Description
          </h3>
          <p className="text-slate-600 leading-relaxed">{listing.description}</p>
        </div>

        {/* Related listings */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Similar Items for Sale
              </h3>
              <Link
                href={`/browse?category=${encodeURIComponent(listing.category)}`}
                className="text-primary font-bold hover:underline flex items-center gap-1 text-sm"
              >
                See all{" "}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((l) => (
                <ProductCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
