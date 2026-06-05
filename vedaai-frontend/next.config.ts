import type { NextConfig } from "next"

const nextConfig = {
  webpack: (config: any, { isServer }: any) => {
    if (!isServer) {
      config.resolve.fallback = { canvas: false, fs: false }
    }
    return config
  },
  turbopack: {},
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig