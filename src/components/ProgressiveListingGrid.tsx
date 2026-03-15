"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Listing } from "@/types";

type ProgressiveListingGridProps = {
  items: Listing[];
  storageKey: string;
  batchSize?: number;
};

const DEFAULT_BATCH_SIZE = 16;
const IS_DEV = process.env.NODE_ENV !== "production";

export default function ProgressiveListingGrid({
  items,
  storageKey,
  batchSize = DEFAULT_BATCH_SIZE,
}: ProgressiveListingGridProps) {
  const persistedKey = `progressive-grid:${storageKey}`;
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === "undefined") {
      return Math.min(batchSize, items.length);
    }

    const persisted = Number.parseInt(sessionStorage.getItem(persistedKey) ?? "", 10);
    if (!Number.isFinite(persisted) || persisted <= 0) {
      return Math.min(batchSize, items.length);
    }

    return Math.min(items.length, persisted);
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isLoadingRef = useRef(false);
  const previousVisibleCountRef = useRef(visibleCount);
  const batchStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setVisibleCount((prev) => {
      const minTarget = Math.min(batchSize, items.length);
      return Math.max(Math.min(items.length, prev), minTarget);
    });
  }, [batchSize, items.length]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    sessionStorage.setItem(persistedKey, String(visibleCount));
  }, [persistedKey, visibleCount]);

  useEffect(() => {
    if (!IS_DEV) {
      previousVisibleCountRef.current = visibleCount;
      return;
    }

    const previous = previousVisibleCountRef.current;
    if (visibleCount > previous) {
      const durationMs =
        batchStartedAtRef.current !== null
          ? Math.round(performance.now() - batchStartedAtRef.current)
          : null;

      console.info("progressive-grid", {
        event: "batch-rendered",
        storageKey,
        batchSize: visibleCount - previous,
        visibleCount,
        totalCount: items.length,
        durationMs,
      });
      batchStartedAtRef.current = null;
    }

    previousVisibleCountRef.current = visibleCount;
  }, [items.length, storageKey, visibleCount]);

  const hasMore = visibleCount < items.length;
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isLoadingRef.current) {
          return;
        }

        isLoadingRef.current = true;
        if (IS_DEV) {
          batchStartedAtRef.current = performance.now();
        }
        setVisibleCount((prev) => Math.min(items.length, prev + batchSize));
        isLoadingRef.current = false;
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [batchSize, hasMore, items.length, visibleCount]);

  return (
    <>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleItems.map((listing) => (
          <ProductCard key={listing.id} listing={listing} />
        ))}
      </div>
      {hasMore ? <div ref={sentinelRef} className="h-8 w-full" /> : null}
    </>
  );
}
