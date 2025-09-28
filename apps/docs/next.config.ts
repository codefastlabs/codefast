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
      "@codefast/tailwind-variants",
    ],
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  outputFileTracingIncludes: {
    "/blocks/*": ["./src/registry/**/*"],
  },
};

export default nextConfig;
