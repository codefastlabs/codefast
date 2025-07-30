import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable package import optimization for specified libraries
    optimizePackageImports: ["@codefast/ui", "@codefast/hooks", "@codefast/image-loader"],

    // Forward browser logs to the terminal for easier debugging
    browserDebugInfoInTerminal: true,

    // Enable Partial Pre-rendering (PPR) - combines static and dynamic content
    ppr: true,

    // Activate new client-side router improvements
    clientSegmentCache: true,

    // Explore route composition and segment overrides via DevTools
    devtoolSegmentExplorer: true,

    // Enable persistent caching for the turbopack dev server and build.
    turbopackPersistentCaching: true,

    // Enable attribution tracking for Core Web Vitals metrics
    webVitalsAttribution: ["CLS", "LCP"],

    // Enable component caching for improved performance
    // cacheComponents: true,
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
