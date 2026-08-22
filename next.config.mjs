/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {
			bodySizeLimit: "8mb",
		},
	},
	images: {
		// Listing images are served from the Cloudflare CDN; the Supabase Storage host
		// is intentionally no longer trusted here. Legacy rows may still point at a
		// supabase.co URL, but new rows resolve via the CDN and the browser is no
		// longer configured to fetch from Supabase Storage for listing photos.
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.campuscart.social",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
