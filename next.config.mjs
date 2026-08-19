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
		remotePatterns: [
			{
				protocol: "https",
				hostname: "mtbpuhxyhreyjefvumtf.supabase.co",
				pathname: "/storage/v1/object/public/**",
			},
		],
	},
};

export default nextConfig;
