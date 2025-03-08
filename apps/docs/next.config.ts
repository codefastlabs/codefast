import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@codefast/ui'],
  },
  transpilePackages: ['@codefast/ui'],
};

export default nextConfig;
