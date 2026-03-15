/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@campuscart/shared"],
	experimental: {
		serverActions: {
			bodySizeLimit: "8mb",
		},
	},
};

export default nextConfig;
