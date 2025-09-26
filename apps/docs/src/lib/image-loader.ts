import type { ImageLoaderProps } from "next/image";

import queryString from "query-string";

import { allLoaders, createImageLoaderSystem } from "@codefast/image-loader";

/**
 * Custom loader for GitHub raw content
 * Demonstrates how easy it is to extend the functional image loader system
 */
const githubRawLoader = ({ src, width }: ImageLoaderProps): string => {
  try {
    // For GitHub raw content, we can add query parameters for caching
    const queryParams = {
      cache: "max-age=31536000", // 1-year cache
      w: width.toString(),
    };

    return queryString.stringifyUrl({ query: queryParams, url: src });
  } catch (error) {
    console.warn(`Failed to transform GitHub raw URL: ${src}`, error);

    return src;
  }
};

/**
 * Custom loader for local development images
 * Shows how to handle local/development scenarios
 */
const localDevLoader = ({ quality, src, width }: ImageLoaderProps): string => {
  // For local development, add query parameters for debugging
  const queryParams = {
    dev: "true",
    q: quality?.toString() ?? "auto",
    w: width.toString(),
  };

  return queryString.stringifyUrl({ query: queryParams, url: src });
};

/**
 * Image loader for the doc app
 * Pre-configured with all default CDN loaders plus custom loaders
 *
 * This demonstrates the enhanced system with performance optimizations:
 * 1. Start with all available loaders for common CDNs
 * 2. Add custom loaders for specific needs
 * 3. Enable caching and performance optimizations
 * 4. Simple configuration with advanced features
 */
const system = createImageLoaderSystem({
  customLoaders: [
    // Custom loader for GitHub raw content
    (config): string => {
      if (config.src.includes("raw.githubusercontent.com")) {
        return githubRawLoader(config);
      }

      throw new Error("Not a GitHub raw URL");
    },

    // Custom loader for local development
    (config): string => {
      if (
        config.src.startsWith("/") ||
        config.src.startsWith("./") ||
        config.src.includes("localhost")
      ) {
        return localDevLoader(config);
      }

      throw new Error("Not a local development URL");
    },
  ],
});

// Register all available loaders
system.registerBuiltInLoaders(allLoaders);

const loader = system.createLoader();

/**
 * Next.js compatible image loader function
 * This function is used by the Next.js Image component to transform image URLs
 *
 * Features:
 * - Automatic CDN detection and optimization
 * - Custom loaders for GitHub and local development
 * - Fallback to the original URL if no loader matches
 * - Simple functional approach without complex abstractions
 *
 * @param params - Image loader parameters from Next.js
 * @returns Transformed image URL optimized for the detected CDN
 */
export function imageLoader(params: ImageLoaderProps): string {
  return loader(params);
}

// Export the main loader function as default for convenience
export default imageLoader;
