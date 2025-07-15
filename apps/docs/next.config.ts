import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable package import optimization for specified libraries
    optimizePackageImports: ["@codefast/ui", "@codefast/hooks"],

    // Forward browser logs to the terminal for easier debugging
    browserDebugInfoInTerminal: true,

    // Enable new caching and pre-rendering behavior
    // dynamicIO: true, // will be renamed to cacheComponents in Next.js 16

    // Activate new client-side router improvements
    clientSegmentCache: true,

    // Explore route composition and segment overrides via DevTools
    devtoolSegmentExplorer: true,

    // Enable persistent caching for the turbopack dev server and build.
    // turbopackPersistentCaching: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
        protocol: "https",
      },
    ],
  },
  outputFileTracingIncludes: {
    "/blocks/*": ["./src/registry/**/*"],
  },
};

export default nextConfig;
