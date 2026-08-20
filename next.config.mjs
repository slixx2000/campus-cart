/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "8mb",
		},
	},
	images: {
		// Listing and avatar images live in Supabase Storage. Without this they were
		// served with `unoptimized`, i.e. the full 1200px / up-to-800KB JPEG on every
		// card — a 16-card browse page pulled several MB straight out of Supabase
		// egress. Supabase's own image transforms are Pro-only, so optimisation
		// happens here instead: resize, WebP/AVIF, and CDN cache.
		// Both hosts during the transition. Supabase-era rows still carry a
		// supabase.co public_url and must keep rendering; new rows resolve to the R2
		// CDN. Drop the Supabase entry in Phase 7, once nothing points at it.
		remotePatterns: [
			{
				protocol: "https",
				hostname: "mtbpuhxyhreyjefvumtf.supabase.co",
				pathname: "/storage/v1/object/public/**",
			},
			{
				protocol: "https",
				hostname: "cdn.campuscart.social",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
