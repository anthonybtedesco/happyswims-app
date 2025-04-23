/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Make sure Mapbox token is available at build time
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
  },
  // Enable transpiling mapbox-gl module
  transpilePackages: ['mapbox-gl'],
}

module.exports = nextConfig 