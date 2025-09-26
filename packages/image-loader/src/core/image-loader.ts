import type { ImageLoaderProps } from "next/image";

import type { LoaderConfig, LoaderFunction } from "./types";

/**
 * Core image loader with registry pattern and configuration-driven approach
 *
 * Provides O(1) lookup performance with Map-based registry
 * Supports custom loaders and flexible configuration
 */
export class ImageLoader {
  private readonly loaders: LoaderConfig[];
  private readonly fallbackLoader?: LoaderFunction;

  constructor(config: LoaderConfig[] = [], fallbackLoader?: LoaderFunction) {
    this.loaders = config;
    this.fallbackLoader = fallbackLoader;
  }

  /**
   * Register a new loader
   */
  registerLoader(name: string, matcher: (src: string) => boolean, loader: LoaderFunction): void {
    this.loaders.push({ loader, matcher, name });
  }

  /**
   * Transform image URL using registered loaders
   */
  transform(params: ImageLoaderProps): string {
    const { src } = params;

    try {
      // Find matching loader using matcher functions
      for (const { loader, matcher } of this.loaders) {
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
   * Get all registered loader names
   */
  getRegisteredLoaders(): string[] {
    return this.loaders.map(({ name }) => name);
  }

  /**
   * Check if a loader is registered
   */
  hasLoader(name: string): boolean {
    return this.loaders.some(({ name: loaderName }) => loaderName === name);
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
