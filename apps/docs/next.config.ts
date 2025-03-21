import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@codefast/ui'],
  },
  images: {
    remotePatterns: [
      {
        hostname: 'images.unsplash.com',
        protocol: 'https',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/components',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
