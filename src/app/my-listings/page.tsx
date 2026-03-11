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
    <div className="min-h-screen bg-background-light text-slate-900 transition-colors dark:bg-[#07111f] dark:text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5 dark:shadow-[0_35px_120px_-55px_rgba(8,15,33,0.95)]">
          <div className="flex items-center justify-between">
          <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80 dark:text-sky-300">
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
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-500 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
          >
            <span className="material-symbols-outlined text-lg leading-none">add_circle</span>
            New Listing
          </Link>
        </div>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/85 p-16 text-center shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5">
            <span className="material-symbols-outlined mb-4 block text-5xl text-slate-300 dark:text-slate-500">
              storefront
            </span>
            <p className="mb-2 text-lg font-bold text-slate-700 dark:text-slate-100">No listings yet</p>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Post your first listing and reach thousands of students.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-blue-500 px-8 py-3 font-bold text-white transition-opacity hover:opacity-90 dark:from-sky-400 dark:to-cyan-300 dark:text-slate-950"
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
                className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200/70 bg-white/85 p-4 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] backdrop-blur dark:glass-card-dark dark:border-white/10 dark:bg-white/5"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/10">
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-bold text-slate-900 dark:text-white">{listing.title}</h3>
                  <p className="mt-0.5 text-sm font-bold text-primary dark:text-sky-300">
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
                  <form action={deleteListingAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button
                      type="submit"
                      className="w-full rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:border-rose-300/20 dark:text-rose-300 dark:hover:bg-rose-300/10"
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
