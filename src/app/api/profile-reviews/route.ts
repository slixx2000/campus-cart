import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getServiceErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLowerCase();

  if (lower.includes("connect timeout") || lower.includes("fetch failed") || lower.includes("network")) {
    return {
      status: 503,
      message: "Reviews service is temporarily unavailable. Please try again.",
    };
  }

  return {
    status: 500,
    message,
  };
}

type SellerReviewRowWithReviewer = {
  id: string;
  seller_id: string;
  reviewer_id: string;
  listing_id: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
};

function buildSummary(rows: Array<{ rating: number }>) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as const;
  const mutable = { ...distribution };

  for (const row of rows) {
    const key = Math.min(5, Math.max(1, row.rating)) as 1 | 2 | 3 | 4 | 5;
    mutable[key] += 1;
  }

  const totalReviews = rows.length;
  const averageRating =
    totalReviews === 0
      ? 0
      : Number((rows.reduce((sum, row) => sum + row.rating, 0) / totalReviews).toFixed(2));

  return { averageRating, totalReviews, distribution: mutable };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId")?.trim();

    if (!sellerId) {
      return NextResponse.json({ error: "Missing sellerId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("seller_reviews")
      .select("id, seller_id, reviewer_id, listing_id, rating, review_text, created_at")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reviewerIds = [...new Set(((data ?? []) as SellerReviewRowWithReviewer[]).map((row) => row.reviewer_id))];
    const { data: reviewerRows, error: reviewerError } = reviewerIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", reviewerIds)
      : { data: [], error: null };

    if (reviewerError) {
      return NextResponse.json({ error: reviewerError.message }, { status: 500 });
    }

    const reviewerMap = new Map(
      (reviewerRows ?? []).map((row) => [
        row.id,
        {
          full_name: row.full_name,
          avatar_url: row.avatar_url,
        },
      ])
    );

    const reviews = ((data ?? []) as SellerReviewRowWithReviewer[]).map((row) => ({
      id: row.id,
      sellerId: row.seller_id,
      reviewerId: row.reviewer_id,
      reviewerName: reviewerMap.get(row.reviewer_id)?.full_name ?? "CampusCart User",
      reviewerAvatarUrl: reviewerMap.get(row.reviewer_id)?.avatar_url ?? null,
      listingId: row.listing_id,
      rating: row.rating,
      reviewText: row.review_text,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ reviews, summary: buildSummary(reviews) });
  } catch (error) {
    const serviceError = getServiceErrorMessage(error, "Could not fetch reviews");
    return NextResponse.json({ error: serviceError.message }, { status: serviceError.status });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const body = await request.json();
    const sellerId = String(body.sellerId ?? "").trim();
    const listingId = body.listingId ? String(body.listingId).trim() : null;
    const reviewText = body.reviewText ? String(body.reviewText).trim().slice(0, 1000) : null;
    const rating = Number(body.rating);

    if (!sellerId) {
      return NextResponse.json({ error: "Missing sellerId" }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer from 1 to 5" }, { status: 400 });
    }

    if (sellerId === user.id) {
      return NextResponse.json({ error: "You cannot review yourself" }, { status: 400 });
    }

    const { error: upsertError } = await supabase
      .from("seller_reviews")
      .upsert(
        {
          seller_id: sellerId,
          reviewer_id: user.id,
          listing_id: listingId,
          rating,
          review_text: reviewText,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "seller_id,reviewer_id" }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const serviceError = getServiceErrorMessage(error, "Could not submit review");
    return NextResponse.json({ error: serviceError.message }, { status: serviceError.status });
  }
}
