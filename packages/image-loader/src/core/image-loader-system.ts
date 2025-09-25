import type { ImageLoaderProps } from "next/image";

import type { ImageLoaderFunction, LoaderDefinition } from "@/types";

import { LoaderRegistry } from "@/core/loader-registry";

/**
 * Configuration for the image loader system
 */
export interface ImageLoaderSystemConfig {
  /** Custom loaders to register */
  customLoaders?: ImageLoaderFunction[];
  /** Enable debug logging */
  debug?: boolean;
  /** Default quality to use when not specified */
  defaultQuality?: number;
  /** Enable/disable caching */
  enableCaching?: boolean;
  /** Loader priority order (higher number = higher priority) */
  loaderPriorities?: Record<string, number>;
  /** Maximum cache size for performance optimization */
  maxCacheSize?: number;
}

/**
 * Enhanced image loader system with performance optimizations
 * and extensibility features
 */
export class ImageLoaderSystem {
  private readonly registry: LoaderRegistry;
  private readonly config: Required<ImageLoaderSystemConfig>;
  private readonly customLoaders: ImageLoaderFunction[];

  constructor(config: ImageLoaderSystemConfig = {}) {
    this.config = {
      customLoaders: [],
      debug: false,
      defaultQuality: 75,
      enableCaching: true,
      loaderPriorities: {},
      maxCacheSize: 1000,
      ...config,
    };

    this.registry = new LoaderRegistry(this.config.enableCaching ? this.config.maxCacheSize : 0);
    this.customLoaders = config.customLoaders ?? [];
  }

  /**
   * Register built-in loaders
   */
  registerBuiltInLoaders(loaders: LoaderDefinition[]): void {
    // Sort by priority if specified
    const sortedLoaders = this.sortLoadersByPriority(loaders);

    this.registry.registerAll(sortedLoaders);
  }

  /**
   * Register a custom loader
   */
  registerCustomLoader(loader: ImageLoaderFunction): void {
    this.customLoaders.push(loader);
  }

  /**
   * Create the main loader function
   */
  createLoader(): ImageLoaderFunction {
    return (params: ImageLoaderProps): string => {
      const normalizedParams = this.normalizeParams(params);

      if (this.config.debug) {
        console.log(`[ImageLoader] Processing URL: ${normalizedParams.src}`);
      }

      // Try built-in loaders first
      if (this.config.enableCaching) {
        const result = this.registry.transformUrl(normalizedParams);

        if (result !== normalizedParams.src) {
          return result;
        }
      } else {
        const loader = this.registry.findLoader(normalizedParams.src);

        if (loader) {
          try {
            return loader.load(normalizedParams);
          } catch (error) {
            console.warn(`Built-in loader failed:`, error);
          }
        }
      }

      // Try custom loaders
      for (const customLoader of this.customLoaders) {
        try {
          return customLoader(normalizedParams);
        } catch (error) {
          if (this.config.debug) {
            console.warn(`Custom loader failed:`, error);
          }
        }
      }

      // Fallback to original URL
      if (this.config.debug) {
        console.warn(`No loader found for URL: ${normalizedParams.src}`);
      }

      return normalizedParams.src;
    };
  }

  /**
   * Get system statistics
   */
  getStats(): {
    registeredLoaders: number;
    customLoaders: number;
    cacheStats: { domainCacheSize: number; urlCacheSize: number };
  } {
    return {
      cacheStats: this.registry.getCacheStats(),
      customLoaders: this.customLoaders.length,
      registeredLoaders: this.registry.getAllLoaders().length,
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.registry.clearCache();
  }

  /**
   * Get all registered loaders
   */
  getAllLoaders(): LoaderDefinition[] {
    return this.registry.getAllLoaders();
  }

  private normalizeParams(params: ImageLoaderProps): ImageLoaderProps {
    return {
      ...params,
      quality: params.quality ?? this.config.defaultQuality,
    };
  }

  private sortLoadersByPriority(loaders: LoaderDefinition[]): LoaderDefinition[] {
    return loaders.toSorted((a, b) => {
      const priorityA = this.config.loaderPriorities[a.name] ?? 0;
      const priorityB = this.config.loaderPriorities[b.name] ?? 0;

      return priorityB - priorityA; // Higher priority first
    });
  }
}
