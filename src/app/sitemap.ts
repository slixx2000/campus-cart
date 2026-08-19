import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/siteUrl";

// Listings change often; a short revalidate keeps the sitemap fresh without
// querying on every crawl.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/browse`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/downloads`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();
    const [{ data: listings }, { data: categories }] = await Promise.all([
      supabase
        .from("listings")
        .select("id, updated_at")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("last_bumped_at", { ascending: false })
        .limit(5000),
      supabase.from("categories").select("slug"),
    ]);

    return [
      ...staticRoutes,
      ...(categories ?? []).map((category) => ({
        url: `${base}/browse?category=${category.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
      ...(listings ?? []).map((listing) => ({
        url: `${base}/product/${listing.id}`,
        lastModified: listing.updated_at ? new Date(listing.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    // A sitemap that 500s is worse than a sitemap with only the static routes.
    return staticRoutes;
  }
}
