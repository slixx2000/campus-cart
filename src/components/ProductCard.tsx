import Link from "next/link";
import { Listing } from "@/types";
import { formatPrice } from "@/lib/data";
import AvatarImage from "@/components/AvatarImage";
import ListingImage from "@/components/ListingImage";

interface ProductCardProps {
  listing: Listing;
}

export default function ProductCard({ listing }: ProductCardProps) {
  const universityLabelBase = listing.universityShortName ?? listing.university;
  const universityLabel = listing.isNearby
    ? `Near you • ${universityLabelBase}`
    : universityLabelBase;

  return (
    <Link href={`/product/${listing.id}`} className="block h-full group">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-300/90 bg-slate-50/95 shadow-lg shadow-slate-900/10 ring-1 ring-slate-200/70 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:bg-white hover:shadow-xl hover:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:ring-0 dark:hover:border-primary/40 dark:hover:ring-white/10">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg sm:aspect-square">
          <ListingImage
            src={listing.images[0]}
            alt={listing.title}
            fallbackSrc="/images/placeholder-electronics.svg"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <button
            className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-400 backdrop-blur-sm transition-colors hover:text-red-500 active:scale-95 dark:bg-background-dark/90 dark:text-slate-300"
            aria-label="Add to favorites"
          >
            <span className="material-symbols-outlined text-xl leading-none">
              favorite
            </span>
          </button>
          {listing.isService && (
            <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-sm dark:bg-background-dark/90">
              Service
            </div>
          )}
          {listing.featured && !listing.isService && (
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
              Featured
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="truncate pr-3 text-sm font-bold text-slate-900 dark:text-white">
              {listing.title}
            </h3>
            <span className="font-black text-primary text-base shrink-0">
              {formatPrice(listing.price)}
              {listing.isService && (
                <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/hr</span>
              )}
            </span>
          </div>

          {listing.condition && (
            <div className="mb-2 flex items-center gap-2 sm:mb-3">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  listing.condition === "New"
                    ? "bg-green-500/10 text-green-600"
                    : listing.condition === "Like New"
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                }`}
              >
                {listing.condition}
              </span>
            </div>
          )}

          <div className="mt-auto space-y-2 border-t border-slate-100 pt-2.5 sm:space-y-3 sm:pt-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="size-8 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <AvatarImage
                  alt={listing.sellerName}
                  src={listing.sellerAvatarUrl}
                  className="h-full w-full object-cover"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-300"
                />
              </div>
              <div className="min-w-0 flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {listing.sellerName}
                </span>
                {listing.sellerIsPioneer ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/15 dark:text-amber-300">
                    <span className="material-symbols-outlined text-[11px] leading-none">verified</span>
                    Pioneer
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm leading-none text-slate-400 dark:text-slate-500">
                  school
                </span>
                <span className="max-w-[110px] truncate text-xs font-medium text-slate-500 dark:text-slate-300">
                  {universityLabel}
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{listing.category}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
