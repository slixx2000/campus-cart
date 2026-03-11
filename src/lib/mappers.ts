import type { ListingWithRelations, ListingCondition } from "@/types/database";
import type { Listing, Category, Condition } from "@/types";

const PLACEHOLDER = "/images/placeholder-electronics.svg";

/** Maps a DB row (with relations) to the UI Listing shape used by ProductCard etc. */
export function dbListingToUi(row: ListingWithRelations): Listing {
  const images =
    row.listing_images.length > 0
      ? [...row.listing_images]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => img.public_url ?? PLACEHOLDER)
      : [PLACEHOLDER];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    category: (row.categories?.name ?? "Other") as Category,
    condition: conditionToUi(row.condition),
    university: row.universities?.name ?? "",
    sellerName: row.profiles?.full_name ?? "Unknown Seller",
    sellerPhone: row.profiles?.phone ?? "",
    images,
    createdAt: row.created_at,
    featured: row.featured,
    isService: row.is_service,
  };
}

function conditionToUi(c: ListingCondition | null): Condition | undefined {
  if (!c) return undefined;
  const map: Record<ListingCondition, Condition> = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
  };
  return map[c];
}
