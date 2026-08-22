import { CDN_URL, PLACEHOLDER_IMAGE } from './constants';
import type { Listing } from '../types';

function thumbKeyFor(objectKey: string): string {
  const dot = objectKey.lastIndexOf('.');
  return dot === -1 ? `${objectKey}_t` : `${objectKey.slice(0, dot)}_t${objectKey.slice(dot)}`;
}

function cdnUrl(objectKey: string): string {
  const base = CDN_URL.replace(/\/+$/, '');
  return `${base}/${objectKey.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
}

export function mapListing(row: any): Listing {
  const images = Array.isArray(row.listing_images)
    ? [...row.listing_images]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((img) =>
          img.object_key ? cdnUrl(img.object_key) : img.public_url ?? PLACEHOLDER_IMAGE
        )
        .filter(Boolean)
    : [];

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price ?? 0),
    featured: row.featured === true,
    isService: row.is_service === true,
    category: row.categories?.name ?? 'Other',
    university: row.universities?.name ?? 'Campus Cart',
    universityShortName: row.universities?.short_name ?? undefined,
    sellerName: row.profiles?.full_name ?? 'Unknown Seller',
    sellerAvatarUrl: row.profiles?.avatar_url ?? null,
    sellerId: row.profiles?.id ?? undefined,
    sellerVerified: row.profiles?.is_verified_student === true,
    sellerPioneer: row.profiles?.is_pioneer_seller === true,
    images: images.length ? images : [PLACEHOLDER_IMAGE],
    createdAt: row.created_at,
    lastBumpedAt: row.last_bumped_at,
    viewCount: Number(row.view_count ?? 0),
    condition: row.condition,
    status: row.status,
  };
}

export function listingThumbUrl(objectKey: string): string {
  return cdnUrl(thumbKeyFor(objectKey));
}
