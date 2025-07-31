import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /** Forward browser logs to the terminal for easier debugging */
    browserDebugInfoInTerminal: true,

    /** Explore route composition and segment overrides via DevTools */
    devtoolSegmentExplorer: true,

    /** Enable package import optimization for specified libraries */
    optimizePackageImports: [
      "@codefast/hooks",
      "@codefast/image-loader",
      "@codefast/ui",
      "@codefast/eslint-config",
      "@codefast/typescript-config",
    ],

    /** Enable Partial Pre-rendering (PPR) - combines static and dynamic content */
    ppr: true,
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
        protocol: "https",
      },
      {
        hostname: "*.cloudinary.com",
        protocol: "https",
      },
      {
        hostname: "*.imgix.net",
        protocol: "https",
      },
      {
        hostname: "*.cloudfront.net",
        protocol: "https",
      },
      {
        hostname: "*.supabase.co",
        protocol: "https",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/blocks/*": ["./src/registry/**/*"],
  },
};

export default nextConfig;
