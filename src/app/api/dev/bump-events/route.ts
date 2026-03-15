import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type BumpEventRow = {
  id: string;
  listing_id: string;
  request_id: string;
  bumped_at: string;
  listings: { title?: string } | null;
};

function parseLimit(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 50);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"), 20);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("listing_bump_events")
      .select("id, listing_id, request_id, bumped_at, listings(title)")
      .eq("user_id", user.id)
      .order("bumped_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as unknown as BumpEventRow[];

    return NextResponse.json({
      events: rows.map((row) => ({
        id: row.id,
        listingId: row.listing_id,
        requestId: row.request_id,
        bumpedAt: row.bumped_at,
        listingTitle: row.listings?.title ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch bump events" },
      { status: 500 }
    );
  }
}
