import type { ImageLoaderProps } from "next/image";

import { imageLoader as baseImageLoader } from "@codefast/image-loader";

/**
 * Custom loader for GitHub raw content
 * Demonstrates how easy it is to extend the simple image loader
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
 * This demonstrates the simple, functional approach:
 * 1. Use the base loader for common CDNs
 * 2. Add custom logic for specific needs
 * 3. Keep it simple and maintainable
 *
 * @param params - Image loader parameters from Next.js
 * @returns Transformed image URL optimized for the detected CDN
 */
export function imageLoader(params: ImageLoaderProps): string {
  const { src } = params;

  // Custom loaders for specific needs
  if (src.includes("raw.githubusercontent.com")) {
    return githubRawLoader(params);
  }

  if (src.startsWith("/") || src.startsWith("./") || src.includes("localhost")) {
    return localDevLoader(params);
  }

  // Use the base loader for all other URLs
  return baseImageLoader(params);
}

// Export as default for convenience
export default imageLoader;
