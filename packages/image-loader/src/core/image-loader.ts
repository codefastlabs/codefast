import type { ImageLoaderProps } from "next/image";

import type { LoaderConfig, LoaderFunction } from "@/core/types";

/**
 * Optimized image loader with domain-based registry and caching
 *
 * Performance optimizations:
 * - O(1) domain-based lookup instead of O(n) linear search
 * - URL parsing cache to avoid repeated parsing
 * - Result caching for frequently accessed URLs
 * - Smart domain extraction for faster matching
 */
export class ImageLoader {
  private readonly domainRegistry = new Map<string, LoaderFunction>();
  private readonly fallbackLoaders: LoaderConfig[] = [];
  private readonly fallbackLoader?: LoaderFunction;
  private readonly urlCache = new Map<string, URL>();
  private readonly resultCache = new Map<string, string>();
  private readonly maxCacheSize: number;

  constructor(config: LoaderConfig[] = [], fallbackLoader?: LoaderFunction, maxCacheSize = 1000) {
    this.fallbackLoader = fallbackLoader;
    this.maxCacheSize = maxCacheSize;
    this.initializeRegistry(config);
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
    // If domain is explicitly provided, use it
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
      const url = this.parseURL(src);

      return url.hostname || null;
    } catch {
      return null;
    }
  }

  /**
   * Parse URL with caching to avoid repeated parsing
   */
  private parseURL(src: string): URL {
    const cachedUrl = this.urlCache.get(src);

    if (cachedUrl) {
      return cachedUrl;
    }

    const url = new URL(src);

    // Implement LRU cache eviction
    if (this.urlCache.size >= this.maxCacheSize) {
      const firstKey = this.urlCache.keys().next().value;

      if (firstKey) {
        this.urlCache.delete(firstKey);
      }
    }

    this.urlCache.set(src, url);

    return url;
  }

  /**
   * Get cached result or compute and cache
   */
  private getCachedResult(key: string, computeFunction: () => string): string {
    const cachedResult = this.resultCache.get(key);

    if (cachedResult) {
      return cachedResult;
    }

    const result = computeFunction();

    // Implement LRU cache eviction
    if (this.resultCache.size >= this.maxCacheSize) {
      const firstKey = this.resultCache.keys().next().value;

      if (firstKey) {
        this.resultCache.delete(firstKey);
      }
    }

    this.resultCache.set(key, result);

    return result;
  }

  /**
   * Register a new loader
   */
  registerLoader(name: string, matcher: (src: string) => boolean, loader: LoaderFunction): void {
    const config: LoaderConfig = { loader, matcher, name };
    const domain = this.extractDomainFromMatcher(config);

    if (domain) {
      this.domainRegistry.set(domain, loader);
    } else {
      this.fallbackLoaders.push(config);
    }
  }

  /**
   * Transform image URL using optimized registry lookup
   */
  transform(params: ImageLoaderProps): string {
    const { quality, src, width } = params;
    const cacheKey = `${src}:${width}:${quality ?? "undefined"}`;

    return this.getCachedResult(cacheKey, () => {
      try {
        // First, try domain-based lookup for performance
        const hostname = this.extractDomainFromUrl(src);

        if (hostname) {
          // Try exact match first
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
    });
  }

  /**
   * Get all registered loader names
   */
  getRegisteredLoaders(): string[] {
    const domainLoaders = [...this.domainRegistry.keys()];
    const fallbackLoaderNames = this.fallbackLoaders.map(({ name }) => name);

    return [...domainLoaders, ...fallbackLoaderNames];
  }

  /**
   * Check if a loader is registered
   */
  hasLoader(name: string): boolean {
    // Check domain registry keys (domain names)
    if (this.domainRegistry.has(name)) return true;

    // Check fallback loaders
    return this.fallbackLoaders.some(({ name: loaderName }) => loaderName === name);
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { urlCacheSize: number; resultCacheSize: number } {
    return {
      resultCacheSize: this.resultCache.size,
      urlCacheSize: this.urlCache.size,
    };
  }

  /**
   * Clear caches (useful for testing or memory management)
   */
  clearCaches(): void {
    this.urlCache.clear();
    this.resultCache.clear();
  }
}

/**
 * Create a new image loader instance
 */
export function createImageLoader(
  config: LoaderConfig[] = [],
  fallbackLoader?: LoaderFunction,
  maxCacheSize = 1000,
): ImageLoader {
  return new ImageLoader(config, fallbackLoader, maxCacheSize);
}
