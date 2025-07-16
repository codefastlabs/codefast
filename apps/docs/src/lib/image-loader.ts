import type { ImageLoaderProps } from "next/image";
import queryString from "query-string";

import { BaseImageLoader, createDefaultImageLoaderFactory } from "@codefast/image-loader";

/**
 * Custom loader example for GitHub raw content
 * Demonstrates how easy it is to extend the image loader system
 */
class GitHubRawLoader extends BaseImageLoader {
  private static readonly DOMAIN_PATTERN = /raw\.githubusercontent\.com$/;
  private static readonly NAME = "github-raw";

  public getName(): string {
    return GitHubRawLoader.NAME;
  }

  public canHandle(source: string): boolean {
    const domain = this.extractDomain(source);
    return GitHubRawLoader.DOMAIN_PATTERN.test(domain);
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { src, width } = config;

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
  }
}

/**
 * Custom loader for local development images
 * Shows how to handle local/development scenarios
 */
class LocalDevLoader extends BaseImageLoader {
  private static readonly NAME = "local-dev";

  public getName(): string {
    return LocalDevLoader.NAME;
  }

  public canHandle(source: string): boolean {
    return source.startsWith("/") || source.startsWith("./") || source.includes("localhost");
  }

  protected transformUrl(config: ImageLoaderProps): string {
    const { quality, src, width } = config;

    // For local development, add query parameters for debugging
    const queryParams = {
      dev: "true",
      q: quality?.toString() ?? "auto",
      w: width.toString(),
    };

    return queryString.stringifyUrl({ query: queryParams, url: src });
  }
}

/**
 * Image loader factory instance for the doc app
 * Pre-configured with all default CDN loaders plus custom loaders
 *
 * This demonstrates the extensibility of the image loader system:
 * 1. Start with default loaders for common CDNs
 * 2. Add custom loaders for specific needs
 * 3. Configure domain mappings if needed
 */
const imageLoaderFactory = createDefaultImageLoaderFactory();

// Register custom loaders - demonstrates easy extensibility
imageLoaderFactory.registerLoaders([new GitHubRawLoader(), new LocalDevLoader()]);

/**
 * Next.js compatible image loader function
 * This function is used by the Next.js Image component to transform image URLs
 *
 * Features:
 * - Automatic CDN detection and optimization
 * - Performance caching for repeated requests
 * - Fallback to the original URL if no loader matches
 * - Easy extensibility with custom loaders
 *
 * @param params - Image loader parameters from Next.js
 * @returns Transformed image URL optimized for the detected CDN
 */
export function imageLoader(params: ImageLoaderProps): string {
  return imageLoaderFactory.load(params);
}

// Export the main loader function as default for convenience
export default imageLoader;
