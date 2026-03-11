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
      <article className="bg-white rounded-xl border border-slate-200 overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all">
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
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full text-slate-400 hover:text-red-500 transition-colors backdrop-blur-sm"
            aria-label="Add to favorites"
          >
            <span className="material-symbols-outlined text-xl leading-none">
              favorite
            </span>
          </button>
          {listing.isService && (
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-sm">
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
            <h3 className="font-bold text-slate-900 truncate pr-3 text-sm">
              {listing.title}
            </h3>
            <span className="font-black text-primary text-base shrink-0">
              {formatPrice(listing.price)}
              {listing.isService && (
                <span className="text-xs text-slate-400 font-normal">/hr</span>
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
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {listing.condition}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400 text-sm leading-none">
                school
              </span>
              <span className="text-xs font-medium text-slate-500 truncate max-w-[110px]">
                {listing.university}
              </span>
            </div>
            <span className="text-xs text-slate-400">{listing.category}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
