import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: [
      '@codefast/ui',
      '@codefast/tailwind-variants',
      'date-fns',
      'lucide-react',
      '@tabler/icons-react',
      'recharts',
    ],
  },
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
  // Enable compression
  compress: true,
  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Enable static page generation optimizations
  poweredByHeader: false,
  // Optimize output
  output: 'standalone',
};

export default withBundleAnalyzer(nextConfig);
