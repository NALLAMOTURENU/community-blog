import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds (doesn't affect runtime safety)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We handle TypeScript errors manually and use @ts-expect-error for known Supabase limitations
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
