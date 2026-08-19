import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice, CATEGORIES } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import AvatarImage from "@/components/AvatarImage";
import ListingImageCarousel from "@/components/ListingImageCarousel";
import {
  getListingById,
  getRelatedListings,
  incrementListingViewCount,
} from "@/lib/repositories/listings";
import { getProfileById } from "@/lib/repositories/profiles";
import { dbListingToUi } from "@/lib/mappers";
import { createClient } from "@/lib/supabase/server";
import { startConversationAction } from "@/app/messages/actions";
import FavoriteButton from "@/components/FavoriteButton";
import { generateWhatsAppLink, telHref } from "@/lib/whatsapp";
import { getFavoriteListingIds } from "@/lib/repositories/favorites";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Listings are shared into WhatsApp far more than they are found via search, and
 * a bare link previews as nothing. This gives the share card a title, price and
 * image.
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const row = await getListingById(id);
  if (!row) return { title: "Listing not found – CampusCart" };

  const listing = dbListingToUi(row);
  const title = `${listing.title} – ${formatPrice(listing.price)}`;
  const description = listing.description.slice(0, 160);
  const image = listing.images[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "CampusCart",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const [row, supabase] = await Promise.all([
    getListingById(id),
    createClient(),
  ]);

  if (!row) notFound();

  const listing = dbListingToUi(row);

  const [relatedRows, { data: { user } }] = await Promise.all([
    getRelatedListings(row.id, row.category_id),
    supabase.auth.getUser(),
    // Keep this non-blocking for UX; feed analytics should never break page load.
    incrementListingViewCount(row.id).catch(() => undefined),
  ]);

  const sellerProfile = listing.sellerId
    ? await getProfileById(listing.sellerId)
    : null;
  const sellerIsPioneer = sellerProfile?.is_pioneer_seller === true;
  const related = relatedRows.map(dbListingToUi);

  // Prevent sellers from messaging their own listing.
  const isOwnListing = !!user && user.id === listing.sellerId;

  const categoryMeta = CATEGORIES.find((c) => c.label === listing.category);

  const isFavorited = (await getFavoriteListingIds(user?.id)).has(listing.id);

  // Contact details are deliberately not part of LISTING_SELECT any more — they
  // come from a security-definer RPC that requires a signed-in caller.
  const sellerPhone = user
    ? (await supabase.rpc("listing_seller_contact", { p_listing_id: listing.id })).data ?? null
    : null;
  const whatsappLink =
    sellerPhone && !isOwnListing
      ? generateWhatsAppLink(sellerPhone, {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          sellerName: listing.sellerName,
        })
      : null;
  const callHref = sellerPhone && !isOwnListing ? telHref(sellerPhone) : null;

  const dateFormatted = new Date(listing.createdAt).toLocaleDateString(
    "en-ZM",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="min-h-screen bg-bg text-fg transition-colors">
      <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-6 md:px-12">
        {/* Breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href="/browse" className="transition-colors hover:text-primary">Browse</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link
            href={`/browse?category=${encodeURIComponent(listing.category)}`}
            className="transition-colors hover:text-primary"
          >
            {listing.category}
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="max-w-xs truncate font-medium text-slate-900 dark:text-white">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Product Image */}
          <div className="lg:col-span-7 space-y-4">
            <ListingImageCarousel
              images={listing.images}
              alt={listing.title}
              featured={listing.featured}
            />
            <div className="rounded-lg border border-line bg-surface p-5 dark:bg-surface">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                Listing overview
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Type</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {listing.isService ? "Service" : "Product"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Seller</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {listing.sellerName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Campus</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {listing.university}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="lg:col-span-5 space-y-5">
            {/* Price card */}
            <div className="card p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-fg sm:text-3xl">
                  {listing.title}
                </h1>
              </div>

              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-fg">
                  {formatPrice(listing.price)}
                </span>
                {listing.isService && (
                  <span className="text-base text-muted">/session</span>
                )}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <span className="chip">
                  <span className="material-symbols-outlined text-[14px] leading-none">
                    {categoryMeta?.materialIcon}
                  </span>
                  {listing.category}
                </span>
                {listing.condition && (
                  <span className="chip">
                    <span className="material-symbols-outlined text-[14px] leading-none">
                      info
                    </span>
                    Condition: {listing.condition}
                  </span>
                )}
                <span className="chip">
                  <span className="material-symbols-outlined text-[14px] leading-none">
                    school
                  </span>
                  {listing.university}
                </span>
              </div>

              <p className="mb-6 flex items-center gap-1 text-sm text-muted">
                <span className="material-symbols-outlined text-[16px] leading-none">
                  schedule
                </span>
                Listed on {dateFormatted}
              </p>

              <div className="mb-6 h-px bg-line" />

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                {!isOwnListing && listing.sellerId ? (
                  <form action={startConversationAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <input type="hidden" name="sellerId" value={listing.sellerId} />
                    <button type="submit" className="btn-primary w-full py-3">
                      <span className="material-symbols-outlined text-xl">forum</span>
                      Message Seller
                    </button>
                  </form>
                ) : isOwnListing ? (
                  <Link href="/my-listings" className="btn-secondary w-full py-3">
                    <span className="material-symbols-outlined text-xl">edit</span>
                    Manage Listing
                  </Link>
                ) : null}
                <FavoriteButton
                  listingId={listing.id}
                  initialFavorited={isFavorited}
                  signedIn={Boolean(user)}
                  label="Save Listing"
                />
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full py-3"
                  >
                    <span className="material-symbols-outlined text-xl">chat</span>
                    Chat on WhatsApp
                  </a>
                ) : null}
                {callHref ? (
                  <a href={callHref} className="btn-ghost w-full py-2">
                    <span className="material-symbols-outlined text-xl">call</span>
                    Call seller
                  </a>
                ) : user && !isOwnListing ? (
                  <p className="text-center text-xs text-muted">
                    This seller hasn&apos;t added a phone number yet — use Message Seller.
                  </p>
                ) : !user ? (
                  <Link href={`/auth/sign-in?redirect=/product/${listing.id}`} className="btn-ghost w-full py-2">
                    <span className="material-symbols-outlined text-xl">lock</span>
                    Sign in to see contact details
                  </Link>
                ) : null}
              </div>
            </div>

            {/* Seller info card */}
            <div className="rounded-lg border border-line bg-surface p-5 dark:bg-surface">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Seller Information
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-14 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10">
                    <AvatarImage
                      alt={listing.sellerName}
                      src={listing.sellerAvatarUrl}
                      className="h-full w-full object-cover"
                      fallbackClassName="flex h-full w-full items-center justify-center bg-primary/10 text-primary "
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">{listing.sellerName}</h4>
                      {sellerIsPioneer ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:border-amber-300/30 dark:bg-amber-400/15 dark:text-amber-300">
                          <span className="material-symbols-outlined text-[11px] leading-none">verified</span>
                          Pioneer
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {sellerProfile?.is_verified_student && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/50 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-400/15 dark:text-emerald-300">
                          <span className="material-symbols-outlined text-[11px] leading-none">verified</span>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {listing.sellerId ? (
                  <Link
                    href={`/profile/${listing.sellerId}`}
                    className="rounded-full border border-primary/30 px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
                  >
                    View Profile
                  </Link>
                ) : null}
              </div>
              <div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-xs">
                <div className="text-slate-500 dark:text-slate-400">{listing.university}</div>
                <div className="text-slate-500 dark:text-slate-400">Listed {dateFormatted}</div>
              </div>
            </div>

            {/* Safety tip */}
            <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
              <span className="material-symbols-outlined shrink-0 text-amber-500 dark:text-amber-300">
                security
              </span>
              <div>
                <strong>Safety tip:</strong> Always meet in well-lit, public
                campus areas. Use the CampusCart messaging system for all
                communication.
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-12 max-w-4xl rounded-lg border border-line bg-surface p-8 dark:bg-surface">
          <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            Item Description
          </h3>
          <p className="leading-relaxed text-slate-600 dark:text-slate-300">{listing.description}</p>
        </div>

        {/* Related listings */}
        {related.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Similar Items for Sale
              </h3>
              <Link
                href={`/browse?category=${encodeURIComponent(listing.category)}`}
                className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                See all{" "}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((l) => (
                <ProductCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
