import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getListingsByUser } from "@/lib/repositories/listings";
import { dbListingToUi } from "@/lib/mappers";
import { formatPrice } from "@/lib/data";
import ArchiveListingButton from "./ArchiveListingButton";
import BumpListingButton from "./BumpListingButton";
import ListingImage from "@/components/ListingImage";

export const metadata = { title: "My Listings – CampusCart" };

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in?redirect=/my-listings");

  const rows = await getListingsByUser(user.id);
  const listings = rows.map(dbListingToUi);

  return (
    <div className="min-h-screen bg-bg text-slate-900 transition-colors dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="mb-8 overflow-hidden rounded-lg border border-line bg-surface p-6 dark:bg-surface">
          <div className="flex items-center justify-between">
          <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80">
                Seller dashboard
              </span>
              <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                My Listings
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {listings.length} listing{listings.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/sell"
            className="btn-primary px-6 py-3 text-sm"
          >
            <span className="material-symbols-outlined text-lg leading-none">add_circle</span>
            New Listing
          </Link>
        </div>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface p-16 text-center dark:bg-surface">
            <span className="material-symbols-outlined mb-4 block text-5xl text-slate-300 dark:text-slate-500">
              storefront
            </span>
            <p className="mb-2 text-lg font-bold text-slate-700 dark:text-slate-100">No listings yet</p>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Post your first listing and reach thousands of students.
            </p>
            <Link
              href="/sell"
              className="btn-primary px-8 py-3"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Post Free Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-start gap-4 rounded-lg border border-line bg-surface p-4 dark:bg-surface"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2 dark:bg-surface">
                  <ListingImage
                    src={listing.images[0]}
                    alt={listing.title}
                    fallbackSrc="/images/placeholder-electronics.svg"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-bold text-slate-900 dark:text-white">{listing.title}</h3>
                  <p className="mt-0.5 text-sm font-bold text-primary">
                    {formatPrice(listing.price)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">{listing.category}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{listing.university}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Link
                    href={`/product/${listing.id}`}
                    className="rounded-full border border-line px-4 py-2 text-center text-xs font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary dark:text-slate-200 dark:hover:border-sky-300"
                  >
                    View
                  </Link>
                  <Link
                    href={`/my-listings/${listing.id}/edit`}
                    className="rounded-full border border-line px-4 py-2 text-center text-xs font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary dark:text-slate-200 dark:hover:border-sky-300"
                  >
                    Edit
                  </Link>
                  <BumpListingButton listingId={listing.id} />
                  <ArchiveListingButton listingId={listing.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
