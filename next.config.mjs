/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: "export"' if you have it locally - it's incompatible with API routes
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
