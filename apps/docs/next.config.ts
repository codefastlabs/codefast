import { type NextConfig } from 'next';

const nextConfig: NextConfig = {
  // experimental: { optimizePackageImports: ['@codefast/ui'] },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
};

export default nextConfig;
