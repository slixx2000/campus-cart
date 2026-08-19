"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import NewListingsCarousel from "@/components/NewListingsCarousel";
import type { Listing } from "@/types";

type FeedResponse = {
  newListings: Listing[];
  nearbyListings: Listing[];
  hasMore: {
    newListings: boolean;
    nearbyListings: boolean;
  };
};

async function parseFeedResponse(response: Response): Promise<FeedResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  if (!raw.trim()) {
    throw new Error("Feed response was empty");
  }

  if (!contentType.includes("application/json")) {
    throw new Error("Feed response was not JSON");
  }

  try {
    return JSON.parse(raw) as FeedResponse;
  } catch {
    throw new Error("Feed response could not be parsed");
  }
}

type HomeFeedSectionsProps = {
  initialNewListings: Listing[];
  initialNearbyListings: Listing[];
  hasNearbyUniversity: boolean;
  favoriteIds?: string[];
  signedIn?: boolean;
};

const PAGE_SIZE = 20;

const appendUnique = (existing: Listing[], incoming: Listing[]): Listing[] => {
  if (incoming.length === 0) {
    return existing;
  }

  const ids = new Set(existing.map((item) => item.id));
  const next = incoming.filter((item) => !ids.has(item.id));
  return next.length > 0 ? [...existing, ...next] : existing;
};

export default function HomeFeedSections({
  initialNewListings,
  initialNearbyListings,
  hasNearbyUniversity,
  favoriteIds = [],
  signedIn = false,
}: HomeFeedSectionsProps) {
  const favorited = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const [newListings, setNewListings] = useState(initialNewListings);
  const [nearbyListings, setNearbyListings] = useState(initialNearbyListings);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState({
    newListings: initialNewListings.length === PAGE_SIZE,
    nearbyListings: hasNearbyUniversity ? initialNearbyListings.length === PAGE_SIZE : false,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const requestedPagesRef = useRef<Set<number>>(new Set([0]));
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const hasAnyMore = useMemo(
    () => hasMore.newListings || hasMore.nearbyListings,
    [hasMore]
  );
  const shouldShowEndOfFeedMessage = page > 0 && !hasAnyMore;

  const loadNextPage = useCallback(() => {
    if (!hasAnyMore || isFetchingRef.current) {
      return;
    }

    const nextPage = page + 1;
    if (requestedPagesRef.current.has(nextPage)) {
      return;
    }

    requestedPagesRef.current.add(nextPage);
    isFetchingRef.current = true;
    setLoadMoreError(null);
    setIsLoadingMore(true);
    const startedAt = performance.now();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    void fetch(`/api/home-feed?page=${nextPage}&pageSize=${PAGE_SIZE}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!mountedRef.current) return;
        if (!response.ok) {
          throw new Error("Failed to fetch the next feed page");
        }

        const payload = await parseFeedResponse(response);
        setNewListings((prev) => appendUnique(prev, payload.newListings));
        setNearbyListings((prev) => appendUnique(prev, payload.nearbyListings));
        setHasMore(payload.hasMore);
        setPage(nextPage);

        console.info("home-feed-web", {
          event: "page-load-success",
          page: nextPage,
          durationMs: Math.round(performance.now() - startedAt),
          counts: {
            newListings: payload.newListings.length,
            nearbyListings: payload.nearbyListings.length,
          },
        });
      })
      .catch((error) => {
        if (!mountedRef.current) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        requestedPagesRef.current.delete(nextPage);
        setLoadMoreError("Could not load more listings.");

        console.warn("home-feed-web", {
          event: "page-load-failure",
          page: nextPage,
          durationMs: Math.round(performance.now() - startedAt),
          error: error instanceof Error ? error.message : "unknown-error",
        });
      })
      .finally(() => {
        if (!mountedRef.current) return;
        isFetchingRef.current = false;
        setIsLoadingMore(false);
      });
  }, [hasAnyMore, page]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        loadNextPage();
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage]);

  return (
    <>
      <section className="mx-auto mt-12 max-w-[1200px] px-4 pb-4 sm:mt-20 sm:px-6 sm:pb-6">
        <div className="mb-5 flex items-center justify-between sm:mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-fg">New Listings</h2>
          <Link
            href="/browse"
            className="flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"
          >
            View all{" "}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
        <NewListingsCarousel
          listings={newListings}
          favoriteIds={favorited}
          signedIn={signedIn}
        />
        {page > 0 && !hasMore.newListings ? (
          <p className="mt-5 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
            No more new listings right now.
          </p>
        ) : null}
      </section>

      <div className="mx-auto h-px w-[1200px] max-w-[calc(100%-3rem)]" />

      <section className="bg-surface py-10 sm:py-16 dark:border-y dark:border-primary/10 dark:bg-primary/5">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="mb-5 flex items-center justify-between sm:mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-fg">Nearby Listings</h2>
            <Link
              href="/browse"
              className="flex items-center gap-1 text-sm font-medium text-muted hover:text-fg"
            >
              View all{" "}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          {nearbyListings.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in and set your university to see nearby marketplace activity.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {nearbyListings.map((listing) => (
                  <ProductCard
                    key={listing.id}
                    listing={{ ...listing, isNearby: true }}
                    isFavorited={favorited.has(listing.id)}
                    signedIn={signedIn}
                  />
                ))}
              </div>
              {page > 0 && !hasMore.nearbyListings ? (
                <p className="mt-5 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                  No more nearby listings right now.
                </p>
              ) : null}
            </>
          )}
        </div>
      </section>

      <div ref={sentinelRef} className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
        {isLoadingMore ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3 rounded-xl border border-line bg-surface p-4 dark:bg-surface">
                <div className="h-40 rounded-lg bg-gray-200 dark:bg-slate-700" />
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : loadMoreError ? (
          <div className="flex flex-col items-center justify-center gap-2 text-sm font-semibold">
            <span className="text-rose-700 dark:text-rose-300">Could not load more listings.</span>
            <button
              type="button"
              onClick={loadNextPage}
              className="rounded-full border border-rose-200 px-4 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/30"
            >
              Tap to retry
            </button>
          </div>
        ) : shouldShowEndOfFeedMessage ? (
          <div className="text-center text-sm font-semibold text-slate-400 dark:text-slate-500">
            You have reached the end of this feed.
          </div>
        ) : null}
      </div>
    </>
  );
}
