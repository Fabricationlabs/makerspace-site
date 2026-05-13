import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yocjivimnyscdibkldqn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Permit any HTTPS host so ad-hoc photo_url values work during development.
      // Tighten this to known hostnames before going to production.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
