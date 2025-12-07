import type { ImageLoaderProps } from 'next/image';

import type { LoaderConfig, LoaderFunction } from '@/types';

import { builtInLoaderConfigs } from './loader-registry';

/**
 * Core ImageLoader class that handles image URL transformation
 * based on configured loaders and matchers.
 */
export class ImageLoader {
  private readonly loaders: LoaderConfig[] = [];
  private readonly fallbackLoader?: LoaderFunction;

  constructor(config: LoaderConfig[] = [], fallbackLoader?: LoaderFunction) {
    this.loaders = config;
    this.fallbackLoader = fallbackLoader;
  }

  /**
   * Transform image URL based on configured loaders.
   * Returns the original src if no matching loader is found.
   */
  transform(params: ImageLoaderProps): string {
    const { src } = params;

    try {
      for (const { loader, matcher } of this.loaders) {
        if (matcher(src)) {
          return loader(params);
        }
      }

      if (this.fallbackLoader) {
        return this.fallbackLoader(params);
      }

      return src;
    } catch {
      return src;
    }
  }
}

/**
 * Factory function to create a new ImageLoader instance.
 */
export function createImageLoader(
  config: LoaderConfig[] = [],
  fallbackLoader?: LoaderFunction,
): ImageLoader {
  return new ImageLoader(config, fallbackLoader);
}

/**
 * Default image loader using built-in loader configurations.
 * This is the main entry point for most use cases.
 */
const defaultImageLoader = createImageLoader(builtInLoaderConfigs);

/**
 * Default image loader function compatible with Next.js Image component.
 * Uses built-in loaders to automatically detect and transform image URLs.
 */
export function imageLoader(params: ImageLoaderProps): string {
  return defaultImageLoader.transform(params);
}

/**
 * Create a custom image loader with user-defined loaders and optional fallback.
 */
export function createCustomImageLoader(config: {
  loaders?: LoaderConfig[];
  fallbackLoader?: LoaderFunction;
}): (params: ImageLoaderProps) => string {
  const loader = createImageLoader(config.loaders, config.fallbackLoader);

  return (params: ImageLoaderProps) => loader.transform(params);
}
