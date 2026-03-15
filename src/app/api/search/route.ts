import { NextResponse } from "next/server";
import { searchListings } from "@/lib/search/searchService";

export async function GET(request: Request) {
  const startedAt = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return NextResponse.json({ query: "", totalCount: 0, results: [] });
    }

    const payload = await searchListings(query);

    console.info("search-api", {
      event: "ok",
      query,
      totalCount: payload.totalCount,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";

    console.error("search-api", {
      event: "error",
      message,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
