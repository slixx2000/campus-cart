import Link from "next/link";
import Image from "next/image";
import { Listing } from "@/types";
import { formatPrice } from "@/lib/data";

interface ProductCardProps {
  listing: Listing;
}

export default function ProductCard({ listing }: ProductCardProps) {
  return (
    <Link href={`/product/${listing.id}`}>
      <article className="overflow-hidden rounded-xl border border-slate-200 bg-white group transition-all hover:shadow-xl hover:shadow-primary/5 dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl dark:hover:border-primary/40 dark:hover:shadow-2xl dark:hover:shadow-primary/10">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
          <button
            className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-400 backdrop-blur-sm transition-colors hover:text-red-500 dark:bg-background-dark/90 dark:text-slate-300"
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
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
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
            <div className="flex items-center gap-2 mb-3">
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

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm leading-none text-slate-400 dark:text-slate-500">
                school
              </span>
              <span className="max-w-[110px] truncate text-xs font-medium text-slate-500 dark:text-slate-300">
                {listing.university}
              </span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">{listing.category}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
