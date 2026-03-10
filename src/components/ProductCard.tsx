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
      <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col h-full">
        {/* Image */}
        <div className="relative h-44 bg-gray-50 shrink-0">
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover"
            unoptimized
          />
          {listing.isService && (
            <span className="absolute top-2 left-2 bg-teal-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Service
            </span>
          )}
          {listing.featured && (
            <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-green-700 font-medium mb-1">
            {listing.category}
          </p>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 flex-1">
            {listing.title}
          </h3>

          <div className="mt-auto flex items-center justify-between">
            <span className="text-green-700 font-bold text-base">
              {formatPrice(listing.price)}
              {listing.isService && (
                <span className="text-gray-400 font-normal text-xs"> /session</span>
              )}
            </span>
            <span className="text-xs text-gray-500">{listing.university}</span>
          </div>

          {listing.condition && (
            <p className="text-xs text-gray-400 mt-1">
              Condition: {listing.condition}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
