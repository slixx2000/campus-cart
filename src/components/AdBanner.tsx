import { createClient } from "@/lib/supabase/server";

/**
 * A paid banner slot. Renders nothing when no banner is running, so the layout
 * is unaffected on a page with no advertisers — which is the normal state early
 * on. RLS only returns banners inside their live window, so no date filtering
 * is needed here.
 */
export default async function AdBanner({
  placement,
}: {
  placement: "home" | "browse";
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_banners")
    .select("id, title, image_url, target_url, advertiser")
    .eq("placement", placement)
    .order("sort_order", { ascending: true })
    .limit(1);

  const banner = data?.[0];
  if (!banner) return null;

  return (
    <a
      href={banner.target_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="card group block overflow-hidden transition-shadow hover:shadow-hover"
    >
      {/* Advertiser-supplied artwork from an arbitrary host, so this stays a
          plain <img>: next/image would need every advertiser domain added to
          remotePatterns. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.image_url}
        alt={banner.title}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="line-clamp-1 text-sm font-medium text-fg">{banner.title}</p>
        <span className="chip shrink-0 text-[10px] uppercase tracking-wide">
          {banner.advertiser ? `Ad · ${banner.advertiser}` : "Ad"}
        </span>
      </div>
    </a>
  );
}
