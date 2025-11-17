import type { ImageLoaderProps } from "next/image";

import type { LoaderConfig, LoaderFunction } from "@/core/types";

/**
 * Optimized image loader with domain-based registry
 *
 * Performance optimizations:
 * - O(1) domain-based lookup instead of O(n) linear search
 * - Smart domain extraction for faster matching
 * - Efficient URL parsing without caching overhead
 */
export class ImageLoader {
  private readonly domainRegistry = new Map<string, LoaderFunction>();
  private readonly fallbackLoaders: LoaderConfig[] = [];
  private readonly fallbackLoader?: LoaderFunction;

  constructor(config: LoaderConfig[] = [], fallbackLoader?: LoaderFunction) {
    this.fallbackLoader = fallbackLoader;
    this.initializeRegistry(config);
  }

  /**
   * Transform image URL using optimized registry lookup
   */
  transform(params: ImageLoaderProps): string {
    const { src } = params;

    try {
      // First, try domain-based lookup for performance
      const hostname = this.extractDomainFromUrl(src);

      if (hostname) {
        // Try the exact match first
        let loader = this.domainRegistry.get(hostname);

        // If no exact match, try subdomain matching
        if (!loader) {
          for (const [domain, domainLoader] of this.domainRegistry) {
            if (hostname.endsWith(`.${domain}`) || hostname === domain) {
              loader = domainLoader;
              break;
            }
          }
        }

        if (loader) {
          return loader(params);
        }
      }

      // Then try fallback loaders (preserves order for multiple matches)
      for (const { loader, matcher } of this.fallbackLoaders) {
        if (matcher(src)) {
          return loader(params);
        }
      }

      // Fallback to custom loader if provided
      if (this.fallbackLoader) {
        return this.fallbackLoader(params);
      }

      // Return original URL
      return src;
    } catch {
      // Invalid URL, return original
      return src;
    }
  }

  /**
   * Initialize the domain-based registry for O(1) lookup
   */
  private initializeRegistry(config: LoaderConfig[]): void {
    for (const loaderConfig of config) {
      const domain = this.extractDomainFromMatcher(loaderConfig);

      if (domain && !this.domainRegistry.has(domain)) {
        // O(1) lookup for domain-based loaders (first match only)
        this.domainRegistry.set(domain, loaderConfig.loader);
      } else {
        // Fallback to linear search for complex matchers or duplicate domains
        this.fallbackLoaders.push(loaderConfig);
      }
    }
  }

  /**
   * Extract domain from matcher function for optimization
   */
  private extractDomainFromMatcher(config: LoaderConfig): null | string {
    // If a domain is explicitly provided, use it
    if (config.domain) {
      return config.domain;
    }

    // Try to extract domain from common matcher patterns
    const matcherString = config.matcher.toString();

    // Match patterns like: src.includes("domain.com")
    const includesMatch = /\.includes\("([^"]+)"\)/.exec(matcherString);

    if (includesMatch) {
      return includesMatch[1];
    }

    // Match patterns like: src.startsWith("https://domain.com")
    const startsWithMatch = /\.startsWith\("https?:\/\/([^"]+)"\)/.exec(matcherString);

    if (startsWithMatch) {
      return startsWithMatch[1];
    }

    return null;
  }

  /**
   * Extract domain from URL for fast lookup
   */
  private extractDomainFromUrl(src: string): null | string {
    try {
      const url = new URL(src);

      return url.hostname || null;
    } catch {
      return null;
    }
  }
}

/**
 * Create a new image loader instance
 */
export function createImageLoader(
  config: LoaderConfig[] = [],
  fallbackLoader?: LoaderFunction,
): ImageLoader {
  return new ImageLoader(config, fallbackLoader);
}
