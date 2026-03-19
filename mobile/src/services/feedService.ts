import type { ListingSummary } from "@campuscart/shared";
import { getSupabaseClient } from "@/lib/supabase";
import type { FeedListing, HomeFeed, ListingDetail } from "@/types";

const HOME_FEED_SECTION_LIMIT = 20;
const LIQUIDITY_CANDIDATE_MULTIPLIER = 3;

type FeedSectionKey = keyof HomeFeed;

type FeedTargets = {
  newest: number;
  recentlyActive: number;
  nearby: number;
  random: number;
};

const LISTING_SELECT = `
  id,
  title,
  description,
  price,
  featured,
  is_service,
  created_at,
  last_bumped_at,
  view_count,
  university_id,
  categories ( name ),
  universities ( id, name, short_name ),
  profiles!listings_seller_id_fkey ( id, full_name, avatar_url, phone ),
  listing_images ( public_url, sort_order )
`;

type ListingRowWithRelations = {
  id: string;
  title: string;
  description: string;
  price: number;
  featured: boolean;
  is_service: boolean;
  created_at: string;
  last_bumped_at: string;
  view_count: number;
  university_id: string;
  categories: { name: string } | null;
  universities: { id: string; name: string; short_name: string } | null;
  profiles: { id: string; full_name: string; avatar_url: string | null; phone: string | null } | null;
  listing_images: Array<{ public_url: string | null; sort_order: number }>;
};

type RankedSearchRow = {
  listing_id: string;
  combined_score: number;
  total_count: number;
};

function toFeedThumbnailUrl(publicUrl: string): string {
  const marker = "/storage/v1/object/public/";
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex < 0) {
    return publicUrl;
  }

  const baseUrl = publicUrl.slice(0, markerIndex);
  const objectPath = publicUrl.slice(markerIndex + marker.length);
  const [pathWithoutQuery] = objectPath.split("?");

  // Use Supabase image render endpoint for smaller feed payloads.
  return `${baseUrl}/storage/v1/render/image/public/${pathWithoutQuery}?width=420&height=420&quality=70&resize=cover`;
}

function toFeedListing(row: ListingRowWithRelations): FeedListing {
  const imageUrl = [...(row.listing_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.public_url)
    .find((url): url is string => Boolean(url));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    universityName: row.universities?.name ?? "",
    universityShortName: row.universities?.short_name,
    createdAt: row.created_at,
    lastBumpedAt: row.last_bumped_at,
    viewCount: Number(row.view_count ?? 0),
    featured: row.featured,
    isService: row.is_service,
    imageUrl: imageUrl ? toFeedThumbnailUrl(imageUrl) : undefined,
    listing_images: row.listing_images ?? [],
  };
}

function buildSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleRows<T>(rows: T[], seed: number): T[] {
  const rand = buildSeededRandom(seed);
  const next = [...rows];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function calculateTargets(pageSize: number, hasNearby: boolean): FeedTargets {
  const newest = Math.floor(pageSize * 0.4);
  const recentlyActive = Math.floor(pageSize * 0.3);
  const nearby = hasNearby ? Math.floor(pageSize * 0.2) : 0;
  let random = pageSize - newest - recentlyActive - nearby;

  if (!hasNearby) {
    // Reallocate nearby budget when user has no nearby context.
    const nearbyBudget = Math.floor(pageSize * 0.2);
    random += Math.floor(nearbyBudget / 2);
    return {
      newest: newest + Math.ceil(nearbyBudget / 2),
      recentlyActive,
      nearby: 0,
      random,
    };
  }

  return {
    newest,
    recentlyActive,
    nearby,
    random,
  };
}

function pickSectionForRandom(
  feed: HomeFeed,
  targets: FeedTargets,
  hasNearby: boolean
): FeedSectionKey {
  const options: Array<{ key: FeedSectionKey; remaining: number }> = [
    { key: "newListings", remaining: targets.newest - feed.newListings.length },
    {
      key: "recentlyActiveListings",
      remaining: targets.recentlyActive - feed.recentlyActiveListings.length,
    },
    {
      key: "nearbyListings",
      remaining: hasNearby ? targets.nearby - feed.nearbyListings.length : -1,
    },
  ];

  options.sort((a, b) => b.remaining - a.remaining);
  return options[0]?.key ?? "newListings";
}

function takeUniqueRows(
  rows: ListingRowWithRelations[],
  targetCount: number,
  selectedIds: Set<string>,
  pushRow: (row: ListingRowWithRelations) => void
): void {
  if (targetCount <= 0) return;

  for (const row of rows) {
    if (targetCount <= 0) break;
    if (selectedIds.has(row.id)) continue;

    selectedIds.add(row.id);
    pushRow(row);
    targetCount -= 1;
  }
}

export async function getCurrentUserUniversityId(): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("university_id")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Error fetching user university ID:", error);
      return null;
    }

    return data?.university_id ?? null;
  } catch (error) {
    console.warn("Exception fetching user university ID:", error);
    return null;
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getHomeFeed(): Promise<HomeFeed> {
  const page = await getHomeFeedPage(0, HOME_FEED_SECTION_LIMIT);
  return page.feed;
}

export type HomeFeedPage = {
  feed: HomeFeed;
  hasMore: {
    newListings: boolean;
    nearbyListings: boolean;
    recentlyActiveListings: boolean;
  };
};

export async function getHomeFeedPage(
  page: number,
  pageSize = HOME_FEED_SECTION_LIMIT
): Promise<HomeFeedPage> {
  try {
    const supabase = getSupabaseClient();
    const effectivePageSize = HOME_FEED_SECTION_LIMIT;
    const safePage = Math.max(0, page);
    const candidateWindowSize = Math.max(effectivePageSize * LIQUIDITY_CANDIDATE_MULTIPLIER, pageSize);
    const from = safePage * candidateWindowSize;
    const to = from + candidateWindowSize - 1;
    const userUniversityIdPromise = getCurrentUserUniversityId();

    const [newRowsResponse, recentlyActiveResponse, randomRowsResponse, userUniversityId] = await Promise.all([
      supabase
        .from("listings")
        .select(LISTING_SELECT)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("last_bumped_at", { ascending: false })
        .range(from, to),
      supabase
        .from("listings")
        .select(LISTING_SELECT)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("last_bumped_at", { ascending: false })
        .range(from, to),
      supabase
        .from("listings")
        .select(LISTING_SELECT)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .range(from, to),
      userUniversityIdPromise,
    ]);

    const nearbyRowsResponse = userUniversityId
      ? await supabase
          .from("listings")
          .select(LISTING_SELECT)
          .eq("status", "active")
          .is("deleted_at", null)
          .eq("university_id", userUniversityId)
          .order("last_bumped_at", { ascending: false })
          .range(from, to)
      : { data: [] as unknown[] };

    const newestRows = (newRowsResponse.data ?? []) as unknown as ListingRowWithRelations[];
    const activeRows = (recentlyActiveResponse.data ?? []) as unknown as ListingRowWithRelations[];
    const nearbyRows = (nearbyRowsResponse.data ?? []) as unknown as ListingRowWithRelations[];
    const randomRows = shuffleRows(
      (randomRowsResponse.data ?? []) as unknown as ListingRowWithRelations[],
      safePage + 137
    );

    const hasNearbyContext = Boolean(userUniversityId);
    const targets = calculateTargets(effectivePageSize, hasNearbyContext);
    const selectedIds = new Set<string>();

    const feed: HomeFeed = {
      newListings: [],
      nearbyListings: [],
      recentlyActiveListings: [],
    };

    takeUniqueRows(newestRows, targets.newest, selectedIds, (row) => {
      feed.newListings.push(toFeedListing(row));
    });

    takeUniqueRows(activeRows, targets.recentlyActive, selectedIds, (row) => {
      feed.recentlyActiveListings.push(toFeedListing(row));
    });

    takeUniqueRows(nearbyRows, targets.nearby, selectedIds, (row) => {
      feed.nearbyListings.push(toFeedListing(row));
    });

    let randomBudget = targets.random;
    for (const row of randomRows) {
      if (randomBudget <= 0) break;
      if (selectedIds.has(row.id)) continue;

      selectedIds.add(row.id);
      randomBudget -= 1;
      const section = pickSectionForRandom(feed, targets, hasNearbyContext);
      feed[section].push(toFeedListing(row));
    }

    const fallbackRows = [newestRows, activeRows, nearbyRows, randomRows].flat();
    const fillSection = (section: FeedSectionKey, targetCount: number) => {
      while (feed[section].length < targetCount) {
        const next = fallbackRows.find((row) => !selectedIds.has(row.id));
        if (!next) break;

        selectedIds.add(next.id);
        feed[section].push(toFeedListing(next));
      }
    };

    fillSection("newListings", targets.newest);
    fillSection("recentlyActiveListings", targets.recentlyActive);
    fillSection("nearbyListings", targets.nearby);

    const hasMoreAny =
      newestRows.length === candidateWindowSize ||
      activeRows.length === candidateWindowSize ||
      randomRows.length === candidateWindowSize ||
      (hasNearbyContext && nearbyRows.length === candidateWindowSize);

    return {
      feed,
      hasMore: {
        newListings: hasMoreAny,
        nearbyListings: hasNearbyContext ? hasMoreAny : false,
        recentlyActiveListings: hasMoreAny,
      },
    };
  } catch (error) {
    console.error("Error loading home feed page:", error);
    // Return empty feed on error instead of throwing
    return {
      feed: {
        newListings: [],
        nearbyListings: [],
        recentlyActiveListings: [],
      },
      hasMore: {
        newListings: false,
        nearbyListings: false,
        recentlyActiveListings: false,
      },
    };
  }
}

export async function getListingDetail(listingId: string): Promise<ListingDetail | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", listingId)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as ListingRowWithRelations;

  // Keep analytics and feed liquidity in sync with web by using the same RPC.
  void supabase.rpc("increment_listing_view", { p_listing_id: listingId });

  return {
    ...toFeedListing(row),
    categoryName: row.categories?.name,
    universityId: row.university_id,
    seller: row.profiles
      ? {
          id: row.profiles.id,
          fullName: row.profiles.full_name,
          avatarUrl: row.profiles.avatar_url,
          phone: row.profiles.phone,
        }
      : undefined,
    images: (row.listing_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => img.public_url)
      .filter((url): url is string => Boolean(url)),
  };
}

