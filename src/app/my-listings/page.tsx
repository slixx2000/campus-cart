import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getListingsByUser } from "@/lib/repositories/listings";
import { dbListingToUi } from "@/lib/mappers";
import { formatPrice } from "@/lib/data";
import { deleteListingAction } from "./actions";

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
    <div className="bg-background-light min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Listings</h1>
            <p className="text-slate-500 text-sm mt-1">
              {listings.length} listing{listings.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/sell"
            className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity text-sm"
          >
            <span className="material-symbols-outlined text-lg leading-none">add_circle</span>
            New Listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">
              storefront
            </span>
            <p className="text-lg font-bold text-slate-700 mb-2">No listings yet</p>
            <p className="text-sm text-slate-500 mb-6">
              Post your first listing and reach thousands of students.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
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
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4 items-start"
              >
                <div className="relative size-20 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{listing.title}</h3>
                  <p className="text-primary font-bold text-sm mt-0.5">
                    {formatPrice(listing.price)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{listing.category}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{listing.university}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Link
                    href={`/product/${listing.id}`}
                    className="px-4 py-2 text-xs font-bold rounded-full border border-slate-200 text-slate-700 hover:border-primary hover:text-primary transition-colors text-center"
                  >
                    View
                  </Link>
                  <Link
                    href={`/my-listings/${listing.id}/edit`}
                    className="px-4 py-2 text-xs font-bold rounded-full border border-slate-200 text-slate-700 hover:border-primary hover:text-primary transition-colors text-center"
                  >
                    Edit
                  </Link>
                  <form action={deleteListingAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button
                      type="submit"
                      className="w-full px-4 py-2 text-xs font-bold rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      onClick={(e) => {
                        if (!confirm("Archive this listing? It will no longer be visible."))
                          e.preventDefault();
                      }}
                    >
                      Archive
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
