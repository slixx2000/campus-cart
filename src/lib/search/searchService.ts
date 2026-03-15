import "server-only";

import { dbListingToUi } from "@/lib/mappers";
import { LISTING_SELECT } from "@/lib/repositories/listings";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/types";
import type { ListingWithRelations } from "@/types/database";

type RankedSearchRow = {
  listing_id: string;
  combined_score: number;
  total_count: number;
};

export type SearchResult = {
  listing: Listing;
  combinedScore: number;
};

export type SearchResponse = {
  query: string;
  totalCount: number;
  results: SearchResult[];
};

export async function searchListings(query: string): Promise<SearchResponse> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return {
      query: "",
      totalCount: 0,
      results: [],
    };
  }

  const supabase = await createClient();

  const { data: rankedRows, error: rankedError } = await supabase.rpc("search_listings", {
    query_text: normalizedQuery,
  });

  if (rankedError) {
    throw new Error(rankedError.message);
  }

  const rows = (rankedRows ?? []) as unknown as RankedSearchRow[];
  const orderedIds = rows.map((row) => row.listing_id);

  if (orderedIds.length === 0) {
    return {
      query: normalizedQuery,
      totalCount: 0,
      results: [],
    };
  }

  const { data: listingRows, error: listingsError } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .in("id", orderedIds);

  if (listingsError) {
    throw new Error(listingsError.message);
  }

  const listingMap = new Map(
    (((listingRows ?? []) as unknown as ListingWithRelations[]) ?? []).map((row) => [row.id, row])
  );

  const scoreMap = new Map(rows.map((row) => [row.listing_id, row.combined_score]));

  const orderedResults = orderedIds
    .map((id) => listingMap.get(id))
    .filter((row): row is ListingWithRelations => Boolean(row))
    .map((row) => ({
      listing: dbListingToUi(row),
      combinedScore: scoreMap.get(row.id) ?? 0,
    }));

  return {
    query: normalizedQuery,
    totalCount: rows[0]?.total_count ?? orderedResults.length,
    results: orderedResults,
  };
}