export async function getSimilarListings(categoryName?: string): Promise<ListingSummary[]> {
  if (!categoryName) return [];

  const supabase = getSupabaseClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("name", categoryName)
    .maybeSingle();

  if (!category?.id) return [];

  const { data } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return ((data ?? []) as unknown as ListingRowWithRelations[]).map(toFeedListing);
}

export async function searchListingsRanked(
  query: string,
  page = 0,
  pageSize = 20
): Promise<{ data: ListingSummary[]; count: number }> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { data: [], count: 0 };
  }

  const supabase = getSupabaseClient();
  const safePage = Math.max(0, page);
  const safePageSize = Math.max(1, pageSize);

  const { data: rankedRows, error: rankedError } = await supabase.rpc("search_listings_ranked", {
    p_query: trimmedQuery,
    p_page: safePage,
    p_page_size: safePageSize,
    p_category_id: null,
    p_university_id: null,
    p_max_price: null,
    p_is_service: null,
  });

  if (rankedError) {
    throw new Error(rankedError.message);
  }

  const ranked = (rankedRows ?? []) as unknown as RankedSearchRow[];
  const orderedIds = ranked.map((row) => row.listing_id);
  const totalCount = ranked[0]?.total_count ?? 0;

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
    (((listingRows ?? []) as unknown as ListingRowWithRelations[]) ?? []).map((row) => [row.id, row])
  );

  const orderedResults = orderedIds
    .map((id) => byId.get(id))
    .filter((row): row is ListingRowWithRelations => Boolean(row))
    .map(toFeedListing);

  return {
    data: orderedResults,
    count: totalCount,
  };
}

export async function addListingToFavorites(listingId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to save listings.");
  }

  const { error } = await supabase.from("favorites").upsert(
    {
      user_id: userId,
      listing_id: listingId,
    },
    {
      onConflict: "user_id,listing_id",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeListingFromFavorites(listingId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must sign in to manage saved listings.");
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function isListingFavorited(listingId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function getFavoriteListings(): Promise<ListingSummary[]> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const { data: favorites, error: favoritesError } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (favoritesError) {
    throw new Error(favoritesError.message);
  }

  const favoriteIds = (favorites ?? []).map((row) => row.listing_id).filter(Boolean);
  if (favoriteIds.length === 0) {
    return [];
  }

  const { data: listings, error: listingError } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .is("deleted_at", null)
    .in("id", favoriteIds);

  if (listingError) {
    throw new Error(listingError.message);
  }

  const listingRows = (listings ?? []) as unknown as ListingRowWithRelations[];
  const listingById = new Map(listingRows.map((row) => [row.id, row]));

  return favoriteIds
    .map((id) => listingById.get(id))
    .filter((row): row is ListingRowWithRelations => Boolean(row))
    .map(toFeedListing);
}
