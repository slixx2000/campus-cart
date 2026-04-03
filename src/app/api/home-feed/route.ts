import { NextResponse } from "next/server";
import { dbListingToUi } from "@/lib/mappers";
import {
  getNearbyListingsPage,
  getNewListingsPage,
  getRecentlyActiveListingsPage,
} from "@/lib/repositories/listings";
import { TimeoutError, withTimeout } from "@/lib/asyncTimeout";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 40;
const HOME_FEED_CACHE_TTL_MS = 30_000;
const HOME_FEED_CACHE_MAX_ENTRIES = 300;
const HOME_FEED_QUERY_TIMEOUT_MS = 4_500;

type HomeFeedPayload = {
  newListings: ReturnType<typeof dbListingToUi>[];
  nearbyListings: ReturnType<typeof dbListingToUi>[];
  recentlyActiveListings: ReturnType<typeof dbListingToUi>[];
  hasMore: {
    newListings: boolean;
    nearbyListings: boolean;
    recentlyActiveListings: boolean;
  };
};

type CachedFeedEntry = {
  expiresAt: number;
  payload: HomeFeedPayload;
};

const feedCache = new Map<string, CachedFeedEntry>();

function pruneFeedCache(now: number) {
  for (const [key, entry] of feedCache.entries()) {
    if (entry.expiresAt <= now) {
      feedCache.delete(key);
    }
  }

  while (feedCache.size > HOME_FEED_CACHE_MAX_ENTRIES) {
    const oldestKey = feedCache.keys().next().value;
    if (!oldestKey) break;
    feedCache.delete(oldestKey);
  }
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    pruneFeedCache(startedAt);

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 0);
    const requestedPageSize = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(Math.max(1, requestedPageSize), MAX_PAGE_SIZE);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userUniversityId = user
      ? (
          await supabase
            .from("profiles")
            .select("university_id")
            .eq("id", user.id)
            .maybeSingle()
        ).data?.university_id ?? null
      : null;

    const cacheKey = `${user?.id ?? "anon"}:${userUniversityId ?? "none"}:${page}:${pageSize}`;
    const cached = feedCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.info("home-feed-api", {
        event: "cache-hit",
        page,
        pageSize,
        userId: user?.id ?? null,
        durationMs: Date.now() - startedAt,
      });

      return NextResponse.json(cached.payload);
    }

    let newRows: Awaited<ReturnType<typeof getNewListingsPage>>;
    let nearbyRows: Awaited<ReturnType<typeof getNearbyListingsPage>> | [];
    let recentlyActiveRows: Awaited<ReturnType<typeof getRecentlyActiveListingsPage>>;

    try {
      [newRows, nearbyRows, recentlyActiveRows] = await withTimeout(
        Promise.all([
          getNewListingsPage(page, pageSize),
          userUniversityId ? getNearbyListingsPage(userUniversityId, page, pageSize) : Promise.resolve([]),
          getRecentlyActiveListingsPage(page, pageSize),
        ]),
        HOME_FEED_QUERY_TIMEOUT_MS,
        "Timed out while loading home feed"
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        if (cached) {
          console.warn("home-feed-api", {
            event: "timeout-fallback-stale-cache",
            page,
            pageSize,
            userId: user?.id ?? null,
            staleByMs: Math.max(0, Date.now() - cached.expiresAt),
            durationMs: Date.now() - startedAt,
          });

          return NextResponse.json(cached.payload, {
            headers: {
              "x-home-feed-cache": "stale-fallback",
            },
          });
        }

        console.warn("home-feed-api", {
          event: "timeout-no-cache",
          page,
          pageSize,
          userId: user?.id ?? null,
          durationMs: Date.now() - startedAt,
        });

        return NextResponse.json(
          { error: "Feed is temporarily slow. Please retry." },
          { status: 504 }
        );
      }

      throw error;
    }

    const payload: HomeFeedPayload = {
      newListings: newRows.map(dbListingToUi),
      nearbyListings: nearbyRows.map(dbListingToUi),
      recentlyActiveListings: recentlyActiveRows.map(dbListingToUi),
      hasMore: {
        newListings: newRows.length === pageSize,
        nearbyListings: userUniversityId ? nearbyRows.length === pageSize : false,
        recentlyActiveListings: recentlyActiveRows.length === pageSize,
      },
    };

    feedCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + HOME_FEED_CACHE_TTL_MS,
    });
    pruneFeedCache(Date.now());

    console.info("home-feed-api", {
      event: "cache-miss",
      page,
      pageSize,
      userId: user?.id ?? null,
      counts: {
        newListings: payload.newListings.length,
        nearbyListings: payload.nearbyListings.length,
        recentlyActiveListings: payload.recentlyActiveListings.length,
      },
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load home feed";
    console.error("home-feed-api", {
      event: "error",
      error: message,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
