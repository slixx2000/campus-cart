import { createClient } from "@/lib/supabase/server";
import type { ListingWithRelations } from "@/types/database";

export const LISTING_SELECT = `
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

type RankedSearchRow = {
  listing_id: string;
  combined_score: number;
  total_count: number;
};

type AdvancedSearchRow = {
  listing_id: string;
  combined_score: number;
  total_count: number;
};

export type ScoredListing = ListingWithRelations & {
  feed_score: number;
};

const HOME_FEED_PAGE_SIZE = 20;

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
    pageSize = 20,
    disablePagination = false,
  } = filter;

  let categoryId: string | null = null;
  let universityId: string | null = null;

  if (category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .or(`slug.eq.${category},name.eq.${category}`)
      .single();
    categoryId = cat?.id ?? null;
  }

  if (university) {
    const { data: uni } = await supabase
      .from("universities")
      .select("id")
      .or(`code.eq.${university},name.ilike.%${university}%`)
      .single();
    universityId = uni?.id ?? null;
  }

  const trimmedQuery = query?.trim();
  if (trimmedQuery) {
    const hasAdvancedSearchFilters = Boolean(
      categoryId || universityId || maxPrice !== undefined || isService !== undefined
    );

    if (!hasAdvancedSearchFilters) {
      const { data: advancedRows, error: advancedError } = await supabase.rpc(
        "search_listings",
        {
          query_text: trimmedQuery,
        }
      );

      if (advancedError) {
        throw new Error(advancedError.message);
      }

      const rows = (advancedRows ?? []) as unknown as AdvancedSearchRow[];
      const orderedIds = rows.map((row) => row.listing_id);
      const totalCount = rows[0]?.total_count ?? 0;

      if (orderedIds.length === 0) {
        return { data: [], count: 0 };
      }

      const { data: listingRows, error: listingError } = await supabase
        .from("listings")
        .select(LISTING_SELECT)
        .in("id", orderedIds);

      if (listingError) {
        throw new Error(listingError.message);
      }

      const byId = new Map(
        (((listingRows ?? []) as unknown as ListingWithRelations[]) ?? []).map((row) => [row.id, row])
      );
      const orderedRows = orderedIds
        .map((id) => byId.get(id))
        .filter((row): row is ListingWithRelations => Boolean(row));

      return {
        data: orderedRows,
        count: totalCount,
      };
    }

    const rankedPageSize = disablePagination ? 20 : pageSize;
    const rankedPage = disablePagination ? 0 : Math.max(0, page - 1);

    const { data: rankedRows, error: rankedError } = await supabase.rpc(
      "search_listings_ranked",
      {
        p_query: trimmedQuery,
        p_page: rankedPage,
        p_page_size: rankedPageSize,
        p_category_id: categoryId,
        p_university_id: universityId,
        p_max_price: maxPrice ?? null,
        p_is_service: isService ?? null,
      }
    );

    if (rankedError) {
      throw new Error(rankedError.message);
    }

    const rankRows = (rankedRows ?? []) as unknown as RankedSearchRow[];
    const orderedIds = rankRows.map((row) => row.listing_id);
    const totalCount = rankRows[0]?.total_count ?? 0;

    if (orderedIds.length === 0) {
      return { data: [], count: 0 };
    }

    const { data: listingRows, error: listingError } = await supabase
      .from("listings")
      .select(LISTING_SELECT)
      .in("id", orderedIds);

    if (listingError) {
      throw new Error(listingError.message);
    }

    const byId = new Map(
      (((listingRows ?? []) as unknown as ListingWithRelations[]) ?? []).map((row) => [row.id, row])
    );
    const orderedRows = orderedIds
      .map((id) => byId.get(id))
      .filter((row): row is ListingWithRelations => Boolean(row));

    return {
      data: orderedRows,
      count: totalCount,
    };
  }

  let q = supabase
    .from("listings")
    .select(LISTING_SELECT, { count: "exact" })
    .eq("status", "active")
    .is("deleted_at", null);

  if (categoryId) q = q.eq("category_id", categoryId);
  if (universityId) q = q.eq("university_id", universityId);
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
  return { data: (data as unknown as ListingWithRelations[]) ?? [], count: count ?? 0 };
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
  return (data as unknown as ListingWithRelations[]) ?? [];
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
  return (data as unknown as ListingWithRelations[]) ?? [];
}

export async function getNewListings(
  limit = 8
): Promise<ListingWithRelations[]> {
  if (limit !== HOME_FEED_PAGE_SIZE) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("last_bumped_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as unknown as ListingWithRelations[]) ?? [];
  }

  return getNewListingsPage(0, HOME_FEED_PAGE_SIZE);
}

export async function getNewListingsPage(
  page: number,
  pageSize = HOME_FEED_PAGE_SIZE
): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const from = Math.max(0, page) * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("last_bumped_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);
  return (data as unknown as ListingWithRelations[]) ?? [];
}

export async function getNearbyListings(
  universityId: string,
  limit = 8
): Promise<ListingWithRelations[]> {
  if (limit !== HOME_FEED_PAGE_SIZE) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("status", "active")
      .is("deleted_at", null)
      .eq("university_id", universityId)
      .order("last_bumped_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as unknown as ListingWithRelations[]) ?? [];
  }

  return getNearbyListingsPage(universityId, 0, HOME_FEED_PAGE_SIZE);
}

export async function getNearbyListingsPage(
  universityId: string,
  page: number,
  pageSize = HOME_FEED_PAGE_SIZE
): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const from = Math.max(0, page) * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .eq("university_id", universityId)
    .order("last_bumped_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);
  return (data as unknown as ListingWithRelations[]) ?? [];
}

export async function getRecentlyActiveListings(
  limit = 8
): Promise<ListingWithRelations[]> {
  if (limit !== HOME_FEED_PAGE_SIZE) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select(LISTING_SELECT)
      .eq("status", "active")
      .is("deleted_at", null)
      .order("last_bumped_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as unknown as ListingWithRelations[]) ?? [];
  }

  return getRecentlyActiveListingsPage(0, HOME_FEED_PAGE_SIZE);
}

export async function getRecentlyActiveListingsPage(
  page: number,
  pageSize = HOME_FEED_PAGE_SIZE
): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const from = Math.max(0, page) * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("last_bumped_at", { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);
  return (data as unknown as ListingWithRelations[]) ?? [];
}

export function scoreListingsForFeed(rows: ListingWithRelations[]): ScoredListing[] {
  const now = Date.now();

  return [...rows]
    .map((row) => {
      const hoursSinceBump = Math.max(
        0,
        (now - new Date(row.last_bumped_at).getTime()) / (1000 * 60 * 60)
      );

      // Score blends recent activity (decays over time) with popularity.
      const recencyScore = Math.max(0, 120 - hoursSinceBump * 4);
      const popularityScore = Math.log10(Number(row.view_count ?? 0) + 1) * 18;
      const feedScore = recencyScore + popularityScore;

      return {
        ...row,
        feed_score: feedScore,
      };
    })
    .sort((a, b) => b.feed_score - a.feed_score);
}

export async function incrementListingViewCount(listingId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_listing_view", {
    p_listing_id: listingId,
  });

  if (error) {
    throw new Error(error.message);
  }
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
  return data as unknown as ListingWithRelations;
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
  return (data as unknown as ListingWithRelations[]) ?? [];
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
  return (data as unknown as ListingWithRelations[]) ?? [];
}
