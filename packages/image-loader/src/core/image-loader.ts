import type { ImageLoaderProps } from "next/image";

import type { LoaderConfig, LoaderFunction } from "@/types";

/**
 * Fast image loader for Next.js
 *
 * Simple and performant implementation without caching overhead.
 * Designed for Next.js image loader which needs to handle requests quickly.
 */
export class ImageLoader {
  private readonly loaders: LoaderConfig[] = [];
  private readonly fallbackLoader?: LoaderFunction;

  constructor(config: LoaderConfig[] = [], fallbackLoader?: LoaderFunction) {
    this.loaders = config;
    this.fallbackLoader = fallbackLoader;
  }

  /**
   * Transform image URL using loader matchers
   */
  transform(params: ImageLoaderProps): string {
    const { src } = params;

    try {
      // Try each loader in order until one matches
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
