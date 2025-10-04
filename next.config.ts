import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Pour la beta, on ignore les warnings ESLint durant le build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Pour la beta, on ignore les erreurs TypeScript durant le build
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
