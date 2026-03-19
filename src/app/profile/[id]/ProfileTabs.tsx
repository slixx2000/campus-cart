"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/types";
import { formatPrice } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import ArchiveListingButton from "@/app/my-listings/ArchiveListingButton";

interface ProfileTabsProps {
  activeListings: Listing[];
  isOwnProfile: boolean;
}

export default function ProfileTabs({ activeListings, isOwnProfile }: ProfileTabsProps) {
  const [tab, setTab] = useState<"listings" | "reviews">("listings");

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
        <div className="mt-8 rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-8 text-center backdrop-blur dark:border-white/10 dark:bg-white/5">
          <span className="material-symbols-outlined mb-4 block text-5xl text-slate-300 dark:text-slate-600">
            reviews
          </span>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
            Reviews coming soon
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Buyer and seller reviews will be shown here once the feature launches.
          </p>
        </div>
      )}
    </>
  );
}
