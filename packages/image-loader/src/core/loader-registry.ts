import type { ImageLoaderProps } from "next/image";

import type { LoaderDefinition } from "@/types";

/**
 * Loader registry for managing and caching loader definitions
 * Provides performance optimizations through caching and lazy loading
 */
export class LoaderRegistry {
  private readonly loaders = new Map<string, LoaderDefinition>();
  private readonly domainCache = new Map<string, null | string>();
  private readonly urlCache = new Map<string, string>();
  private readonly maxCacheSize: number;

  constructor(maxCacheSize = 1000) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Register a loader definition
   */
  register(definition: LoaderDefinition): void {
    this.loaders.set(definition.name, definition);
  }

  /**
   * Register multiple loader definitions
   */
  registerAll(definitions: LoaderDefinition[]): void {
    for (const definition of definitions) {
      this.register(definition);
    }
  }

  /**
   * Find the best matching loader for a given URL
   * Uses caching for performance optimization
   */
  findLoader(src: string): LoaderDefinition | null {
    // Check cache first
    const cachedLoader = this.domainCache.get(src);

    if (cachedLoader) {
      return this.loaders.get(cachedLoader) ?? null;
    }

    // Find a matching loader
    for (const [, definition] of this.loaders) {
      if (definition.canHandle(src)) {
        // Cache the result
        this.cacheDomain(src, definition.name);

        return definition;
      }
    }

    // Cache negative result
    this.cacheDomain(src, null);

    return null;
  }

  /**
   * Transform URL using the appropriate loader
   * Includes URL transformation caching
   */
  transformUrl(params: ImageLoaderProps): string {
    const cacheKey = this.createCacheKey(params);

    // Check URL cache
    const cachedUrl = this.urlCache.get(cacheKey);

    if (cachedUrl) {
      return cachedUrl;
    }

    const loader = this.findLoader(params.src);

    if (!loader) {
      return params.src;
    }

    try {
      const transformedUrl = loader.load(params);

      // Cache the transformed URL
      this.cacheUrl(cacheKey, transformedUrl);

      return transformedUrl;
    } catch (error) {
      console.warn(`Loader ${loader.name} failed for ${params.src}:`, error);

      return params.src;
    }
  }

  /**
   * Get all registered loaders
   */
  getAllLoaders(): LoaderDefinition[] {
    return [...this.loaders.values()];
  }

  /**
   * Get loader by name
   */
  getLoader(name: string): LoaderDefinition | undefined {
    return this.loaders.get(name);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.domainCache.clear();
    this.urlCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { domainCacheSize: number; urlCacheSize: number } {
    return {
      domainCacheSize: this.domainCache.size,
      urlCacheSize: this.urlCache.size,
    };
  }

  private cacheDomain(src: string, loaderName: null | string): void {
    if (this.domainCache.size >= this.maxCacheSize) {
      // Remove oldest entries (simple FIFO)
      const firstKey = this.domainCache.keys().next().value;

      if (firstKey) {
        this.domainCache.delete(firstKey);
      }
    }

    this.domainCache.set(src, loaderName);
  }

  private cacheUrl(key: string, url: string): void {
    if (this.urlCache.size >= this.maxCacheSize) {
      // Remove oldest entries (simple FIFO)
      const firstKey = this.urlCache.keys().next().value;

      if (firstKey) {
        this.urlCache.delete(firstKey);
      }
    }

    this.urlCache.set(key, url);
  }

  private createCacheKey(params: ImageLoaderProps): string {
    return `${params.src}|${params.width}|${params.quality ?? "default"}`;
  }
}
