import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    browserDebugInfoInTerminal: true,

    optimizePackageImports: [
      "@codefast/image-loader",
      "@codefast/ui",
      "@codefast/tailwind-variants",
    ],
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  outputFileTracingIncludes: {
    "/blocks/*": ["./src/registry/**/*"],
  },
  reactCompiler: true,
};

export default nextConfig;
