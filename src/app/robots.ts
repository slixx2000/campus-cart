import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing here is useful to a crawler, and some of it is per-user.
      disallow: [
        "/api/",
        "/auth/",
        "/account",
        "/my-listings",
        "/messages",
        "/chat",
        "/profile/settings",
        "/admin/",
        "/dev/",
        "/student-email/",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
