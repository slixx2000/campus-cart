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
      <article className="flex h-full min-h-[202px] flex-col overflow-hidden rounded-[0.95rem] border border-slate-300/90 bg-slate-50/95 shadow-lg shadow-slate-900/10 ring-1 ring-slate-200/70 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:bg-white hover:shadow-xl hover:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:ring-0 dark:hover:border-primary/40 dark:hover:ring-white/10">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
          <ListingImage
            src={listing.images[0]}
            alt={listing.title}
            fallbackSrc="/images/placeholder-electronics.svg"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <button
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.25 text-slate-400 backdrop-blur-sm transition-colors hover:text-red-500 active:scale-95 dark:bg-background-dark/90 dark:text-slate-300"
            aria-label="Add to favorites"
          >
            <span className="material-symbols-outlined text-[clamp(0.9rem,1.4vw,1.2rem)] leading-none">
              favorite
            </span>
          </button>
          {listing.isService && (
            <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[clamp(0.5rem,0.8vw,0.62rem)] font-bold uppercase tracking-widest text-primary backdrop-blur-sm dark:bg-background-dark/90">
              Service
            </div>
          )}
          {listing.featured && !listing.isService && (
            <div className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 text-[clamp(0.5rem,0.8vw,0.62rem)] font-bold uppercase tracking-widest text-white">
              Featured
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-[clamp(0.45rem,0.92vw,0.85rem)]">
          <div className="mb-1.5 flex items-start justify-between">
            <h3 className="line-clamp-1 pr-2 text-[clamp(0.62rem,0.98vw,0.88rem)] font-bold text-slate-900 dark:text-white">
              {listing.title}
            </h3>
            <span className="shrink-0 text-[clamp(0.68rem,1vw,0.92rem)] font-black text-primary">
              {formatPrice(listing.price)}
              {listing.isService && (
                <span className="text-[clamp(0.56rem,0.8vw,0.68rem)] font-normal text-slate-400 dark:text-slate-500">/hr</span>
              )}
            </span>
          </div>

          {listing.condition && (
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[clamp(0.52rem,0.8vw,0.65rem)] font-bold ${
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

          <div className="mt-auto space-y-2 border-t border-slate-100 pt-2.5 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              <div className="size-[clamp(1.15rem,1.8vw,2rem)] overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <AvatarImage
                  alt={listing.sellerName}
                  src={listing.sellerAvatarUrl}
                  className="h-full w-full object-cover"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-primary/10 text-primary dark:bg-sky-400/10 dark:text-sky-300"
                />
              </div>
              <div className="min-w-0 flex items-center gap-1">
                <span className="truncate text-[clamp(0.58rem,0.9vw,0.75rem)] font-semibold text-slate-700 dark:text-slate-200">
                  {listing.sellerName}
                </span>
                {listing.sellerIsPioneer ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-100 px-1.5 py-0.5 text-[clamp(0.5rem,0.8vw,0.62rem)] font-bold text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/15 dark:text-amber-300">
                    <span className="material-symbols-outlined text-[10px] leading-none">verified</span>
                    Pioneer
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[clamp(0.64rem,0.95vw,0.85rem)] leading-none text-slate-400 dark:text-slate-500">
                  school
                </span>
                <span className="max-w-[95px] truncate text-[clamp(0.56rem,0.85vw,0.72rem)] font-medium text-slate-500 dark:text-slate-300">
                  {universityLabel}
                </span>
              </div>
              <span className="line-clamp-1 text-[clamp(0.56rem,0.82vw,0.72rem)] text-slate-400 dark:text-slate-500">
                {listing.category}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
