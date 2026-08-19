import Link from "next/link";
import { Listing } from "@/types";
import { formatPrice } from "@/lib/data";
import ListingImage from "@/components/ListingImage";
import FavoriteButton from "@/components/FavoriteButton";

interface ProductCardProps {
  listing: Listing;
  isFavorited?: boolean;
  signedIn?: boolean;
}

export default function ProductCard({
  listing,
  isFavorited = false,
  signedIn = false,
}: ProductCardProps) {
  const universityLabelBase = listing.universityShortName ?? listing.university;
  const universityLabel = listing.isNearby
    ? `Near you • ${universityLabelBase}`
    : universityLabelBase;

  const statusLabel = listing.isService
    ? "Service"
    : listing.featured
    ? "Featured"
    : listing.condition;

  return (
    <Link href={`/product/${listing.id}`} className="group block h-full">
      <article className="card flex h-full flex-col overflow-hidden transition-shadow hover:shadow-hover">
        <div className="relative aspect-square overflow-hidden bg-surface-2">
          <ListingImage
            src={listing.images[0]}
            alt={listing.title}
            fallbackSrc="/images/placeholder-electronics.svg"
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {statusLabel ? (
            <span className="pill absolute right-2 top-2 bg-surface/90 text-fg">
              {statusLabel}
            </span>
          ) : null}
          <FavoriteButton
            listingId={listing.id}
            initialFavorited={isFavorited}
            signedIn={signedIn}
            className="absolute left-2 top-2"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="text-lg font-bold leading-tight text-fg">
            {formatPrice(listing.price)}
            {listing.isService ? (
              <span className="text-sm font-medium text-muted">/hr</span>
            ) : null}
          </p>
          <h3 className="line-clamp-1 text-sm text-fg">{listing.title}</h3>
          <p className="mt-auto flex items-center gap-1 pt-1 text-xs text-muted">
            <span className="material-symbols-outlined text-[14px] leading-none">
              location_on
            </span>
            <span className="truncate">{universityLabel}</span>
            {listing.sellerIsPioneer ? (
              <span
                className="material-symbols-outlined ml-auto shrink-0 text-[14px] leading-none text-accent"
                title="Pioneer seller"
              >
                verified
              </span>
            ) : null}
          </p>
        </div>
      </article>
    </Link>
  );
}
