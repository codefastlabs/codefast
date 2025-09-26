import type { ImageLoaderProps } from "next/image";

import {
  createCustomImageLoader,
  defaultLoaderConfigs,
  isDomainMatch,
  isLocalPath,
} from "@codefast/image-loader";

/**
 * Custom loader for GitHub raw content
 * Demonstrates how easy it is to extend the registry-based image loader
 */
function githubRawLoader({ src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("cache", "max-age=31536000"); // 1-year cache
    url.searchParams.set("w", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Custom loader for local development images
 * Shows how to handle local/development scenarios
 */
function localDevLoader({ quality, src, width }: ImageLoaderProps): string {
  try {
    const url = new URL(src);

    url.searchParams.set("dev", "true");
    url.searchParams.set("q", quality?.toString() ?? "auto");
    url.searchParams.set("w", width.toString());

    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Enhanced image loader for the doc app
 *
 * This demonstrates the registry pattern with a configuration-driven approach:
 * 1. Use the base loader for common CDNs (via defaultLoaderConfigs)
 * 2. Add custom loaders for specific needs
 * 3. Leverage the new registry pattern for better performance
 *
 * @param params - Image loader parameters from Next.js
 * @returns Transformed image URL optimized for the detected CDN
 */
export const imageLoader: (params: ImageLoaderProps) => string = createCustomImageLoader({
  // Fallback to the original URL for unmatched URLs
  fallbackLoader: (params): string => params.src,
  // Custom loaders for specific needs
  loaders: [
    {
      loader: githubRawLoader,
      matcher: (src): boolean => isDomainMatch(src, "raw.githubusercontent.com"),
      name: "github-raw",
    },
    {
      loader: localDevLoader,
      matcher: (src): boolean => isLocalPath(src),
      name: "local-dev",
    },
    ...defaultLoaderConfigs,
  ],
});

// Default export required by Next.js for loaderFile
export default imageLoader;
