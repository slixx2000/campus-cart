import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, CATEGORIES } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import AvatarImage from "@/components/AvatarImage";
import { getListingById, getRelatedListings } from "@/lib/repositories/listings";
import { dbListingToUi } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/server";
import { startConversationAction } from "@/app/messages/actions";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const [row, supabase] = await Promise.all([
    getListingById(id),
    createClient(),
  ]);

  if (!row) notFound();

  const listing = dbListingToUi(row);

  const [relatedRows, { data: { user } }] = await Promise.all([
    getRelatedListings(row.id, row.category_id),
    supabase.auth.getUser(),
  ]);
  const related = relatedRows.map(dbListingToUi);

  // Prevent sellers from messaging their own listing.
  const isOwnListing = !!user && user.id === listing.sellerId;

  const categoryMeta = CATEGORIES.find((c) => c.label === listing.category);

  const dateFormatted = new Date(listing.createdAt).toLocaleDateString(
    "en-ZM",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="min-h-screen bg-background-light text-slate-900 transition-colors dark:bg-[#07111f] dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6">
        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="transition-colors hover:text-primary dark:hover:text-sky-300">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href="/browse" className="transition-colors hover:text-primary dark:hover:text-sky-300">Browse</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link
            href={`/browse?category=${encodeURIComponent(listing.category)}`}
            className="transition-colors hover:text-primary dark:hover:text-sky-300"
          >
            {listing.category}
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="max-w-xs truncate font-medium text-slate-900 dark:text-white">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Product Image */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[0_35px_120px_-55px_rgba(8,15,33,0.95)]">
              <Image
                src={listing.images[0]}
                alt={listing.title}
                fill
                className="object-cover"
                unoptimized
              />
              {listing.featured && (
                <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur dark:bg-slate-950/70 dark:text-white">
                  Featured
                </div>
              )}
            </div>
            <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                Listing overview
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Type</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {listing.isService ? "Service" : "Product"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Seller</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {listing.sellerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Campus</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {listing.university}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="lg:col-span-5 space-y-5">
            {/* Price card */}
            <div className="rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
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
                <h1 className="pr-4 text-2xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-3xl">
                  {listing.title}
                </h1>
                <button className="shrink-0 text-slate-400 transition-colors hover:text-red-500 dark:text-slate-500 dark:hover:text-rose-400">
                  <span className="material-symbols-outlined text-2xl">favorite</span>
                </button>
              </div>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-black text-primary">
                  {formatPrice(listing.price)}
                </span>
                {listing.isService && (
                  <span className="text-base text-slate-500 dark:text-slate-400">/session</span>
                )}
              </div>

              {/* Meta chips */}
              <div className="space-y-3 mb-7">
                {listing.condition && (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-background-light p-3 dark:border-white/10 dark:bg-[#0d1a2b]">
                    <span className="material-symbols-outlined text-primary">verified_user</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Condition</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{listing.condition}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-background-light p-3 dark:border-white/10 dark:bg-[#0d1a2b]">
                  <span className="material-symbols-outlined text-primary">school</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">University</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{listing.university}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-background-light p-3 dark:border-white/10 dark:bg-[#0d1a2b]">
                  <span className="material-symbols-outlined text-primary">calendar_today</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Listed on</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{dateFormatted}</p>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                {/* Message Seller — hidden for own listings */}
                {!isOwnListing && listing.sellerId ? (
                  <form action={startConversationAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="sellerId" value={listing.sellerId} />
                    <button
                      type="submit"
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-600 text-lg font-bold text-white shadow-lg shadow-primary/30 transition-all hover:shadow-primary/50 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950 dark:shadow-sky-400/20"
                    >
                      <span className="material-symbols-outlined">forum</span>
                      Message Seller
                    </button>
                  </form>
                ) : isOwnListing ? (
                  <Link
                    href="/my-listings"
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-primary text-lg font-bold text-primary transition-all hover:bg-primary/5 dark:border-sky-400 dark:text-sky-300"
                  >
                    <span className="material-symbols-outlined">edit</span>
                    Manage Listing
                  </Link>
                ) : null}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`tel:${listing.sellerPhone.replace(/\s/g, "")}`}
                    className="flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined text-xl">call</span>
                    Call
                  </a>
                  <button className="flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10">
                    <span className="material-symbols-outlined text-xl">bookmark</span>
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Seller info card */}
            <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Seller Information
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-14 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 dark:border-sky-400/20 dark:bg-sky-400/10">
                    <AvatarImage
                      alt={listing.sellerName}
                      src={listing.sellerAvatarUrl}
                      className="h-full w-full object-cover"
                      fallbackClassName="flex h-full w-full items-center justify-center bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-300"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{listing.sellerName}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-amber-400 text-sm">star</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">4.8</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">(12 sales)</span>
                    </div>
                  </div>
                </div>
                {listing.sellerId ? (
                  <Link
                    href={`/profile/${listing.sellerId}`}
                    className="rounded-full border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5 dark:border-sky-400/30 dark:text-sky-300 dark:hover:bg-sky-400/10"
                  >
                    View Profile
                  </Link>
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400">{listing.university}</span>
                <span className="flex items-center gap-1 font-bold text-green-500 dark:text-emerald-300">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Quick Responder
                </span>
              </div>
            </div>

            {/* Safety tip */}
            <div className="flex gap-3 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
              <span className="material-symbols-outlined shrink-0 text-amber-500 dark:text-amber-300">
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
        <div className="mt-12 max-w-4xl rounded-[2rem] border border-slate-200/70 bg-white/80 p-8 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
          <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            Item Description
          </h3>
          <p className="leading-relaxed text-slate-600 dark:text-slate-300">{listing.description}</p>
        </div>

        {/* Related listings */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Similar Items for Sale
              </h3>
              <Link
                href={`/browse?category=${encodeURIComponent(listing.category)}`}
                className="flex items-center gap-1 text-sm font-bold text-primary hover:underline dark:text-sky-300"
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
