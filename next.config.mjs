/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: "export"' if you have it locally - it's incompatible with API routes
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized_images: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.thesportsdb.com',
      },
      {
        protocol: 'https',
        hostname: 'r2.thesportsdb.com',
      },
    ],
  },
}

export default nextConfig
