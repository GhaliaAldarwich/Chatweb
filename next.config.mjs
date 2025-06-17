/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "valiant-partridge-243.convex.cloud",
			},
			{
				protocol: "https",
				hostname: "oaidalleapiprodscus.blob.core.windows.net",
			},
			{
				protocol: "https",
				hostname: "upbeat-meerkat-472.convex.cloud",
			},
		],
	},
};

export default nextConfig;
