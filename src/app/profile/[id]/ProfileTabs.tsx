"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/types";
import type { SellerRatingSummary, SellerReview } from "@/types";
import { formatPrice } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import ArchiveListingButton from "@/app/my-listings/ArchiveListingButton";

interface ProfileTabsProps {
  activeListings: Listing[];
  isOwnProfile: boolean;
  sellerId: string;
  viewerId?: string;
}

const emptySummary: SellerRatingSummary = {
  averageRating: 0,
  totalReviews: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

type ApiPayload = {
  error?: string;
  reviews?: SellerReview[];
  summary?: SellerRatingSummary;
  ok?: boolean;
};

async function readJsonSafely(response: Response): Promise<ApiPayload> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  if (!raw.trim()) {
    return {};
  }

  if (!contentType.includes("application/json")) {
    return {
      error: response.ok
        ? "Unexpected server response format."
        : `Request failed with status ${response.status}`,
    };
  }

  try {
    return JSON.parse(raw) as ApiPayload;
  } catch {
    return {
      error: "Could not parse server response.",
    };
  }
}

export default function ProfileTabs({ activeListings, isOwnProfile, sellerId, viewerId }: ProfileTabsProps) {
  const [tab, setTab] = useState<"listings" | "reviews">("listings");
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [summary, setSummary] = useState<SellerRatingSummary>(emptySummary);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const canReview = Boolean(viewerId && viewerId !== sellerId);

  const ratingStars = useMemo(() => {
    const filled = Math.round(summary.averageRating);
    return `${"★".repeat(filled)}${"☆".repeat(5 - filled)}`;
  }, [summary.averageRating]);

  useEffect(() => {
    if (tab !== "reviews") return;

    let mounted = true;
    setLoadingReviews(true);

    fetch(`/api/profile-reviews?sellerId=${encodeURIComponent(sellerId)}`)
      .then(async (res) => {
        const payload = await readJsonSafely(res);
        if (!res.ok) throw new Error(payload.error || "Could not load reviews");
        if (!mounted) return;
        setReviews(payload.reviews || []);
        setSummary(payload.summary || emptySummary);
      })
      .catch((error) => {
        console.error("profile-reviews-load", error);
      })
      .finally(() => {
        if (mounted) setLoadingReviews(false);
      });

    return () => {
      mounted = false;
    };
  }, [sellerId, tab]);

  async function handleSubmitReview() {
    setSubmittingReview(true);
    try {
      const response = await fetch("/api/profile-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, rating, reviewText }),
      });
      const payload = await readJsonSafely(response);
      if (!response.ok) {
        throw new Error(payload.error || "Could not submit review");
      }

      const refresh = await fetch(`/api/profile-reviews?sellerId=${encodeURIComponent(sellerId)}`);
      const refreshPayload = await readJsonSafely(refresh);
      if (refresh.ok) {
        setReviews(refreshPayload.reviews || []);
        setSummary(refreshPayload.summary || emptySummary);
      }
      setReviewText("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <>
      {/* Tab bar */}
      <div className="sticky top-[68px] z-40 -mx-4 px-4 py-2 backdrop-blur-md bg-background-light/90 dark:bg-background-dark/90 md:-mx-8 md:px-8">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700 no-scrollbar">
          <button
            onClick={() => setTab("listings")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold transition-all ${
              tab === "listings"
                ? "border-primary text-primary dark:border-sky-300 dark:text-sky-300"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-lg leading-none">grid_view</span>
            {isOwnProfile ? "My Listings" : "Listings"}{" "}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-white/10">
              {activeListings.length}
            </span>
          </button>

          <button
            onClick={() => setTab("reviews")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 text-sm font-bold transition-all ${
              tab === "reviews"
                ? "border-primary text-primary dark:border-sky-300 dark:text-sky-300"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-lg leading-none">reviews</span>
            Reviews
          </button>
        </div>
      </div>

      {/* Listings tab */}
      {tab === "listings" && (
        <div className="mt-8">
          {activeListings.length === 0 ? (
            <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-16 text-center backdrop-blur dark:border-white/10 dark:bg-white/5">
              <span className="material-symbols-outlined mb-4 block text-5xl text-slate-300 dark:text-slate-600">
                storefront
              </span>
              <p className="mb-2 text-lg font-bold text-slate-700 dark:text-slate-200">
                {isOwnProfile ? "No listings yet" : "No active listings"}
              </p>
              {isOwnProfile && (
                <>
                  <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                    Post your first listing and reach thousands of students.
                  </p>
                  <Link
                    href="/sell"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-500 px-8 py-3 font-bold text-white hover:opacity-90 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
                  >
                    <span className="material-symbols-outlined text-lg leading-none">add_circle</span>
                    Post Free Listing
                  </Link>
                </>
              )}
            </div>
          ) : isOwnProfile ? (
            /* Own-profile management view */
            <div className="space-y-4">
              {activeListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200/70 bg-white/85 p-4 shadow-sm backdrop-blur transition-all duration-300 ease-out hover:scale-[1.01] hover:-translate-y-1 hover:shadow-xl hover:ring-1 hover:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:ring-white/10"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/10">
                    <Image
                      src={listing.images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-110"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-900 dark:text-white">
                      {listing.title}
                    </h3>
                    <p className="mt-0.5 text-sm font-bold text-primary dark:text-sky-300">
                      {formatPrice(listing.price)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {listing.category}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {listing.university}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    <Link
                      href={`/product/${listing.id}`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary dark:border-white/10 dark:text-slate-200 dark:hover:border-sky-300 dark:hover:text-sky-300"
                    >
                      View
                    </Link>
                    <Link
                      href={`/my-listings/${listing.id}/edit`}
                      className="rounded-full border border-slate-200 px-4 py-2 text-center text-xs font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary dark:border-white/10 dark:text-slate-200 dark:hover:border-sky-300 dark:hover:text-sky-300"
                    >
                      Edit
                    </Link>
                    <ArchiveListingButton listingId={listing.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Public grid view */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeListings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews tab */}
      {tab === "reviews" && (
        <div className="mt-8 space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/85 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Seller rating</p>
            <div className="mt-2 flex items-end gap-3">
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : "--"}
              </p>
              <p className="pb-1 text-amber-500">{ratingStars}</p>
              <p className="pb-1 text-sm text-slate-500 dark:text-slate-400">{summary.totalReviews} review{summary.totalReviews === 1 ? "" : "s"}</p>
            </div>
          </div>

          {canReview ? (
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/85 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Leave a review</p>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl ${star <= rating ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
                rows={3}
                maxLength={1000}
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Share your experience with this seller"
              />
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="mt-3 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {submittingReview ? "Saving..." : "Submit review"}
              </button>
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/85 p-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent reviews</p>
            {loadingReviews ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No reviews yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{review.reviewerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="mt-1 text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
                    {review.reviewText ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{review.reviewText}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
