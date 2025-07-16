import type { ImageLoaderProps } from "next/image";

import type { ImageLoader, ImageLoaderFactoryConfig } from "@/types";

/**
 * Cache for loader selection to improve performance
 */
type LoaderCache = Record<string, ImageLoader | null>;

/**
 * Cache for URL transformations to avoid repeated processing
 */
type TransformCache = Record<string, string>;

/**
 * Factory class for managing and selecting image loaders
 * Implements the Factory pattern and follows the Dependency Inversion Principle
 * Optimized for high performance with caching and memoization
 */
export class ImageLoaderFactory {
  private readonly loaders: ImageLoader[] = [];
  private readonly config: ImageLoaderFactoryConfig;
  private readonly loaderCache: LoaderCache = {};
  private readonly transformCache: TransformCache = {};
  private readonly maxCacheSize: number = 1000;

  constructor(config: ImageLoaderFactoryConfig = {}) {
    this.config = {
      defaultQuality: 75,
      ...config,
    };
  }

  /**
   * Registers a new image loader
   * Follows the Open/Closed Principle - new loaders can be added without modifying existing code
   */
  public registerLoader(loader: ImageLoader): void {
    if (this.loaders.some((l) => l.getName() === loader.getName())) {
      throw new Error(`Loader with name "${loader.getName()}" is already registered`);
    }
    this.loaders.push(loader);
    // Clear cache when a new loader is registered
    this.clearLoaderCache();
  }

  /**
   * Registers multiple image loaders at once
   */
  public registerLoaders(loaders: ImageLoader[]): void {
    for (const loader of loaders) {
      this.registerLoader(loader);
    }
  }

  /**
   * Unregisters an image loader by name
   */
  public unregisterLoader(name: string): boolean {
    const index = this.loaders.findIndex((loader) => loader.getName() === name);
    if (index !== -1) {
      this.loaders.splice(index, 1);
      // Clear cache when the loader is unregistered
      this.clearLoaderCache();
      return true;
    }
    return false;
  }

  /**
   * Gets all registered loaders
   */
  public getLoaders(): readonly ImageLoader[] {
    return [...this.loaders];
  }

  /**
   * Finds the appropriate loader for a given source URL
   * Returns the first loader that can handle the URL
   * Uses caching for improved performance on repeated lookups
   */
  public findLoader(source: string): ImageLoader | null {
    const domain = this.extractDomain(source);

    // Check cache first for performance
    if (domain in this.loaderCache) {
      return this.loaderCache[domain];
    }

    let selectedLoader: ImageLoader | null = null;

    // Check domain mappings first
    if (this.config.domainMappings?.[domain]) {
      const mappedLoaderName = this.config.domainMappings[domain];
      selectedLoader = this.loaders.find((loader) => loader.getName() === mappedLoaderName) ?? null;
    }

    // If no mapped loader found, find the first loader that can handle the URL
    selectedLoader ??= this.loaders.find((loader) => loader.canHandle(source)) ?? null;

    // Cache the result for future lookups
    this.cacheLoader(domain, selectedLoader);

    return selectedLoader;
  }

  /**
   * Loads an image using the appropriate loader
   * Main entry point for image loading
   * Uses memoization for improved performance on repeated transformations
   */
  public load(config: ImageLoaderProps): string {
    // Create a cache key for memoization
    const cacheKey = this.createTransformCacheKey(config);

    // Check the transform cache first
    if (this.transformCache[cacheKey]) {
      return this.transformCache[cacheKey];
    }

    const loader = this.findLoader(config.src);

    if (!loader) {
      // Fallback: return the original URL if no loader can handle it
      console.warn(`No loader found for URL: ${config.src}. Returning original URL.`);
      return config.src;
    }

    const normalizedConfig = {
      ...config,
      quality: config.quality ?? this.config.defaultQuality,
    };

    const transformedUrl = loader.load(normalizedConfig);

    // Cache the result for future use
    this.cacheTransform(cacheKey, transformedUrl);

    return transformedUrl;
  }

  /**
   * Creates a Next.js compatible image loader function
   * This function can be used directly in Next.js configuration
   */
  public createNextImageLoader() {
    return (params: ImageLoaderProps): string => {
      return this.load({
        quality: params.quality,
        src: params.src,
        width: params.width,
      });
    };
  }

  /**
   * Gets loader statistics
   * Useful for debugging and monitoring
   */
  public getStats(): {
    totalLoaders: number;
    loaderNames: string[];
    domainMappings: Record<string, string>;
  } {
    return {
      domainMappings: this.config.domainMappings ?? {},
      loaderNames: this.loaders.map((loader) => loader.getName()),
      totalLoaders: this.loaders.length,
    };
  }

  /**
   * Clears all registered loaders and caches
   * Useful for testing or reconfiguration
   */
  public clear(): void {
    this.loaders.length = 0;
    this.clearLoaderCache();
    this.clearTransformCache();
  }

  /**
   * Utility method to extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObject = new URL(url);
      return urlObject.hostname.toLowerCase();
    } catch {
      return "";
    }
  }

  /**
   * Caches a loader for a specific domain
   */
  private cacheLoader(domain: string, loader: ImageLoader | null): void {
    // Implement LRU-like behavior by clearing the cache if it gets too large
    if (Object.keys(this.loaderCache).length >= this.maxCacheSize) {
      this.clearLoaderCache();
    }
    this.loaderCache[domain] = loader;
  }

  /**
   * Clears the loader cache
   */
  private clearLoaderCache(): void {
    for (const key of Object.keys(this.loaderCache)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.loaderCache[key];
    }
  }

  /**
   * Creates a cache key for URL transformation
   */
  private createTransformCacheKey(config: ImageLoaderProps): string {
    const quality = config.quality ?? this.config.defaultQuality ?? 75;
    return `${config.src}|${config.width.toString()}|${quality.toString()}`;
  }

  /**
   * Caches a transformed URL
   */
  private cacheTransform(key: string, transformedUrl: string): void {
    // Implement LRU-like behavior by clearing the cache if it gets too large
    if (Object.keys(this.transformCache).length >= this.maxCacheSize) {
      this.clearTransformCache();
    }
    this.transformCache[key] = transformedUrl;
  }

  /**
   * Clears the transform cache
   */
  private clearTransformCache(): void {
    for (const key of Object.keys(this.transformCache)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.transformCache[key];
    }
  }
}

/**
 * Default factory instance
 * Singleton pattern for convenience
 */
export const defaultImageLoaderFactory = new ImageLoaderFactory();
