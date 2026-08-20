import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusCart",
    short_name: "CampusCart",
    description:
      "Buy, sell, and trade with students on your campus instantly.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F172A",
    // Matches --primary in globals.css. Was #2563eb, left over from the old
    // blue palette the Stitch redesign replaced.
    theme_color: "#0F172A",
    orientation: "portrait",
    categories: ["shopping", "social"],
    icons: [
      { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android masks this one, so it needs the padding the raster icons have.
      { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
