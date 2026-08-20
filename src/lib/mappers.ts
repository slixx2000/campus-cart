import type { ListingWithRelations, ListingCondition } from "@/types/database";
import type { Listing, Category, Condition } from "@/types";
import { cdnUrl, thumbKeyFor } from "@/lib/cdn";

const PLACEHOLDER = "/images/placeholder-electronics.svg";

/** Maps a DB row (with relations) to the UI Listing shape used by ProductCard etc. */
export function dbListingToUi(row: ListingWithRelations): Listing {
  // object_key wins where present; public_url is the fallback for anything written
  // before the R2 cutover. Both can coexist indefinitely — nothing needs backfilling.
  const sorted = [...row.listing_images].sort((a, b) => a.sort_order - b.sort_order);
  const images =
    sorted.length > 0
      ? sorted.map((img) =>
          img.object_key ? cdnUrl(img.object_key) : img.public_url ?? PLACEHOLDER
        )
      : [PLACEHOLDER];
  // Grid-sized variants. Supabase-era rows have no thumbnail, so they fall back to the
  // full image and keep rendering exactly as before.
  const thumbnails =
    sorted.length > 0
      ? sorted.map((img) =>
          img.object_key
            ? cdnUrl(thumbKeyFor(img.object_key))
            : img.public_url ?? PLACEHOLDER
        )
      : [PLACEHOLDER];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    category: (row.categories?.name ?? "Other") as Category,
    condition: conditionToUi(row.condition),
    university: row.universities?.name ?? "",
    universityShortName: row.universities?.short_name ?? undefined,
    sellerId: row.profiles?.id,
    sellerName: row.profiles?.full_name ?? "Unknown Seller",
    sellerAvatarUrl: row.profiles?.avatar_url ?? undefined,
    sellerIsPioneer: row.profiles?.is_pioneer_seller === true,
    images,
    thumbnails,
    viewCount: Number(row.view_count ?? 0),
    lastBumpedAt: row.last_bumped_at,
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
