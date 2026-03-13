import { createClient } from "@/lib/supabase/server";
import type { ListingWithRelations } from "@/types/database";

const LISTING_SELECT = `
  *,
  categories ( id, name, slug, material_icon, color_class ),
  universities ( id, name, short_name, city ),
  profiles!listings_seller_id_fkey ( id, full_name, phone, avatar_url ),
  listing_images ( id, public_url, storage_path, sort_order )
`;

export type ListingsFilter = {
  query?: string;
  category?: string;
  university?: string;
  maxPrice?: number;
  isService?: boolean;
  sortBy?: "newest" | "price-asc" | "price-desc";
  page?: number;
  pageSize?: number;
  disablePagination?: boolean;
};

export async function getListings(
  filter: ListingsFilter = {}
): Promise<{ data: ListingWithRelations[]; count: number }> {
  const supabase = await createClient();
  const {
    query,
    category,
    university,
    maxPrice,
    isService,
    sortBy = "newest",
    page = 1,
    pageSize = 12,
    disablePagination = false,
  } = filter;

  let q = supabase
    .from("listings")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("status", "active")
    .is("deleted_at", null);

  if (query?.trim()) {
    q = q.or(
      `title.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`
    );
  }
  if (category) {
    // category can be a slug or a name; join via subquery via filter
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .or(`slug.eq.${category},name.eq.${category}`)
      .single();
    if (cat) q = q.eq("category_id", cat.id);
  }
  if (university) {
    const { data: uni } = await supabase
      .from("universities")
      .select("id")
      .or(`code.eq.${university},name.ilike.%${university}%`)
      .single();
    if (uni) q = q.eq("university_id", uni.id);
  }
  if (maxPrice !== undefined) q = q.lte("price", maxPrice);
  if (isService !== undefined) q = q.eq("is_service", isService);

  switch (sortBy) {
    case "price-asc":
      q = q.order("price", { ascending: true });
      break;
    case "price-desc":
      q = q.order("price", { ascending: false });
      break;
    default:
      q = q.order("created_at", { ascending: false });
  }

  if (!disablePagination) {
    const from = (page - 1) * pageSize;
    q = q.range(from, from + pageSize - 1);
  }

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { data: (data as ListingWithRelations[]) ?? [], count: count ?? 0 };
}

export async function getFeaturedListings(
  limit = 8
): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .eq("featured", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as ListingWithRelations[]) ?? [];
}

export async function getRecentListings(
  limit = 8
): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as ListingWithRelations[]) ?? [];
}

export async function getListingById(
  id: string
): Promise<ListingWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();
  if (error) return null;
  return data as ListingWithRelations;
}

export async function getRelatedListings(
  listingId: string,
  categoryId: string,
  limit = 4
): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("category_id", categoryId)
    .eq("status", "active")
    .is("deleted_at", null)
    .neq("id", listingId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as ListingWithRelations[]) ?? [];
}

export async function getListingsByUser(
  userId: string
): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("seller_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ListingWithRelations[]) ?? [];
}
