"use client";

import { useEffect, useMemo, useState } from "react";
import type { Listing } from "@/types";

type SearchResult = {
  listing: Listing;
  combinedScore: number;
};

type SearchPayload = {
  query: string;
  totalCount: number;
  results: SearchResult[];
};

type UseMarketplaceSearchResult = {
  results: SearchResult[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
};

async function parseSearchPayload(response: Response): Promise<SearchPayload> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  if (!raw.trim()) {
    throw new Error("Search response was empty");
  }

  if (!contentType.includes("application/json")) {
    throw new Error("Search response was not JSON");
  }

  try {
    return JSON.parse(raw) as SearchPayload;
  } catch {
    throw new Error("Search response could not be parsed");
  }
}

const DEBOUNCE_MS = 300;

export function useMarketplaceSearch(query: string): UseMarketplaceSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!normalizedQuery) {
      setResults([]);
      setTotalCount(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Search request failed with status ${response.status}`);
        }

        const payload = await parseSearchPayload(response);
        setResults(payload.results ?? []);
        setTotalCount(payload.totalCount ?? 0);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }

        setResults([]);
        setTotalCount(0);
        setError("Unable to run search right now.");
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [normalizedQuery]);

  return { results, totalCount, isLoading, error };
}
